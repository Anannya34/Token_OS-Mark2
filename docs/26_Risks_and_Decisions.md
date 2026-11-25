# TokenOS --- Architecture Decisions & Open Risks (ADR)

## 1. Open Decisions Matrix

| ID | Topic | Options | Recommendation | Trade-offs | Blocking Status |
|---|---|---|---|---|---|
| **ADR-01** | First Local Runtime | Ollama vs LM Studio vs vLLM | **Ollama** | Lightweight, zero-config local setup; model list dynamically fetched. | Resolved (P0) |
| **ADR-02** | First MVP Task Type | Text/Coding vs Image/Video | **Text / Structured Output** | Deterministic schema validation and clear IPAR repair verification. | Resolved (P0) |
| **ADR-03** | Live Telemetry Stream | SSE vs WebSockets | **SSE (Server-Sent Events)** | Simpler, stateless server push, native browser reconnection, lower overhead. | Resolved (P0) |
| **ADR-04** | ML Anomaly Model | Isolation Forest vs Autoencoder | **Isolation Forest** | Works on small datasets without huge compute; easy feature attribution. | Resolved (P1) |
| **ADR-05** | Remote Provider Key Storage | Local DB vs Env / Secrets Manager | **Environment Variables / Secrets Boundary** | Zero plain-text keys in frontend/git; total isolation. | Resolved (P0) |

---

## 2. Risk Register

1. **Non-deterministic Provider Telemetry:**
   - *Risk:* Local LLMs may report token counts inconsistently.
   - *Mitigation:* Explicit provenance tags (`provider_reported`, `measured_locally`, `estimated`).
2. **Infinite Repair Loop / Runaway Spending:**
   - *Risk:* IPAR loop could endlessly attempt fixes on impossible constraints.
   - *Mitigation:* Hard budgets enforced at Policy Engine level (Max retries, Max budget \$).
3. **SSRF via Local Inference Endpoints:**
   - *Risk:* User-entered provider URL could ping unauthorized internal networks.
   - *Mitigation:* Strict endpoint URL validation and whitelist filtering.
