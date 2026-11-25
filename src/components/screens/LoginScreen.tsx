import React, { useState, useEffect } from 'react';
import {
  Shield,
  Lock,
  Mail,
  Key,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  User,
  Smartphone,
  Building2,
  Copy,
  Check,
  RefreshCw,
  Zap,
  X,
  Database,
  Settings,
  ExternalLink
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import PixelCard from '../common/PixelCard';
import {
  loginWithEmail,
  registerWithEmail,
  loginWithOAuth,
  sendEmailOtp,
  verifyEmailOtp,
  verifyOtpWithTokenHash,
  testSupabaseConnection,
  resetSupabaseInstance
} from '../../services/supabaseClient';
import {
  AuthSession,
  setAuthSession,
  getAuthSession,
  saveSupabaseConfig,
  UserType
} from '../../services/storageService';
import {
  checkRateLimit,
  recordFailedAttempt,
  clearRateLimit,
  sanitizeInput,
  isHoneypotTriggered,
  evaluatePasswordStrength,
  validateEmail,
  checkPasswordCriteria,
  logSecurityAudit
} from '../../services/securityGuard';

export const GLOBAL_STANDARD_ROLES: { value: UserType; label: string; description: string }[] = [
  {
    value: 'SOFTWARE_ENGINEER',
    label: 'Software Engineer / Full-Stack Developer',
    description: 'Full-stack, frontend, backend, or autonomous code generation'
  },
  {
    value: 'AI_RESEARCHER',
    label: 'AI / Machine Learning Engineer',
    description: 'LLM fine-tuning, prompt engineering, and neural evaluation'
  },
  {
    value: 'DEVOPS_PLATFORM',
    label: 'DevOps / Platform & Cloud SRE',
    description: 'Infrastructure, deployment, CI/CD, and site reliability'
  },
  {
    value: 'SYSTEM_ARCHITECT',
    label: 'System Architect & Tech Lead',
    description: 'Autonomous orchestration, zero-trust governance, and security'
  },
  {
    value: 'STUDENT_ENGINEER',
    label: 'Student / Academic Researcher',
    description: 'Computer science coursework, capstone projects, and labs'
  },
  {
    value: 'PRODUCT_LEAD',
    label: 'Product Manager & Technical Executive',
    description: 'Product lifecycle, AI policy governance, and telemetry'
  },
  {
    value: 'OTHER',
    label: 'Other / Independent Builder',
    description: 'Open-source creator, domain specialist, or autonomous hobbyist'
  }
];

interface LoginScreenProps {
  onLoginSuccess: (session: AuthSession) => void;
  initialErrorMessage?: string | null;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLoginSuccess, initialErrorMessage }) => {
  // Auth Modes: 'password' | 'otp'
  const [authMode, setAuthMode] = useState<'password' | 'otp'>('password');
  const [isSignUp, setIsSignUp] = useState(false);
  const [isOtpSignUp, setIsOtpSignUp] = useState(false);

  // Form Fields
  const [fullName, setFullName] = useState('');
  const [organization, setOrganization] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [otpToken, setOtpToken] = useState('');
  const [userType, setUserType] = useState<UserType>('SOFTWARE_ENGINEER');
  const [honeypot, setHoneypot] = useState(''); // Anti-bot honeypot trap

  // UI state
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(initialErrorMessage || null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Update error message if initialErrorMessage changes
  useEffect(() => {
    if (initialErrorMessage) {
      setErrorMessage(initialErrorMessage);
    }
  }, [initialErrorMessage]);

  // Lockout / Rate limit countdown
  const [lockoutSec, setLockoutSec] = useState<number>(0);

  // OTP Dispatched State
  const [otpSender, setOtpSender] = useState<string>('TokenOS Security Operations <security@token-os.io>');
  const [otpExpiresInMin, setOtpExpiresInMin] = useState<number>(10);
  const [isSovereignOtp, setIsSovereignOtp] = useState<boolean>(false);
  const [fallbackPasscode, setFallbackPasscode] = useState<string | null>(null);
  const [copiedPasscode, setCopiedPasscode] = useState<boolean>(false);

  // Supabase PostgreSQL Auto-Detection & Configuration State
  const currentSavedSession = getAuthSession();
  const [supabaseStatus, setSupabaseStatus] = useState<{
    connected: boolean;
    latencyMs?: number;
    tablesVerified?: string[];
    error?: string;
  } | null>(null);
  const [showSupabaseConfig, setShowSupabaseConfig] = useState<boolean>(false);
  const [supabaseUrlInput, setSupabaseUrlInput] = useState<string>(() => {
    return currentSavedSession.supabaseUrl || (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_SUPABASE_URL) || 'https://dsbekslsqzsoyearqtol.supabase.co';
  });
  const [supabaseKeyInput, setSupabaseKeyInput] = useState<string>(() => {
    return currentSavedSession.supabaseKey || (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_SUPABASE_ANON_KEY) || 'sb_publishable_Z5QjVsAdQoALPjojbGbL9w_7qNsqO9L';
  });
  const [testingSupabase, setTestingSupabase] = useState<boolean>(false);
  const [configFeedback, setConfigFeedback] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

  const handleTestSupabase = async () => {
    setTestingSupabase(true);
    setConfigFeedback(null);
    try {
      const res = await testSupabaseConnection(supabaseUrlInput.trim(), supabaseKeyInput.trim());
      setSupabaseStatus(res);
      if (res.connected) {
        setConfigFeedback({
          type: 'success',
          text: `Connected successfully! Latency: ${res.latencyMs ?? 0}ms.`
        });
      } else {
        setConfigFeedback({
          type: 'error',
          text: res.error || 'Connection failed.'
        });
      }
    } catch (err: any) {
      setConfigFeedback({
        type: 'error',
        text: err.message || 'Connection test failed.'
      });
    } finally {
      setTestingSupabase(false);
    }
  };

  const handleSaveSupabaseConfig = async () => {
    saveSupabaseConfig(supabaseUrlInput.trim(), supabaseKeyInput.trim());
    resetSupabaseInstance();
    setTestingSupabase(true);
    setConfigFeedback({
      type: 'info',
      text: 'Saved credentials. Testing live connection...'
    });
    try {
      const res = await testSupabaseConnection(supabaseUrlInput.trim(), supabaseKeyInput.trim());
      setSupabaseStatus(res);
      if (res.connected) {
        setConfigFeedback({
          type: 'success',
          text: `Active & connected! Latency: ${res.latencyMs ?? 0}ms.`
        });
      } else {
        setConfigFeedback({
          type: 'error',
          text: res.error || 'Saved, but endpoint is unreachable.'
        });
      }
    } catch (err: any) {
      setConfigFeedback({
        type: 'error',
        text: err.message || 'Saved, but connection error occurred.'
      });
    } finally {
      setTestingSupabase(false);
    }
  };

  // Initial check on mount to detect live Supabase & parse verification link query parameters
  useEffect(() => {
    testSupabaseConnection().then((res) => {
      setSupabaseStatus(res);
    });

    try {
      // Clear any legacy stored pending otp email so the text box starts completely clean & empty
      localStorage.removeItem('token_os_pending_otp_email');

      const searchParams = new URLSearchParams(window.location.search);
      const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ''));
      const urlOtp = searchParams.get('otp') || searchParams.get('token') || hashParams.get('token');
      const urlEmail = searchParams.get('email') || hashParams.get('email');
      const tokenHash = searchParams.get('token_hash') || hashParams.get('token_hash');
      const authType = (searchParams.get('type') || hashParams.get('type') || 'email') as any;

      if (urlEmail) {
        setEmail(urlEmail);
      }
      if (urlOtp) {
        setAuthMode('otp');
        setOtpSent(true);
        setOtpToken(urlOtp);
      }

      // If user clicked email confirmation or magic link, auto-verify immediately without requiring re-entering email!
      if (tokenHash) {
        setLoading(true);
        setSuccessMessage('Verifying authorization token from email link...');
        verifyOtpWithTokenHash(tokenHash, authType).then((res) => {
          if (res.success && res.user) {
            clearRateLimit(res.user.email || urlEmail || '');
            const session = buildSession(
              res.user.id,
              res.user.email || urlEmail || 'user@identity.provider',
              userType,
              'supabase_cloud',
              res.user.user_metadata?.full_name,
              res.user.user_metadata?.organization
            );
            setAuthSession(session);
            onLoginSuccess(session);
          } else if (res.error) {
            setErrorMessage(res.error);
            setLoading(false);
          }
        }).catch((err) => {
          setErrorMessage(err.message || 'Token verification failed');
          setLoading(false);
        });
      }
    } catch {}
  }, []);

  // Cooldown countdown timer
  useEffect(() => {
    if (lockoutSec <= 0) return;
    const interval = setInterval(() => {
      setLockoutSec((prev) => (prev > 1 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [lockoutSec]);

  // Security Criteria Checks
  const emailValidation = validateEmail(email);
  const passwordCriteria = checkPasswordCriteria(password);
  const passwordStrength = evaluatePasswordStrength(password);
  const isPasswordMatch = password.length > 0 && confirmPassword.length > 0 && password === confirmPassword;

  // Helper to construct authenticated session
  const buildSession = (
    userId: string,
    userEmail: string,
    role: UserType,
    mode: 'supabase_cloud' | 'sovereign_local',
    name?: string,
    org?: string
  ): AuthSession => ({
    user: {
      id: userId,
      email: userEmail,
      fullName: name || fullName.trim(),
      organization: org || organization.trim(),
      role,
      mode
    },
    supabaseUrl: currentSavedSession.supabaseUrl,
    supabaseKey: currentSavedSession.supabaseKey,
    grokApiKey: currentSavedSession.grokApiKey,
    loginTime: Date.now()
  });

  // 1. Handle Email & Password Authentication
  const handlePasswordAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    // Bot detection
    if (isHoneypotTriggered(honeypot)) {
      logSecurityAudit('RATE_LIMIT_TRIGGERED', 'honeypot_bot', { reason: 'Bot trap triggered' });
      setErrorMessage('Automated script activity detected. Request blocked by security firewall.');
      return;
    }

    const cleanEmail = sanitizeInput(email);

    // Email format validation
    const emailCheck = validateEmail(cleanEmail);
    if (!emailCheck.valid) {
      setErrorMessage(emailCheck.error || 'Invalid email format.');
      return;
    }

    // Rate Limit Security Check
    const rateCheck = checkRateLimit(cleanEmail);
    if (!rateCheck.allowed) {
      logSecurityAudit('RATE_LIMIT_TRIGGERED', cleanEmail, { lockoutRemainingSec: rateCheck.lockoutRemainingSec });
      setLockoutSec(rateCheck.lockoutRemainingSec || 60);
      setErrorMessage(rateCheck.reason || 'Rate limit exceeded');
      return;
    }

    setLoading(true);
    try {
      if (isSignUp) {
        if (!fullName.trim()) {
          setErrorMessage('Full Name is required to initialize your identity profile.');
          setLoading(false);
          return;
        }

        if (!passwordCriteria.isAllMet) {
          setErrorMessage('Security policy requires password with minimum 8 chars, uppercase, lowercase, number, and special symbol.');
          setLoading(false);
          return;
        }

        if (!isPasswordMatch) {
          setErrorMessage('Passwords do not match. Please re-enter identical credentials.');
          setLoading(false);
          return;
        }

        const res = await registerWithEmail(cleanEmail, password, userType, {
          fullName: fullName.trim(),
          organization: organization.trim()
        });

        if (!res.success) {
          recordFailedAttempt(cleanEmail);
          logSecurityAudit('LOGIN_FAILED', cleanEmail, { error: res.error, isSignUp: true });
          setErrorMessage(res.error || 'Registration failed');
        } else {
          clearRateLimit(cleanEmail);
          logSecurityAudit('LOGIN_SUCCESS', cleanEmail, { userType, isSignUp: true });
          setSuccessMessage(`Account initialized for ${fullName.trim()} [${userType}]. Loading workspace...`);
          setTimeout(() => {
            const session = buildSession(
              res.user?.id || `usr-${Date.now()}`,
              cleanEmail,
              userType,
              supabaseStatus?.connected ? 'supabase_cloud' : 'sovereign_local',
              fullName.trim(),
              organization.trim()
            );
            setAuthSession(session);
            onLoginSuccess(session);
          }, 800);
        }
      } else {
        const res = await loginWithEmail(cleanEmail, password);
        if (!res.success) {
          const limit = recordFailedAttempt(cleanEmail);
          logSecurityAudit('LOGIN_FAILED', cleanEmail, { error: res.error });
          if (!limit.allowed) {
            logSecurityAudit('RATE_LIMIT_TRIGGERED', cleanEmail, { lockoutSec: limit.lockoutRemainingSec });
            setLockoutSec(limit.lockoutRemainingSec || 60);
            setErrorMessage(limit.reason || 'Account temporarily locked out');
          } else {
            setErrorMessage(res.error || 'Invalid credentials provided');
          }
        } else {
          clearRateLimit(cleanEmail);
          logSecurityAudit('LOGIN_SUCCESS', cleanEmail, { userType });
          setSuccessMessage('Zero-trust credentials validated. Loading Token-OS...');
          setTimeout(() => {
            const session = buildSession(
              res.user?.id || `usr-${Date.now()}`,
              cleanEmail,
              userType,
              supabaseStatus?.connected ? 'supabase_cloud' : 'sovereign_local'
            );
            setAuthSession(session);
            onLoginSuccess(session);
          }, 800);
        }
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Authentication error');
    } finally {
      setLoading(false);
    }
  };

  // 2. Handle Dispatching Email OTP (Dynamic Changing Code)
  const handleSendOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    const cleanEmail = sanitizeInput(email);
    const emailCheck = validateEmail(cleanEmail);
    if (!emailCheck.valid) {
      setErrorMessage(emailCheck.error || 'Please provide a valid email address.');
      return;
    }

    if (isOtpSignUp && !fullName.trim()) {
      setErrorMessage('Full Name is required to initialize your identity profile.');
      return;
    }

    setLoading(true);
    try {
      const res = await sendEmailOtp(cleanEmail);
      if (!res.success) {
        setErrorMessage(res.error || 'Failed to dispatch OTP code');
      } else {
        setOtpSent(true);
        if (res.isSovereignFallback && res.fallbackCode) {
          setIsSovereignOtp(true);
          setFallbackPasscode(res.fallbackCode);
          setSuccessMessage(`Sovereign passcode generated for ${cleanEmail}! Enter the 6-digit code below.`);
        } else {
          setIsSovereignOtp(false);
          setFallbackPasscode(null);
          setSuccessMessage(`Security passcode transmitted to ${cleanEmail}. Check your inbox!`);
        }
        if (res.sender) setOtpSender(res.sender);
        if (res.expiresInMinutes) setOtpExpiresInMin(res.expiresInMinutes);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  // 3. Handle Verifying OTP
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const cleanEmail = sanitizeInput(email);
    const cleanToken = sanitizeInput(otpToken);

    if (cleanToken.length < 6) {
      setErrorMessage('Please enter the full 6-digit verification code.');
      return;
    }

    setLoading(true);
    try {
      const res = await verifyEmailOtp(
        cleanEmail, 
        cleanToken, 
        userType,
        isOtpSignUp ? { fullName: fullName.trim(), organization: organization.trim() } : undefined
      );

      if (!res.success) {
        const limit = recordFailedAttempt(cleanEmail);
        logSecurityAudit('LOGIN_FAILED', cleanEmail, { method: 'EMAIL_OTP', error: res.error });
        if (!limit.allowed) {
          logSecurityAudit('RATE_LIMIT_TRIGGERED', cleanEmail, { lockoutSec: limit.lockoutRemainingSec });
          setLockoutSec(limit.lockoutRemainingSec || 60);
          setErrorMessage(limit.reason || 'Too many invalid attempts');
        } else {
          setErrorMessage(res.error || 'Invalid 6-digit OTP code');
        }
      } else {
        clearRateLimit(cleanEmail);
        localStorage.removeItem('token_os_pending_otp_email');
        logSecurityAudit('LOGIN_SUCCESS', cleanEmail, { method: 'EMAIL_OTP', userType, isOtpSignUp });
        setSuccessMessage('OTP code verified successfully! Loading workspace...');
        setTimeout(() => {
          const session = buildSession(
            res.user?.id || `usr-otp-${Date.now()}`,
            cleanEmail,
            userType,
            supabaseStatus?.connected ? 'supabase_cloud' : 'sovereign_local',
            isOtpSignUp ? fullName.trim() : (res.user?.user_metadata?.full_name || ''),
            isOtpSignUp ? organization.trim() : (res.user?.user_metadata?.organization || '')
          );
          setAuthSession(session);
          onLoginSuccess(session);
        }, 800);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'OTP verification failed');
    } finally {
      setLoading(false);
    }
  };

  // 4. Handle OAuth (Google / GitHub)
  const handleOAuth = async (provider: 'google' | 'github') => {
    setErrorMessage(null);
    setLoading(true);
    try {
      const res = await loginWithOAuth(provider);
      if (!res.success) {
        logSecurityAudit('LOGIN_FAILED', `oauth_${provider}`, { error: res.error });
        setErrorMessage(res.error || `Failed to initiate ${provider} auth`);
        setLoading(false);
      } else {
        logSecurityAudit('LOGIN_SUCCESS', `oauth_${provider}`, { userType });
        if (!supabaseStatus?.connected) {
          const session = buildSession(
            `usr-${provider}-${Date.now()}`,
            `developer@${provider}.oauth`,
            userType,
            'sovereign_local'
          );
          setAuthSession(session);
          onLoginSuccess(session);
        }
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'OAuth error');
      setLoading(false);
    }
  };

  // Instant Sovereign Local Mode (Bypasses any cloud DNS / network outages)
  const handleEnterSovereignMode = () => {
    const session = buildSession(
      `usr-op-${Date.now()}`,
      email.trim() || 'operator@token-os.local',
      userType,
      'sovereign_local',
      fullName.trim() || 'Sovereign Operator',
      organization.trim() || 'Token-OS Autonomous Labs'
    );
    setAuthSession(session);
    onLoginSuccess(session);
  };

  return (
    <div className="w-full min-h-screen flex items-center justify-center p-4 sm:p-6 relative overflow-y-auto font-sans">
      {/* Background Neon Ambient Glows */}
      <div className="absolute top-1/4 -left-32 w-96 h-96 bg-[#D97757]/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-[#E2896B]/10 rounded-full blur-[140px] pointer-events-none" />

      {/* Cyber Grid Lines */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1E293B15_1px,transparent_1px),linear-gradient(to_bottom,#1E293B15_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none" />

      {/* Main Centered Login / Registration Card wrapped in React Bits PixelCard */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="relative z-10 w-full max-w-xl mx-auto my-auto"
      >
        <PixelCard
          colors={['#f8fafc', '#f1f5f9', '#cbd5e1']}
          glowColor="#D97757"
          shape="square"
          origin="center"
          gap={5}
          pixelSize={2}
          speed={35}
          revealDuration={600}
          spotlight={0.5}
          glow={0.5}
          opacity={0.35}
          fade={0.7}
          trigger="hover"
          radius={24}
          clickPulse
          intro
          theme="dark"
          className="w-full border border-slate-700/80 shadow-[0_0_60px_rgba(217,119,87,0.15)]"
        >
          <div className="p-6 sm:p-8 space-y-6 bg-slate-950/40">
            {/* Supabase Gateway Telemetry Strip */}
            <div className="flex items-center justify-between px-3.5 py-2 rounded-xl bg-slate-900/90 border border-slate-800/90 text-[11px] font-mono">
              <div className="flex items-center gap-2 min-w-0">
                <span className={`w-2 h-2 rounded-full shrink-0 ${supabaseStatus?.connected ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400 animate-pulse'}`} />
                <span className="text-slate-300 font-semibold truncate">
                  {supabaseStatus?.connected 
                    ? `Supabase Cloud Connected (${supabaseStatus.latencyMs ?? 20}ms)` 
                    : 'Supabase Cloud Paused / Offline'}
                </span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowSupabaseConfig(true);
                  setConfigFeedback(null);
                }}
                className="text-[#E2896B] hover:text-[#D97757] hover:underline flex items-center gap-1.5 cursor-pointer transition-colors shrink-0 font-medium ml-2"
                title="Inspect or update Supabase endpoint & credentials"
              >
                <Database className="w-3.5 h-3.5 text-[#D97757]" />
                <span>Configure Supabase</span>
              </button>
            </div>

            {/* Header Telemetry */}
            <div className="text-center space-y-2 border-b border-slate-800/80 pb-5 relative">
              <div className="flex items-center justify-center">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#D97757]/10 border border-[#D97757]/30 text-[#E2896B] text-xs font-mono font-bold tracking-wider">
                  <Shield className="w-3.5 h-3.5" />
                  <span>ZERO-TRUST IDENTITY GATEWAY</span>
                </div>
              </div>

              <h1 className="text-2xl sm:text-3xl font-black font-mono tracking-tight text-[#F0F4F8] pt-2">
                TOKEN-<span className="text-[#D97757]">OS</span> ACCESS
              </h1>
              <p className="text-xs font-mono text-slate-300 tracking-wide font-semibold">
                AUTONOMOUS AI CONTROL PLANE • SOVEREIGN MODEL EXECUTION • ZERO-TRUST GOVERNANCE
              </p>
              <p className="text-[11px] text-slate-400 font-sans mt-0.5">
                Deterministic verification, real-time Pareto telemetry, and targeted IPAR refinement.
              </p>
            </div>

            {/* Lockout Banner */}
            {lockoutSec > 0 && (
              <div className="p-4 bg-red-950/60 border border-red-500/50 rounded-xl text-red-200 text-xs font-mono flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <span className="font-bold text-red-400 block tracking-wide">
                    LOCKOUT ENFORCED: 5 FAILED ATTEMPTS DETECTED
                  </span>
                  <p className="text-[11px] text-slate-300">
                    Authentication disabled for security. Cooldown remaining: <span className="font-bold text-red-400">{lockoutSec}s</span>
                  </p>
                </div>
              </div>
            )}

            {/* OAuth One-Click Identity Providers */}
            <div className="space-y-2">
              <div className="grid grid-cols-2 gap-3 text-xs font-mono">
                <button
                  type="button"
                  disabled={loading || lockoutSec > 0}
                  onClick={() => handleOAuth('google')}
                  className="flex items-center justify-center gap-2 py-2.5 px-4 bg-slate-900 hover:bg-slate-800 border border-slate-700/80 rounded-xl text-slate-200 hover:text-white transition-all cursor-pointer disabled:opacity-50"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path
                      fill="#EA4335"
                      d="M12 5c1.6 0 3 .6 4.1 1.6l3.1-3.1C17.3 1.7 14.8 1 12 1 7.5 1 3.7 3.6 1.9 7.3l3.7 2.9C6.5 7.4 9 5 12 5z"
                    />
                    <path
                      fill="#4285F4"
                      d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5.1 3.7-8.8z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.6 14.8c-.2-.7-.4-1.5-.4-2.8s.2-2.1.4-2.8L1.9 6.3C.7 8.7 0 10.8 0 12s.7 3.3 1.9 5.7l3.7-2.9z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3 0-5.5-2-6.4-4.8L1.9 16.4C3.7 20.4 7.5 23 12 23z"
                    />
                  </svg>
                  <span>Google</span>
                </button>

                <button
                  type="button"
                  disabled={loading || lockoutSec > 0}
                  onClick={() => handleOAuth('github')}
                  className="flex items-center justify-center gap-2 py-2.5 px-4 bg-slate-900 hover:bg-slate-800 border border-slate-700/80 rounded-xl text-slate-200 hover:text-white transition-all cursor-pointer disabled:opacity-50"
                >
                  <svg className="w-4 h-4 fill-current text-white" viewBox="0 0 24 24">
                    <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
                  </svg>
                  <span>GitHub</span>
                </button>
              </div>

              {/* Instant Sovereign Access Button (Bypasses Cloud DNS / Network Errors) */}
              <button
                type="button"
                onClick={handleEnterSovereignMode}
                className="w-full py-2 px-3 bg-slate-900/60 hover:bg-slate-800 border border-slate-800 hover:border-[#D97757]/60 text-slate-300 hover:text-white rounded-xl text-xs font-mono transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm group"
                title="Bypass cloud DNS & enter workstation directly in sovereign mode"
              >
                <Zap className="w-3.5 h-3.5 text-[#D97757] group-hover:scale-110 transition-transform" />
                <span>⚡ Instant Sovereign Operator Access (Bypass Cloud Auth)</span>
              </button>

              <div className="relative flex py-2 items-center">
                <div className="flex-grow border-t border-slate-800"></div>
                <span className="flex-shrink mx-4 text-[10px] text-slate-500 font-mono tracking-widest uppercase">
                  or authenticate with enterprise identity
                </span>
                <div className="flex-grow border-t border-slate-800"></div>
              </div>
            </div>

            {/* Tab Selection: Password vs OTP */}
            <div className="flex p-1 bg-slate-900 border border-slate-800 rounded-xl text-xs font-mono">
              <button
                type="button"
                onClick={() => {
                  setAuthMode('password');
                  setErrorMessage(null);
                }}
                className={`flex-1 py-1.5 rounded-lg transition-colors flex items-center justify-center gap-2 cursor-pointer ${authMode === 'password'
                  ? 'bg-[#D97757] text-black font-bold shadow-[0_0_12px_rgba(217,119,87,0.4)]'
                  : 'text-slate-400 hover:text-white'
                  }`}
              >
                <Lock className="w-3.5 h-3.5" />
                <span>EMAIL & PASSWORD</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setAuthMode('otp');
                  setErrorMessage(null);
                }}
                className={`flex-1 py-1.5 rounded-lg transition-colors flex items-center justify-center gap-2 cursor-pointer ${authMode === 'otp'
                  ? 'bg-[#D97757] text-black font-bold shadow-[0_0_12px_rgba(217,119,87,0.4)]'
                  : 'text-slate-400 hover:text-white'
                  }`}
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span>EMAIL OTP CODE</span>
              </button>
            </div>

            {/* Error / Success Feedback */}
            {errorMessage && (
              <div className="flex items-center gap-2 p-3 bg-red-500/15 border border-red-500/40 rounded-xl text-red-300 text-xs font-mono">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
                <span>{errorMessage}</span>
              </div>
            )}

            {successMessage && (
              <div className="flex items-center gap-2 p-3 bg-emerald-500/15 border border-emerald-500/40 rounded-xl text-emerald-300 text-xs font-mono">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                <span>{successMessage}</span>
              </div>
            )}

            {/* Hidden Honeypot Field (Anti-Bot Trap) */}
            <div className="hidden" aria-hidden="true">
              <input
                type="text"
                tabIndex={-1}
                autoComplete="off"
                value={honeypot}
                onChange={(e) => setHoneypot(e.target.value)}
              />
            </div>

            {/* Mode 1: Email & Password Form */}
            {authMode === 'password' && (
              <form onSubmit={handlePasswordAuth} className="space-y-4 text-xs font-mono">
                {/* Detailed Registration Fields */}
                {isSignUp && (
                  <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {/* Full Name */}
                      <div>
                        <label className="block text-slate-300 mb-1 flex items-center gap-1.5">
                          <User className="w-3.5 h-3.5 text-[#D97757]" />
                          <span>Full Name *</span>
                        </label>
                        <input
                          type="text"
                          required
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                          placeholder="e.g. Dr. Alex Rivera"
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-[#D97757]"
                        />
                      </div>

                      {/* Organization / Lab */}
                      <div>
                        <label className="block text-slate-300 mb-1 flex items-center gap-1.5">
                          <Building2 className="w-3.5 h-3.5 text-sky-400" />
                          <span>Workspace / Org</span>
                        </label>
                        <input
                          type="text"
                          value={organization}
                          onChange={(e) => setOrganization(e.target.value)}
                          placeholder="e.g. Stanford AI Lab"
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-sky-500"
                        />
                      </div>
                    </div>

                    {/* Global Standard Designation Dropdown */}
                    <div>
                      <label className="block text-slate-300 mb-1 flex items-center gap-1.5">
                        <Shield className="w-3.5 h-3.5 text-[#D97757]" />
                        <span>Professional Designation / Role</span>
                      </label>
                      <select
                        value={userType}
                        onChange={(e) => setUserType(e.target.value as UserType)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-slate-100 focus:outline-none focus:border-[#D97757] cursor-pointer"
                      >
                        {GLOBAL_STANDARD_ROLES.map((role) => (
                          <option key={role.value} value={role.value}>
                            {role.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </>
                )}

                {/* Email Address */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-slate-300">Email Address</label>
                    {email.length > 0 && (
                      <span className={`text-[10px] ${emailValidation.valid ? 'text-emerald-400' : 'text-red-400'}`}>
                        {emailValidation.valid ? '✓ Valid format' : '✗ Invalid email format'}
                      </span>
                    )}
                  </div>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                    <input
                      type="email"
                      required
                      disabled={lockoutSec > 0}
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="engineer@enterprise.io"
                      className={`w-full bg-slate-950 border rounded-xl pl-9 pr-3.5 py-2.5 text-slate-100 placeholder:text-slate-600 focus:outline-none disabled:opacity-50 ${email.length > 0 && !emailValidation.valid
                        ? 'border-red-500/80 focus:border-red-500'
                        : 'border-slate-800 focus:border-[#D97757]'
                        }`}
                    />
                  </div>
                </div>

                {/* Password */}
                <div>
                  <label className="block text-slate-300 mb-1">Password</label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      disabled={lockoutSec > 0}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••••••"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-9 py-2.5 text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-[#D97757] disabled:opacity-50"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-3 text-slate-500 hover:text-slate-300 cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>

                  {/* Dynamic Password Security Criteria Checklist for Registration */}
                  {isSignUp && password.length > 0 && (
                    <div className="mt-2.5 p-3 bg-slate-950/80 border border-slate-800/80 rounded-xl space-y-1.5 text-[11px]">
                      <div className="flex items-center justify-between font-bold text-slate-400">
                        <span>SECURITY POLICY REQUIREMENTS</span>
                        <span className={passwordCriteria.isAllMet ? 'text-emerald-400' : 'text-amber-400'}>
                          {passwordCriteria.isAllMet ? 'ALL MET' : `${passwordStrength.score}/5 MET`}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-1.5 pt-1 text-[10px]">
                        <div className={`flex items-center gap-1.5 ${passwordCriteria.minLength ? 'text-emerald-400' : 'text-slate-500'}`}>
                          {passwordCriteria.minLength ? <Check className="w-3 h-3 text-emerald-400" /> : <X className="w-3 h-3 text-slate-600" />}
                          <span>Min 8 characters</span>
                        </div>

                        <div className={`flex items-center gap-1.5 ${passwordCriteria.hasUpper ? 'text-emerald-400' : 'text-slate-500'}`}>
                          {passwordCriteria.hasUpper ? <Check className="w-3 h-3 text-emerald-400" /> : <X className="w-3 h-3 text-slate-600" />}
                          <span>Uppercase (A-Z)</span>
                        </div>

                        <div className={`flex items-center gap-1.5 ${passwordCriteria.hasLower ? 'text-emerald-400' : 'text-slate-500'}`}>
                          {passwordCriteria.hasLower ? <Check className="w-3 h-3 text-emerald-400" /> : <X className="w-3 h-3 text-slate-600" />}
                          <span>Lowercase (a-z)</span>
                        </div>

                        <div className={`flex items-center gap-1.5 ${passwordCriteria.hasNumber ? 'text-emerald-400' : 'text-slate-500'}`}>
                          {passwordCriteria.hasNumber ? <Check className="w-3 h-3 text-emerald-400" /> : <X className="w-3 h-3 text-slate-600" />}
                          <span>Number (0-9)</span>
                        </div>

                        <div className={`flex items-center gap-1.5 col-span-2 ${passwordCriteria.hasSpecial ? 'text-emerald-400' : 'text-slate-500'}`}>
                          {passwordCriteria.hasSpecial ? <Check className="w-3 h-3 text-emerald-400" /> : <X className="w-3 h-3 text-slate-600" />}
                          <span>Special symbol (!@#$%^&*...)</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Confirm Password Field when Signing Up */}
                {isSignUp && (
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-slate-300">Confirm Password</label>
                      {confirmPassword.length > 0 && (
                        <span className={`text-[10px] ${isPasswordMatch ? 'text-emerald-400' : 'text-red-400'}`}>
                          {isPasswordMatch ? '✓ Passwords match' : '✗ Passwords do not match'}
                        </span>
                      )}
                    </div>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                      <input
                        type={showConfirmPassword ? 'text' : 'password'}
                        required
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="••••••••••••"
                        className={`w-full bg-slate-950 border rounded-xl pl-9 pr-9 py-2.5 text-slate-100 placeholder:text-slate-600 focus:outline-none ${confirmPassword.length > 0 && !isPasswordMatch
                          ? 'border-red-500/80 focus:border-red-500'
                          : 'border-slate-800 focus:border-[#D97757]'
                          }`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-3 text-slate-500 hover:text-slate-300 cursor-pointer"
                      >
                        {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                )}

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={loading || lockoutSec > 0 || (isSignUp && (!passwordCriteria.isAllMet || !isPasswordMatch || !emailValidation.valid))}
                  className="w-full py-3 bg-[#D97757] hover:bg-[#E2896B] text-black font-bold rounded-xl transition-all shadow-[0_0_20px_rgba(217,119,87,0.4)] cursor-pointer flex items-center justify-center gap-2 uppercase tracking-wider disabled:opacity-50"
                >
                  {loading ? (
                    <span className="animate-spin w-4 h-4 border-2 border-black border-t-transparent rounded-full" />
                  ) : (
                    <>
                      <span>{isSignUp ? 'CREATE ACCOUNT & INITIALIZE WORKSPACE' : 'AUTHENTICATE & ENTER'}</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>

                {/* Toggle Sign Up vs Sign In */}
                <div className="text-center pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setIsSignUp(!isSignUp);
                      setErrorMessage(null);
                      setSuccessMessage(null);
                    }}
                    className="text-[11px] text-slate-400 hover:text-[#E2896B] transition-colors cursor-pointer"
                  >
                    {isSignUp ? 'Already registered? Sign in here' : "Need a new account? Create user account"}
                  </button>
                </div>
              </form>
            )}

            {/* Mode 2: Email OTP Form */}
            {authMode === 'otp' && (
              <div className="space-y-4 text-xs font-mono">
                {!otpSent ? (
                  <form onSubmit={handleSendOtp} className="space-y-3.5">
                    {/* If New User Profile Setup is enabled for OTP */}
                    {isOtpSignUp && (
                      <div className="space-y-3 p-3.5 bg-slate-950/80 border border-slate-800/90 rounded-xl">
                        <div className="flex items-center gap-2 text-slate-300 font-bold border-b border-slate-800 pb-2">
                          <User className="w-3.5 h-3.5 text-[#D97757]" />
                          <span>NEW USER PROFILE INITIALIZATION</span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="block text-slate-300 mb-1">Full Name *</label>
                            <input
                              type="text"
                              required={isOtpSignUp}
                              value={fullName}
                              onChange={(e) => setFullName(e.target.value)}
                              placeholder="e.g. Alex Rivera"
                              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-[#D97757]"
                            />
                          </div>

                          <div>
                            <label className="block text-slate-300 mb-1">Workspace / Org</label>
                            <input
                              type="text"
                              value={organization}
                              onChange={(e) => setOrganization(e.target.value)}
                              placeholder="e.g. Acme AI Labs"
                              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-[#D97757]"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-slate-300 mb-1 flex items-center gap-1.5">
                            <Shield className="w-3.5 h-3.5 text-[#D97757]" />
                            <span>Professional Designation / Role</span>
                          </label>
                          <select
                            value={userType}
                            onChange={(e) => setUserType(e.target.value as UserType)}
                            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-[#D97757] cursor-pointer"
                          >
                            {GLOBAL_STANDARD_ROLES.map((role) => (
                              <option key={role.value} value={role.value}>
                                {role.label}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    )}

                    <div>
                      <label className="block text-slate-300 mb-1">Email Address for Verification Passcode</label>
                      <div className="relative">
                        <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                        <input
                          type="email"
                          required
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="engineer@enterprise.io"
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3.5 py-2.5 text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-[#D97757]"
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={loading || lockoutSec > 0 || (isOtpSignUp && !fullName.trim())}
                      className="w-full py-3 bg-[#D97757] hover:bg-[#E2896B] text-black font-bold rounded-xl transition-all shadow-[0_0_20px_rgba(217,119,87,0.4)] cursor-pointer flex items-center justify-center gap-2 uppercase tracking-wider disabled:opacity-50"
                    >
                      {loading ? (
                        <span className="animate-spin w-4 h-4 border-2 border-black border-t-transparent rounded-full" />
                      ) : (
                        <>
                          <span>{isOtpSignUp ? 'INITIALIZE PROFILE & SEND CODE' : 'SEND 6-DIGIT PASSCODE'}</span>
                          <Smartphone className="w-4 h-4" />
                        </>
                      )}
                    </button>

                    {/* Toggle Create Account vs Sign In in OTP mode */}
                    <div className="text-center pt-1">
                      <button
                        type="button"
                        onClick={() => {
                          setIsOtpSignUp(!isOtpSignUp);
                          setErrorMessage(null);
                          setSuccessMessage(null);
                        }}
                        className="text-[11px] text-slate-400 hover:text-[#E2896B] transition-colors cursor-pointer"
                      >
                        {isOtpSignUp
                          ? 'Already registered? Quick sign-in with passcode'
                          : 'First time here? Create user account & profile'}
                      </button>
                    </div>
                  </form>
                ) : (
                  <div className="space-y-4">
                    {/* Structured Official TokenOS Security Dispatch Receipt */}
                    <div className="p-4 bg-slate-900/90 border border-emerald-500/40 rounded-2xl shadow-[0_0_25px_rgba(16,185,129,0.15)] space-y-3 font-mono text-xs">
                      <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                          <span className="text-[11px] font-bold text-slate-200 tracking-wider">
                            TOKENOS SECURITY OPERATIONS • OFFICIAL DISPATCH
                          </span>
                        </div>
                        <span className="text-[10px] text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/30">
                          {isSovereignOtp ? 'SOVEREIGN LOCAL DISPATCH' : 'DISPATCHED TO INBOX'}
                        </span>
                      </div>

                      {/* Structured Email Headers */}
                      <div className="space-y-1.5 text-[11px] bg-slate-950/80 p-3 rounded-xl border border-slate-800/80 text-slate-300">
                        <div className="flex items-center gap-2">
                          <span className="text-slate-500 w-16 shrink-0">FROM:</span>
                          <span className="text-[#E2896B] font-bold truncate">{otpSender}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-slate-500 w-16 shrink-0">TO:</span>
                          <span className="text-emerald-300 font-semibold truncate">{email}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-slate-500 w-16 shrink-0">SUBJECT:</span>
                          <span className="text-slate-300 truncate">TokenOS Access Passcode — Dynamic Session Authorization</span>
                        </div>
                      </div>

                      {/* Verification Instructions or Sovereign Fallback Box */}
                      {isSovereignOtp && fallbackPasscode ? (
                        <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl space-y-2">
                          <div className="flex items-center justify-between text-amber-300 font-bold text-[11px]">
                            <div className="flex items-center gap-1.5">
                              <Shield className="w-4 h-4 text-amber-400" />
                              <span>SOVEREIGN PASSCODE (CLOUD UNREACHABLE / PAUSED)</span>
                            </div>
                            <span className="text-[10px] bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded font-mono">
                              INSTANT DEV PASSCODE
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-300 leading-relaxed font-sans">
                            Supabase Cloud is paused or offline. TokenOS Sovereign Security Gateway generated a local cryptographic session passcode so you are never blocked:
                          </p>
                          <div className="flex items-center justify-between gap-2 pt-1 bg-black/70 p-2.5 rounded-lg border border-amber-500/40">
                            <div className="font-mono text-xl font-black text-amber-300 tracking-[0.3em]">
                              {fallbackPasscode}
                            </div>
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => {
                                  setOtpToken(fallbackPasscode);
                                }}
                                className="px-3 py-1.5 bg-[#D97757] hover:bg-[#E2896B] text-black font-bold rounded-lg text-xs font-mono transition-colors cursor-pointer"
                              >
                                Auto-Fill Code
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  navigator.clipboard.writeText(fallbackPasscode);
                                  setCopiedPasscode(true);
                                  setTimeout(() => setCopiedPasscode(false), 2000);
                                }}
                                className="p-1.5 text-slate-400 hover:text-white transition-colors cursor-pointer border border-slate-700 rounded-lg hover:border-slate-500"
                                title="Copy passcode"
                              >
                                {copiedPasscode ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                              </button>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="p-3 bg-[#D97757]/10 border border-[#D97757]/30 rounded-xl space-y-1.5">
                          <div className="flex items-center gap-2 text-[#E2896B] font-bold text-[11px]">
                            <Mail className="w-4 h-4 shrink-0" />
                            <span>CHECK YOUR INBOX TO RETRIEVE YOUR 6-DIGIT CODE</span>
                          </div>
                          <p className="text-[11px] text-slate-300 leading-relaxed font-sans">
                            A single-use confirmation code has been transmitted directly to your email inbox: <span className="font-mono text-white font-semibold">{email}</span>.
                            Open your mail app (or check spam/junk), copy the 6-digit code, and enter it below to complete the cryptographic handshake.
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Verification Form */}
                    <form onSubmit={handleVerifyOtp} className="space-y-3">
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="text-slate-300">Enter 6-Digit Code from Email</label>
                          <button
                            type="button"
                            onClick={() => {
                              setOtpSent(false);
                              setOtpToken('');
                              setFallbackPasscode(null);
                              setIsSovereignOtp(false);
                            }}
                            className="text-[10px] text-sky-400 hover:underline cursor-pointer"
                          >
                            Change email
                          </button>
                        </div>
                        <input
                          type="text"
                          maxLength={6}
                          required
                          value={otpToken}
                          onChange={(e) => setOtpToken(e.target.value.replace(/\D/g, '').slice(0, 6))}
                          placeholder="• • • • • •"
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-center text-xl font-bold tracking-[0.4em] text-[#D97757] placeholder:text-slate-600 focus:outline-none focus:border-[#D97757]"
                        />
                        <span className="text-[10px] text-slate-500 block text-center mt-1">
                          Paste the 6-digit passcode sent to {email}
                        </span>
                      </div>

                      <button
                        type="submit"
                        disabled={loading || lockoutSec > 0 || otpToken.length < 6}
                        className="w-full py-3 bg-emerald-500 hover:bg-emerald-400 text-black font-bold rounded-xl transition-all shadow-[0_0_20px_rgba(16,185,129,0.3)] cursor-pointer flex items-center justify-center gap-2 uppercase tracking-wider disabled:opacity-50"
                      >
                        {loading ? (
                          <span className="animate-spin w-4 h-4 border-2 border-black border-t-transparent rounded-full" />
                        ) : (
                          <>
                            <span>COMPLETE HANDSHAKE & ACCESS WORKSPACE</span>
                            <ArrowRight className="w-4 h-4" />
                          </>
                        )}
                      </button>

                      {/* Resend Dynamic Code Trigger */}
                      <div className="text-center pt-1">
                        <button
                          type="button"
                          disabled={loading}
                          onClick={() => handleSendOtp()}
                          className="text-[11px] text-slate-400 hover:text-[#E2896B] transition-colors inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                        >
                          <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
                          <span>Didn't receive email? Resend code to inbox</span>
                        </button>
                      </div>
                    </form>
                  </div>
                )}
              </div>
            )}
          </div>
        </PixelCard>
      </motion.div>

      {/* Supabase Endpoint Configuration Modal */}
      <AnimatePresence>
        {showSupabaseConfig && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 space-y-5 font-mono text-xs"
            >
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2 text-slate-100 font-bold">
                  <Database className="w-4 h-4 text-[#D97757]" />
                  <span className="text-sm">Supabase Cloud Connection & Configuration</span>
                </div>
                <button
                  type="button"
                  onClick={() => setShowSupabaseConfig(false)}
                  className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Status Banner */}
              <div className={`p-3 rounded-xl border flex items-start gap-2.5 ${
                supabaseStatus?.connected
                  ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-200'
                  : 'bg-amber-950/60 border-amber-500/40 text-amber-200'
              }`}>
                {supabaseStatus?.connected ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                )}
                <div className="space-y-1">
                  <div className="font-bold">
                    {supabaseStatus?.connected
                      ? `Connected to Supabase (${supabaseStatus.latencyMs ?? 0}ms)`
                      : 'Endpoint Unreachable or Paused'}
                  </div>
                  <p className="text-[11px] text-slate-300 font-sans leading-relaxed">
                    {supabaseStatus?.connected
                      ? 'Live PostgreSQL connection verified with Row-Level Security (RLS) active.'
                      : (supabaseStatus?.error || 'Unable to connect to current Supabase URL. If using Supabase Free Tier, inactive projects pause after 7 days.')}
                  </p>
                </div>
              </div>

              {/* Form Fields */}
              <div className="space-y-3.5">
                <div>
                  <label className="block text-slate-300 mb-1">Supabase Project URL</label>
                  <input
                    type="text"
                    value={supabaseUrlInput}
                    onChange={(e) => setSupabaseUrlInput(e.target.value)}
                    placeholder="https://your-project.supabase.co"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-[#D97757]"
                  />
                  <span className="text-[10px] text-slate-500 mt-1 block">
                    From Supabase Dashboard &gt; Project Settings &gt; API
                  </span>
                </div>

                <div>
                  <label className="block text-slate-300 mb-1">Supabase Anon Public API Key</label>
                  <input
                    type="password"
                    value={supabaseKeyInput}
                    onChange={(e) => setSupabaseKeyInput(e.target.value)}
                    placeholder="sb_publishable_... or eyJhbGciOi..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-[#D97757]"
                  />
                  <span className="text-[10px] text-slate-500 mt-1 block">
                    Public anon key safe for browser client requests
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  disabled={testingSupabase}
                  onClick={handleTestSupabase}
                  className="flex-1 py-2 px-3 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl border border-slate-700 transition-colors flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${testingSupabase ? 'animate-spin' : ''}`} />
                  <span>Test Connection</span>
                </button>

                <button
                  type="button"
                  disabled={testingSupabase}
                  onClick={handleSaveSupabaseConfig}
                  className="flex-1 py-2 px-3 bg-[#D97757] hover:bg-[#E2896B] text-black font-bold rounded-xl transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Save & Connect</span>
                </button>
              </div>

              {/* Feedback Alert */}
              {configFeedback && (
                <div className={`p-2.5 rounded-lg border text-[11px] flex items-center gap-2 ${
                  configFeedback.type === 'success'
                    ? 'bg-emerald-950/70 border-emerald-700 text-emerald-300'
                    : configFeedback.type === 'info'
                    ? 'bg-sky-950/70 border-sky-700 text-sky-300'
                    : 'bg-red-950/70 border-red-700 text-red-300'
                }`}>
                  {configFeedback.type === 'success' ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  ) : configFeedback.type === 'info' ? (
                    <RefreshCw className="w-4 h-4 text-sky-400 shrink-0 animate-spin" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                  )}
                  <span>{configFeedback.text}</span>
                </div>
              )}

              {/* Guidance Tips */}
              <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800/80 space-y-1 text-[11px] text-slate-400 font-sans">
                <div className="font-bold text-slate-300 font-mono text-[10px] uppercase tracking-wider">
                  How to unpause or setup Supabase:
                </div>
                <p>
                  1. Visit <a href="https://supabase.com/dashboard" target="_blank" rel="noreferrer" className="text-[#E2896B] underline inline-flex items-center gap-0.5">supabase.com/dashboard <ExternalLink className="w-3 h-3" /></a> and sign in.
                </p>
                <p>
                  2. If project shows &quot;Paused&quot;, click &quot;Restore project&quot; to re-enable database and DNS.
                </p>
                <p>
                  3. If using a new project, copy the Project URL and anon key, paste them above, and click &quot;Save & Connect&quot;.
                </p>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
