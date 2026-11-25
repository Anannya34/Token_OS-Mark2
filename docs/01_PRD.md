# TokenOS --- Product Requirements Document (PRD)

## 1. Executive Summary & Intent Alignment
TokenOS is an **Intent-Aware AI Execution Control Plane**. Unlike simple model routers, prompt optimizers, or context compressors, TokenOS governs intent interpretation, prompts, context, models, reasoning effort, tools, verification, and refinement under explicit quality, cost, latency, token, credit, privacy, and risk constraints.

### Core Philosophy
> Do not always compress. Do not always retrieve. Do not always use the strongest model. Do not always retry. Decide per request based on intent, evidence, expected improvement, risk, and cost.

---

## 2. Five Primary Navigation Destinations

1. **Workbench**
   - Define task objective, type (text, coding, research, data analysis, image, video, writing).
   - Compile & edit Intent Contract: hard constraints, soft preferences, forbidden outcomes, confidence threshold.
   - Prompt Laboratory: original, analyzed, structured, optimized prompt with diff view.
   - Provider preference, privacy restrictions, budget limits (tokens, cost, latency, retries).

2. **Execution Control**
   - Real-time pipeline visualizer: **Intent → Policy → Context → Prompt → Model → Reasoning → Tools → Verify**.
   - Event stream (SSE/WebSocket): status, duration, provider selected, reason for selection.
   - Candidate actions score table, selected policy action, and concise rationale.
   - Real backend events drive UI (states: `idle`, `active`, `completed`, `failed`, `skipped`, `blocked`, `retrying`, `cancelled`).

3. **Quality & Evidence**
   - Requirement-by-requirement verification pass/fail/uncertain ledger.
   - Evidence ledger linked to claims: `VERIFIED`, `SUPPORTED`, `INFERRED`, `ASSUMED`, `UNVERIFIED`, `CONTRADICTED`.
   - Deterministic schema checks vs. LLM-as-judge scores vs. human annotations.
   - Final status evaluation: `READY`, `NEEDS_IMPROVEMENT`, `ABSTAIN`.

4. **Repair & Refinement (IPAR)**
   - Targeted repair controller enforcing requirement-level diagnosis.
   - Comparison of targeted patch vs. full regeneration to prevent collateral damage.
   - Predicted benefit vs. cost/latency/risk/collateral damage evaluation.
   - Before/after output diff with explicit stop conditions.

5. **Runs & Insights**
   - Historical observability, searchable execution traces, versioned intent/prompt/policy links.
   - Policy benchmarking, cost/quality Pareto frontier visualization.
   - Operational anomaly event logs and reproducibility export.

---

## 3. Seven Canonical Technical Modules Mapping
- **Command Center** ➔ Integrated overview widgets within Runs & Insights.
- **Intent Contract** ➔ Workbench core editor.
- **Prompt Laboratory** ➔ Workbench prompt analysis panel.
- **Execution Control** ➔ Primary screen #2.
- **Hallucination Firewall** ➔ Quality & Evidence verification core.
- **Refinement Loop** ➔ Repair & Refinement primary screen #4.
- **MCP Control Center** ➔ Integrations panel & Execution Control subpanel.

---

## 4. MVP Acceptance Criteria
1. Configure a real local inference endpoint (Ollama / Local OpenAI-compatible).
2. Create and edit an Intent Contract with explicit hard constraints.
3. Run execution under deterministic policy baseline.
4. Stream truthful execution trace over SSE without fake telemetry.
5. Perform requirement-level evaluation and display evidence ledger.
6. Trigger IPAR targeted repair recommendation on failure.
7. Persist run and trace in database with usage provenance.
8. Zero plain-text API secrets exposed in frontend or Git.
