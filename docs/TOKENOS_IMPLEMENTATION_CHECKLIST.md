# TokenOS Implementation Checklist

## 1. Repository & Project Setup
- [x] Inspect workspace and determine stack (Vite + React + TypeScript + TailwindCSS / Lucide icons)
- [x] Create `TOKENOS_IMPLEMENTATION_CHECKLIST.md`
- [x] Initialize React + TypeScript application shell with Vite
- [x] Install dependencies (`lucide-react`, `clsx`, `tailwind-merge`, `tailwindcss`, `autoprefixer`, `postcss`, `vitest`)

## 2. Design Tokens & Theme (Slate Grey + Dark Orange)
- [x] Configure Tailwind / CSS variables for `--bg-app` (`#20252B`), `--bg-deep` (`#181D22`), `--surface` (`#292F36`), `--surface-elevated` (`#323941`), `--border` (`#414A54`), `--text-primary` (`#F2F4F5`), `--text-secondary` (`#B3BBC3`), `--text-muted` (`#87919B`), `--accent` (`#C7652B`), `--accent-hover` (`#E17A3F`), `--accent-tint`, `--success` (`#45B987`), `--warning` (`#E4AD4D`), `--error` (`#E66A68`), `--info` (`#6BA7D9`)
- [x] Configure typography (`Inter` + `JetBrains Mono`)
- [x] Configure 4px grid spacing, radii (6px, 10px, 14px, full), and focus rings (2px accent)

## 3. Application Shell
- [x] Persistent collapsible left sidebar (240px -> 64px rail) with TokenOS logo, nav links, active accent border/tint, user/settings
- [x] Header with title, description, `DEMO MODE` / `LIVE` badge, provider status, help, user menu
- [x] Navigation routing for 7 exact named screens:
  1. Overview
  2. Understand Request
  3. Optimize Request
  4. AI Execution
  5. Check Answer
  6. Improve Answer
  7. Execution History

## 4. Shared Components
- [x] Button (Primary orange, Secondary, Ghost, Danger)
- [x] StatusBadge (`DEMO`, `LIVE`, `Estimated`, `Provider-reported`, `Unavailable`)
- [x] MetricCard & Card
- [x] DataTable (sticky header, sortable, filterable, row hover, selected row tint)
- [x] Tabs (underline, active accent)
- [x] Drawer & Modal (14px radius, subtle shadow)
- [x] Tooltip & Toast ("Contract approved", etc.)
- [x] EmptyState, Skeleton & ErrorState
- [x] PipelineStepper (Intent → Policy → Context → Model → Reasoning → Tools → Verify)
- [x] DiffView (original vs optimized, v1 vs v2)
- [x] ChecklistItem (met, partial, not met, not evaluated)
- [x] CodeBlock (mono, copy button) & ProvenanceNote

## 5. Screen Implementation
- [x] **Overview Screen**: landing workspace, summary cards, recent runs, activity feed, "How TokenOS works" guide, connection status, demo scenario launcher
- [x] **Understand Request Screen**: intent contract extraction, editable fields, ambiguity clarification questions, assumption badges, schema validation
- [x] **Optimize Request Screen**: prompt comparison (original vs optimized), controls (concise/balanced/detailed, format), token estimate (`Estimated`), prompt-quality checklist
- [x] **AI Execution Screen**: request preview, provider/model selector, execution policy, budget, context & tools, interactive pipeline execution step-by-step, usage/trace display
- [x] **Check Answer Screen**: answer viewer, contract success criteria checklist (met, partial, not met), evidence panel, quality dimensions, severe findings with deterministic vs model-based badges
- [x] **Improve Answer Screen**: repair plan, Value of Iteration panel (expected gain, cost/tokens, risk, recommendation, rationale), bounded iteration counter, before/after diff, re-check flow
- [x] **Execution History Screen**: searchable/filterable table of runs, detail modal/view with tabs (Contract, Prompts, Config, Pipeline, Tools, Answers, Findings, Provenance, Errors)

## 6. Data Model & State Management
- [x] Define types for `Run`, `RequestDraft`, `IntentContract`, `PromptVersion`, `ExecutionConfig`, `ExecutionEvent`, `AnswerVersion`, `VerificationReport`, `UsageRecord`, `ToolCallRecord`
- [x] Reactive state store with persistent local storage and demo fixture state

## 7. Demo Scenario (Ambiguous Sales Request E2E Journey)
- [x] Pre-fill request: "Look at these sales numbers, tell me what changed, and make a useful summary for my team."
- [x] Synthetic sales table (August/September 1600K total, regional shifts)
- [x] Understand: assumption "compare September to August, month over month"
- [x] Optimize: output structure requiring all 4 regions, total change, token estimate (~1,284)
- [x] Execute: demo model profile execution, pipeline trace, Answer v1 (flawed: claims overall growth, omits South/West, invents campaign)
- [x] Check: 3 findings (total change not met, regions missing not met, unsupported campaign claim not met)
- [x] Improve: recommendation IMPROVE, bounded iteration 1, produces Answer v2 (accurate regional shift & flat total, no invented campaign), re-check all criteria MET
- [x] History: saved run with full decision trace & provenance matching exact prompt numbers

## 8. Quality, Accessibility & Verification
- [x] Keyboard navigation, 2px focus ring, ARIA attributes, AA contrast
- [x] Responsive layouts (desktop, tablet, mobile off-canvas nav)
- [x] Smoke test suite validating all 7 screens and end-to-end demo flow
- [x] Linting and TypeScript typechecking pass with 0 errors
