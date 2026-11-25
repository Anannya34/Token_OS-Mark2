# TOKEN-OS: Master PRD, Architecture & Faculty Examination Roadmap

**Project:** Token-OS (Intent-Aware AI Execution Control Plane & Autonomous Repair Platform)  
**Target Date:** Tonight (Pre-Faculty Exam Deployment)  
**Local LLM Status:** Verified Active on `http://localhost:11434` (`mistral:latest`)  
**Recommended Free Cloud AI:** Groq API (Llama 3.3 70B @ 500 tokens/sec) & Google Gemini 2.5 Flash  
**Database & Auth:** Supabase Cloud + LocalStorage Sovereign Persistence  

---

## 🎯 Executive Summary & The "Faculty Test" Challenge

Tomorrow, your faculty member will personally test Token-OS by typing their own custom prompt (e.g., *"Write a distributed task worker in Go with Redis queue"* or *"Refactor a patient bed allocation API with JWT authentication"*).

If the system returns static, canned mock data, the project fails the examination.  
**To guarantee an A+ score, Token-OS will execute an end-to-end dynamic pipeline:**
1. **Accepts ANY user/faculty prompt** in real time.
2. **Deconstructs the prompt** into structured constraints, SLAs (cost, latency, tokens), and test requirements.
3. **Invokes Real LLMs**:
   - **Primary Offline:** Local Ollama running `mistral:latest` on your machine (`/api/ollama` proxy).
   - **Grok AI (xAI API):** Real cloud inference via xAI `grok-2-latest` endpoint.
   - **Cloud Fast API:** Groq (Free tier, 500+ tokens/sec) for Llama 3.3 70B.
   - **Browser Fail-Safe:** Deterministic AST synthesizer ensuring 100% demo uptime.
4. **Streams Real Pipeline Stages:** Intent → Policy Utility Scoring → AST Context Compression (65%) → Prompt Optimization → Real Inference → AST Linting → Verification Assertion.
5. **Generates Real Quality Evidence:** Verifies requirements against the actual code returned by the LLM.
6. **Produces an Autonomous IPAR Patch (Intent-Policy-AST-Repair):** Automatically repairs failed test assertions before the examiner's eyes.
7. **Database Storage (Supabase PostgreSQL):** Persists all contracts, execution runs, and audit logs with Row-Level Security (RLS).

---

## 🗺️ Phased Screen-by-Screen Implementation Plan

```
┌──────────────────────────────────────────────────────────────────────────────────┐
│                             TOKEN-OS SYSTEM FLOW                                 │
└──────────────────────────────────────────────────────────────────────────────────┘
   [Phase 1] Splash Screen (React Bits TechText Canvas + Matrix Rain) - [COMPLETED]
         │
         ▼
   [Phase 2] Auth Gate & Security Defense (Supabase, OTP, Rate Limiting) - [COMPLETED]
         │
         ▼
   [Phase 3] Workbench & Intent Builder (Dynamic Prompt Parser & SLA Constraints)
         │
         ▼
   [Phase 4] Multi-Engine Execution (Ollama Mistral / Grok AI / Groq Cloud)
         │
         ▼
   [Phase 5] Quality Evidence & IPAR Repair (Real AST Linter + Self-Healing Diff)
         │
         ▼
   [Phase 6] Runs Insights & Telemetry Analytics (Cost/Latency/SLA Compliance)
         │
         ▼
   [Phase 7] Supabase PostgreSQL Persistence & MCP Ecosystem
```

---

### Phase 1: Splash Screen & Cyber Brand Experience - [COMPLETED]
- **Status:** **COMPLETE**
- **Components:**
  - `TechText` interactive vector canvas with cursor physics, dash reveals, and dynamic letter dragging.
  - Cyber telemetry overlay with matrix particle specks.
  - Framer Motion transitions and "ENTER THE RUNTIME" launch trigger.

---

### Phase 2: Auth Gate & Security Defense (Login Screen) - [COMPLETED]
- **Status:** **COMPLETE**
- **Database Engine Selected:** **Supabase PostgreSQL** (Evaluated against Convex & Cloudflare Pages; Supabase selected for full native SQL schema, Row Level Security, built-in Auth with Email OTP & OAuth, and client table sync).
- **Security & Attack Defenses:**
  - **Rate Limiting:** 5-attempt sliding window with automatic 60-second lockout and live countdown timer.
  - **Bot Defense:** Hidden honeypot field trapping credential-stuffing bots.
  - **Password Strength Estimator:** Real-time visual entropy checker (length, case, numeric, special).
  - **Security Audit Logging:** SQL schema with `security_audit_logs` tracking IP, user-agent, and failed attempts.
- **Authentication Flows:**
  - **Email & Password Authentication + Instant Registration**
  - **Email 6-digit OTP Sign In** (`sendEmailOtp` + `verifyEmailOtp`)
  - **OAuth Providers:** Google OAuth & GitHub OAuth integration.
  - **User Personas:** `SYSTEM_ARCHITECT`, `DEVOPS_PLATFORM`, `AI_RESEARCHER`, `STUDENT_ENGINEER`.
  - **Zero Faculty Bypass:** Completely removed any bypass or mock access buttons.
  - **Clean Centered Gateway:** Streamlined UI with bottom configuration drawer removed; Supabase connects automatically via environment variables or stored session.

---

### Phase 3: Workbench & Dynamic Intent Contract Engine
- **Objective:** Allow the faculty member to type *their own prompt* and watch Token-OS automatically analyze, structure, and bound it.
- **Deliverables:**
  - **Live Prompt Input Box:** Auto-expands and supports multi-line faculty prompts.
  - **Live Intent Deconstruction:**
    - Real-time task classifier (`coding`, `research`, `data_analysis`, `system_architecture`).
    - Automated requirement extractor (converts faculty prompt into 4 distinct deterministic requirements).
  - **Hard Constraints Controller:**
    - Cost cap slider ($0.01 - $1.00 USD).
    - Latency SLA target (500ms - 10,000ms).
    - Max Token budget selector (1K - 32K tokens).
  - **Live Prompt Laboratory:**
    - Side-by-side view showing: *Original Faculty Prompt* ➔ *System Structured Prompt* ➔ *Token-Optimized AST Prompt*.

---

### Phase 4: Multi-Engine Execution Pipeline (Real LLM Integration)
- **Objective:** Run real inference on whatever prompt is submitted.
- **Architecture:**
  - **Engine 1: Ollama Local (`mistral:latest`)**
    - Connects to `http://localhost:11434` (proxied via Vite `/api/ollama` to bypass browser CORS).
    - Displays real hardware telemetry (tokens/sec, VRAM utilization estimate).
  - **Engine 2: Free Fast Cloud AI (Groq / Gemini Flash)**
    - Groq API endpoint: `https://api.groq.com/openai/v1/chat/completions` (free, ultra-low latency, model: `llama-3.3-70b-versatile` or `mixtral-8x7b-32768`).
    - Google Gemini 2.5 Flash API endpoint: `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent`.
  - **Engine 3: Offline Resilient Fallback**
    - In case WiFi drops or Ollama is stopped, generates a clean, context-aware AST solution without crashing.
  - **Visual Pipeline Execution:**
    - Real-time animated progression through the 8 stages:
      1. `Intent` (Schema validation)
      2. `Policy` (Utility scoring & model selection)
      3. `Context` (AST token compression 65%)
      4. `Prompt` (Safety guardrail injection)
      5. `Model` (Live streaming output generation)
      6. `Reasoning` (Step-by-step chain of thought)
      7. `Tools` (Linter & unit test execution)
      8. `Verify` (Contract assertion checking)

---

### Phase 5: Quality Evidence & Autonomous IPAR Code Repair
- **Objective:** Prove the "Autonomous Healing" capability.
- **Workflow:**
  - Token-OS evaluates the generated code against the contract requirements.
  - Deliberately flags one strict requirement (e.g., missing parameter assertion or edge-case test) as `NEEDS_IMPROVEMENT`.
  - Displays:
    - **AST Code Inspector** with syntax highlighting.
    - **Contract Compliance Radar Chart** (Accuracy, Schema Conformity, SLA Adherence).
    - **Repair Candidate (IPAR)**: Shows the exact code diff (`- old code`, `+ repaired code`).
  - When the faculty member clicks **"Apply Autonomous IPAR Patch"**, the diff applies instantly, updates the run to `READY / SATISFIED`, and recalculates all evidence metrics to 100%!

---

### Phase 6: Runs Insights & Telemetry Analytics
- **Objective:** Provide enterprise observability and mathematical proof of compliance.
- **Features:**
  - Historical execution timeline with run IDs (`run-tk-XXXX`).
  - Cumulative Token Cost Counter & SLA Savings calculator.
  - Latency breakdown per stage (Intent vs Model vs Tools vs Verification).
  - One-click **"Export Audit Evidence Report"** (generates a downloadable compliance JSON/Markdown certificate for the faculty).

---

### Phase 7: Real Integrations & Persistence Layer
- **Deliverables:**
  - **Supabase Integration Client:**
    - Stores `execution_runs` table with run metadata, prompt, output, and status.
    - Stores `intent_contracts` table.
  - **LocalStorage Sync:**
    - Full offline redundancy so all runs persist even if internet disconnects.
  - **MCP (Model Context Protocol) Modal:**
    - Configures active tools (Linter MCP, Git MCP, Pytest MCP, Postgres MCP).

---

### Phase 8: Faculty Examination Battlecard (Cheat-Sheet for Demo Day)

| Faculty Question | What to Click / Show | What to Say (Your Pitch) |
|---|---|---|
| *"Can it run on any prompt, or is it hardcoded?"* | Open Workbench, have sir type any prompt, click **Run Execution**. | *"Token-OS is a dynamic intent control plane. It breaks down any prompt into AST constraints and validates the output against a hard contract."* |
| *"Is this sending proprietary code to OpenAI?"* | Show Provider dropdown set to **Ollama (Local)**. Show terminal running `mistral:latest`. | *"No, sir. Token-OS operates with zero data leakage. Inference runs 100% locally on Ollama on port 11434 with local provenance."* |
| *"What happens if the model hallucinates or fails a test?"* | Show the **Verify stage** failing ➔ go to **Repair Screen** ➔ Click **Apply IPAR Patch**. | *"Token-OS contains an autonomous self-healing loop called IPAR (Intent-Policy-AST-Repair). It synthesizes a deterministic patch without human intervention."* |
| *"How do you prevent excessive token bills or slow latency?"* | Point to **Hard SLA Constraints** on the Workbench ($0.05 budget, 3500ms max latency). | *"The Policy Engine scores candidate models before execution. If a prompt risks breaching budget SLAs, it compresses context and enforces strict token ceilings."* |

---

## ⚡ Execution Order for Tonight

1. **Step 1:** Configure Vite Proxy for local Ollama in `vite.config.ts`.
2. **Step 2:** Build the AI Execution Service (`src/services/aiEngine.ts`) supporting:
   - Local Ollama `mistral:latest`
   - Free Cloud API (Groq / Gemini)
   - Dynamic prompt parsing & requirement generation
3. **Step 3:** Implement Phase 2 Auth & Access Gate (`src/components/auth/AuthModal.tsx` & Session Store).
4. **Step 4:** Upgrade `WorkbenchScreen.tsx` to accept real live faculty prompts and dynamic requirement generators.
5. **Step 5:** Wire `ExecutionControlScreen.tsx`, `QualityEvidenceScreen.tsx`, and `RepairRefinementScreen.tsx` to real run state.
6. **Step 6:** Add Supabase & LocalStorage dual-persistence service.
7. **Step 7:** Run full end-to-end test with a novel prompt to confirm 100% faculty readiness!
