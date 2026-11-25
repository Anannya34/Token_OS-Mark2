"""
TOKEN-OS ML ENGINE: Isolation Forest Anomaly Detector & Token Regressor Training
Generates 1,200 telemetry runs, trains StandardScaler, IsolationForest, and RandomForestRegressor,
evaluates Precision/Recall/F1, and exports .joblib model artifacts.
"""

import os
import numpy as np
from sklearn.preprocessing import StandardScaler
from sklearn.ensemble import IsolationForest, RandomForestRegressor
from sklearn.metrics import precision_score, recall_score, f1_score
import joblib

FEATURE_NAMES = [
    'inputTokens',
    'outputTokens',
    'costUsd',
    'latencyMs',
    'retryCount',
    'toolFailures',
    'compressionRatio',
    'reqCount',
    'qualityScore'
]

def generate_telemetry_dataset(n_samples=1200, contamination=0.05, random_state=42):
    rng = np.random.RandomState(random_state)
    n_anomalies = int(n_samples * contamination)
    n_normals = n_samples - n_anomalies

    # 1. Normal Operational Traces
    normal_input = rng.normal(loc=350, scale=120, size=n_normals).clip(30, 900)
    normal_output = rng.normal(loc=550, scale=180, size=n_normals).clip(60, 1400)
    normal_cost = (normal_input + normal_output) * 0.000001 * rng.uniform(0.0, 1.5, size=n_normals)
    normal_latency = rng.normal(loc=850, scale=250, size=n_normals).clip(150, 2200)
    normal_retries = rng.choice([0, 1], size=n_normals, p=[0.92, 0.08])
    normal_tool_failures = rng.choice([0, 1], size=n_normals, p=[0.96, 0.04])
    normal_comp_ratio = rng.normal(loc=0.68, scale=0.08, size=n_normals).clip(0.40, 0.88)
    normal_req_count = rng.randint(1, 5, size=n_normals)
    normal_quality = rng.normal(loc=0.94, scale=0.05, size=n_normals).clip(0.80, 1.0)

    X_normal = np.column_stack([
        normal_input, normal_output, normal_cost, normal_latency,
        normal_retries, normal_tool_failures, normal_comp_ratio,
        normal_req_count, normal_quality
    ])
    y_normal = np.ones(n_normals)  # 1 for normal

    # 2. Synthetic Anomalous Traces (token spikes, latency loops, tool failures)
    anom_input = rng.choice([
        rng.uniform(3000, 9500), # extreme token spike
        rng.uniform(300, 600)
    ], size=n_anomalies)
    anom_output = rng.choice([
        rng.uniform(2500, 7000),
        rng.uniform(500, 1000)
    ], size=n_anomalies)
    anom_cost = rng.uniform(0.015, 0.095, size=n_anomalies)
    anom_latency = rng.choice([
        rng.uniform(6500, 18000), # extreme latency jitter
        rng.uniform(500, 1200)
    ], size=n_anomalies)
    anom_retries = rng.randint(2, 5, size=n_anomalies)
    anom_tool_failures = rng.randint(2, 6, size=n_anomalies)
    anom_comp_ratio = rng.uniform(0.10, 0.35, size=n_anomalies)
    anom_req_count = rng.randint(4, 10, size=n_anomalies)
    anom_quality = rng.uniform(0.15, 0.60, size=n_anomalies)

    X_anom = np.column_stack([
        anom_input, anom_output, anom_cost, anom_latency,
        anom_retries, anom_tool_failures, anom_comp_ratio,
        anom_req_count, anom_quality
    ])
    y_anom = -np.ones(n_anomalies)  # -1 for anomaly

    X = np.vstack([X_normal, X_anom])
    y = np.concatenate([y_normal, y_anom])

    # Shuffle
    shuffle_idx = rng.permutation(len(X))
    return X[shuffle_idx], y[shuffle_idx]

def train_and_export():
    print("=" * 60)
    print("TOKEN-OS TIER 2 ML ENGINE TRAINING SUITE")
    print("=" * 60)

    X, y = generate_telemetry_dataset(n_samples=1200, contamination=0.05, random_state=42)
    print(f"Generated {len(X)} telemetry traces (9 features each).")

    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X)

    # 1. Train Isolation Forest
    iso_forest = IsolationForest(
        n_estimators=100,
        contamination=0.05,
        random_state=42,
        n_jobs=-1
    )
    iso_forest.fit(X_scaled)
    preds = iso_forest.predict(X_scaled)

    # Evaluate Isolation Forest
    prec = precision_score(y, preds, pos_label=-1)
    rec = recall_score(y, preds, pos_label=-1)
    f1 = f1_score(y, preds, pos_label=-1)

    print("\n--- Isolation Forest Anomaly Detection Performance ---")
    print(f"  Precision: {prec:.4f}")
    print(f"  Recall:    {rec:.4f}")
    print(f"  F1-Score:  {f1:.4f}")

    # 2. Train Random Forest Regressor for Token Growth Forecasting
    y_tokens = X[:, 0] + X[:, 1]  # inputTokens + outputTokens
    rf_regressor = RandomForestRegressor(n_estimators=50, random_state=42)
    rf_regressor.fit(X[:, [0, 6, 7]], y_tokens)
    print("\n--- Random Forest Token Regressor Performance ---")
    print(f"  R2 Score:  {rf_regressor.score(X[:, [0, 6, 7]], y_tokens):.4f}")

    # Save artifacts
    models_dir = os.path.join(os.path.dirname(__file__), 'models')
    os.makedirs(models_dir, exist_ok=True)

    joblib.dump(scaler, os.path.join(models_dir, 'scaler.joblib'))
    joblib.dump(iso_forest, os.path.join(models_dir, 'isolation_forest.joblib'))
    joblib.dump(rf_regressor, os.path.join(models_dir, 'rf_regressor.joblib'))

    print(f"\nModel artifacts successfully saved to: {models_dir}")
    print("Files created:")
    print("  - scaler.joblib")
    print("  - isolation_forest.joblib")
    print("  - rf_regressor.joblib")
    print("=" * 60)

if __name__ == '__main__':
    train_and_export()
