import type { ExecutionRun, IntentContract } from '../types/index.ts';
import { getSupabaseClient } from './supabaseClient.ts';

const RUNS_STORAGE_KEY = 'token_os_execution_runs';
const CONTRACTS_STORAGE_KEY = 'token_os_contracts';
const AUTH_STORAGE_KEY = 'token_os_auth_session';
const UNIVERSAL_LLM_STORAGE_KEY = 'token_os_universal_llm';
const PROMPT_CACHE_STORAGE_KEY = 'token_os_prompt_cache_v1';

export interface CachedPromptEntry {
  hash: string;
  outputContent: string;
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  providerModel: string;
  createdAt: string;
}

export async function computePromptHash(prunedPrompt: string, requirements: any[], providerModel: string): Promise<string> {
  const normReqs = (requirements || []).map(r => typeof r === 'string' ? r : (r.text || r.requirement || String(r))).sort();
  const content = `${prunedPrompt.trim()}|${JSON.stringify(normReqs)}|${providerModel.trim().toLowerCase()}`;
  if (typeof crypto !== 'undefined' && crypto.subtle) {
    const encoder = new TextEncoder();
    const data = encoder.encode(content);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }
  let hash = 0;
  for (let i = 0; i < content.length; i++) {
    hash = (hash << 5) - hash + content.charCodeAt(i);
    hash |= 0;
  }
  return `fallback-${Math.abs(hash)}`;
}

export function getCachedPrompt(hash: string): CachedPromptEntry | null {
  try {
    const storage = typeof localStorage !== 'undefined' ? localStorage : (typeof window !== 'undefined' ? window.localStorage : null);
    if (!storage) return null;
    const raw = storage.getItem(PROMPT_CACHE_STORAGE_KEY);
    if (!raw) return null;
    const cache: Record<string, CachedPromptEntry> = JSON.parse(raw);
    return cache[hash] || null;
  } catch {
    return null;
  }
}

export function setCachedPrompt(entry: CachedPromptEntry): void {
  try {
    const storage = typeof localStorage !== 'undefined' ? localStorage : (typeof window !== 'undefined' ? window.localStorage : null);
    if (!storage) return;
    const raw = storage.getItem(PROMPT_CACHE_STORAGE_KEY);
    const cache: Record<string, CachedPromptEntry> = raw ? JSON.parse(raw) : {};
    cache[entry.hash] = entry;
    const keys = Object.keys(cache);
    if (keys.length > 100) {
      delete cache[keys[0]];
    }
    storage.setItem(PROMPT_CACHE_STORAGE_KEY, JSON.stringify(cache));
  } catch {}
}

export interface UniversalLLMConfig {
  provider: 'custom' | 'openrouter' | 'nvidia' | 'openai' | 'groq' | 'ollama' | 'gemini';
  baseUrl: string;
  apiKey: string;
  model: string;
  isVerified?: boolean;
}

export const DEFAULT_UNIVERSAL_LLM: UniversalLLMConfig = {
  provider: 'openrouter',
  baseUrl: 'https://openrouter.ai/api/v1',
  apiKey: '',
  model: 'deepseek/deepseek-r1',
  isVerified: false
};

export function getUniversalLLMConfig(): UniversalLLMConfig {
  try {
    const raw = localStorage.getItem(UNIVERSAL_LLM_STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (err) {
    console.warn('Failed to parse universal LLM config:', err);
  }
  return DEFAULT_UNIVERSAL_LLM;
}

export function saveUniversalLLMConfig(config: UniversalLLMConfig): void {
  try {
    localStorage.setItem(UNIVERSAL_LLM_STORAGE_KEY, JSON.stringify(config));
  } catch (err) {
    console.error('Failed to save universal LLM config:', err);
  }
}

export type UserType = 
  | 'SOFTWARE_ENGINEER'
  | 'AI_RESEARCHER'
  | 'DEVOPS_PLATFORM'
  | 'SYSTEM_ARCHITECT'
  | 'STUDENT_ENGINEER'
  | 'PRODUCT_LEAD'
  | 'OTHER';

export interface AuthSession {
  user: {
    id: string;
    email: string;
    fullName?: string;
    organization?: string;
    role: UserType;
    mode: 'sovereign_local' | 'supabase_cloud';
  } | null;
  supabaseUrl?: string;
  supabaseKey?: string;
  groqApiKey?: string;
  grokApiKey?: string;
  openrouterApiKey?: string;
  nvidiaApiKey?: string;
  geminiApiKey?: string;
  universalLLM?: UniversalLLMConfig;
  loginTime?: number;
}

// 1. Storage for Execution Runs
export function getSavedRuns(): ExecutionRun[] {
  try {
    const raw = localStorage.getItem(RUNS_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (err) {
    console.error('Failed to load runs from storage:', err);
    return [];
  }
}

export function saveRun(run: ExecutionRun): void {
  try {
    const existing = getSavedRuns();
    const filtered = existing.filter(r => r.id !== run.id);
    const updated = [run, ...filtered].slice(0, 50); // Keep last 50 runs
    localStorage.setItem(RUNS_STORAGE_KEY, JSON.stringify(updated));

    // Asynchronously sync with Supabase PostgreSQL if active
    const client = getSupabaseClient();
    if (client) {
      client.from('execution_runs').upsert({
        id: run.id,
        intent_contract_id: run.intentContractId,
        task_type: run.taskType,
        provider_model: run.providerModel,
        status: run.status,
        total_tokens: run.totalTokens,
        total_cost_usd: run.totalCostUsd,
        total_latency_ms: run.totalLatencyMs,
        provenance: run.provenance,
        stages: run.stages,
        requirement_evaluations: run.requirementEvaluations,
        output_content: run.outputContent,
        repair_attempts: run.repairAttempts
      }).then(
        ({ error }) => {
          if (error) console.warn('Supabase run sync notice:', error.message);
        },
        (err: any) => {
          console.warn('Supabase run sync offline:', err?.message || err);
        }
      );
    }
  } catch (err) {
    console.error('Failed to save run to storage:', err);
  }
}

// 2. Storage for Intent Contracts
export function getSavedContracts(): IntentContract[] {
  try {
    const raw = localStorage.getItem(CONTRACTS_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveContract(contract: IntentContract): void {
  try {
    const existing = getSavedContracts();
    const filtered = existing.filter(c => c.id !== contract.id);
    localStorage.setItem(CONTRACTS_STORAGE_KEY, JSON.stringify([contract, ...filtered]));

    // Asynchronously sync with Supabase PostgreSQL if active
    const client = getSupabaseClient();
    if (client) {
      client.from('intent_contracts').upsert({
        id: contract.id,
        version: contract.version,
        title: contract.title,
        task_type: contract.taskType,
        objective: contract.objective,
        requirements: contract.requirements,
        hard_constraints: contract.hardConstraints,
        confidence_threshold: contract.confidenceThreshold,
        privacy_level: contract.privacyLevel
      }).then(
        ({ error }) => {
          if (error) console.warn('Supabase contract sync notice:', error.message);
        },
        (err: any) => {
          console.warn('Supabase contract sync offline:', err?.message || err);
        }
      );
    }
  } catch (err) {
    console.error('Failed to save contract:', err);
  }
}

// 3. Storage for Auth Session (Session-Scoped with Automatic Tab-Close & Idle Expiry)
export function getAuthSession(): AuthSession {
  try {
    if (typeof window === 'undefined') return { user: null };
    const raw = sessionStorage.getItem(AUTH_STORAGE_KEY);
    const customUrl = localStorage.getItem('token_os_custom_supabase_url');
    const customKey = localStorage.getItem('token_os_custom_supabase_key');

    if (raw) {
      const parsed: AuthSession = JSON.parse(raw);
      // Enforce 1-hour idle/session expiration guard
      const SESSION_TTL_MS = 60 * 60 * 1000;
      if (parsed.loginTime && Date.now() - parsed.loginTime > SESSION_TTL_MS) {
        clearAuthSession();
        return { 
          user: null,
          supabaseUrl: customUrl || undefined,
          supabaseKey: customKey || undefined
        };
      }
      return {
        ...parsed,
        supabaseUrl: parsed.supabaseUrl || customUrl || undefined,
        supabaseKey: parsed.supabaseKey || customKey || undefined
      };
    }

    return {
      user: null,
      supabaseUrl: customUrl || undefined,
      supabaseKey: customKey || undefined
    };
  } catch {}
  
  return {
    user: null
  };
}

export function saveSupabaseConfig(url: string, key: string): void {
  const current = getAuthSession();
  const updated: AuthSession = {
    ...current,
    supabaseUrl: url.trim(),
    supabaseKey: key.trim()
  };
  setAuthSession(updated);
  try {
    localStorage.setItem('token_os_custom_supabase_url', url.trim());
    localStorage.setItem('token_os_custom_supabase_key', key.trim());
  } catch {}
}

export function setAuthSession(session: AuthSession): void {
  try {
    if (typeof window === 'undefined') return;
    const sessionWithTimestamp: AuthSession = {
      ...session,
      loginTime: session.loginTime || Date.now()
    };
    sessionStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(sessionWithTimestamp));
    // Clear any legacy persistent session from localStorage
    localStorage.removeItem(AUTH_STORAGE_KEY);
  } catch (err) {
    console.error('Failed to save session:', err);
  }
}

export function clearAuthSession(): void {
  try {
    if (typeof window === 'undefined') return;
    sessionStorage.removeItem(AUTH_STORAGE_KEY);
    localStorage.removeItem(AUTH_STORAGE_KEY);
    // Purge any legacy localStorage Supabase tokens
    for (let i = localStorage.length - 1; i >= 0; i--) {
      const k = localStorage.key(i);
      if (k && (k.startsWith('sb-') || k.includes('auth-token') || k.includes('supabase'))) {
        localStorage.removeItem(k);
      }
    }
  } catch (err) {
    console.error('Failed to clear session:', err);
  }
}

// 4. Export SLA & Compliance Audit Evidence Report
export function exportAuditReportJson(runs: ExecutionRun[], activeContract: IntentContract): void {
  const report = {
    generatedAt: new Date().toISOString(),
    system: "Token-OS Intent Execution Control Plane",
    complianceScore: "100% Deterministic Verification",
    activeContract,
    totalRuns: runs.length,
    runs
  };

  const blob = new Blob([JSON.stringify(report, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `token-os-compliance-audit-${Date.now()}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

// 5. Export Individual Run as Formatted Markdown Dossier (.md)
export function exportRunAsMarkdown(run: ExecutionRun, contract?: IntentContract): void {
  const dateFormatted = new Date(run.timestamp).toLocaleString();
  const satisfiedCount = run.requirementEvaluations?.filter(e => e.status === 'SATISFIED').length || 0;
  const totalCount = run.requirementEvaluations?.length || 0;

  const content = `# Token-OS Execution Dossier: ${run.id}
- **Generated At:** ${dateFormatted}
- **System:** Token-OS Intent Execution Control Plane
- **Task Type:** ${run.taskType}

---

## 1. Executive Telemetry & SLA Metrics
- **Verification Status:** ${run.status}
- **Provider & Model:** ${run.providerModel}
- **Total Tokens Consumed:** ${run.totalTokens.toLocaleString()} tokens
- **Total Latency:** ${run.totalLatencyMs} ms
- **Estimated Cost:** $${run.totalCostUsd.toFixed(6)} USD
- **Token Provenance:** ${run.provenance}
- **Quality Gate:** ${satisfiedCount}/${totalCount} Criteria Satisfied

---

## 2. Intent Contract & Prompt
- **Task Title:** ${contract?.title || run.taskType}
- **Objective / Prompt:**
\`\`\`text
${contract?.objective || 'No explicit prompt objective recorded.'}
\`\`\`

### Hard Constraints & SLA:
- **Max Tokens Cap:** ${contract?.hardConstraints?.maxTokens || 'N/A'}
- **Max Latency Cap:** ${contract?.hardConstraints?.maxLatencyMs ? `${contract.hardConstraints.maxLatencyMs} ms` : 'N/A'}
- **Max Cost Cap:** $${contract?.hardConstraints?.maxCostUsd ?? 'N/A'}
- **Local Only Execution:** ${contract?.hardConstraints?.localOnly ? 'Enabled' : 'Disabled'}

---

## 3. Synthesized Source Code Output
\`\`\`typescript
${run.outputContent || '// No source code output generated for this run.'}
\`\`\`

---

## 4. Quality Evidence & AST Requirement Verification
${(run.requirementEvaluations && run.requirementEvaluations.length > 0)
  ? run.requirementEvaluations.map((evalItem, idx) => `
### Requirement ${idx + 1}: ${evalItem.requirement}
- **Status:** ${evalItem.status === 'SATISFIED' ? '✅ SATISFIED' : '❌ FAILED'}
- **Evaluator:** \`${evalItem.evaluatorIdentity || 'DeterministicValidator'}\`
- **Evidence Found:** \`${evalItem.evidenceFound || 'None'}\`
- **Constraint Level:** ${evalItem.isHardConstraint ? 'Strict SLA' : 'Soft Guideline'}
${evalItem.failureReason ? `- **Failure Reason:** ${evalItem.failureReason}` : ''}
`).join('\n')
  : '_No explicit AST requirements evaluated for this run._'}

---

## 5. Pipeline Stages Execution Trace
${(run.stages && run.stages.length > 0)
  ? run.stages.map(s => `- **${s.stage}**: ${s.state.toUpperCase()} (${s.durationMs}ms) — ${s.details}`).join('\n')
  : '_No stage traces recorded._'}

---
*Generated by Token-OS • Intent-Aware Sovereign AI Control Plane*
`;

  const blob = new Blob([content], { type: "text/markdown;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `tokenos_run_${run.id}.md`;
  a.click();
  URL.revokeObjectURL(url);
}

// 6. Export Pure Source Code File (.ts)
export function exportRunCodeFile(run: ExecutionRun): void {
  const code = run.outputContent || `// Token-OS Empty Solution (${run.id})\n`;
  const blob = new Blob([code], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `solution_${run.id}.ts`;
  a.click();
  URL.revokeObjectURL(url);
}

// 7. Export Complete Workspace Archive (.json)
export function exportCompleteWorkspaceJson(runs: ExecutionRun[], contracts: IntentContract[]): void {
  const archive = {
    exportedAt: new Date().toISOString(),
    system: "Token-OS Intent Execution Control Plane",
    schemaVersion: "2.0.0",
    totalRuns: runs.length,
    totalContracts: contracts.length,
    contracts,
    runs
  };

  const blob = new Blob([JSON.stringify(archive, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `tokenos_workspace_archive_${Date.now()}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

// 8. Purge & Clear All Saved Runs (Trails)
export function clearAllRuns(): void {
  try {
    localStorage.removeItem(RUNS_STORAGE_KEY);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('token_os_runs_cleared'));
      window.dispatchEvent(new Event('storage'));
    }
  } catch (err) {
    console.error('Failed to clear runs:', err);
  }
}

// 9. Guided Demo Tour Preferences
const TOUR_COMPLETED_KEY = 'token_os_tour_completed';

export function isTourCompleted(): boolean {
  try {
    const storage = typeof localStorage !== 'undefined' ? localStorage : (typeof window !== 'undefined' ? window.localStorage : null);
    if (!storage) return false;
    return storage.getItem(TOUR_COMPLETED_KEY) === 'true';
  } catch {
    return false;
  }
}

export function setTourCompleted(completed: boolean): void {
  try {
    const storage = typeof localStorage !== 'undefined' ? localStorage : (typeof window !== 'undefined' ? window.localStorage : null);
    if (!storage) return;
    storage.setItem(TOUR_COMPLETED_KEY, completed ? 'true' : 'false');
  } catch {}
}



