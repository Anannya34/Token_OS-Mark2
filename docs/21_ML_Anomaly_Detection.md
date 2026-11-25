# TokenOS --- ML Operational Anomaly Detection Specification (Track A)

## 1. Goal & Scope
Track A flags unusual operational behavior in TokenOS execution streams: token spikes, latency anomalies, repeated MCP tool failures, abnormal retries, cost deviations, and quality drops.

---

## 2. Feature Vector Schema
For each execution run $i$, the anomaly detector extracts feature vector $\mathbf{x}_i$:
- $x_1$: Total input tokens
- $x_2$: Total output tokens
- $x_3$: Measured cost (\$)
- $x_4$: Latency (seconds)
- $x_5$: Retry count
- $x_6$: Tool call failure count
- $x_7$: Reasoning duration ratio
- $x_8$: Context compression ratio
- $x_9$: Rolling baseline deviation score (Z-score over last 50 runs)

---

## 3. Staged Model Lifecycle

### Stage 1: Statistical Threshold Baseline (P0)
- Rule-based detection using moving Z-score ($\mu \pm 3\sigma$) on token count, cost, and latency.

### Stage 2: Isolation Forest Model (P1 Baseline)
- Scikit-learn `IsolationForest(n_estimators=100, contamination=0.05, random_state=42)`.
- Fitted strictly on historical clean execution runs.
- Output: Anomaly score $[-1, 1]$ mapped to probability $[0, 1]$.

### Stage 3: Autoencoder / ANN (P2 - Conditional)
- **Promotion Gate:** Neural net autoencoder will only be trained/deployed if dataset exceeds 10,000 runs AND beats Isolation Forest baseline on human-reviewed test set PR-AUC by >= 15%.

---

## 4. Evaluation Metrics & Human Review
- Metrics: Precision, Recall, F1-score, PR-AUC, False Positive Rate (FPR), Detection Latency.
- **Human Review UI:** Anomaly events are flagged in Runs & Insights with explicit feature attribution (Shapley value explanations) for developer confirmation/dismissal.
