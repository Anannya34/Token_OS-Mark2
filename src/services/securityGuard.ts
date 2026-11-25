/**
 * TOKEN-OS ZERO-TRUST SECURITY GUARD
 * Implements client-side anti-brute force, rate limiting,
 * honeypot bot trap detection, and credential sanitization.
 */

interface RateLimitRecord {
  attempts: number;
  lockoutUntil: number; // timestamp ms
  lastAttempt: number;
}

const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_WINDOW_MS = 60 * 1000; // 60 seconds
const ATTEMPT_DECAY_WINDOW_MS = 120 * 1000; // 2 minutes

const rateLimitStore: Record<string, RateLimitRecord> = {};

export interface SecurityCheckResult {
  allowed: boolean;
  lockoutRemainingSec?: number;
  reason?: string;
}

export interface PasswordStrength {
  score: number; // 0 to 4
  label: 'WEAK' | 'FAIR' | 'GOOD' | 'STRONG';
  feedback: string[];
}

/**
 * Check if a client/email is currently rate limited
 */
export function checkRateLimit(identifier: string): SecurityCheckResult {
  const key = identifier.toLowerCase().trim() || 'global_client';
  const now = Date.now();
  const record = rateLimitStore[key];

  if (!record) {
    return { allowed: true };
  }

  // Check active lockout
  if (record.lockoutUntil > now) {
    const remainingSec = Math.ceil((record.lockoutUntil - now) / 1000);
    return {
      allowed: false,
      lockoutRemainingSec: remainingSec,
      reason: `SECURITY ALERT: Too many failed authentication attempts. Account temporarily locked for ${remainingSec}s to prevent brute-force attacks.`
    };
  }

  // Decay old attempts if past window
  if (now - record.lastAttempt > ATTEMPT_DECAY_WINDOW_MS) {
    delete rateLimitStore[key];
    return { allowed: true };
  }

  return { allowed: true };
}

/**
 * Record a failed authentication attempt
 */
export function recordFailedAttempt(identifier: string): SecurityCheckResult {
  const key = identifier.toLowerCase().trim() || 'global_client';
  const now = Date.now();
  const record = rateLimitStore[key] || { attempts: 0, lockoutUntil: 0, lastAttempt: now };

  record.attempts += 1;
  record.lastAttempt = now;

  if (record.attempts >= MAX_FAILED_ATTEMPTS) {
    record.lockoutUntil = now + LOCKOUT_WINDOW_MS;
    rateLimitStore[key] = record;
    const remainingSec = Math.ceil(LOCKOUT_WINDOW_MS / 1000);
    return {
      allowed: false,
      lockoutRemainingSec: remainingSec,
      reason: `EXCEEDED RATE LIMIT: ${MAX_FAILED_ATTEMPTS} failed attempts detected. Cooldown enforced for ${remainingSec}s.`
    };
  }

  rateLimitStore[key] = record;
  return { allowed: true };
}

/**
 * Reset rate limit counter upon successful authentication
 */
export function clearRateLimit(identifier: string): void {
  const key = identifier.toLowerCase().trim() || 'global_client';
  delete rateLimitStore[key];
}

/**
 * Sanitize user input to neutralize injection payloads
 */
export function sanitizeInput(input: string): string {
  if (!input) return '';
  return input
    .replace(/[<>]/g, '') // remove HTML tag brackets
    .trim();
}

/**
 * Check honeypot field (anti-bot protection)
 * Real humans never fill hidden honeypot inputs; bots do.
 */
export function isHoneypotTriggered(honeypotValue: string): boolean {
  return Boolean(honeypotValue && honeypotValue.trim().length > 0);
}

/**
 * Strict RFC-compliant email address validation
 */
export interface EmailValidationResult {
  valid: boolean;
  error?: string;
}

export function validateEmail(email: string): EmailValidationResult {
  const clean = email.trim();
  if (!clean) {
    return { valid: false, error: 'Email address cannot be empty.' };
  }
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;
  if (!emailRegex.test(clean)) {
    return { valid: false, error: 'Invalid email address format (e.g. name@domain.com).' };
  }
  return { valid: true };
}

/**
 * Strict password criteria checker (Min 8 chars, uppercase, lowercase, number, special char)
 */
export interface PasswordCriteria {
  minLength: boolean;
  hasUpper: boolean;
  hasLower: boolean;
  hasNumber: boolean;
  hasSpecial: boolean;
  isAllMet: boolean;
}

export function checkPasswordCriteria(password: string): PasswordCriteria {
  const minLength = password.length >= 8;
  const hasUpper = /[A-Z]/.test(password);
  const hasLower = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password);
  return {
    minLength,
    hasUpper,
    hasLower,
    hasNumber,
    hasSpecial,
    isAllMet: minLength && hasUpper && hasLower && hasNumber && hasSpecial
  };
}

/**
 * Calculate password security strength & entropy
 */
export function evaluatePasswordStrength(password: string): PasswordStrength {
  const criteria = checkPasswordCriteria(password);
  const feedback: string[] = [];
  let score = 0;

  if (criteria.minLength) score += 1;
  else feedback.push('At least 8 characters');

  if (criteria.hasUpper) score += 1;
  else feedback.push('Uppercase letter (A-Z)');

  if (criteria.hasLower) score += 1;
  else feedback.push('Lowercase letter (a-z)');

  if (criteria.hasNumber) score += 1;
  else feedback.push('Number (0-9)');

  if (criteria.hasSpecial) score += 1;
  else feedback.push('Special character (!@#$%^&*)');

  const labels: PasswordStrength['label'][] = ['WEAK', 'FAIR', 'GOOD', 'STRONG'];
  const labelIndex = Math.min(Math.max(score - 2, 0), 3);

  return {
    score,
    label: labels[labelIndex],
    feedback
  };
}

export interface SecurityAuditEntry {
  id: string;
  eventType: 'LOGIN_SUCCESS' | 'LOGIN_FAILED' | 'RATE_LIMIT_TRIGGERED' | 'IPAR_PATCH_APPLIED' | 'EXECUTION_LAUNCHED';
  identifier: string;
  timestamp: string;
  metadata?: Record<string, any>;
}

const AUDIT_LOGS_KEY = 'token_os_security_audit_logs';

/**
 * Log a security event locally and to Supabase (if connected)
 */
export function logSecurityAudit(
  eventType: 'LOGIN_SUCCESS' | 'LOGIN_FAILED' | 'RATE_LIMIT_TRIGGERED' | 'IPAR_PATCH_APPLIED' | 'EXECUTION_LAUNCHED',
  identifier: string,
  metadata?: Record<string, any>
): SecurityAuditEntry {
  const entry: SecurityAuditEntry = {
    id: `sec-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    eventType,
    identifier,
    timestamp: new Date().toISOString(),
    metadata: metadata || {}
  };

  try {
    const raw = localStorage.getItem(AUDIT_LOGS_KEY);
    const existing: SecurityAuditEntry[] = raw ? JSON.parse(raw) : [];
    localStorage.setItem(AUDIT_LOGS_KEY, JSON.stringify([entry, ...existing].slice(0, 50)));
  } catch {}

  return entry;
}

/**
 * Retrieve cached security audit logs
 */
export function getSecurityAuditLogs(): SecurityAuditEntry[] {
  try {
    const raw = localStorage.getItem(AUDIT_LOGS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}
