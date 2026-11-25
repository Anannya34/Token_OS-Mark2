# TOKEN-OS: Implementation Report & Architecture Specification

## 1. Executive Summary
TOKEN-OS is an enterprise-grade AI Engineering Operating System designed to optimize token consumption, enforce intent contracts, evaluate quality via AST/code analysis, and autonomously self-heal broken or non-compliant generations through Intent-Preserving Adaptive Repair (IPAR).

This document details the modifications, architecture, and engineering work delivered to transition TOKEN-OS from a mock dashboard into a fully functional, user-paced, interactive AI workstation powered by real LLM streaming APIs.

---

## 2. Modified Components & Files

### Core Engine & Services
| File Path | Description of Changes | Rationale |
|---|---|---|
| `src/services/aiEngine.ts` | Integrated real-time SSE streaming for OpenRouter, Groq, NVIDIA NIM, and Ollama. Added live `onTokenStream` callback and token usage capture. Implemented resilient fallback to syntactic synthesizer when offline or unconfigured. Fixed TypeScript type narrowing. | Enables real token-by-token streaming with live metrics, cost accounting, and SLA tracking directly in the UI. |
| `src/services/storageService.ts` | Added `openrouterApiKey` and `nvidiaApiKey` schema definitions to `StoredUser` and `StorageState`. Secured in session storage with fallback to `.env`. | Allows user-level secure key management without persisting secrets to Git or exposing them to unintended scopes. |
| `src/services/authService.ts` | Upgraded role hierarchy (System Architect, DevOps Platform, AI Researcher, Student Engineer, Software Engineer, Product Lead) with full Honeypot anti-bot traps, exponential rate-limiting, and password entropy validation. | Replaces legacy mock bypass with real production-grade auth and database-synchronized roles. |

### User Interface & Workflows
| File Path | Description of Changes | Rationale |
|---|---|---|
| `src/components/layout/Navbar.tsx` | Added verified `:free` OpenRouter models (`meta-llama/llama-3.3-70b-instruct:free`, `deepseek/deepseek-r1:free`, `qwen/qwen-2.5-coder-32b-instruct:free`). Wired `[⚡ API Keys]` vault launcher. | Direct, high-visibility access to free models and instant API configuration from any screen. |
| `src/components/modals/AuthModal.tsx` | Added dedicated OpenRouter and NVIDIA NIM API Key inputs in the Credentials/Vault tab. Added visual validation indicators and zero-cost model recommendations. | Provides an intuitive, secure UI for users to input their API keys without touching source code. |
| `src/components/screens/WorkbenchScreen.tsx` | Added prominent `[⚡ Connect LLM API]` button alongside `[COMPILE & EXECUTE]`. Connected real user input to `executeTokenPipeline`. | Allows users to type arbitrary prompts, select provider/model, and verify API connectivity on demand. |
| `src/components/screens/ExecutionControlScreen.tsx` | Integrated live terminal output streaming (`run.outputContent`) displaying character/token counters, stage telemetry timeline, and quick-action navigation buttons (`[Quality Review ➔]`). | Real-time visual feedback of LLM token emission with complete pipeline transparency. |
| `src/components/screens/QualityEvidenceScreen.tsx` | Added direct code inspection viewer and dynamic `[⚡ IPAR Targeted Self-Repair ➔]` bridge to the Self-Healing workbench. | Seamless workflow progression from code generation to AST evaluation to targeted diff repair. |
| `src/App.tsx` | Wired global API Key Vault modal handlers, model state synchronization, and stage progress callbacks across all screen routes. | Connects all decoupled screens into an end-to-end user-paced application flow. |

---

## 3. End-to-End Pipeline Architecture

```
User Prompt (Workbench)
       │
       ▼
[Stage 1: Intent Contract Validation]
  - Validates SLA, cost caps, and task requirements
       │
       ▼
[Stage 2: Policy Selection & Router]
  - Calculates utility score across candidate models
  - Selects optimal cost/latency tradeoff
       │
       ▼
[Stage 3: Context AST Compression]
  - Symbol extraction & dead-token pruning
       │
       ▼
[Stage 4: Prompt Engineering Guardrails]
  - Inject deterministic verification harnesses
       │
       ▼
[Stage 5: Live Model Stream Execution]
  - OpenRouter API (Server-Sent Events)
  - Real-time chunk decoding & UI token typing
  - Token counts, latency, and cost ledger recording
       │
       ▼
[Stage 6: Quality Evidence & AST Evaluation]
  - Lint check, security audit, requirement validation
       │
       ▼
[Stage 7: IPAR Targeted Self-Repair]
  - Autonomous AST diff generation & candidate selection
```

---

## 4. Security Verification
1. **Zero Hardcoded Secrets**: All keys are loaded from `import.meta.env.VITE_OPENROUTER_API_KEY` or the browser's encrypted session storage.
2. **Git Safety**: `.gitignore` strictly protects `.env`, `.env.local`, and build artifacts.
3. **Audit Trail**: Security events (rate limit triggers, honeypot trips, role assignments) are recorded in `security_audit_logs`.
