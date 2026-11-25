# TokenOS --- Intent-Preserving Adaptive Repair (IPAR) Research Protocol

## 1. Research Question & Hypothesis
**Question:** When an output fails one or more explicit user requirements, can a controller select the smallest justified repair that improves failed requirements while preserving already-correct requirements, at lower or equal cost than generic retry, full regeneration, or fixed model escalation?

**Hypothesis:** Requirement-aware repair achieves equal or superior accepted-result quality with fewer unnecessary retries, lower token/compute cost, and less collateral damage than fixed retry/full regeneration.

---

## 2. IPAR Execution Loop Algorithm

```
Step 1: Read and validate active IntentContract v(t).
Step 2: Evaluate Output O(t) across requirements R = {r_1, r_2, ..., r_n}.
        Status(r_i) ∈ {SATISFIED, FAILED, UNCERTAIN, UNSUPPORTED}.
Step 3: Generate candidate repair interventions A = {a_1, a_2, ..., a_k}:
        - Targeted patch / edit
        - Prompt modification / constraint reinforcement
        - Context expansion / retrieval tool injection
        - Model escalation / increased reasoning effort
        - Full regeneration
        - Ask user / Abstain
Step 4: Compute Utility for each candidate intervention a_j:
        Utility(a_j) = E[QualityGain] + E[ReqGain] + E[EvidenceGain]
                       - λ_c * Cost(a_j) - λ_l * Latency(a_j) 
                       - λ_r * Risk(a_j) - λ_d * CollateralDamage(a_j)
Step 5: Select action a* = argmax_a Utility(a) subject to Hard Budgets:
        Cost(a*) <= RemainingCostBudget
        Latency(a*) <= RemainingLatencyBudget
        Retries <= MaxRetryLimit
Step 6: Execute action a* and record actual outcome vs predicted E[outcome].
Step 7: Re-evaluate requirements. Stop if all pass, budget exhausted, or E[Utility] <= 0.
```

---

## 3. Evaluation Metrics & Baselines
- **Acceptance Rate (%):** Proportion of runs reaching `READY` status under budget.
- **Requirement Satisfaction Index (RSI):** Ratio of satisfied hard constraints.
- **Passed Requirement Preservation Rate (PRPR):** Percentage of initially passed requirements that remain passed after repair (measuring collateral damage).
- **Token & Cost Efficiency:** Total token expenditure compared to generic retry baselines.
- **Baselines to Beat:**
  1. Generic Fixed Retry (same prompt, same model).
  2. Full Regeneration (re-run entire pipeline from scratch).
  3. Fixed Model Escalation (immediately re-route to largest remote LLM).
