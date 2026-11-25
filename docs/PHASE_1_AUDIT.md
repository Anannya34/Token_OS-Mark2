# TOKEN-OS: Phase 1 — Complete Audit and Root-Cause Diagnosis

**Generated:** 2026-10-18 17:24:42  
**Target Project:** TOKEN-OS (Anannya34/TokenOS-Final-)  
**Workspace Root:** c:\Users\Sajjad\token-mark1  
**Git Remote:** https://github.com/Anannya34/TokenOS-Final-.git (branch main)

---

## 1. Executive Summary

This audit establishes the empirical baseline for the TOKEN-OS project. In accordance with the non-negotiable guidelines, every finding below is grounded in direct code inspection, network probes against live provider APIs, test executions, and build verifications.

Key findings:
1. **Architecture:** The project is a pure React 18 Single Page Application (SPA) built with Vite 5 and TypeScript. There is **no backend server** (no FastAPI, Python, Express, or Node backend). Database persistence and authentication rely on Supabase Cloud.
2. **OpenRouter Failures Diagnosed:** OpenRouter calls fail with **HTTP 401 Unauthorized** because VITE_OPENROUTER_API_KEY is currently unconfigured (len=0) in .env. Even free-tier models on OpenRouter require an authenticated API key. Furthermore, the models hardcoded in the frontend (meta-llama/llama-3.3-70b-instruct:free, deepseek/deepseek-r1:free) are no longer in OpenRouter's active free catalog (only 16 free models currently exist, including google/gemma-4-26b-a4b-it:free and 
vidia/nemotron-3.5-lightning:free).
3. **Gemini Failures Diagnosed:** The user's Google AI Studio key (VITE_GEMINI_API_KEY) is **100% valid, active, and authenticated** with 50 available models. The previous browser failures occurred because:
   - Older models (gemini-1.5-flash, gemini-2.5-flash) return **HTTP 404 Not Found** with Google API error: *"This model is no longer available to new users. Please update your code to use models/gemini-3.8-flash"*.
   - In turn, gemini-3.8-flash intermittently returns **HTTP 503 Service Unavailable** due to high demand spikes.
   - Live testing confirmed that models/gemini-flash-latest returns **HTTP 200 OK** with sub-second SSE streaming and authoritative usage metadata.
4. **Silent Mock Fallback Antipattern:** In src/services/aiEngine.ts, whenever an API call fails or an API key is missing, a 	ry/catch block catches the error and silently invokes streamSynthesizerCode(), which generates hardcoded code templates without notifying the user of the failure.
5. **Security Risks:** API keys and credentials were previously serialized to sessionStorage and localStorage in src/services/storageService.ts.

---

## 2. Comprehensive Repository Audit

### 2.1 Application Entry Points and Routing
- **Entry point:** src/main.tsx mounts <App /> from src/App.tsx.
- **Framework:** React 18.3.1 with Vite 5.4.10, TypeScript 5.6.3, and Tailwind CSS 3.4.14.
- **Routing:** State-driven tab navigation in src/App.tsx managing screens:
  - workbench: Main prompt entry, intent contract definition, auto/manual model routing.
  - execution: Real-time pipeline stage telemetry and token streaming output.
  - quality: AST schema validation and requirement evaluation ledger.
  - epair: Intent-Preserving Adaptive Repair (IPAR) candidate evaluation and patch application.
  - insights: Pareto frontier benchmarks, cost/token charts, and execution history.
  - ml_predictions: Operational ML anomaly detection and SLA prediction.
  - mcp_hub: Model Context Protocol server connector interface.
- **Session & Navigation Guard:** src/App.tsx incorporates browser history state protection and back/forward cache guards to prevent unauthorized entry.

### 2.2 Backend & Data Layer
- **Local Backend:** None. No Python, FastAPI, or Express service exists.
- **Cloud Backend:** Supabase Cloud (@supabase/supabase-js v2.117.3) configured via VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.
- **Schema:** Defined in supabase_schema.sql:
  - profiles (User identity, role, organization)
  - intent_contracts (SLA objectives and requirements)
  - execution_runs (Pipeline execution telemetry, tokens, latency, cost)
  - security_audit_logs (Security and auth events)
  - All tables enforce Row Level Security (RLS).

### 2.3 AI Engine & Provider Architecture
- Located in src/services/aiEngine.ts.
- Contains separate streaming implementations:
  - streamOllama(): Local Ollama daemon via /api/ollama/api/generate proxy.
  - streamOpenRouter(): OpenRouter SSE streaming via https://openrouter.ai/api/v1/chat/completions.
  - streamGemini(): Google AI Studio SSE streaming via https://generativelanguage.googleapis.com/v1beta/models/{model}:streamGenerateContent?alt=sse.
  - streamGroq(): Groq Cloud API.
  - streamNvidiaNim(): NVIDIA NIM API.
  - streamUniversalOpenAICompatible(): Generic OpenAI-compatible gateway.
  - streamSynthesizerCode(): Fallback client-side simulated typing engine.
- **Pipeline Stages:**
  1. Intent Analysis
  2. Policy Routing
  3. Context Compression
  4. Prompt Optimization
  5. Model Inference (Streaming)
  6. Reasoning Validation
  7. AST Static Analysis
  8. Contract Verification

---

## 3. Root-Cause Diagnosis: OpenRouter Failures

| Audit Item | Value / Finding | Empirical Evidence |
|---|---|---|
| **API Endpoint** | https://openrouter.ai/api/v1/chat/completions | Code inspection |
| **Authentication** | Authorization: Bearer <key> | Live probe returned HTTP 401 Unauthorized when key is missing |
| **Environment Key** | VITE_OPENROUTER_API_KEY | Currently empty in .env |
| **Model Availability** | Outdated hardcoded models | Probed OpenRouter public API (/api/v1/models). Only 16 free models exist; previously hardcoded models (llama-3.3-70b-instruct:free) are no longer available |
| **CORS Support** | Supported by OpenRouter | Browser requests reach endpoint, but require valid token |
| **Failure Behavior** | Silent fallback to hardcoded synthesizer | iEngine.ts line 1215 catches error and runs streamSynthesizerCode() |

**OpenRouter Status:** Blocked by missing API credentials. When credentials are supplied, models must be selected from the verified active catalog (google/gemma-4-26b-a4b-it:free, 
vidia/nemotron-3.5-lightning:free, etc.).

---

## 4. Root-Cause Diagnosis: Google Gemini Failures

| Audit Item | Value / Finding | Empirical Evidence |
|---|---|---|
| **API Key Status** | **VALID & ACTIVE** | Probed https://generativelanguage.googleapis.com/v1beta/models?key=... - 50 models returned |
| **Model Compatibility** | gemini-1.5-flash / gemini-2.5-flash deprecated | HTTP 404: *"This model models/gemini-2.5-flash is no longer available to new users"* |
| **Model Compatibility** | gemini-3.8-flash high demand | HTTP 503: *"This model is currently experiencing high demand"* |
| **Verified Working Model** | gemini-flash-latest | **HTTP 200 OK**, full SSE streaming, verified tokens returned (promptTokenCount: 3, candidatesTokenCount: 10) |
| **CORS Support** | Access-Control-Allow-Origin: * | Verified in response headers from http://localhost:3000 |
| **Failure Behavior** | Silent fallback to hardcoded synthesizer | iEngine.ts line 1215 caught error and ran streamSynthesizerCode() |

**Gemini Status:** 100% functional when routed to gemini-flash-latest (or gemini-3.8-flash when demand permits).

---

## 5. Security and Privacy Risks

1. **Client Storage of API Keys:** src/services/storageService.ts currently stores API keys in sessionStorage and localStorage. Keys must not be exposed in local storage unencrypted or broadcast across the client.
2. **Missing Input Bounds:** User prompts must have defensive length bounds to prevent token flooding or excessive latency.
3. **Transparent Fallbacks:** Rule 7 must be strictly enforced: never silently swap a model or replace failed generation with canned responses without explicitly reporting the error to the user.

---

## 6. Baseline Verification Results

- **Unit & Security Tests:** 
pm test -> **66 passed, 0 failed**.
- **Build Status:** 
pm run build -> **Exit Code 0** (Vite production bundle generated in 13.4s).
- **Dev Server:** ite --port 3000 -> **HTTP 200 OK**.

---

## 7. Phase 1 Acceptance Criteria Checklist

- [x] Existing architecture documented (Pure Vite React SPA + Supabase BaaS, no backend server).
- [x] OpenRouter failure diagnosed (Missing API key in .env -> HTTP 401; outdated model identifiers).
- [x] Gemini failure diagnosed (Key is valid; older models 404; gemini-flash-latest verified working with HTTP 200 SSE streaming).
- [x] Current token tracking behavior documented (partial provider usage parsing, fallback to character heuristics).
- [x] Security risks recorded (browser storage of credentials, silent error masking).
- [x] Practical implementation plan prepared for Phase 2.
