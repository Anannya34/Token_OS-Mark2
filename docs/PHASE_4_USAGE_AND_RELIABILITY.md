# TOKEN-OS Phase 4: Real Token Accounting, Usage, and Reliability Report

**Document Status:** Complete & Verified  
**Date:** October 18, 2026  
**Module:** Usage Telemetry, Token Accounting & Cost Attribution Engine  
**Corpus / Repository:** `Anannya34/TokenOS-Final-` (Unified at `c:\Users\Sajjad\token-mark1`)

---

## 1. Executive Summary

Phase 4 establishes authoritative, transparent, and multi-tenant-safe token accounting and cost tracking across the entire TOKEN-OS platform. Previous iterations utilized arbitrary random integers for token counts and hardcoded `$0` assumptions. Phase 4 completely eradicates fabricated metrics, replacing them with a strict data model distinguishing between:

1. **`provider_reported`**: Authoritative usage metrics extracted directly from official SSE streaming or completion payloads (e.g., Google AI Studio `usageMetadata.promptTokenCount` and `candidatesTokenCount`).
2. **`measured_locally`**: Hardware-level token counting from local sovereign LLM engines (Ollama port 11434).
3. **`estimated`**: Clearly labeled character-to-token ratio heuristics applied solely during offline synthesis or unconfigured fallback states.
4. **`unavailable`**: Explicitly reported when an upstream provider fails before returning token metadata, preventing misleading numbers.

All 66 automated tests pass cleanly (`46 Security/Auth` + `20 LLM/Pipeline`), and `npm run build` succeeds with zero TypeScript or packaging errors.

---

## 2. Usage Data Model & Schema

The execution telemetry schema in [`src/types/index.ts`](file:///c:/Users/Sajjad/token-mark1/src/types/index.ts) was extended to track full token provenance, input/output breakdown, actual serving model, and calculation method:

```typescript
export type ProvenanceType = 
  | 'provider_reported' 
  | 'measured_locally' 
  | 'estimated' 
  | 'unavailable';

export interface ExecutionRun {
  id: string;
  intentContractId: string;
  timestamp: string;
  taskType: TaskType;
  providerModel: string;
  actualServingModel?: string;
  status: 'READY' | 'NEEDS_IMPROVEMENT' | 'ABSTAIN' | 'FAILED' | 'RUNNING';
  inputTokens?: number;
  outputTokens?: number;
  cachedTokens?: number;
  totalTokens: number;
  totalCostUsd: number;
  costCalculationMethod?: 'verified_free_tier' | 'provider_reported' | 'estimated' | 'offline_synthesizer';
  provenance: ProvenanceType;
  totalLatencyMs: number;
  stages: StageTelemetry[];
  policyDecisions: PolicyCandidateAction[];
  requirementEvaluations: RequirementEvaluation[];
  evidenceLedger: EvidenceItem[];
  repairAttempts: number;
  anomaly?: AnomalyEvent;
  outputContent: string;
}
```

### Database Synchronization
This model maps directly to the Supabase PostgreSQL table `execution_runs` declared in `supabase_schema.sql`, protected by Row Level Security (RLS) policies guaranteeing cross-tenant isolation:
- `user_id` foreign key ensures non-admin users can only view their own telemetry.
- Organization column on user profiles partitions fleet-wide analytics.

---

## 3. Actual vs. Estimated Tokens Implementation

### A. Google AI Studio (Gemini Flash Latest)
In [`src/services/providers/geminiProvider.ts`](file:///c:/Users/Sajjad/token-mark1/src/services/providers/geminiProvider.ts), SSE stream events include the official `usageMetadata` object:
```json
"usageMetadata": {
  "promptTokenCount": 27,
  "candidatesTokenCount": 2302,
  "totalTokenCount": 2329
}
```
The provider adapter parses this object and populates `ProviderUsage`:
- `promptTokens`: 27
- `completionTokens`: 2,302
- `totalTokens`: 2,329
- `provenance`: `'provider_reported'`

### B. OpenRouter Unified Gateway
In [`src/services/providers/openrouterProvider.ts`](file:///c:/Users/Sajjad/token-mark1/src/services/providers/openrouterProvider.ts), streaming requests pass `stream_options: { include_usage: true }`. When the final chunk arrives, OpenRouter sends authoritative token counts and cost metadata, extracted into the execution run without character estimation.

### C. Local Ollama Engine
In [`src/services/providers/ollamaProvider.ts`](file:///c:/Users/Sajjad/token-mark1/src/services/providers/ollamaProvider.ts), the terminal JSON event provides:
- `prompt_eval_count` (Input tokens)
- `eval_count` (Generated output tokens)
- `total_duration` (Hardware compute latency in nanoseconds)
Provenance is tagged as `'measured_locally'`.

### D. Offline / Unconfigured Synthesizer
When a provider API key is not configured in `.env` or the API Key Vault, TOKEN-OS does not fabricate fake provider results. It streams the deterministic local synthesizer with:
- Transparent console warning: `[TOKEN-OS] OpenRouter Unified Gateway API key not configured. Streaming deterministic offline synthesis.`
- Model labeled as `OpenRouter (Offline Synthesizer)`
- Provenance marked as `'estimated'`
- Cost calculated as `$0.0000` (`verified_free_tier`)

---

## 4. Token Counting During Streaming

1. **Progressive Display:** As tokens stream over Server-Sent Events (SSE), the Live Model Stream Output renders each chunk incrementally using RAF (RequestAnimationFrame) throttled updates to avoid UI stutter.
2. **Pending Usage State:** While the stream is active, the UI displays `Streaming... (Usage pending final provider packet)`. Live token counts are displayed as an estimated running count (based on characters received) clearly tagged with `~` prefix.
3. **Authoritative Reconciliation:** When the terminal SSE event is received:
   - Live stream completes.
   - Authoritative `usageMetadata` overrides the running estimate.
   - The token badge transitions from `~250 est.` to `2,329 Provider Reported`.

---

## 5. Cost Calculation Integrity

TOKEN-OS enforces strict rules to prevent billing misinformation:
1. **Zero-Cost Free Tier Guarantee:** Models tagged with `:free` (OpenRouter), `gemini-flash-latest` (under 15 RPM free tier in Google AI Studio), and Ollama local hardware are recorded at `$0.0000` with `costCalculationMethod: 'verified_free_tier'`.
2. **Paid Model Protection:** If a paid model is queried, costs are derived from provider-reported rate cards (input cost per 1M tokens + output cost per 1M tokens). If rates are unverified, TOKEN-OS displays `Cost unavailable` rather than misleading the user with `$0.00`.
3. **No Hidden Upgrades:** TOKEN-OS will never automatically fall back from a free model to a paid model without explicit user authorization.

---

## 6. UI & Dashboard Verification

The following UI components were updated to display real token accounting:

### A. ExecutionControlScreen (`src/components/screens/ExecutionControlScreen.tsx`)
- **Token Counter Badge:** Renders exact `inputTokens` (Prompt) and `outputTokens` (Completion).
- **Provenance Badge:** Displays a color-coded tag:
  - Green: `Provider Reported` (Google AI Studio / OpenRouter)
  - Blue: `Local Hardware` (Ollama)
  - Amber: `Estimated` (Offline Synthesizer)
  - Red: `Unavailable` (Execution Failed)
- **Live Latency & Cost:** Millisecond precision execution duration and verified tier cost.

### B. RunsInsightsScreen (`src/components/screens/RunsInsightsScreen.tsx`)
- **Fleet Analytics:** Aggregates input vs. output token distribution across all runs.
- **Provider Reliability:** Displays real failure rates and latency percentiles.
- **Model Attribution:** Tracks consumption per serving model.

---

## 7. Automated Test Results

### Suite 1: Security & Auth (`scripts/test_auth_and_security.ts`)
- **Result:** 46 Passed, 0 Failed
- **Highlights:** Rate limiting lockout enforced (5 attempts), honeypot bot trap active, RFC email validation, XSS escaping, Supabase RLS policies validated.

### Suite 2: LLM Integration & Pipeline (`scripts/test_llm_and_pipeline.ts`)
- **Result:** 20 Passed, 0 Failed
- **Highlights:**
  - `2.1 - 2.5`: Pipeline run generated, output code populated, 228 token stream chunks received, 15 stage events tracked.
  - `3.1 - 3.4`: Token accounting recorded 257 tokens, provenance honestly tagged `estimated`, zero-cost free tier honored ($0), AST compression stage logged.
  - `4.1 - 4.4`: Deterministic AST evaluation checked against contract requirements, edge case gap flagged `NEEDS_IMPROVEMENT`.
  - `5.1 - 5.4`: IPAR self-healing generated targeted boundary test patch with 0.58 predicted gain.

### Production Build (`npm run build`)
- **Result:** Clean exit code 0 (`built in 13.73s`).

---

## 8. Phase 4 Acceptance Criteria Checklist

| Criterion | Status | Evidence / Verification |
|---|---|---|
| Actual usage captured when returned by provider | **PASSED** | Gemini SSE parser extracts `promptTokenCount` and `candidatesTokenCount`. Live probe: 2,329 tokens. |
| Estimates clearly labeled | **PASSED** | Offline synthesizer outputs tagged with `provenance: 'estimated'`. |
| Pricing is not fabricated | **PASSED** | Free tier models recorded at `$0.0000`; paid models calculate rate-card or flag `unavailable`. |
| Streaming usage reconciled correctly | **PASSED** | Stream output shows pending estimate during inference, reconciled upon terminal SSE usage packet. |
| Usage not duplicated by retries/fallbacks | **PASSED** | Single terminal `ExecutionRun` record generated per user trigger. |
| Errors are understandable | **PASSED** | Provider errors surfaced with HTTP status, exact cause, and configuration instructions. |
| Usage respects user boundaries | **PASSED** | Supabase RLS enforces `auth.uid() = user_id` on `execution_runs`. |

---
**Phase 4 is complete.** Ready to proceed with Phase 5 (End-to-End Verification and Presentation Readiness).
