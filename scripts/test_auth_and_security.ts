/**
 * TOKEN-OS MASTER TEST SUITE: Real Auth, Security & Supabase Integrity
 * Run with: node --experimental-strip-types scripts/test_auth_and_security.ts
 */

import { 
  checkRateLimit, 
  recordFailedAttempt, 
  clearRateLimit, 
  sanitizeInput, 
  isHoneypotTriggered, 
  evaluatePasswordStrength,
  validateEmail,
  checkPasswordCriteria,
  logSecurityAudit,
  getSecurityAuditLogs
} from '../src/services/securityGuard.ts';
import fs from 'node:fs';
import path from 'node:path';

let passedTests = 0;
let failedTests = 0;

function assert(condition: boolean, testName: string, details?: string) {
  if (condition) {
    console.log(`  \x1b[32m✔ PASS\x1b[0m: ${testName}`);
    passedTests++;
  } else {
    console.error(`  \x1b[31m✖ FAIL\x1b[0m: ${testName} ${details ? `(${details})` : ''}`);
    failedTests++;
  }
}

console.log('\n================================================================');
console.log('  TOKEN-OS SECURITY GUARD & REAL AUTH VERIFICATION SUITE');
console.log('================================================================\n');

// -------------------------------------------------------------
// GROUP 1: Rate Limiting & Cooldown Protection Against Brute Force
// -------------------------------------------------------------
console.log('[SUITE 1] Rate Limiting & Brute-Force Attack Mitigation');
const testUser = 'attacker_test@token-os.internal';
clearRateLimit(testUser);

// Initial state
const check1 = checkRateLimit(testUser);
assert(check1.allowed === true, '1.1 Initial client state is permitted');

// 1 to 4 failed attempts should not lock out
for (let i = 1; i <= 4; i++) {
  const result = recordFailedAttempt(testUser);
  assert(result.allowed === true, `1.2 Failed attempt #${i} tracked without premature lockout`);
}

// 5th attempt MUST trigger 60s lockout
const lockoutResult = recordFailedAttempt(testUser);
assert(lockoutResult.allowed === false, '1.3 5th failed attempt triggers immediate lockout');
assert(typeof lockoutResult.lockoutRemainingSec === 'number' && lockoutResult.lockoutRemainingSec > 0, '1.4 Lockout countdown timer is enforced (>0s remaining)');

// Subsequent checks during lockout must be blocked
const blockedCheck = checkRateLimit(testUser);
assert(blockedCheck.allowed === false, '1.5 Subsequent queries during lockout window are strictly denied');

// Reset upon successful authentication
clearRateLimit(testUser);
const postClearCheck = checkRateLimit(testUser);
assert(postClearCheck.allowed === true, '1.6 Clearing rate limit restores authorized access');

// -------------------------------------------------------------
// GROUP 2: Anti-Bot Honeypot Defense
// -------------------------------------------------------------
console.log('\n[SUITE 2] Honeypot Bot Trap Detection');
assert(isHoneypotTriggered('') === false, '2.1 Human submission (empty honeypot) passes cleanly');
assert(isHoneypotTriggered('   ') === false, '2.2 Whitespace in honeypot is treated as empty');
assert(isHoneypotTriggered('spam_bot_payload') === true, '2.3 Bot script filling hidden honeypot is detected & flagged');
assert(isHoneypotTriggered('https://malicious-link.ru') === true, '2.4 Automated injection in honeypot is blocked');

// -------------------------------------------------------------
// GROUP 3: Password Entropy & Strength Meter
// -------------------------------------------------------------
console.log('\n[SUITE 3] Password Entropy & Policy Enforcement');
const weakPass = evaluatePasswordStrength('short');
assert(weakPass.label === 'WEAK' && weakPass.score <= 1, '3.1 Short password flagged as WEAK');

const numericPass = evaluatePasswordStrength('12345678');
assert(numericPass.score < 3, '3.2 Pure numeric password flagged for lacking casing & symbols');

const goodPass = evaluatePasswordStrength('SecurePass12');
assert(goodPass.score >= 3, '3.3 Mixed alphanumeric password rated GOOD');

const strongPass = evaluatePasswordStrength('T0ken!OS#Sec2026');
assert(strongPass.label === 'STRONG' && strongPass.score === 5, '3.4 High-entropy password with all 5 criteria rated STRONG');

// Password Criteria
const criteriaFail = checkPasswordCriteria('password');
assert(criteriaFail.isAllMet === false, '3.5 Incomplete password flags isAllMet as false');
assert(criteriaFail.hasUpper === false && criteriaFail.hasNumber === false, '3.6 Missing uppercase and number accurately identified');

const criteriaPass = checkPasswordCriteria('T0ken!OS#Sec2026');
assert(criteriaPass.isAllMet === true, '3.7 Password satisfying length, casing, numbers, symbols flags isAllMet as true');

// Email Validation
const badEmail = validateEmail('invalid-email-string');
assert(badEmail.valid === false, '3.8 Malformed email rejected with validation failure');

const goodEmail = validateEmail('architect@token-os.io');
assert(goodEmail.valid === true, '3.9 Valid RFC email passes successfully');

// -------------------------------------------------------------
// GROUP 4: Input Sanitization & XSS Neutralization
// -------------------------------------------------------------
console.log('\n[SUITE 4] Input Sanitization & XSS Prevention');
const xssPayload = "<script>alert('xss')</script>admin@domain.com";
const sanitized = sanitizeInput(xssPayload);
assert(!sanitized.includes('<') && !sanitized.includes('>'), '4.1 HTML tag delimiters < > neutralized');
assert(sanitized.includes('admin@domain.com'), '4.2 Legitimate email segment preserved');

// -------------------------------------------------------------
// GROUP 5: Security Audit Logging Trail
// -------------------------------------------------------------
console.log('\n[SUITE 5] Audit Trail & Incident Logging');
const auditLog = logSecurityAudit('RATE_LIMIT_TRIGGERED', 'suspicious_actor@ip.net', { attempts: 5 });
assert(auditLog.eventType === 'RATE_LIMIT_TRIGGERED', '5.1 Security incident correctly typed');
assert(typeof auditLog.timestamp === 'string' && auditLog.timestamp.length > 0, '5.2 ISO timestamp recorded');
assert(auditLog.id.startsWith('sec-'), '5.3 Unique security event ID generated');

const logs = getSecurityAuditLogs();
assert(Array.isArray(logs), '5.4 Security audit logs retrieval returns array');

// -------------------------------------------------------------
// GROUP 6: Supabase PostgreSQL Schema & RLS Verification
// -------------------------------------------------------------
console.log('\n[SUITE 6] Supabase Database Schema & RLS Policies');
const schemaPath = path.resolve('supabase_schema.sql');
assert(fs.existsSync(schemaPath), '6.1 supabase_schema.sql exists on disk');

const schemaSql = fs.readFileSync(schemaPath, 'utf-8');

// Check required tables
assert(schemaSql.includes('CREATE TABLE IF NOT EXISTS public.profiles'), '6.2 profiles table declared');
assert(schemaSql.includes('CREATE TABLE IF NOT EXISTS public.intent_contracts'), '6.3 intent_contracts table declared');
assert(schemaSql.includes('CREATE TABLE IF NOT EXISTS public.execution_runs'), '6.4 execution_runs table declared');
assert(schemaSql.includes('CREATE TABLE IF NOT EXISTS public.security_audit_logs'), '6.5 security_audit_logs table declared');

// Check RLS policies
assert(schemaSql.includes('ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;'), '6.6 RLS enabled on profiles');
assert(schemaSql.includes('ALTER TABLE public.intent_contracts ENABLE ROW LEVEL SECURITY;'), '6.7 RLS enabled on intent_contracts');
assert(schemaSql.includes('ALTER TABLE public.execution_runs ENABLE ROW LEVEL SECURITY;'), '6.8 RLS enabled on execution_runs');
assert(schemaSql.includes('ALTER TABLE public.security_audit_logs ENABLE ROW LEVEL SECURITY;'), '6.9 RLS enabled on security_audit_logs');

// Check user types
assert(schemaSql.includes("'SYSTEM_ARCHITECT'"), '6.10 UserType SYSTEM_ARCHITECT supported in schema');
assert(schemaSql.includes("'DEVOPS_PLATFORM'"), '6.11 UserType DEVOPS_PLATFORM supported in schema');
assert(schemaSql.includes("'AI_RESEARCHER'"), '6.12 UserType AI_RESEARCHER supported in schema');
assert(schemaSql.includes("'STUDENT_ENGINEER'"), '6.13 UserType STUDENT_ENGINEER supported in schema');
assert(schemaSql.includes("'SOFTWARE_ENGINEER'"), '6.14 UserType SOFTWARE_ENGINEER supported in schema');
assert(schemaSql.includes("'PRODUCT_LEAD'"), '6.15 UserType PRODUCT_LEAD supported in schema');
assert(schemaSql.includes("'OTHER'"), '6.16 UserType OTHER supported in schema');

// Verify faculty bypass is NOT present
assert(!schemaSql.includes('FACULTY_EVALUATOR'), '6.17 Obsolete faculty bypass role eliminated from schema');

// Verify organization column exists
assert(schemaSql.includes('organization TEXT'), '6.18 organization column added to profiles schema');

// -------------------------------------------------------------
// GROUP 7: Client-Side Vault Master PIN Entropy & System Design Rules
// -------------------------------------------------------------
console.log('\n[SUITE 7] Client-Side Vault Master PIN Entropy & Anti-Brute-Force Security');
import { evaluatePinEntropy } from '../src/services/apiVaultService.ts';

// 7.1 Minimum length rejection
const shortPin = evaluatePinEntropy('12');
assert(!shortPin.valid && shortPin.strength === 'too_weak', '7.1 Short PIN (< 4 chars) rejected as too_weak');

// 7.2 Repeating characters rejection (e.g. 0000, 1111)
const repeatedPin = evaluatePinEntropy('0000');
assert(!repeatedPin.valid && repeatedPin.label === 'Repeated Digits', '7.2 Repeating digits (0000) rejected');

const repeatedPin2 = evaluatePinEntropy('999999');
assert(!repeatedPin2.valid, '7.3 Extended repeating digits (999999) rejected');

// 7.4 Sequential pattern rejection (e.g. 1234, 4321, 6789)
const seqPin1 = evaluatePinEntropy('1234');
assert(!seqPin1.valid && seqPin1.label === 'Sequential Pattern', '7.4 Sequential ascending pattern (1234) rejected');

const seqPin2 = evaluatePinEntropy('54321');
assert(!seqPin2.valid, '7.5 Sequential descending pattern (54321) rejected');

// 7.6 Common trivial passwords / PINs
const commonPin = evaluatePinEntropy('password');
assert(!commonPin.valid && commonPin.label === 'Easily Guessable', '7.6 Common weak password rejected');

// 7.7 Valid non-trivial numeric PIN
const validNumeric = evaluatePinEntropy('8392');
assert(validNumeric.valid === true, '7.7 Non-sequential numeric PIN (8392) accepted');

// 7.8 High-entropy alphanumeric PIN with symbols
const highEntropyPin = evaluatePinEntropy('Tk-Secure-982#');
assert(highEntropyPin.valid === true && highEntropyPin.score >= 3, '7.8 High-entropy alphanumeric & symbol PIN rated Strong');

// -------------------------------------------------------------
// GROUP 8: Sovereign OTP Fallback & Clean Default Credentials
// -------------------------------------------------------------
console.log('\n[SUITE 8] Sovereign OTP Resiliency & Clean Default Verification');

// 8.1 Check that anannyaborkar email is not hardcoded anywhere in src/
const srcFiles = ['src/components/screens/LoginScreen.tsx', 'src/components/modals/AuthModal.tsx'];
for (const file of srcFiles) {
  const content = fs.readFileSync(path.resolve(file), 'utf-8');
  assert(!content.includes('anannyaborkar@gmail.com'), `8.1 Clean email field in ${file} (no hardcoded email)`);
  assert(!content.includes('Anannyaaa'), `8.2 Clean display name in ${file} (no hardcoded alias)`);
}

// 8.2 Verify sendEmailOtp and verifyEmailOtp resiliency
import { sendEmailOtp, verifyEmailOtp } from '../src/services/supabaseClient.ts';

// Mock sessionStorage in node environment for OTP test
if (typeof globalThis.sessionStorage === 'undefined') {
  const store: Record<string, string> = {};
  (globalThis as any).sessionStorage = {
    getItem: (k: string) => store[k] || null,
    setItem: (k: string, v: string) => { store[k] = v; },
    removeItem: (k: string) => { delete store[k]; }
  };
}

const otpTestEmail = 'developer-' + Date.now() + '@enterprise.io';
const otpDispatch = await sendEmailOtp(otpTestEmail);
assert(otpDispatch.success === true, '8.3 OTP dispatch succeeds (cloud dispatch or sovereign fallback)');

if (otpDispatch.isSovereignFallback) {
  assert(typeof otpDispatch.fallbackCode === 'string' && otpDispatch.fallbackCode.length === 6, '8.4 6-digit cryptographic passcode generated');
  const badVerify = await verifyEmailOtp(otpTestEmail, '000000');
  assert(badVerify.success === false, '8.5 Invalid passcode rejected');
  const goodVerify = await verifyEmailOtp(otpTestEmail, otpDispatch.fallbackCode!);
  assert(goodVerify.success === true, '8.6 Sovereign OTP handshake verified successfully');
  assert(goodVerify.user?.email === otpTestEmail, '8.7 Authenticated user object populated with clean email');
} else {
  assert(otpDispatch.isSovereignFallback === false, '8.4 Cloud Supabase OTP dispatch verified without fallback');
  const badVerify = await verifyEmailOtp(otpTestEmail, '000000');
  assert(badVerify.success === false, '8.5 Invalid passcode rejected by Cloud Supabase');

  // Also verify sovereign fallback flow directly
  (globalThis as any).sessionStorage.setItem('token_os_sovereign_otp', JSON.stringify({
    email: otpTestEmail,
    code: '789123',
    createdAt: Date.now(),
    expiresAt: Date.now() + 600000
  }));
  const goodVerify = await verifyEmailOtp(otpTestEmail, '789123');
  assert(goodVerify.success === true, '8.6 Sovereign OTP handshake verified successfully');
  assert(goodVerify.user?.email === otpTestEmail, '8.7 Authenticated user object populated with clean email');
  (globalThis as any).sessionStorage.removeItem('token_os_sovereign_otp');
}

// -------------------------------------------------------------
// GROUP 9: Client-Side WebCrypto AES-GCM Key Vault Encryption & PBKDF2
// -------------------------------------------------------------
console.log('\n[SUITE 9] Client-Side WebCrypto AES-GCM Vault Encryption & PBKDF2 Key Derivation');
const { deriveKeyPBKDF2, encryptDataAESGCM, decryptDataAESGCM } = await import('../src/services/apiVaultService.ts');

const testVaultPin = 'Secure#MasterPIN*2026';
const sensitiveApiKey = 'sk-groq-prod-live-999888777666';

// 9.1 Encrypt sensitive payload using AES-GCM & PBKDF2
const encryptedPayload = await encryptDataAESGCM(sensitiveApiKey, testVaultPin);
assert(encryptedPayload.__enc === true, '9.1 Encrypted payload stamped with __enc flag');
assert(encryptedPayload.version === 1, '9.2 Payload version recorded as 1');
assert(typeof encryptedPayload.salt === 'string' && encryptedPayload.salt.length === 32, '9.3 16-byte random salt generated (32 hex chars)');
assert(typeof encryptedPayload.iv === 'string' && encryptedPayload.iv.length === 24, '9.4 12-byte random IV generated (24 hex chars)');
assert(typeof encryptedPayload.ciphertext === 'string' && encryptedPayload.ciphertext.length > 0, '9.5 AES-GCM ciphertext populated');
assert(!encryptedPayload.ciphertext.includes(sensitiveApiKey), '9.6 Ciphertext does not leak plaintext secret');

// 9.7 Decrypt with valid Master PIN
const decryptedKey = await decryptDataAESGCM(encryptedPayload, testVaultPin);
assert(decryptedKey === sensitiveApiKey, '9.7 Decrypted secret matches original plaintext exactly');

// 9.8 Decrypt with incorrect Master PIN must reject
let decryptionFailed = false;
try {
  await decryptDataAESGCM(encryptedPayload, 'WrongPIN#1234');
} catch (err) {
  decryptionFailed = true;
}
assert(decryptionFailed === true, '9.8 Authentication tag validation failure rejects wrong PIN');

// -------------------------------------------------------------
// SUMMARY
// -------------------------------------------------------------
console.log('\n================================================================');
console.log(`  VERIFICATION RESULTS: ${passedTests} PASSED, ${failedTests} FAILED`);
console.log('================================================================\n');

if (failedTests > 0) {
  process.exit(1);
} else {
  console.log('\x1b[32m✔ ALL SECURITY, AUTH & DATABASE SUITES PASSED FLAWLESSLY!\x1b[0m\n');
  process.exit(0);
}
