import React, { useState, useEffect } from 'react';
import { 
  Shield, 
  Key, 
  Lock, 
  Unlock, 
  Eye, 
  EyeOff, 
  Trash2, 
  RefreshCw, 
  Plus, 
  CheckCircle2, 
  AlertCircle, 
  X, 
  ExternalLink,
  Zap,
  Globe,
  Check,
  Copy
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  getVaultKeys, 
  saveVaultKey, 
  deleteVaultKey, 
  verifyVaultMasterPassword, 
  hasVaultMasterPassword,
  checkPinLockout,
  PROVIDER_PRESETS, 
  type VaultKeyEntry, 
  type ProviderPreset 
} from '../../services/apiVaultService.ts';
import { testUniversalLLMConnection } from '../../services/aiEngine.ts';

interface ApiKeyVaultModalProps {
  isOpen: boolean;
  onClose: () => void;
  onKeysUpdated?: () => void;
}

export const ApiKeyVaultModal: React.FC<ApiKeyVaultModalProps> = ({
  isOpen,
  onClose,
  onKeysUpdated
}) => {
  const [keys, setKeys] = useState<VaultKeyEntry[]>([]);
  const [selectedProvider, setSelectedProvider] = useState<string>('groq');
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [modelInput, setModelInput] = useState('');
  const [baseUrlInput, setBaseUrlInput] = useState('');
  const [keyNameInput, setKeyNameInput] = useState('');
  
  // Security & Password states
  const [isMasterPasswordSet, setIsMasterPasswordSet] = useState(false);
  const [masterPasswordModalOpen, setMasterPasswordModalOpen] = useState(false);
  const [passwordPromptAction, setPasswordPromptAction] = useState<'view' | 'delete' | null>(null);
  const [passwordAttempt, setPasswordAttempt] = useState('');
  const [deleteConfirmWord, setDeleteConfirmWord] = useState('');
  const [targetKeyForAction, setTargetKeyForAction] = useState<VaultKeyEntry | null>(null);
  
  // Unmasked keys set (IDs of keys revealed after password check)
  const [revealedKeyIds, setRevealedKeyIds] = useState<Set<string>>(new Set());
  
  // Feedback states
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; latencyMs: number; message: string } | null>(null);
  const [testingKeyId, setTestingKeyId] = useState<string | null>(null);
  const [copiedKeyId, setCopiedKeyId] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadKeys();
      setIsMasterPasswordSet(hasVaultMasterPassword());
      applyPreset('groq');
    }

    const handlePinChanged = () => {
      setIsMasterPasswordSet(hasVaultMasterPassword());
    };
    window.addEventListener('token_os_pin_changed', handlePinChanged);
    window.addEventListener('storage', handlePinChanged);
    return () => {
      window.removeEventListener('token_os_pin_changed', handlePinChanged);
      window.removeEventListener('storage', handlePinChanged);
    };
  }, [isOpen]);

  const loadKeys = () => {
    const loaded = getVaultKeys();
    setKeys(loaded);
  };

  const applyPreset = (providerKey: string) => {
    setSelectedProvider(providerKey);
    const preset: ProviderPreset = PROVIDER_PRESETS[providerKey] || PROVIDER_PRESETS.groq;
    setBaseUrlInput(preset.baseUrl);
    setModelInput(preset.defaultModel);
    setKeyNameInput(`${preset.name} Key`);
    setApiKeyInput('');
    setTestResult(null);
  };

  const showStatus = (text: string, type: 'success' | 'error') => {
    setStatusMessage({ type, text });
    setTimeout(() => setStatusMessage(null), 4000);
  };

  // Test live connection of new key being added
  const handleTestNewKey = async () => {
    if (!apiKeyInput.trim() && selectedProvider !== 'ollama') {
      showStatus('Please paste an API key before testing connection.', 'error');
      return;
    }
    setIsTesting(true);
    setTestResult(null);

    const res = await testUniversalLLMConnection(
      baseUrlInput,
      apiKeyInput.trim(),
      modelInput
    );

    setIsTesting(false);
    setTestResult(res);
  };

  // Save new key into the vault
  const handleSaveKey = () => {
    if (!apiKeyInput.trim() && selectedProvider !== 'ollama') {
      showStatus('API key cannot be empty.', 'error');
      return;
    }

    const preset = PROVIDER_PRESETS[selectedProvider];
    saveVaultKey({
      provider: selectedProvider as any,
      name: keyNameInput.trim() || `${preset?.name || selectedProvider} Key`,
      apiKey: apiKeyInput.trim(),
      baseUrl: baseUrlInput.trim() || preset?.baseUrl || '',
      model: modelInput.trim() || preset?.defaultModel || '',
      isVerified: testResult?.success || false
    });

    loadKeys();
    onKeysUpdated?.();
    setApiKeyInput('');
    setTestResult(null);
    showStatus('API Key successfully saved to secure vault!', 'success');
  };

  // Test an existing saved key directly
  const handleTestExistingKey = async (entry: VaultKeyEntry) => {
    setTestingKeyId(entry.id);
    const res = await testUniversalLLMConnection(
      entry.baseUrl,
      entry.apiKey,
      entry.model
    );
    setTestingKeyId(null);
    showStatus(
      res.success 
        ? `✔ Connected to ${entry.name} (${res.latencyMs}ms)` 
        : `❌ Error: ${res.message}`,
      res.success ? 'success' : 'error'
    );
  };

  // Request to reveal key (direct unmasking if no PIN configured, otherwise authenticates)
  const handleRequestRevealKey = (entry: VaultKeyEntry) => {
    if (revealedKeyIds.has(entry.id)) {
      // Re-mask
      setRevealedKeyIds(prev => {
        const next = new Set(prev);
        next.delete(entry.id);
        return next;
      });
      return;
    }

    // Direct mode: if no Master PIN is set, reveal directly without prompt
    if (!hasVaultMasterPassword()) {
      setRevealedKeyIds(prev => new Set(prev).add(entry.id));
      showStatus(`Unmasked key for ${entry.name} (Direct Mode).`, 'success');
      return;
    }

    const lockout = checkPinLockout();
    if (lockout.locked) {
      showStatus(`Vault locked due to consecutive failed attempts. Wait ${lockout.remainingSeconds}s.`, 'error');
      return;
    }

    setTargetKeyForAction(entry);
    setPasswordPromptAction('view');
    setPasswordAttempt('');
    setMasterPasswordModalOpen(true);
  };

  // Request to delete key (requires confirmation; asks for PIN only if configured)
  const handleRequestDeleteKey = (entry: VaultKeyEntry) => {
    if (hasVaultMasterPassword()) {
      const lockout = checkPinLockout();
      if (lockout.locked) {
        showStatus(`Vault locked due to failed attempts. Wait ${lockout.remainingSeconds}s.`, 'error');
        return;
      }
    }

    setTargetKeyForAction(entry);
    setPasswordPromptAction('delete');
    setPasswordAttempt('');
    setDeleteConfirmWord('');
    setMasterPasswordModalOpen(true);
  };

  // Verify PIN and perform action
  const handleVerifyPasswordAndExecute = async () => {
    const isProtected = hasVaultMasterPassword();

    if (isProtected) {
      const isValid = await verifyVaultMasterPassword(passwordAttempt);
      if (!isValid) {
        const lockout = checkPinLockout();
        if (lockout.locked) {
          showStatus(`Vault locked for ${lockout.remainingSeconds}s due to 5 failed attempts.`, 'error');
          setMasterPasswordModalOpen(false);
          return;
        }
        showStatus('Incorrect Master PIN.', 'error');
        return;
      }
    }

    if (passwordPromptAction === 'view' && targetKeyForAction) {
      setRevealedKeyIds(prev => new Set(prev).add(targetKeyForAction.id));
      setMasterPasswordModalOpen(false);
      showStatus('Key unmasked.', 'success');
    } else if (passwordPromptAction === 'delete' && targetKeyForAction) {
      const res = await deleteVaultKey(targetKeyForAction.id, passwordAttempt, deleteConfirmWord);
      if (res.success) {
        loadKeys();
        onKeysUpdated?.();
        setMasterPasswordModalOpen(false);
        showStatus(`Deleted ${targetKeyForAction.name} successfully.`, 'success');
      } else {
        showStatus(res.error || 'Failed to delete.', 'error');
      }
    }
  };

  const handleCopyKey = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKeyId(id);
    setTimeout(() => setCopiedKeyId(null), 2000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="relative w-full max-w-3xl bg-[#0F172A] border border-slate-700 rounded-2xl shadow-[0_0_50px_rgba(217,119,87,0.25)] overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/80">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-[#D97757]/10 text-[#D97757] border border-[#D97757]/30 shadow-[0_0_15px_rgba(217,119,87,0.2)]">
              <Key className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-[#F0F4F8] tracking-wide font-mono">
                  SECURE API KEY VAULT
                </h2>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800 flex items-center gap-1 font-bold">
                  <Lock className="w-3 h-3" />
                  CLIENT ENCRYPTED
                </span>
              </div>
              <p className="text-xs text-slate-400 font-sans">
                Connect and manage Groq, Gemini, OpenRouter, and custom endpoints with zero server key leakage.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Global Feedback Banner */}
        {statusMessage && (
          <div className={`px-6 py-2.5 text-xs font-mono flex items-center gap-2 ${
            statusMessage.type === 'success' 
              ? 'bg-emerald-950/80 border-b border-emerald-800 text-emerald-300' 
              : 'bg-red-950/80 border-b border-red-800 text-red-300'
          }`}>
            {statusMessage.type === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
            <span>{statusMessage.text}</span>
          </div>
        )}

        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {/* Section 1: Connected Keys List */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-mono font-bold text-[#E2896B] uppercase tracking-wider flex items-center gap-2">
                <Lock className="w-3.5 h-3.5" />
                Active Connected LLM Keys ({keys.length})
              </h3>
            </div>

            {keys.length === 0 ? (
              <div className="p-4 rounded-xl border border-dashed border-slate-800 bg-slate-900/40 text-center text-xs text-slate-400 font-sans">
                No custom API keys connected yet. Select a provider below to connect your free key.
              </div>
            ) : (
              <div className="space-y-2.5">
                {keys.map((k) => {
                  const isRevealed = revealedKeyIds.has(k.id);
                  const isTestingThis = testingKeyId === k.id;
                  const isCopied = copiedKeyId === k.id;

                  return (
                    <div 
                      key={k.id}
                      className="p-3.5 rounded-xl border border-slate-800 bg-slate-900/80 flex flex-wrap items-center justify-between gap-3 text-xs font-mono"
                    >
                      <div className="space-y-1 min-w-[220px]">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-100">{k.name}</span>
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-800 text-[#D97757] border border-slate-700 uppercase font-mono">
                            {k.provider}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-400 flex items-center gap-1.5 font-sans">
                          <span>Model: <strong className="font-mono text-slate-300">{k.model}</strong></span>
                        </div>
                        <div className="flex items-center gap-2 text-slate-400 font-mono text-[11px]">
                          <span>
                            {isRevealed 
                              ? k.apiKey 
                              : `sk-${'•'.repeat(Math.min(28, Math.max(12, k.apiKey.length - 4)))}`}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {/* Eye Toggle to View / Mask */}
                        <button
                          type="button"
                          onClick={() => handleRequestRevealKey(k)}
                          className="p-2 rounded-lg bg-slate-950 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-800 transition-colors cursor-pointer"
                          title={isRevealed ? "Hide API Key" : "View API Key (Requires Master Password)"}
                        >
                          {isRevealed ? <EyeOff className="w-3.5 h-3.5 text-amber-400" /> : <Eye className="w-3.5 h-3.5" />}
                        </button>

                        {/* Copy Key Button */}
                        <button
                          type="button"
                          onClick={() => handleCopyKey(k.id, k.apiKey)}
                          className="p-2 rounded-lg bg-slate-950 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-800 transition-colors cursor-pointer"
                          title="Copy API Key"
                        >
                          {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>

                        {/* Ping / Test Live Connection */}
                        <button
                          type="button"
                          onClick={() => handleTestExistingKey(k)}
                          disabled={isTestingThis}
                          className="px-2.5 py-1.5 rounded-lg bg-slate-950 hover:bg-slate-800 text-slate-300 border border-slate-800 text-[11px] flex items-center gap-1.5 transition-colors cursor-pointer"
                        >
                          <RefreshCw className={`w-3 h-3 ${isTestingThis ? 'animate-spin text-[#D97757]' : ''}`} />
                          <span>{isTestingThis ? 'Pinging...' : 'Test Connection'}</span>
                        </button>

                        {/* Delete Button (Double Confirmation) */}
                        <button
                          type="button"
                          onClick={() => handleRequestDeleteKey(k)}
                          className="p-2 rounded-lg bg-red-950/40 hover:bg-red-900/60 text-red-400 border border-red-800/60 transition-colors cursor-pointer"
                          title="Delete API Key (Requires Password & Confirmation)"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="border-t border-slate-800 pt-5">
            <h3 className="text-xs font-mono font-bold text-[#E2896B] uppercase tracking-wider mb-3 flex items-center gap-2">
              <Plus className="w-3.5 h-3.5" />
              Connect a New AI Provider
            </h3>

            {/* Provider Quick Selector */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
              {Object.keys(PROVIDER_PRESETS).filter(p => p !== 'openai').map((key) => {
                const preset = PROVIDER_PRESETS[key];
                const isSelected = selectedProvider === key;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => applyPreset(key)}
                    className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-[#1B2436] text-[#D97757] border-[#D97757]/80 font-bold shadow-[0_0_15px_rgba(217,119,87,0.2)]'
                        : 'bg-slate-900/70 text-slate-400 border-slate-800 hover:text-slate-200 hover:border-slate-700'
                    }`}
                  >
                    <div className="text-xs truncate font-mono">{preset.name.split(' (')[0]}</div>
                    <div className="text-[10px] text-slate-500 font-sans mt-0.5 truncate">
                      {key === 'groq' ? 'Ultra-Fast Free LPUs' : key === 'gemini' ? '15 RPM Free Tier' : key === 'ollama' ? '100% Offline' : '200+ Models'}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Provider Help Hint */}
            {PROVIDER_PRESETS[selectedProvider]?.description && (
              <div className="p-3 bg-slate-900/90 border border-slate-800 rounded-xl mb-4 text-xs font-sans text-slate-300 flex items-center justify-between">
                <span>{PROVIDER_PRESETS[selectedProvider].description}</span>
                {PROVIDER_PRESETS[selectedProvider].keyHelpUrl && (
                  <a
                    href={PROVIDER_PRESETS[selectedProvider].keyHelpUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[#D97757] hover:underline flex items-center gap-1 font-mono text-[11px] shrink-0 ml-3"
                  >
                    <span>Get Key</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>
            )}

            {/* Form Fields with Suggestions */}
            <div className="space-y-3.5 text-xs font-mono">
              <div>
                <label className="block text-slate-300 mb-1 text-[11px]">
                  API Key / Bearer Secret Token
                </label>
                <input
                  type="password"
                  value={apiKeyInput}
                  onChange={(e) => setApiKeyInput(e.target.value)}
                  placeholder={selectedProvider === 'ollama' ? 'No key needed for local Ollama' : 'Paste your API key here (e.g. gsk_... or AIza...)'}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 font-mono text-xs focus:outline-none focus:border-[#D97757]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-slate-300 text-[11px]">
                      Serving Model
                    </label>
                    <span className="text-[10px] text-[#E2896B]">Select or Type Any Model</span>
                  </div>
                  <div className="relative">
                    <input
                      type="text"
                      list={`models-${selectedProvider}`}
                      value={modelInput}
                      onChange={(e) => setModelInput(e.target.value)}
                      placeholder="e.g. llama-3.3-70b-versatile or custom model"
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 font-mono text-xs focus:outline-none focus:border-[#D97757]"
                    />
                    <datalist id={`models-${selectedProvider}`}>
                      {PROVIDER_PRESETS[selectedProvider]?.availableModels?.map(m => (
                        <option key={m.id} value={m.id}>
                          {m.name}
                        </option>
                      ))}
                    </datalist>
                  </div>
                </div>

                <div>
                  <label className="block text-slate-300 mb-1 text-[11px]">
                    Base URL / Gateway Endpoint (Auto-Filled)
                  </label>
                  <input
                    type="text"
                    value={baseUrlInput}
                    onChange={(e) => setBaseUrlInput(e.target.value)}
                    placeholder="https://api.groq.com/openai/v1"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 font-mono text-xs focus:outline-none focus:border-[#D97757]"
                  />
                </div>
              </div>

              {/* Test Result Live Banner */}
              {testResult && (
                <div className={`p-3 rounded-xl border text-xs flex items-center justify-between ${
                  testResult.success 
                    ? 'bg-emerald-950/70 border-emerald-700/80 text-emerald-300' 
                    : 'bg-red-950/70 border-red-800 text-red-300'
                }`}>
                  <div className="flex items-center gap-2">
                    {testResult.success ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <AlertCircle className="w-4 h-4 text-red-400" />}
                    <span>{testResult.message}</span>
                  </div>
                  {testResult.latencyMs > 0 && (
                    <span className="font-mono text-[10px] text-slate-400">{testResult.latencyMs}ms</span>
                  )}
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleTestNewKey}
                  disabled={isTesting}
                  className="flex-1 py-2.5 bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 font-mono font-bold rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isTesting ? 'animate-spin text-[#D97757]' : ''}`} />
                  <span>{isTesting ? 'Pinging Provider...' : 'Test Connection & Ping'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleSaveKey}
                  className="flex-1 py-2.5 bg-[#D97757] hover:bg-[#E2896B] text-black font-mono font-bold rounded-xl transition-all shadow-[0_0_20px_rgba(217,119,87,0.3)] flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Key className="w-3.5 h-3.5 fill-black" />
                  <span>Save to Secure Vault</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* MASTER PASSWORD / DELETE CONFIRMATION MODAL */}
      <AnimatePresence>
        {masterPasswordModalOpen && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-md bg-[#0A0E17] border border-slate-700 rounded-2xl p-6 shadow-2xl space-y-4 font-mono text-xs"
            >
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2 text-slate-100 font-bold">
                  {passwordPromptAction === 'delete' ? <Trash2 className="w-4 h-4 text-red-400" /> : <Lock className="w-4 h-4 text-[#D97757]" />}
                  <span>
                    {passwordPromptAction === 'view' ? 'Authenticate to View Key' : 'Confirm API Key Deletion'}
                  </span>
                </div>
                <button 
                  onClick={() => setMasterPasswordModalOpen(false)}
                  className="text-slate-400 hover:text-white cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {passwordPromptAction === 'view' && (
                <div className="space-y-3">
                  <p className="text-slate-300 font-sans text-xs">
                    Enter your Vault Master PIN to unmask and view the secret key for <strong className="text-white">{targetKeyForAction?.name}</strong>.
                  </p>
                  <input
                    type="password"
                    value={passwordAttempt}
                    onChange={(e) => setPasswordAttempt(e.target.value)}
                    placeholder="Enter Vault Master PIN"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 text-xs focus:outline-none focus:border-[#D97757]"
                    autoFocus
                  />
                </div>
              )}

              {passwordPromptAction === 'delete' && (
                <div className="space-y-3">
                  <div className="p-3 bg-red-950/40 border border-red-800/80 rounded-xl text-red-300 text-xs font-sans">
                    ⚠️ <strong>Permanent Action:</strong> This will remove <span className="font-mono font-bold text-white">{targetKeyForAction?.name}</span> from your local vault.
                  </div>

                  {isMasterPasswordSet && (
                    <div>
                      <label className="block text-slate-300 mb-1 text-[11px]">1. Enter Master PIN</label>
                      <input
                        type="password"
                        value={passwordAttempt}
                        onChange={(e) => setPasswordAttempt(e.target.value)}
                        placeholder="Enter Vault Master PIN"
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 text-xs focus:outline-none focus:border-red-500"
                        autoFocus
                      />
                    </div>
                  )}

                  <div>
                    <label className="block text-slate-300 mb-1 text-[11px]">
                      {isMasterPasswordSet ? '2. ' : ''}Type <strong className="text-red-400">Delete</strong> to confirm
                    </label>
                    <input
                      type="text"
                      value={deleteConfirmWord}
                      onChange={(e) => setDeleteConfirmWord(e.target.value)}
                      placeholder='Type "Delete" exactly'
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 text-xs focus:outline-none focus:border-red-500 font-mono"
                      autoFocus={!isMasterPasswordSet}
                    />
                  </div>
                </div>
              )}

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setMasterPasswordModalOpen(false)}
                  className="flex-1 py-2 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded-lg font-mono cursor-pointer"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={handleVerifyPasswordAndExecute}
                  disabled={passwordPromptAction === 'delete' && deleteConfirmWord !== 'Delete'}
                  className={`flex-1 py-2 rounded-lg font-mono font-bold transition-all ${
                    passwordPromptAction === 'delete'
                      ? deleteConfirmWord === 'Delete'
                        ? 'bg-red-600 hover:bg-red-500 text-white cursor-pointer'
                        : 'bg-red-950/40 text-red-700 border border-red-900/40 cursor-not-allowed'
                      : 'bg-[#D97757] hover:bg-[#E2896B] text-black cursor-pointer'
                  }`}
                >
                  {passwordPromptAction === 'view' ? 'Unmask Key' : 'Confirm Deletion'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
