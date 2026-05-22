"""
FairAI Dashboard — FastAPI Backend
AI Fairness Evaluation Platform
"""

import io
import uuid
from typing import Dict

import pandas as pd
from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware

from model_utils import run_llm_analysis, run_ml_analysis, run_predictions_analysis
from schemas import AnalyzeLLMRequest, AnalyzeMLRequest, AnalyzePredictionsRequest

# ── App ────────────────────────────────────────────────────────────────────────

app = FastAPI(
    title="FairAI Dashboard API",
    description="AI Fairness Evaluation Platform — Classical ML, LLM, and Prediction analysis",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── In-memory dataset store ────────────────────────────────────────────────────

_datasets: Dict[str, pd.DataFrame] = {}
MAX_PREVIEW_ROWS = 10
MAX_UPLOAD_MB = 50


# ── Health ─────────────────────────────────────────────────────────────────────

@app.get("/api/health", tags=["System"])
def health():
    """Health check endpoint."""
    return {"status": "ok", "version": "1.0.0"}


# ── Upload ─────────────────────────────────────────────────────────────────────

@app.post("/api/upload", tags=["Dataset"])
async def upload(file: UploadFile = File(...)):
    """
    Upload a CSV dataset. Returns dataset_id, preview, column info.
    Max size: 50 MB.
    """
    if not file.filename or not file.filename.lower().endswith(".csv"):
        raise HTTPException(400, "Only CSV files are supported.")

    content = await file.read()
    if len(content) > MAX_UPLOAD_MB * 1024 * 1024:
        raise HTTPException(413, f"File exceeds {MAX_UPLOAD_MB} MB limit.")

    try:
        df = pd.read_csv(io.BytesIO(content))
    except Exception as e:
        raise HTTPException(400, f"Failed to parse CSV: {e}")

    if df.empty:
        raise HTTPException(400, "Uploaded CSV is empty.")

    dataset_id = str(uuid.uuid4())
    _datasets[dataset_id] = df

    # Column type categorisation
    numeric_cols = df.select_dtypes(include="number").columns.tolist()
    categorical_cols = df.select_dtypes(exclude="number").columns.tolist()

    # Value counts for quick EDA
    col_stats = {}
    for col in df.columns:
        col_stats[col] = {
            "dtype": str(df[col].dtype),
            "nulls": int(df[col].isna().sum()),
            "unique": int(df[col].nunique()),
            "sample": df[col].dropna().head(3).astype(str).tolist(),
        }

    return {
        "dataset_id": dataset_id,
        "filename": file.filename,
        "rows": len(df),
        "columns": list(df.columns),
        "numeric_columns": numeric_cols,
        "categorical_columns": categorical_cols,
        "col_stats": col_stats,
        "preview": df.head(MAX_PREVIEW_ROWS).fillna("").astype(str).to_dict(orient="records"),
    }


# ── Columns ────────────────────────────────────────────────────────────────────

@app.get("/api/columns/{dataset_id}", tags=["Dataset"])
def get_columns(dataset_id: str):
    """Return column metadata for a previously uploaded dataset."""
    if dataset_id not in _datasets:
        raise HTTPException(404, "Dataset not found. Please re-upload.")
    df = _datasets[dataset_id]
    return {
        "columns": list(df.columns),
        "numeric_columns": df.select_dtypes(include="number").columns.tolist(),
        "categorical_columns": df.select_dtypes(exclude="number").columns.tolist(),
        "dtypes": {c: str(t) for c, t in df.dtypes.items()},
    }


# ── Analysis: Classical ML ─────────────────────────────────────────────────────

@app.post("/api/analyze/ml", tags=["Analysis"])
def analyze_ml(req: AnalyzeMLRequest):
    """
    Train and evaluate ML classifiers (LR, RF, XGBoost).
    Returns performance + fairness metrics + group-level analysis.
    """
    if req.dataset_id not in _datasets:
        raise HTTPException(404, "Dataset not found. Please re-upload.")
    if req.target_column not in _datasets[req.dataset_id].columns:
        raise HTTPException(400, f"Target column '{req.target_column}' not found.")
    if req.protected_attribute not in _datasets[req.dataset_id].columns:
        raise HTTPException(400, f"Protected column '{req.protected_attribute}' not found.")
    if not req.models:
        raise HTTPException(400, "Select at least one model.")

    try:
        return run_ml_analysis(_datasets[req.dataset_id], req)
    except Exception as e:
        raise HTTPException(500, f"Analysis failed: {e}")


# ── Analysis: Existing Predictions ────────────────────────────────────────────

@app.post("/api/analyze/predictions", tags=["Analysis"])
def analyze_predictions(req: AnalyzePredictionsRequest):
    """
    Evaluate a pre-existing prediction column for performance and fairness.
    """
    if req.dataset_id not in _datasets:
        raise HTTPException(404, "Dataset not found. Please re-upload.")
    df = _datasets[req.dataset_id]
    for col in (req.target_column, req.prediction_column, req.protected_attribute):
        if col not in df.columns:
            raise HTTPException(400, f"Column '{col}' not found in dataset.")

    try:
        return run_predictions_analysis(df, req)
    except Exception as e:
        raise HTTPException(500, f"Analysis failed: {e}")


# ── Analysis: LLM Fairness ────────────────────────────────────────────────────

@app.post("/api/analyze/llm", tags=["Analysis"])
def analyze_llm(req: AnalyzeLLMRequest):
    """
    Evaluate multiple LLM prediction columns for performance and fairness.
    Expects columns like: true_label, FLAN_small, FLAN_base, TinyLlama, SEX, RAC1P
    """
    if req.dataset_id not in _datasets:
        raise HTTPException(404, "Dataset not found. Please re-upload.")
    df = _datasets[req.dataset_id]
    if req.target_column not in df.columns:
        raise HTTPException(400, f"Target column '{req.target_column}' not found.")
    if req.protected_attribute not in df.columns:
        raise HTTPException(400, f"Protected column '{req.protected_attribute}' not found.")
    missing = [c for c in req.prediction_columns if c not in df.columns]
    if missing:
        raise HTTPException(400, f"Prediction columns not found: {missing}")

    try:
        return run_llm_analysis(df, req)
    except Exception as e:
        raise HTTPException(500, f"Analysis failed: {e}")
