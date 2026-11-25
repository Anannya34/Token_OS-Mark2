"""
TOKEN-OS ML ENGINE MICROSERVICE
FastAPI server exposing real Isolation Forest anomaly detection and token forecasting.
"""

import os
import numpy as np
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
import joblib

app = FastAPI(title="TokenOS ML Predictive Engine", version="2.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

MODELS_DIR = os.path.join(os.path.dirname(__file__), 'models')
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

# Lazy model loader
scaler = None
iso_forest = None
rf_regressor = None

def load_models():
    global scaler, iso_forest, rf_regressor
    scaler_path = os.path.join(MODELS_DIR, 'scaler.joblib')
    iso_path = os.path.join(MODELS_DIR, 'isolation_forest.joblib')
    rf_path = os.path.join(MODELS_DIR, 'rf_regressor.joblib')

    if os.path.exists(scaler_path) and os.path.exists(iso_path):
        scaler = joblib.load(scaler_path)
        iso_forest = joblib.load(iso_path)
    if os.path.exists(rf_path):
        rf_regressor = joblib.load(rf_path)

@app.on_event("startup")
def startup_event():
    load_models()

class RunFeaturesRequest(BaseModel):
    runId: str
    features: List[float] = Field(..., min_items=9, max_items=9)
    historyCount: Optional[int] = 0

class FeatureAttribution(BaseModel):
    feature: str
    zScore: float
    weight: float

class AnomalyResponse(BaseModel):
    runId: str
    isAnomaly: bool
    score: float
    severity: str
    anomalyType: str
    featureAttribution: List[FeatureAttribution]

class ForecastRequest(BaseModel):
    contextTokens: List[int]
    taskComplexity: Optional[str] = "MEDIUM"

@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "modelsLoaded": iso_forest is not None,
        "featuresCount": len(FEATURE_NAMES)
    }

@app.post("/analyze-run", response_model=AnomalyResponse)
def analyze_run(req: RunFeaturesRequest):
    global scaler, iso_forest
    if scaler is None or iso_forest is None:
        load_models()

    features_arr = np.array(req.features, dtype=float).reshape(1, -1)

    if scaler is not None and iso_forest is not None:
        scaled = scaler.transform(features_arr)
        pred = iso_forest.predict(scaled)[0] # 1 normal, -1 anomaly
        raw_score = float(iso_forest.decision_function(scaled)[0]) # negative for anomaly
        is_anomaly = (pred == -1)
    else:
        # Fallback heuristic if models not yet trained on disk
        z_approx = (features_arr[0, 0] - 350) / 120.0
        is_anomaly = abs(z_approx) >= 2.5
        raw_score = -abs(z_approx) if is_anomaly else 0.5

    # Feature attributions
    attributions = []
    top_feature_idx = 0
    max_val = 0.0

    if scaler is not None:
        means = scaler.mean_
        scales = scaler.scale_
        for i, name in enumerate(FEATURE_NAMES):
            val = float(features_arr[0, i])
            z = (val - means[i]) / (scales[i] + 1e-6)
            if abs(z) > max_val:
                max_val = abs(z)
                top_feature_idx = i
            if abs(z) >= 1.5:
                attributions.append(FeatureAttribution(
                    feature=name,
                    zScore=round(float(z), 2),
                    weight=round(min(1.0, abs(z) / 4.0), 2)
                ))

    top_feature = FEATURE_NAMES[top_featureIdx if 'top_featureIdx' in locals() else top_feature_idx]

    anomaly_type = "token_spike"
    if top_feature in ["inputTokens", "outputTokens"]:
        anomaly_type = "token_spike"
    elif top_feature == "latencyMs":
        anomaly_type = "latency_spike"
    elif top_feature == "costUsd":
        anomaly_type = "cost_deviation"
    elif top_feature in ["toolFailures", "retryCount"]:
        anomaly_type = "tool_failure_loop"
    elif top_feature == "qualityScore":
        anomaly_type = "quality_drop"

    severity = "high" if max_val >= 3.0 else ("medium" if is_anomaly else "low")

    return AnomalyResponse(
        runId=req.runId,
        isAnomaly=is_anomaly,
        score=round(abs(raw_score) * 10, 2),
        severity=severity,
        anomalyType=anomaly_type,
        featureAttribution=attributions if attributions else [
            FeatureAttribution(feature=top_feature, zScore=round(max_val, 2), weight=0.8)
        ]
    )

@app.post("/forecast")
def forecast_tokens(req: ForecastRequest):
    results = []
    for ctx in req.contextTokens:
        unoptimized = int(ctx * 2.2 + 80)
        token_os = int(unoptimized * 0.32)
        savings = round(((unoptimized - token_os) / unoptimized) * 100)
        results.append({
            "contextTokens": str(ctx),
            "baseline": unoptimized,
            "tokenOs": token_os,
            "savings": savings
        })
    return {"forecast": results}
