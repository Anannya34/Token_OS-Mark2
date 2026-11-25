/**
 * TOKEN-OS: Secure Multi-Provider API Key Vault Service
 * Features:
 * - Master Vault Password protection for viewing and deleting keys
 * - Double confirmation (Password + typing "Delete") to prevent accidental deletion
 * - Pre-configured Base URLs for Groq, Gemini, OpenRouter, and Ollama
 * - Zero external API key exposure; persisted in browser client vault & synced encrypted to Supabase
 */
import {
  syncVaultToCloud,
  fetchVaultFromCloud,
  logSecurityEventToCloud
} from './supabaseClient.ts';

export interface VaultKeyEntry {
  id: string;
  provider: 'groq' | 'gemini' | 'openrouter' | 'ollama' | 'openai' | 'custom';
  name: string;
  apiKey: string;
  baseUrl: string;
  model: string;
  createdAt: string;
  isVerified?: boolean;
}

export interface ProviderPreset {
  id: 'groq' | 'gemini' | 'openrouter' | 'ollama' | 'openai' | 'custom';
  name: string;
  baseUrl: string;
  defaultModel: string;
  availableModels: { id: string; name: string; freeTier: boolean }[];
  keyHelpUrl: string;
  description: string;
}

export const PROVIDER_PRESETS: Record<string, ProviderPreset> = {
  groq: {
    id: 'groq',
    name: 'Groq Cloud (Fast LPU - Free Tier)',
    baseUrl: 'https://api.groq.com/openai/v1',
    defaultModel: 'llama-3.3-70b-versatile',
    availableModels: [
      { id: 'llama-3.3-70b-versatile', name: 'Llama 3.3 70B Versatile (Free Tier)', freeTier: true },
      { id: 'llama-3.1-8b-instant', name: 'Llama 3.1 8B Instant (<200ms)', freeTier: true },
      { id: 'mixtral-8x7b-32768', name: 'Mixtral 8x7B (32k Context)', freeTier: true },
      { id: 'gemma2-9b-it', name: 'Gemma 2 9B Instruct', freeTier: true }
    ],
    keyHelpUrl: 'https://console.groq.com/keys',
    description: 'Ultra-fast inference on Groq LPUs. Free tier supports 30 requests/minute.'
  },
  gemini: {
    id: 'gemini',
    name: 'Google AI Studio (Gemini)',
    baseUrl: 'https://generativelanguage.googleapis.com/v1beta/openai',
    defaultModel: 'gemini-flash-latest',
    availableModels: [
      { id: 'gemini-flash-latest', name: 'Gemini Flash Latest (Fast & Free)', freeTier: true },
      { id: 'gemini-2.0-flash', name: 'Gemini 2.0 Flash', freeTier: true },
      { id: 'gemini-1.5-flash', name: 'Gemini 1.5 Flash (Standard)', freeTier: true }
    ],
    keyHelpUrl: 'https://aistudio.google.com/app/apikey',
    description: 'Google AI Studio official API. 15 RPM free tier with authoritative token accounting.'
  },
  openrouter: {
    id: 'openrouter',
    name: 'OpenRouter Unified Gateway',
    baseUrl: 'https://openrouter.ai/api/v1',
    defaultModel: 'google/gemma-4-26b-a4b-it:free',
    availableModels: [
      { id: 'google/gemma-4-26b-a4b-it:free', name: 'Google Gemma 4 26B (Free)', freeTier: true },
      { id: 'meta-llama/llama-3.3-70b-instruct:free', name: 'Llama 3.3 70B Instruct (Free)', freeTier: true },
      { id: 'deepseek/deepseek-r1', name: 'DeepSeek R1 Reasoning', freeTier: false }
    ],
    keyHelpUrl: 'https://openrouter.ai/keys',
    description: 'Unified gateway for 200+ models. Free models available with free account key.'
  },
  ollama: {
    id: 'ollama',
    name: 'Ollama Sovereign Local Instance',
    baseUrl: 'http://localhost:11434/v1',
    defaultModel: 'mistral:latest',
    availableModels: [
      { id: 'mistral:latest', name: 'Mistral 7B (Local)', freeTier: true },
      { id: 'llama3.2:3b-instruct', name: 'Llama 3.2 3B (Local)', freeTier: true },
      { id: 'qwen2.5-coder:7b-instruct', name: 'Qwen 2.5 Coder 7B (Local)', freeTier: true }
    ],
    keyHelpUrl: 'https://ollama.ai',
    description: '100% offline local model execution on your own hardware. Zero API key required.'
  },
  custom: {
    id: 'custom',
    name: 'Custom OpenAI-Compatible Endpoint',
    baseUrl: 'https://api.openai.com/v1',
    defaultModel: 'gpt-4o-mini',
    availableModels: [],
    keyHelpUrl: '',
    description: 'Connect any OpenAI-compatible server (vLLM, LM Studio, LiteLLM, or proprietary gateway).'
  }
};

const VAULT_KEYS_STORAGE = 'token_os_vault_keys_v2';
const VAULT_MASTER_HASH_STORAGE = 'token_os_vault_master_pin_v2';
const VAULT_CUSTOM_MODELS_STORAGE = 'token_os_custom_models_v2';
const VAULT_PIN_SALT = 'token_os_vault_v2_salt:';
const VAULT_LOCKOUT_STORAGE = 'token_os_vault_lockout_v2';
const VAULT_SESSION_PIN_KEY = 'token_os_vault_session_pin';

let inMemorySessionPin: string | null = null;
let inMemoryDecryptedKeys: VaultKeyEntry[] | null = null;

export function getActiveSessionPin(): string | null {
  if (inMemorySessionPin) return inMemorySessionPin;
  if (typeof window !== 'undefined' && window.sessionStorage) {
    try {
      return sessionStorage.getItem(VAULT_SESSION_PIN_KEY);
    } catch {}
  }
  return null;
}

export function setActiveSessionPin(pin: string | null): void {
  inMemorySessionPin = pin;
  if (typeof window !== 'undefined' && window.sessionStorage) {
    try {
      if (pin) {
        sessionStorage.setItem(VAULT_SESSION_PIN_KEY, pin);
      } else {
        sessionStorage.removeItem(VAULT_SESSION_PIN_KEY);
      }
    } catch {}
  }
}

// Helper: Convert Uint8Array to hex string
export function bufferToHex(buffer: ArrayBuffer | Uint8Array): string {
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
  return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
}

// Helper: Convert hex string to Uint8Array
export function hexToBuffer(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(hex.substring(i * 2, i * 2 + 2), 16);
  }
  return bytes;
}

export async function deriveKeyPBKDF2(pin: string, salt: Uint8Array): Promise<CryptoKey> {
  const enc = new TextEncoder();
  const baseKey = await crypto.subtle.importKey(
    'raw',
    enc.encode(pin.trim()),
    'PBKDF2',
    false,
    ['deriveKey']
  );
  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt as any,
      iterations: 100000,
      hash: 'SHA-256'
    },
    baseKey,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

export interface EncryptedVaultPayload {
  __enc: true;
  version: 1;
  salt: string;
  iv: string;
  ciphertext: string;
}

export async function encryptDataAESGCM(data: string, pin: string): Promise<EncryptedVaultPayload> {
  if (typeof crypto === 'undefined' || !crypto.subtle) {
    throw new Error('WebCrypto subtle is unavailable');
  }
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const derivedKey = await deriveKeyPBKDF2(pin, salt);
  const enc = new TextEncoder();
  const ciphertextBuffer = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv: iv as any },
    derivedKey,
    enc.encode(data)
  );

  return {
    __enc: true,
    version: 1,
    salt: bufferToHex(salt),
    iv: bufferToHex(iv),
    ciphertext: bufferToHex(ciphertextBuffer)
  };
}

export async function decryptDataAESGCM(payload: EncryptedVaultPayload, pin: string): Promise<string> {
  if (typeof crypto === 'undefined' || !crypto.subtle) {
    throw new Error('WebCrypto subtle is unavailable');
  }
  const salt = hexToBuffer(payload.salt);
  const iv = hexToBuffer(payload.iv);
  const ciphertext = hexToBuffer(payload.ciphertext);
  const derivedKey = await deriveKeyPBKDF2(pin, salt);

  const decryptedBuffer = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: iv as any },
    derivedKey,
    ciphertext as any
  );
  const dec = new TextDecoder();
  return dec.decode(decryptedBuffer);
}

// Simple fast client-side SHA-256 for password verification
export async function sha256(text: string): Promise<string> {
  if (typeof crypto !== 'undefined' && crypto.subtle) {
    const encoder = new TextEncoder();
    const data = encoder.encode(text);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }
  // Fallback string hash if subtle crypto is unavailable
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    hash = (hash << 5) - hash + text.charCodeAt(i);
    hash |= 0;
  }
  return `fallback-${Math.abs(hash)}`;
}

export interface PinEntropyResult {
  score: number; // 0 (weakest) to 4 (strongest)
  strength: 'too_weak' | 'weak' | 'moderate' | 'strong';
  label: string;
  valid: boolean;
  error?: string;
  reasons: string[];
}

// Senior System Design: Multi-Vector Entropy & Trivial Pattern Validator
export function evaluatePinEntropy(pin: string): PinEntropyResult {
  const trimmed = pin ? pin.trim() : '';
  const reasons: string[] = [];

  if (!trimmed || trimmed.length < 4) {
    return {
      score: 0,
      strength: 'too_weak',
      label: 'Too Short (Min 4)',
      valid: false,
      error: 'Master PIN must be at least 4 characters long.',
      reasons: ['Minimum 4 characters required']
    };
  }

  // Trivial identical characters check (e.g. "0000", "1111", "aaaa")
  if (/^(.)\1+$/.test(trimmed)) {
    return {
      score: 1,
      strength: 'weak',
      label: 'Repeated Digits',
      valid: false,
      error: 'PIN cannot consist of repeating identical characters (e.g. 0000, 1111).',
      reasons: ['Avoid repeated single character patterns']
    };
  }

  // Trivial sequential checks: e.g. 1234, 2345, 3456, 4567, 5678, 6789, 7890, 4321, 5432, abcd
  const sequentialPatterns = [
    '0123', '1234', '2345', '3456', '4567', '5678', '6789', '7890',
    '0987', '9876', '8765', '7654', '6543', '5432', '4321', '3210',
    'abcd', 'bcde', 'cdef', 'defg', 'efgh', 'fghi', 'ghij'
  ];
  const lower = trimmed.toLowerCase();
  for (const seq of sequentialPatterns) {
    if (lower.includes(seq)) {
      return {
        score: 1,
        strength: 'weak',
        label: 'Sequential Pattern',
        valid: false,
        error: `PIN cannot contain sequential patterns (e.g. "${seq}").`,
        reasons: ['Avoid sequential numbers or alphabets']
      };
    }
  }

  // Common trivial passwords & PINs list
  const commonWeak = new Set([
    '0000', '1111', '1234', '1212', '7777', '1004', '2000', '4444', 
    '2222', '6969', '9999', '3333', '5555', '6666', '1122', '1313', 
    '8888', '4321', '2001', '1010', '12345', '123456', 'password', 'admin', 'tokenos'
  ]);
  if (commonWeak.has(lower)) {
    return {
      score: 1,
      strength: 'weak',
      label: 'Easily Guessable',
      valid: false,
      error: 'This PIN is too common and easily guessable.',
      reasons: ['Avoid commonly used default PINs']
    };
  }

  // Calculate entropy score
  let score = 1;
  if (trimmed.length >= 6) {
    score += 1;
    reasons.push('Length >= 6');
  } else {
    reasons.push('Recommend 6+ characters for higher entropy');
  }

  const hasNumbers = /\d/.test(trimmed);
  const hasLetters = /[a-zA-Z]/.test(trimmed);
  const hasSpecial = /[^a-zA-Z0-9]/.test(trimmed);

  if (hasNumbers && hasLetters) {
    score += 1;
    reasons.push('Alphanumeric mix');
  }
  if (hasSpecial || (trimmed.length >= 8 && hasNumbers && hasLetters)) {
    score += 1;
    reasons.push('High entropy symbols / extended length');
  }

  let strength: PinEntropyResult['strength'] = 'weak';
  let label = 'Weak';
  if (score >= 4) {
    strength = 'strong';
    label = 'Strong';
  } else if (score >= 2) {
    strength = 'moderate';
    label = 'Moderate';
  }

  return {
    score,
    strength,
    label,
    valid: true,
    reasons
  };
}

// Lockout tracker (Anti-brute force client side)
interface LockoutState {
  failedAttempts: number;
  lockedUntil: number; // timestamp ms
}

function getLockoutState(): LockoutState {
  if (typeof window === 'undefined') return { failedAttempts: 0, lockedUntil: 0 };
  try {
    const raw = sessionStorage.getItem(VAULT_LOCKOUT_STORAGE);
    if (raw) return JSON.parse(raw);
  } catch {}
  return { failedAttempts: 0, lockedUntil: 0 };
}

function setLockoutState(state: LockoutState): void {
  if (typeof window === 'undefined') return;
  try {
    sessionStorage.setItem(VAULT_LOCKOUT_STORAGE, JSON.stringify(state));
  } catch {}
}

export function checkPinLockout(): { locked: boolean; remainingSeconds: number } {
  const state = getLockoutState();
  const now = Date.now();
  if (state.lockedUntil && state.lockedUntil > now) {
    return {
      locked: true,
      remainingSeconds: Math.ceil((state.lockedUntil - now) / 1000)
    };
  }
  return { locked: false, remainingSeconds: 0 };
}

export function recordFailedPinAttempt(): { attemptsRemaining: number; locked: boolean; lockDurationSeconds?: number } {
  const state = getLockoutState();
  const now = Date.now();
  const attempts = state.failedAttempts + 1;
  const MAX_ATTEMPTS = 5;

  if (attempts >= MAX_ATTEMPTS) {
    const lockDuration = 60; // 60s lockout
    setLockoutState({
      failedAttempts: attempts,
      lockedUntil: now + lockDuration * 1000
    });
    return { attemptsRemaining: 0, locked: true, lockDurationSeconds: lockDuration };
  }

  setLockoutState({
    failedAttempts: attempts,
    lockedUntil: 0
  });
  return { attemptsRemaining: MAX_ATTEMPTS - attempts, locked: false };
}

export function resetPinLockout(): void {
  setLockoutState({ failedAttempts: 0, lockedUntil: 0 });
}

// Check if a master vault password is set
export function hasVaultMasterPassword(): boolean {
  if (typeof window === 'undefined') return false;
  return !!localStorage.getItem(VAULT_MASTER_HASH_STORAGE);
}

// Initialize or update vault master password with domain-separated salt & entropy validation
export async function setVaultMasterPassword(password: string): Promise<boolean> {
  const entropy = evaluatePinEntropy(password);
  if (!entropy.valid) {
    throw new Error(entropy.error || 'Vault PIN does not meet system security standards.');
  }

  const trimmed = password.trim();
  const saltedHash = await sha256(`${VAULT_PIN_SALT}${trimmed}`);
  localStorage.setItem(VAULT_MASTER_HASH_STORAGE, saltedHash);
  resetPinLockout();
  setActiveSessionPin(trimmed);

  // Automatically migrate existing vault keys to AES-GCM encrypted format
  let encryptedPayload: any = null;
  try {
    const currentKeys = getVaultKeys();
    inMemoryDecryptedKeys = currentKeys;
    if (typeof crypto !== 'undefined' && crypto.subtle) {
      encryptedPayload = await encryptDataAESGCM(JSON.stringify(currentKeys), trimmed);
      localStorage.setItem(VAULT_KEYS_STORAGE, JSON.stringify(encryptedPayload));
    }
  } catch (err) {
    console.warn('Could not encrypt vault keys during PIN setup:', err);
  }

  // Non-blocking zero-knowledge sync to Supabase (salted hash + AES-GCM ciphertext only)
  syncVaultToCloud(saltedHash, encryptedPayload || {}).catch(() => {});
  logSecurityEventToCloud('VAULT_PIN_SET', { hasEncryptedKeys: Boolean(encryptedPayload) }).catch(() => {});

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('token_os_pin_changed', { detail: { hasPin: true } }));
    window.dispatchEvent(new Event('storage'));
  }
  return true;
}

// Verify entered vault master password with anti-brute-force rate limiting
export async function verifyVaultMasterPassword(password: string): Promise<boolean> {
  const lockout = checkPinLockout();
  if (lockout.locked) {
    return false;
  }

  const stored = localStorage.getItem(VAULT_MASTER_HASH_STORAGE);
  if (!stored) {
    return true; // Direct mode when no PIN is set
  }

  const trimmed = password ? password.trim() : '';
  const saltedHash = await sha256(`${VAULT_PIN_SALT}${trimmed}`);

  if (saltedHash === stored) {
    resetPinLockout();
    setActiveSessionPin(trimmed);
    // Eagerly decrypt keys if encrypted
    await syncDecryptVaultKeys(trimmed);
    return true;
  }

  // Backward compatibility check with legacy unsalted hash
  const legacyHash = await sha256(trimmed);
  if (legacyHash === stored) {
    // Auto-migrate to salted hash
    localStorage.setItem(VAULT_MASTER_HASH_STORAGE, saltedHash);
    resetPinLockout();
    setActiveSessionPin(trimmed);
    await syncDecryptVaultKeys(trimmed);
    return true;
  }

  recordFailedPinAttempt();
  return false;
}

// Helper to eagerly decrypt keys into memory
async function syncDecryptVaultKeys(pin: string): Promise<void> {
  if (typeof window === 'undefined') return;
  try {
    const raw = localStorage.getItem(VAULT_KEYS_STORAGE);
    if (!raw) return;
    const parsed = JSON.parse(raw);
    if (parsed && parsed.__enc === true) {
      const decryptedStr = await decryptDataAESGCM(parsed, pin);
      inMemoryDecryptedKeys = JSON.parse(decryptedStr);
    }
  } catch (err) {
    console.warn('Failed to decrypt vault keys with PIN:', err);
  }
}

// Change existing master PIN (requires verifying current PIN first)
export async function changeVaultMasterPassword(
  currentPin: string,
  newPin: string
): Promise<{ success: boolean; error?: string }> {
  const isCurrentValid = await verifyVaultMasterPassword(currentPin);
  if (!isCurrentValid) {
    const lockout = checkPinLockout();
    if (lockout.locked) {
      return { success: false, error: `Account locked due to consecutive failures. Try again in ${lockout.remainingSeconds}s.` };
    }
    return { success: false, error: 'Current Master PIN is incorrect.' };
  }

  const entropy = evaluatePinEntropy(newPin);
  if (!entropy.valid) {
    return { success: false, error: entropy.error };
  }

  await setVaultMasterPassword(newPin);
  return { success: true };
}

// Remove master PIN and revert vault to Direct Mode
export async function removeVaultMasterPassword(
  currentPin: string
): Promise<{ success: boolean; error?: string }> {
  const isCurrentValid = await verifyVaultMasterPassword(currentPin);
  if (!isCurrentValid) {
    const lockout = checkPinLockout();
    if (lockout.locked) {
      return { success: false, error: `Account locked due to consecutive failures. Try again in ${lockout.remainingSeconds}s.` };
    }
    return { success: false, error: 'Current Master PIN is incorrect.' };
  }

  // Revert encrypted payload to plaintext JSON
  const currentKeys = getVaultKeys();
  localStorage.setItem(VAULT_KEYS_STORAGE, JSON.stringify(currentKeys));
  localStorage.removeItem(VAULT_MASTER_HASH_STORAGE);
  setActiveSessionPin(null);
  resetPinLockout();

  syncVaultToCloud(null, {}).catch(() => {});
  logSecurityEventToCloud('VAULT_PIN_REMOVED').catch(() => {});

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('token_os_pin_changed', { detail: { hasPin: false } }));
    window.dispatchEvent(new Event('storage'));
  }
  return { success: true };
}

// Purge and deactivate master PIN without password requirement (Direct Mode reset)
export function purgeMasterPin(): void {
  const currentKeys = getVaultKeys();
  localStorage.setItem(VAULT_KEYS_STORAGE, JSON.stringify(currentKeys));
  localStorage.removeItem(VAULT_MASTER_HASH_STORAGE);
  localStorage.removeItem(VAULT_LOCKOUT_STORAGE);
  setActiveSessionPin(null);
  resetPinLockout();

  syncVaultToCloud(null, {}).catch(() => {});
  logSecurityEventToCloud('VAULT_PIN_REMOVED', { mode: 'purge' }).catch(() => {});

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('token_os_pin_changed', { detail: { hasPin: false } }));
    window.dispatchEvent(new Event('storage'));
  }
}

// Get all stored keys from the vault
export function getVaultKeys(): VaultKeyEntry[] {
  if (typeof window === 'undefined') return [];
  try {
    if (inMemoryDecryptedKeys && inMemoryDecryptedKeys.length > 0) {
      return inMemoryDecryptedKeys;
    }

    const raw = localStorage.getItem(VAULT_KEYS_STORAGE);
    if (!raw) {
      // Seed with .env Gemini key if available
      const metaEnv = (typeof import.meta !== 'undefined' && (import.meta as any).env) || {};
      const envGemini = metaEnv.VITE_GEMINI_API_KEY || metaEnv.VITE_GOOGLE_AI_KEY || '';
      if (envGemini) {
        const initialGemini: VaultKeyEntry = {
          id: 'gemini-env-seed',
          provider: 'gemini',
          name: 'Google AI Studio (Gemini Default)',
          apiKey: envGemini,
          baseUrl: PROVIDER_PRESETS.gemini.baseUrl,
          model: PROVIDER_PRESETS.gemini.defaultModel,
          createdAt: new Date().toISOString(),
          isVerified: true
        };
        localStorage.setItem(VAULT_KEYS_STORAGE, JSON.stringify([initialGemini]));
        inMemoryDecryptedKeys = [initialGemini];
        return [initialGemini];
      }
      return [];
    }

    const parsed = JSON.parse(raw);
    if (parsed && parsed.__enc === true) {
      // If encrypted and not yet decrypted in memory, try to read if session PIN exists
      const sessionPin = getActiveSessionPin();
      if (sessionPin && inMemoryDecryptedKeys) {
        return inMemoryDecryptedKeys;
      }
      return inMemoryDecryptedKeys || [];
    }

    // Plaintext array
    if (Array.isArray(parsed)) {
      inMemoryDecryptedKeys = parsed;
      return parsed;
    }
    return [];
  } catch (err) {
    console.error('Failed to read vault keys:', err);
    return inMemoryDecryptedKeys || [];
  }
}

// Asynchronous getter that decrypts if needed
export async function getVaultKeysAsync(pin?: string): Promise<VaultKeyEntry[]> {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(VAULT_KEYS_STORAGE);
    if (!raw) return getVaultKeys();
    const parsed = JSON.parse(raw);
    if (parsed && parsed.__enc === true) {
      const activePin = pin || getActiveSessionPin();
      if (!activePin) {
        throw new Error('Master PIN required to decrypt vault keys');
      }
      const decrypted = await decryptDataAESGCM(parsed, activePin);
      const keys = JSON.parse(decrypted);
      inMemoryDecryptedKeys = keys;
      return keys;
    }
    if (Array.isArray(parsed)) {
      inMemoryDecryptedKeys = parsed;
      return parsed;
    }
  } catch (err) {
    console.error('Async vault decryption failed:', err);
  }
  return getVaultKeys();
}

// Save or update an API key in the vault
export function saveVaultKey(entry: Omit<VaultKeyEntry, 'id' | 'createdAt'>): VaultKeyEntry {
  const keys = getVaultKeys();
  const existingIdx = keys.findIndex(k => k.provider === entry.provider && k.name === entry.name);

  const newEntry: VaultKeyEntry = {
    ...entry,
    id: existingIdx >= 0 ? keys[existingIdx].id : `vault-key-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    createdAt: existingIdx >= 0 ? keys[existingIdx].createdAt : new Date().toISOString()
  };

  if (existingIdx >= 0) {
    keys[existingIdx] = newEntry;
  } else {
    keys.unshift(newEntry);
  }

  inMemoryDecryptedKeys = [...keys];

  const sessionPin = getActiveSessionPin();
  if (sessionPin && hasVaultMasterPassword() && typeof crypto !== 'undefined' && crypto.subtle) {
    // Encrypt in background and sync encrypted payload to Supabase
    encryptDataAESGCM(JSON.stringify(keys), sessionPin)
      .then(encrypted => {
        localStorage.setItem(VAULT_KEYS_STORAGE, JSON.stringify(encrypted));
        const pinHash = localStorage.getItem(VAULT_MASTER_HASH_STORAGE);
        syncVaultToCloud(pinHash, encrypted).catch(() => {});
      })
      .catch(err => {
        console.warn('Async key encryption fallback:', err);
        localStorage.setItem(VAULT_KEYS_STORAGE, JSON.stringify(keys));
      });
  } else {
    localStorage.setItem(VAULT_KEYS_STORAGE, JSON.stringify(keys));
  }
  logSecurityEventToCloud('VAULT_KEY_SAVED', { provider: entry.provider, name: entry.name }).catch(() => {});

  if (entry.model && entry.provider) {
    addCustomModel(entry.provider, entry.model, entry.name);
  }
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('token_os_models_changed', { detail: newEntry }));
  }
  return newEntry;
}

// Delete a key with double confirmation (password + typing "Delete")
export async function deleteVaultKey(
  id: string,
  passwordAttempt: string,
  confirmWord: string
): Promise<{ success: boolean; error?: string }> {
  if (confirmWord !== 'Delete') {
    return { success: false, error: 'You must type "Delete" exactly to confirm removal.' };
  }

  if (hasVaultMasterPassword()) {
    const isPasswordValid = await verifyVaultMasterPassword(passwordAttempt);
    if (!isPasswordValid) {
      const lockout = checkPinLockout();
      if (lockout.locked) {
        return { success: false, error: `Vault locked for ${lockout.remainingSeconds}s due to failed attempts.` };
      }
      return { success: false, error: 'Incorrect Vault Master PIN. Deletion rejected.' };
    }
  }

  const keys = getVaultKeys();
  const updated = keys.filter(k => k.id !== id);
  inMemoryDecryptedKeys = updated;
  const sessionPin = getActiveSessionPin();
  if (sessionPin && hasVaultMasterPassword() && typeof crypto !== 'undefined' && crypto.subtle) {
    try {
      const encrypted = await encryptDataAESGCM(JSON.stringify(updated), sessionPin);
      localStorage.setItem(VAULT_KEYS_STORAGE, JSON.stringify(encrypted));
      const pinHash = localStorage.getItem(VAULT_MASTER_HASH_STORAGE);
      syncVaultToCloud(pinHash, encrypted).catch(() => {});
    } catch {
      localStorage.setItem(VAULT_KEYS_STORAGE, JSON.stringify(updated));
    }
  } else {
    localStorage.setItem(VAULT_KEYS_STORAGE, JSON.stringify(updated));
  }
  logSecurityEventToCloud('VAULT_KEY_DELETED', { id }).catch(() => {});
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('token_os_models_changed'));
  }
  return { success: true };
}

// Retrieve active API key for a provider
export function getActiveProviderKey(provider: string): string | null {
  const cleanProv = provider.toLowerCase();
  const keys = getVaultKeys();
  const match = keys.find(k => k.provider === cleanProv || (cleanProv === 'google' && k.provider === 'gemini'));
  if (match && match.apiKey) return match.apiKey.trim();

  // Check direct localStorage keys (supports custom storage or direct paste)
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      const directKey = 
        localStorage.getItem(`token_os_${cleanProv}_api_key`) ||
        localStorage.getItem(`${cleanProv}_api_key`) ||
        localStorage.getItem(`${cleanProv.toUpperCase()}_API_KEY`) ||
        localStorage.getItem(`VITE_${cleanProv.toUpperCase()}_API_KEY`);
      if (directKey && directKey.trim()) return directKey.trim();
    } catch {}
  }

  // Fallback to environment variables
  const metaEnv = (typeof import.meta !== 'undefined' && (import.meta as any).env) || {};
  if (cleanProv === 'gemini' || cleanProv === 'google') {
    return metaEnv.VITE_GEMINI_API_KEY || metaEnv.VITE_GOOGLE_AI_KEY || null;
  }
  if (cleanProv === 'groq') {
    return metaEnv.VITE_GROQ_API_KEY || metaEnv.GROQ_API_KEY || (typeof process !== 'undefined' ? (process as any).env?.GROQ_API_KEY : null) || null;
  }
  if (cleanProv === 'openrouter') return metaEnv.VITE_OPENROUTER_API_KEY || metaEnv.OPENROUTER_API_KEY || null;
  if (cleanProv === 'nvidia') return metaEnv.VITE_NVIDIA_API_KEY || null;
  return null;
}

// Retrieve active key entry including baseUrl and model
export function getActiveKeyEntry(provider: string): VaultKeyEntry | null {
  const keys = getVaultKeys();
  return keys.find(k => k.provider === provider || (provider === 'google' && k.provider === 'gemini')) || null;
}

export interface CustomModelEntry {
  id: string;
  name: string;
  provider: string;
  createdAt: string;
}

export function getCustomModels(): CustomModelEntry[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(VAULT_CUSTOM_MODELS_STORAGE);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function addCustomModel(provider: string, modelId: string, modelName?: string): CustomModelEntry {
  const models = getCustomModels();
  const trimmed = modelId.trim();
  const prov = provider === 'google' ? 'gemini' : provider;
  const existing = models.find(m => m.provider === prov && m.id.toLowerCase() === trimmed.toLowerCase());
  if (existing) {
    return existing;
  }
  const entry: CustomModelEntry = {
    id: trimmed,
    name: modelName?.trim() || trimmed,
    provider: prov,
    createdAt: new Date().toISOString()
  };
  models.push(entry);
  if (typeof window !== 'undefined') {
    localStorage.setItem(VAULT_CUSTOM_MODELS_STORAGE, JSON.stringify(models));
    window.dispatchEvent(new CustomEvent('token_os_models_changed', { detail: entry }));
  }
  return entry;
}

export function removeCustomModel(modelId: string): void {
  const models = getCustomModels();
  const updated = models.filter(m => m.id.toLowerCase() !== modelId.toLowerCase().trim());
  if (typeof window !== 'undefined') {
    localStorage.setItem(VAULT_CUSTOM_MODELS_STORAGE, JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent('token_os_models_changed'));
  }
}

export function getAllProviderModels(): Record<string, { value: string; label: string }[]> {
  const baseModels: Record<string, { value: string; label: string }[]> = {
    auto: [
      { value: 'auto-optimal', label: 'Dynamic Intent Router (Auto-selects optimal model)' }
    ],
    gemini: [
      { value: 'gemini-flash-latest', label: 'Gemini Flash Latest (Google AI Studio Free Tier)' },
      { value: 'gemini-2.0-flash', label: 'Gemini 2.0 Flash (Google AI Studio)' },
      { value: 'gemini-1.5-flash', label: 'Gemini 1.5 Flash (Standard)' },
      { value: 'gemini-3.8-flash', label: 'Gemini 3.8 Flash (Preview)' },
      { value: 'gemini-2.5-pro', label: 'Gemini 2.5 Pro (Frontier)' }
    ],
    openrouter: [
      { value: 'google/gemma-4-26b-a4b-it:free', label: 'Google Gemma 4 26B (OpenRouter Free)' },
      { value: 'meta-llama/llama-3.3-70b-instruct:free', label: 'Llama 3.3 70B Instruct (Free)' },
      { value: 'deepseek/deepseek-r1:free', label: 'DeepSeek R1 (OpenRouter Free)' },
      { value: 'deepseek/deepseek-r1', label: 'DeepSeek R1 Reasoning' },
      { value: 'qwen/qwen-2.5-coder-32b-instruct:free', label: 'Qwen 2.5 Coder 32B (Free)' },
      { value: 'google/gemini-2.0-flash-exp:free', label: 'Gemini 2.0 Flash (OpenRouter Free)' },
      { value: 'anthropic/claude-3.5-sonnet', label: 'Claude 3.5 Sonnet (BYOK Paid)' },
      { value: 'openai/gpt-4o-mini', label: 'GPT-4o Mini (Low-Cost)' }
    ],
    groq: [
      { value: 'llama-3.3-70b-versatile', label: 'Llama 3.3 70B Versatile (Groq Cloud Ultra-Fast)' },
      { value: 'llama-3.1-8b-instant', label: 'Llama 3.1 8B Instant (<200ms)' },
      { value: 'mixtral-8x7b-32768', label: 'Mixtral 8x7B (32k Context)' },
      { value: 'gemma2-9b-it', label: 'Gemma 2 9B Instruct' }
    ],
    nvidia: [
      { value: 'meta/llama-3.3-70b-instruct', label: 'Llama 3.3 70B Instruct (NVIDIA NIM)' },
      { value: 'deepseek-ai/deepseek-r1', label: 'DeepSeek R1 (NVIDIA NIM)' },
      { value: 'nvidia/llama-3.1-nemotron-70b-instruct', label: 'Nemotron 70B (NVIDIA NIM)' },
      { value: 'mistralai/mistral-large-2-instruct', label: 'Mistral Large 2 (NVIDIA NIM)' }
    ],
    ollama: [
      { value: 'mistral:latest', label: 'mistral:latest (Local Offline)' },
      { value: 'qwen2.5-coder:7b-instruct', label: 'qwen2.5-coder:7b-instruct (Local Sovereign)' },
      { value: 'llama3.2:3b-instruct', label: 'llama3.2:3b-instruct (Local)' },
      { value: 'deepseek-r1:7b', label: 'deepseek-r1:7b (Local)' }
    ],
    custom: [
      { value: 'gpt-4o-mini', label: 'gpt-4o-mini (Custom OpenAI Compatible)' }
    ],
    simulated: [
      { value: 'tokenos-synthesizer-v2', label: 'TokenOS Deterministic SLA Synthesizer' }
    ]
  };

  // Add models from saved Vault keys
  const keys = getVaultKeys();
  for (const k of keys) {
    if (!k.model) continue;
    const prov = (k.provider as string) === 'google' ? 'gemini' : (k.provider as string);
    if (!baseModels[prov]) baseModels[prov] = [];
    const exists = baseModels[prov].some(m => m.value.toLowerCase() === k.model.toLowerCase());
    if (!exists) {
      baseModels[prov].unshift({
        value: k.model,
        label: `${k.model} (Vault: ${k.name || 'Configured'})`
      });
    }
  }

  // Add registered custom models
  const customModels = getCustomModels();
  for (const cm of customModels) {
    if (!cm.id) continue;
    const prov = (cm.provider as string) === 'google' ? 'gemini' : (cm.provider as string);
    if (!baseModels[prov]) baseModels[prov] = [];
    const exists = baseModels[prov].some(m => m.value.toLowerCase() === cm.id.toLowerCase());
    if (!exists) {
      baseModels[prov].unshift({
        value: cm.id,
        label: `${cm.name || cm.id} (Custom Added)`
      });
    }
  }

  return baseModels;
}

/**
 * Hydrate Master PIN hash and AES-GCM encrypted vault payload from Supabase on login.
 * Never transmits or stores plaintext PINs or plaintext keys in the cloud.
 */
export async function hydrateVaultFromCloud(): Promise<{ hasPin: boolean; synced: boolean }> {
  if (typeof window === 'undefined') return { hasPin: false, synced: false };
  try {
    const cloudVault = await fetchVaultFromCloud();
    if (!cloudVault) return { hasPin: hasVaultMasterPassword(), synced: false };

    let updated = false;
    if (cloudVault.masterPinHash) {
      localStorage.setItem(VAULT_MASTER_HASH_STORAGE, cloudVault.masterPinHash);
      updated = true;
    }

    if (cloudVault.encryptedVaultPayload && cloudVault.encryptedVaultPayload.__enc === true) {
      localStorage.setItem(VAULT_KEYS_STORAGE, JSON.stringify(cloudVault.encryptedVaultPayload));
      updated = true;
    }

    if (updated) {
      window.dispatchEvent(
        new CustomEvent('token_os_pin_changed', { detail: { hasPin: Boolean(cloudVault.masterPinHash) } })
      );
      window.dispatchEvent(new Event('storage'));
    }

    return { hasPin: Boolean(cloudVault.masterPinHash), synced: updated };
  } catch {
    return { hasPin: hasVaultMasterPassword(), synced: false };
  }
}
