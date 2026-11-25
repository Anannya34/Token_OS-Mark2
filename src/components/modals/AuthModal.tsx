import React, { useState, useEffect, useMemo } from 'react';
import { 
  X, 
  Lock, 
  Key, 
  Database, 
  UserCheck, 
  CheckCircle2, 
  AlertCircle, 
  Save, 
  ShieldCheck, 
  ShieldAlert, 
  Eye, 
  EyeOff, 
  Trash2, 
  RefreshCw,
  Check,
  HardDrive,
  FolderTree,
  FolderArchive,
  FileText,
  FileCode,
  Copy
} from 'lucide-react';
import { 
  AuthSession, 
  UserType, 
  getAuthSession, 
  setAuthSession,
  getSavedRuns,
  getSavedContracts,
  exportRunAsMarkdown,
  exportRunCodeFile,
  exportCompleteWorkspaceJson,
  clearAllRuns
} from '../../services/storageService';
import type { ExecutionRun, IntentContract } from '../../types';
import { 
  hasVaultMasterPassword, 
  setVaultMasterPassword, 
  changeVaultMasterPassword, 
  removeVaultMasterPassword, 
  purgeMasterPin,
  evaluatePinEntropy,
  checkPinLockout,
  type PinEntropyResult
} from '../../services/apiVaultService';
import { getSupabaseClient } from '../../services/supabaseClient';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSessionUpdated: (session: AuthSession) => void;
  onSignOut?: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ 
  isOpen, 
  onClose, 
  onSessionUpdated 
}) => {
  const current = getAuthSession();

  // User Profile Form State (Initialized from active session with fallback to sovereign operator defaults)
  const [fullName, setFullName] = useState(current.user?.fullName || '');
  const [email, setEmail] = useState(current.user?.email || '');
  const [organization, setOrganization] = useState(current.user?.organization || 'Token-OS Autonomous Labs');
  const [role, setRole] = useState<UserType>(current.user?.role || 'SYSTEM_ARCHITECT');

  // Vault Master PIN State
  const [hasPin, setHasPin] = useState<boolean>(() => hasVaultMasterPassword());
  const [pinAction, setPinAction] = useState<'idle' | 'set' | 'change' | 'remove'>('idle');
  
  // PIN Form Inputs
  const [currentPinInput, setCurrentPinInput] = useState('');
  const [newPinInput, setNewPinInput] = useState('');
  const [confirmPinInput, setConfirmPinInput] = useState('');
  const [showPins, setShowPins] = useState(false);
  const [pinStatusMessage, setPinStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isSubmittingPin, setIsSubmittingPin] = useState(false);

  // Profile Save Feedback
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Saved Runs & Workspaces Archive State
  const [savedRuns, setSavedRuns] = useState<ExecutionRun[]>([]);
  const [savedContracts, setSavedContracts] = useState<IntentContract[]>([]);
  const [showStructureBlueprint, setShowStructureBlueprint] = useState(true);
  const [copiedStructure, setCopiedStructure] = useState(false);

  // Schema representation of the recommended prompt execution file structure
  const WORKSPACE_STRUCTURE_SCHEMA = `token_os_workspace/
├── runs/
│   └── [TIMESTAMP]_[RUN_ID]/
│       ├── metadata.json          # Telemetry, tokens, model, status, cost, latency
│       ├── prompt_intent.json     # User prompt, synthesized requirements, SLA constraints
│       ├── output_solution.ts     # Synthesized executable source code solution
│       ├── quality_evidence.md    # AST verification evidence & passing criteria
│       └── README.md              # Human-readable summary & execution trace
└── archive/
    └── tokenos_workspace_archive.json # Complete portable JSON backup of all runs`;

  const handleCopyStructure = () => {
    navigator.clipboard.writeText(WORKSPACE_STRUCTURE_SCHEMA);
    setCopiedStructure(true);
    setTimeout(() => setCopiedStructure(false), 2000);
  };

  // Sync state whenever modal opens or session updates
  useEffect(() => {
    if (isOpen) {
      const sess = getAuthSession();
      if (sess.user) {
        if (sess.user.fullName) setFullName(sess.user.fullName);
        if (sess.user.email) setEmail(sess.user.email);
        if (sess.user.organization) setOrganization(sess.user.organization);
        if (sess.user.role) setRole(sess.user.role);
      }
      setSavedRuns(getSavedRuns());
      setSavedContracts(getSavedContracts());
      setHasPin(hasVaultMasterPassword());
      setPinAction('idle');
      resetPinForm();
    }
  }, [isOpen]);

  // Listen for storage events to keep saved runs reactive
  useEffect(() => {
    const refreshRuns = () => {
      setSavedRuns(getSavedRuns());
      setSavedContracts(getSavedContracts());
    };
    window.addEventListener('storage', refreshRuns);
    return () => window.removeEventListener('storage', refreshRuns);
  }, []);

  // Listen for live PIN changes across the app
  useEffect(() => {
    const handlePinChanged = () => {
      setHasPin(hasVaultMasterPassword());
    };
    window.addEventListener('token_os_pin_changed', handlePinChanged);
    window.addEventListener('storage', handlePinChanged);
    return () => {
      window.removeEventListener('token_os_pin_changed', handlePinChanged);
      window.removeEventListener('storage', handlePinChanged);
    };
  }, []);

  const resetPinForm = () => {
    setCurrentPinInput('');
    setNewPinInput('');
    setConfirmPinInput('');
    setPinStatusMessage(null);
  };

  // Real-time entropy analysis of new PIN
  const newPinEntropy: PinEntropyResult = useMemo(() => {
    return evaluatePinEntropy(newPinInput);
  }, [newPinInput]);

  const avatarLetter = (fullName?.trim() ? fullName.trim().charAt(0) : 'A').toUpperCase();

  // Save Operator Profile to Session and Supabase profiles table
  const handleSaveProfile = async () => {
    const client = getSupabaseClient();
    const activeUserId = current.user?.id || `usr-op-${Date.now()}`;

    if (client) {
      try {
        await client.from('profiles').upsert({
          id: activeUserId,
          email: email.trim(),
          full_name: fullName.trim(),
          organization: organization.trim(),
          user_type: role,
          updated_at: new Date().toISOString()
        });
      } catch (err) {
        console.warn('Profile Supabase sync notice:', err);
      }
    }

    const session: AuthSession = {
      ...current,
      user: {
        id: activeUserId,
        email: email.trim(),
        fullName: fullName.trim(),
        organization: organization.trim(),
        role,
        mode: current.user?.mode || 'supabase_cloud'
      }
    };

    setAuthSession(session);
    onSessionUpdated(session);
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
    }, 2800);
  };

  // Handle Master PIN setup
  const handleExecuteSetPin = async () => {
    if (!newPinEntropy.valid) {
      setPinStatusMessage({ type: 'error', text: newPinEntropy.error || 'PIN does not meet entropy requirements.' });
      return;
    }
    if (newPinInput !== confirmPinInput) {
      setPinStatusMessage({ type: 'error', text: 'PIN confirmation does not match.' });
      return;
    }

    setIsSubmittingPin(true);
    try {
      await setVaultMasterPassword(newPinInput);
      setHasPin(true);
      setPinAction('idle');
      resetPinForm();
      setPinStatusMessage({ type: 'success', text: 'Vault Master PIN activated successfully.' });
      setTimeout(() => setPinStatusMessage(null), 3500);
    } catch (err: any) {
      setPinStatusMessage({ type: 'error', text: err.message || 'Failed to set Master PIN.' });
    } finally {
      setIsSubmittingPin(false);
    }
  };

  // Handle Master PIN update
  const handleExecuteChangePin = async () => {
    if (!currentPinInput) {
      setPinStatusMessage({ type: 'error', text: 'Current Master PIN is required.' });
      return;
    }
    if (!newPinEntropy.valid) {
      setPinStatusMessage({ type: 'error', text: newPinEntropy.error || 'New PIN does not meet entropy requirements.' });
      return;
    }
    if (newPinInput !== confirmPinInput) {
      setPinStatusMessage({ type: 'error', text: 'New PIN confirmation does not match.' });
      return;
    }

    setIsSubmittingPin(true);
    try {
      const res = await changeVaultMasterPassword(currentPinInput, newPinInput);
      if (!res.success) {
        setPinStatusMessage({ type: 'error', text: res.error || 'Failed to update PIN.' });
      } else {
        setHasPin(true);
        setPinAction('idle');
        resetPinForm();
        setPinStatusMessage({ type: 'success', text: 'Master PIN changed successfully.' });
        setTimeout(() => setPinStatusMessage(null), 3500);
      }
    } catch (err: any) {
      setPinStatusMessage({ type: 'error', text: err.message || 'Failed to update Master PIN.' });
    } finally {
      setIsSubmittingPin(false);
    }
  };

  // Handle Master PIN removal (Revert to Direct Mode)
  const handleExecuteRemovePin = async () => {
    if (!currentPinInput) {
      setPinStatusMessage({ type: 'error', text: 'Current Master PIN is required to confirm removal.' });
      return;
    }

    setIsSubmittingPin(true);
    try {
      const res = await removeVaultMasterPassword(currentPinInput);
      if (!res.success) {
        setPinStatusMessage({ type: 'error', text: res.error || 'Failed to remove PIN.' });
      } else {
        setHasPin(false);
        setPinAction('idle');
        resetPinForm();
        setPinStatusMessage({ type: 'success', text: 'Master PIN removed. Vault reverted to Direct Mode.' });
        setTimeout(() => setPinStatusMessage(null), 3500);
      }
    } catch (err: any) {
      setPinStatusMessage({ type: 'error', text: err.message || 'Failed to remove Master PIN.' });
    } finally {
      setIsSubmittingPin(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="relative w-full max-w-2xl bg-[#0B101D] border border-slate-700/80 rounded-2xl shadow-[0_0_50px_rgba(217,119,87,0.22)] overflow-hidden">
        
        {/* MODAL HEADER: Matching Image 2 Reference */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800/80 bg-[#0E1526]/80">
          <div className="flex items-center gap-3.5">
            {/* Avatar initial badge with terracotta background */}
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#D97757] to-amber-500 flex items-center justify-center text-black font-black text-sm shadow-md shrink-0">
              {avatarLetter}
            </div>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h2 className="text-sm sm:text-base font-bold text-[#F0F4F8] tracking-wider font-mono uppercase">
                  OPERATOR PROFILE & CREDENTIAL CONTROLS
                </h2>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-[#06281E] text-[#34D399] border border-[#065F46] flex items-center gap-1 font-bold">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#34D399]" />
                  {role}
                </span>
              </div>
              <p className="text-xs text-slate-400 font-sans mt-0.5">
                Sovereign Operator Identity • Vault Master PIN • Infrastructure Telemetry
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* MODAL BODY */}
        <div className="p-6 space-y-6 max-h-[82vh] overflow-y-auto">

          {/* Feedback Banner for Profile Save */}
          {savedSuccess && (
            <div className="flex items-center gap-2 p-3 bg-emerald-500/15 border border-emerald-500/40 rounded-xl text-emerald-300 text-xs font-mono">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Operator profile synchronized and saved successfully!</span>
            </div>
          )}

          {/* SECTION 1: OPERATOR IDENTITY & WORKSTATION CREDENTIALS */}
          <section className="space-y-3.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-[#E2896B]" />
                <h3 className="text-xs font-mono font-bold text-[#E2896B] uppercase tracking-wider">
                  OPERATOR IDENTITY & WORKSTATION CREDENTIALS
                </h3>
              </div>
              <span className="text-[11px] text-slate-500 font-sans">
                Synced with PostgreSQL profiles
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 font-mono text-xs">
              <div>
                <label className="block text-slate-300 mb-1 text-[11px]">Full Name / Display Alias</label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Alex Rivera"
                  className="w-full bg-[#080D1A] border border-slate-800 rounded-lg px-3 py-2 text-slate-100 font-mono text-xs focus:outline-none focus:border-[#D97757]"
                />
              </div>

              <div>
                <label className="block text-slate-300 mb-1 text-[11px]">Email Address</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. engineer@enterprise.io"
                  className="w-full bg-[#080D1A] border border-slate-800 rounded-lg px-3 py-2 text-slate-100 font-mono text-xs focus:outline-none focus:border-[#D97757]"
                />
              </div>

              <div>
                <label className="block text-slate-300 mb-1 text-[11px]">Organization / Engineering Squad</label>
                <input
                  type="text"
                  value={organization}
                  onChange={(e) => setOrganization(e.target.value)}
                  placeholder="e.g. Token-OS Autonomous Labs"
                  className="w-full bg-[#080D1A] border border-slate-800 rounded-lg px-3 py-2 text-slate-100 font-mono text-xs focus:outline-none focus:border-[#D97757]"
                />
              </div>

              <div>
                <label className="block text-slate-300 mb-1 text-[11px]">Standardized User Role</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as UserType)}
                  className="w-full bg-[#080D1A] border border-slate-800 rounded-lg px-3 py-2 text-slate-100 font-mono text-xs focus:outline-none focus:border-[#D97757] cursor-pointer"
                >
                  <option value="SYSTEM_ARCHITECT" className="bg-[#0F172A] text-slate-100">System Architect & Tech Lead</option>
                  <option value="SOFTWARE_ENGINEER" className="bg-[#0F172A] text-slate-100">Software Engineer / Full-Stack Developer</option>
                  <option value="AI_RESEARCHER" className="bg-[#0F172A] text-slate-100">AI / Machine Learning Engineer</option>
                  <option value="DEVOPS_PLATFORM" className="bg-[#0F172A] text-slate-100">DevOps / Platform & Cloud SRE</option>
                  <option value="STUDENT_ENGINEER" className="bg-[#0F172A] text-slate-100">Student / Academic Researcher</option>
                  <option value="PRODUCT_LEAD" className="bg-[#0F172A] text-slate-100">Product Manager & Technical Executive</option>
                  <option value="OTHER" className="bg-[#0F172A] text-slate-100">Other / Independent Builder</option>
                </select>
              </div>
            </div>

            <button
              type="button"
              onClick={handleSaveProfile}
              className="w-full mt-2 py-2.5 bg-[#C86A4B] hover:bg-[#D97757] text-black font-mono font-bold rounded-lg transition-all shadow-[0_0_20px_rgba(217,119,87,0.25)] flex items-center justify-center gap-2 cursor-pointer"
            >
              <Save className="w-3.5 h-3.5 fill-black" />
              <span>Save Profile & Synchronize</span>
            </button>
          </section>

          {/* SECTION 2: CLIENT-SIDE VAULT MASTER PIN */}
          <section className="space-y-2 pt-2 border-t border-slate-800/80">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Lock className="w-4 h-4 text-[#E2896B]" />
                <h3 className="text-xs font-mono font-bold text-[#E2896B] uppercase tracking-wider">
                  CLIENT-SIDE VAULT MASTER PIN
                </h3>
              </div>

              {hasPin ? (
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#06281E] text-[#34D399] border border-[#065F46] flex items-center gap-1 font-bold">
                  <ShieldCheck className="w-3 h-3 text-[#34D399]" />
                  PIN ACTIVE (PROTECTED)
                </span>
              ) : (
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-950/60 text-amber-400 border border-amber-700/60 flex items-center gap-1 font-bold">
                  <AlertCircle className="w-3 h-3 text-amber-400" />
                  NO PIN SET (DIRECT MODE)
                </span>
              )}
            </div>

            <p className="text-xs text-slate-400 font-sans">
              Protects raw API key unmasking and deletion in your secure local key vault.
            </p>

            {/* PIN Content Card */}
            <div className="bg-[#080D1A] border border-slate-800 rounded-xl p-4 space-y-3">
              
              {/* Feedback Banner for PIN operations */}
              {pinStatusMessage && (
                <div className={`p-2.5 rounded-lg border text-xs flex items-center gap-2 font-mono ${
                  pinStatusMessage.type === 'success'
                    ? 'bg-emerald-950/70 border-emerald-700/80 text-emerald-300'
                    : 'bg-red-950/70 border-red-800 text-red-300'
                }`}>
                  {pinStatusMessage.type === 'success' ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                  )}
                  <span>{pinStatusMessage.text}</span>
                </div>
              )}

              {/* IDLE VIEW (When not in set/change/remove mode) */}
              {pinAction === 'idle' && (
                <>
                  {!hasPin ? (
                    <div className="space-y-3">
                      <p className="text-xs text-slate-300 font-sans">
                        No Master PIN is configured. Anyone with access to this browser can unmask or delete stored keys.
                      </p>
                      <button
                        type="button"
                        onClick={() => {
                          setPinAction('set');
                          resetPinForm();
                        }}
                        className="py-2 px-4 bg-[#C86A4B] hover:bg-[#D97757] text-black font-mono font-bold text-xs rounded-lg transition-all flex items-center gap-2 cursor-pointer"
                      >
                        <Lock className="w-3.5 h-3.5" />
                        <span>Set Vault Master PIN</span>
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <p className="text-xs text-slate-300 font-sans">
                        Master PIN is active. Client-side domain-salted SHA-256 encryption protects your stored API keys with anti-brute-force rate limiting.
                      </p>
                      <div className="flex items-center gap-2.5 flex-wrap pt-1">
                        <button
                          type="button"
                          onClick={() => {
                            setPinAction('change');
                            resetPinForm();
                          }}
                          className="py-1.5 px-3 bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 hover:border-[#D97757] font-mono text-xs rounded-lg transition-all flex items-center gap-1.5 cursor-pointer"
                        >
                          <Key className="w-3.5 h-3.5 text-[#E2896B]" />
                          <span>Change Master PIN</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            purgeMasterPin();
                            setHasPin(false);
                            setPinStatusMessage({ type: 'success', text: 'Master PIN successfully deactivated. Direct Mode enabled.' });
                            setTimeout(() => setPinStatusMessage(null), 3000);
                          }}
                          className="py-1.5 px-3 bg-red-950/40 hover:bg-red-950/80 text-red-300 border border-red-800/80 font-mono text-xs rounded-lg transition-all flex items-center gap-1.5 cursor-pointer font-semibold"
                          title="Deactivate active Master PIN and return to Direct Mode immediately"
                        >
                          <Trash2 className="w-3.5 h-3.5 text-red-400" />
                          <span>Deactivate PIN (Direct Mode)</span>
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}

              {/* ACTION: SET NEW MASTER PIN */}
              {pinAction === 'set' && (
                <div className="space-y-3 font-mono text-xs">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                    <span className="font-bold text-slate-200 flex items-center gap-1.5">
                      <Lock className="w-3.5 h-3.5 text-[#D97757]" />
                      Configure High-Entropy Vault Master PIN
                    </span>
                    <button
                      type="button"
                      onClick={() => setPinAction('idle')}
                      className="text-slate-400 hover:text-white"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-slate-300 text-[11px]">New Master PIN</label>
                        <button
                          type="button"
                          onClick={() => setShowPins(!showPins)}
                          className="text-[10px] text-slate-400 hover:text-slate-200 flex items-center gap-1"
                        >
                          {showPins ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                          <span>{showPins ? 'Hide' : 'Show'}</span>
                        </button>
                      </div>
                      <input
                        type={showPins ? 'text' : 'password'}
                        value={newPinInput}
                        onChange={(e) => setNewPinInput(e.target.value)}
                        placeholder="Min 4 chars (e.g. S3cur3P!n)"
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 text-xs focus:outline-none focus:border-[#D97757]"
                        autoFocus
                      />
                    </div>

                    <div>
                      <label className="block text-slate-300 mb-1 text-[11px]">Confirm New PIN</label>
                      <input
                        type={showPins ? 'text' : 'password'}
                        value={confirmPinInput}
                        onChange={(e) => setConfirmPinInput(e.target.value)}
                        placeholder="Re-type PIN exactly"
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 text-xs focus:outline-none focus:border-[#D97757]"
                      />
                    </div>
                  </div>

                  {/* Real-time System Design Entropy Indicator */}
                  {newPinInput.length > 0 && (
                    <div className="p-3 bg-slate-900/90 rounded-lg border border-slate-800 space-y-2">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-slate-400 font-sans">PIN Entropy Strength:</span>
                        <span className={`font-bold uppercase ${
                          newPinEntropy.strength === 'strong' ? 'text-emerald-400' :
                          newPinEntropy.strength === 'moderate' ? 'text-amber-400' :
                          'text-red-400'
                        }`}>
                          {newPinEntropy.label}
                        </span>
                      </div>

                      {/* 4-bar strength meter */}
                      <div className="grid grid-cols-4 gap-1.5 h-1.5">
                        <div className={`rounded-full ${newPinEntropy.score >= 1 ? (newPinEntropy.score === 1 ? 'bg-red-500' : 'bg-amber-500') : 'bg-slate-800'}`} />
                        <div className={`rounded-full ${newPinEntropy.score >= 2 ? 'bg-amber-400' : 'bg-slate-800'}`} />
                        <div className={`rounded-full ${newPinEntropy.score >= 3 ? 'bg-emerald-400' : 'bg-slate-800'}`} />
                        <div className={`rounded-full ${newPinEntropy.score >= 4 ? 'bg-emerald-300' : 'bg-slate-800'}`} />
                      </div>

                      {/* Dynamic validation hints */}
                      <div className="text-[10px] text-slate-400 space-y-0.5">
                        {newPinEntropy.error ? (
                          <span className="text-red-400 flex items-center gap-1">
                            <AlertCircle className="w-3 h-3 shrink-0" />
                            {newPinEntropy.error}
                          </span>
                        ) : (
                          <span className="text-emerald-400 flex items-center gap-1">
                            <Check className="w-3 h-3 shrink-0" />
                            Satisfies entropy requirements (resistant to trivial brute-force)
                          </span>
                        )}
                        {confirmPinInput.length > 0 && newPinInput !== confirmPinInput && (
                          <span className="text-red-400 block">⚠️ PIN confirmation does not match</span>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="flex gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setPinAction('idle')}
                      className="flex-1 py-2 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded-lg"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleExecuteSetPin}
                      disabled={isSubmittingPin || !newPinEntropy.valid || newPinInput !== confirmPinInput}
                      className={`flex-1 py-2 rounded-lg font-bold transition-all ${
                        newPinEntropy.valid && newPinInput === confirmPinInput
                          ? 'bg-[#C86A4B] hover:bg-[#D97757] text-black cursor-pointer'
                          : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                      }`}
                    >
                      {isSubmittingPin ? 'Encrypting & Saving...' : 'Activate Master PIN'}
                    </button>
                  </div>
                </div>
              )}

              {/* ACTION: CHANGE EXISTING PIN */}
              {pinAction === 'change' && (
                <div className="space-y-3 font-mono text-xs">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                    <span className="font-bold text-slate-200 flex items-center gap-1.5">
                      <Key className="w-3.5 h-3.5 text-[#D97757]" />
                      Rotate Vault Master PIN
                    </span>
                    <button
                      type="button"
                      onClick={() => setPinAction('idle')}
                      className="text-slate-400 hover:text-white"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div>
                    <label className="block text-slate-300 mb-1 text-[11px]">1. Current Master PIN</label>
                    <input
                      type="password"
                      value={currentPinInput}
                      onChange={(e) => setCurrentPinInput(e.target.value)}
                      placeholder="Enter active PIN"
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 text-xs focus:outline-none focus:border-[#D97757]"
                      autoFocus
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-300 mb-1 text-[11px]">2. New Master PIN</label>
                      <input
                        type={showPins ? 'text' : 'password'}
                        value={newPinInput}
                        onChange={(e) => setNewPinInput(e.target.value)}
                        placeholder="Min 4 non-trivial chars"
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 text-xs focus:outline-none focus:border-[#D97757]"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-300 mb-1 text-[11px]">3. Confirm New PIN</label>
                      <input
                        type={showPins ? 'text' : 'password'}
                        value={confirmPinInput}
                        onChange={(e) => setConfirmPinInput(e.target.value)}
                        placeholder="Re-type new PIN"
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 text-xs focus:outline-none focus:border-[#D97757]"
                      />
                    </div>
                  </div>

                  {newPinInput.length > 0 && (
                    <div className="p-2.5 bg-slate-900/90 rounded-lg border border-slate-800 space-y-1.5">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-slate-400 font-sans">New PIN Strength:</span>
                        <span className={`font-bold uppercase ${
                          newPinEntropy.strength === 'strong' ? 'text-emerald-400' :
                          newPinEntropy.strength === 'moderate' ? 'text-amber-400' :
                          'text-red-400'
                        }`}>
                          {newPinEntropy.label}
                        </span>
                      </div>
                      <div className="text-[10px] text-slate-400">
                        {newPinEntropy.error ? (
                          <span className="text-red-400">⚠️ {newPinEntropy.error}</span>
                        ) : (
                          <span className="text-emerald-400">✔ Ready for cryptographic upgrade</span>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="flex gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setPinAction('idle')}
                      className="flex-1 py-2 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded-lg"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleExecuteChangePin}
                      disabled={isSubmittingPin || !currentPinInput || !newPinEntropy.valid || newPinInput !== confirmPinInput}
                      className={`flex-1 py-2 rounded-lg font-bold transition-all ${
                        currentPinInput && newPinEntropy.valid && newPinInput === confirmPinInput
                          ? 'bg-[#C86A4B] hover:bg-[#D97757] text-black cursor-pointer'
                          : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                      }`}
                    >
                      {isSubmittingPin ? 'Updating...' : 'Save New PIN'}
                    </button>
                  </div>
                </div>
              )}

              {/* ACTION: REMOVE PIN (REVERT TO DIRECT MODE) */}
              {pinAction === 'remove' && (
                <div className="space-y-3 font-mono text-xs">
                  <div className="p-3 bg-red-950/40 border border-red-800/80 rounded-xl text-red-300 text-xs font-sans">
                    ⚠️ <strong>Security Notice:</strong> Removing your Master PIN switches your key vault to Direct Mode. Anyone with physical or browser access will be able to unmask and copy your raw provider API keys without authentication.
                  </div>

                  <div>
                    <label className="block text-slate-300 mb-1 text-[11px]">
                      Enter Current Master PIN to Confirm Removal:
                    </label>
                    <input
                      type="password"
                      value={currentPinInput}
                      onChange={(e) => setCurrentPinInput(e.target.value)}
                      placeholder="Enter Master PIN"
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 text-xs focus:outline-none focus:border-red-500"
                      autoFocus
                    />
                  </div>

                  <div className="flex gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setPinAction('idle')}
                      className="flex-1 py-2 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded-lg"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleExecuteRemovePin}
                      disabled={isSubmittingPin || !currentPinInput}
                      className={`flex-1 py-2 rounded-lg font-bold transition-all ${
                        currentPinInput
                          ? 'bg-red-600 hover:bg-red-500 text-white cursor-pointer'
                          : 'bg-red-950/40 text-red-700 border border-red-900/40 cursor-not-allowed'
                      }`}
                    >
                      {isSubmittingPin ? 'Removing...' : 'Confirm Removal & Switch to Direct'}
                    </button>
                  </div>
                </div>
              )}

            </div>
          </section>

          {/* SECTION 3: SAVED WORKSPACES & FILE EXPORTS (PERSISTENT PROMPT ARCHIVE) */}
          <section className="space-y-3.5 pt-2 border-t border-slate-800/80">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <HardDrive className="w-4 h-4 text-[#E2896B]" />
                <h3 className="text-xs font-mono font-bold text-[#E2896B] uppercase tracking-wider">
                  SAVED PROMPT WORKSPACES & FILE ARCHIVE
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowStructureBlueprint(prev => !prev)}
                  className="text-[11px] font-mono text-slate-300 hover:text-white bg-slate-900 hover:bg-slate-800 border border-slate-800 px-2.5 py-1 rounded cursor-pointer transition-colors flex items-center gap-1.5"
                  title="Toggle recommended workspace directory blueprint"
                >
                  <FolderTree className="w-3.5 h-3.5 text-[#D97757]" />
                  <span>{showStructureBlueprint ? 'Hide File Blueprint' : 'File Blueprint'}</span>
                </button>
                {savedRuns.length > 0 && (
                  <>
                    <button
                      type="button"
                      onClick={() => {
                        clearAllRuns();
                        setSavedRuns([]);
                      }}
                      className="text-[11px] font-mono text-red-400 hover:text-red-300 bg-red-950/40 hover:bg-red-950/80 border border-red-800/80 px-2.5 py-1 rounded cursor-pointer transition-colors flex items-center gap-1.5 font-semibold"
                      title="Delete all saved execution trails from storage"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Purge All Trails</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => exportCompleteWorkspaceJson(savedRuns, savedContracts)}
                      className="text-[11px] font-mono text-emerald-400 hover:text-emerald-300 bg-emerald-950/40 hover:bg-emerald-950/80 border border-emerald-800/80 px-2.5 py-1 rounded cursor-pointer transition-colors flex items-center gap-1.5 font-semibold"
                      title="Export all runs and intent contracts as a portable JSON workspace file"
                    >
                      <FolderArchive className="w-3.5 h-3.5" />
                      <span>Export Archive ({savedRuns.length})</span>
                    </button>
                  </>
                )}
              </div>
            </div>

            <p className="text-xs text-slate-400 font-sans">
              Save your prompt executions as permanent local files (.md, .ts, or .json) so you can review your code solutions, token metrics, and SLA verifications anytime.
            </p>

            {/* Recommended File Structure Blueprint Card */}
            {showStructureBlueprint && (
              <div className="bg-[#080D1A] border border-slate-800/90 rounded-xl p-3.5 space-y-2.5 font-mono text-xs">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <span className="text-[11px] font-bold text-slate-200 flex items-center gap-1.5">
                    <FolderTree className="w-3.5 h-3.5 text-[#E2896B]" />
                    Recommended File Structure For Prompt Execution Saves
                  </span>
                  <button
                    type="button"
                    onClick={handleCopyStructure}
                    className="text-[10px] text-slate-400 hover:text-slate-100 bg-slate-900 border border-slate-800 px-2 py-0.5 rounded cursor-pointer transition-colors flex items-center gap-1"
                  >
                    {copiedStructure ? (
                      <>
                        <Check className="w-3 h-3 text-emerald-400" />
                        <span className="text-emerald-400">Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" />
                        <span>Copy Structure</span>
                      </>
                    )}
                  </button>
                </div>

                <pre className="text-[10px] sm:text-[11px] text-slate-300 leading-relaxed overflow-x-auto p-2.5 bg-slate-950/80 rounded-lg border border-slate-900">
{`token_os_workspace/
├── runs/
│   └── 2026-10-22_run-1729571234/
│       ├── metadata.json          # Run ID, timestamp, model, total tokens, latency, cost
│       ├── prompt_intent.json     # User prompt, synthesized requirements, SLA constraints
│       ├── output_solution.ts     # Synthesized executable source code solution
│       ├── quality_evidence.md    # AST verification evidence, passing tests, gap analysis
│       └── README.md              # Complete human-readable Markdown execution dossier
└── archive/
    └── tokenos_workspace_archive.json # Complete portable snapshot of all runs`}
                </pre>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[10px] text-slate-400 font-sans pt-1">
                  <div className="p-2 rounded bg-slate-900/60 border border-slate-800/60">
                    <strong className="text-slate-200 font-mono block">output_solution.ts</strong>
                    Pure executable source code ready to import or run directly.
                  </div>
                  <div className="p-2 rounded bg-slate-900/60 border border-slate-800/60">
                    <strong className="text-slate-200 font-mono block">README.md</strong>
                    Human-readable dossier with prompt, token telemetry, and code.
                  </div>
                  <div className="p-2 rounded bg-slate-900/60 border border-slate-800/60">
                    <strong className="text-slate-200 font-mono block">metadata.json</strong>
                    Structured telemetry for auditing, cost tracking, and SLA verification.
                  </div>
                </div>
              </div>
            )}

            {/* List of Saved Executions with 1-Click File Downloads */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-slate-300 font-semibold flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-[#D97757]" />
                  Archived Execution Files ({savedRuns.length})
                </span>
                <span className="text-[10px] text-slate-500 font-sans">
                  Available offline in browser storage
                </span>
              </div>

              {savedRuns.length === 0 ? (
                <div className="p-4 rounded-xl bg-slate-900/40 border border-slate-800 text-center text-xs text-slate-400 font-sans">
                  No execution runs recorded yet. Run a prompt in the <strong className="text-slate-300 font-mono">Workbench</strong> and click <strong className="text-[#E2896B]">Compile & Execute</strong> to generate your first save file.
                </div>
              ) : (
                <div className="space-y-2.5 max-h-[300px] overflow-y-auto pr-1">
                  {savedRuns.map((run) => {
                    const matchingContract = savedContracts.find(c => c.id === run.intentContractId);
                    return (
                      <div 
                        key={run.id}
                        className="p-3 bg-[#080D1A] border border-slate-800/90 hover:border-slate-700/80 rounded-xl space-y-2 transition-all font-mono"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-200 text-xs">{run.id}</span>
                            <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                              {run.providerModel}
                            </span>
                            <span className={`text-[9px] font-bold px-2 py-0.5 rounded ${
                              run.status === 'READY' 
                                ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' 
                                : 'bg-amber-950 text-amber-400 border border-amber-800'
                            }`}>
                              {run.status}
                            </span>
                          </div>
                          <span className="text-[10px] text-slate-500 font-sans">
                            {new Date(run.timestamp).toLocaleDateString()} {new Date(run.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>

                        {matchingContract?.objective && (
                          <p className="text-[11px] text-slate-400 line-clamp-1 italic font-sans">
                            "{matchingContract.objective}"
                          </p>
                        )}

                        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-800/60 text-[10px]">
                          <div className="flex items-center gap-3 text-slate-400">
                            <span>Tokens: <strong className="text-slate-200 font-mono">{run.totalTokens.toLocaleString()}</strong></span>
                            <span>Latency: <strong className="text-slate-200 font-mono">{run.totalLatencyMs}ms</strong></span>
                            <span>Cost: <strong className="text-emerald-400 font-mono">${run.totalCostUsd.toFixed(5)}</strong></span>
                          </div>

                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => exportRunAsMarkdown(run, matchingContract)}
                              className="flex items-center gap-1 px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-800 hover:border-slate-700 rounded text-[11px] transition-colors cursor-pointer"
                              title="Download complete Markdown dossier (.md) with prompt, source code, and verification report"
                            >
                              <FileText className="w-3 h-3 text-[#E2896B]" />
                              <span>Save .md Dossier</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => exportRunCodeFile(run)}
                              className="flex items-center gap-1 px-2.5 py-1 bg-emerald-950/40 hover:bg-emerald-950/70 text-emerald-300 border border-emerald-800/70 rounded text-[11px] transition-colors cursor-pointer font-semibold"
                              title="Download pure synthesized source code file (.ts)"
                            >
                              <FileCode className="w-3 h-3 text-emerald-400" />
                              <span>Save Code (.ts)</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </section>

          {/* SECTION 4: BACKEND INFRASTRUCTURE TELEMETRY */}
          <section className="space-y-2 pt-2 border-t border-slate-800/80">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Database className="w-4 h-4 text-[#E2896B]" />
                <h3 className="text-xs font-mono font-bold text-[#E2896B] uppercase tracking-wider">
                  BACKEND INFRASTRUCTURE TELEMETRY
                </h3>
              </div>
              <span className="text-[11px] font-mono text-[#34D399] flex items-center gap-1.5 font-bold">
                <span className="w-2 h-2 rounded-full bg-[#34D399] animate-pulse" />
                • POSTGRESQL RLS
              </span>
            </div>

            <div className="bg-[#080D1A] border border-slate-800 rounded-xl p-4 space-y-2.5 font-mono text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Database Engine:</span>
                <span className="text-[#34D399] font-bold">
                  Supabase PostgreSQL (Cloud Active)
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-400">Project Endpoint:</span>
                <span className="text-slate-200">
                  {current.supabaseUrl || (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_SUPABASE_URL) || 'https://dsbekslsqzsoyearqtol.supabase.co'}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-400">Security Architecture:</span>
                <span className="text-slate-200">PostgreSQL Row-Level Security (RLS)</span>
              </div>
            </div>
          </section>

        </div>
      </div>
    </div>
  );
};

export default AuthModal;
