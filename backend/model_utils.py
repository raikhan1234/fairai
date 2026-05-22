"""
FairAI — model training and direct prediction evaluation.

Key guarantees:
- Protected attribute is ALWAYS kept as str, never cast to int.
- y_true / y_pred are always validated to be strictly binary {0, 1}.
- LLM / Predictions analysis never touches the full dataframe (no median on strings).
- ML preprocess uses separate imputers for numeric vs. categorical columns.
"""

import numpy as np
import pandas as pd
from typing import Any, Dict, List, Tuple

from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score

from fairness_utils import compute_fairness_metrics, compute_group_analysis, bias_level, recommendation
from schemas import AnalyzeMLRequest, AnalyzePredictionsRequest, AnalyzeLLMRequest

MODEL_DISPLAY = {
    "logistic_regression": "Logistic Regression",
    "random_forest": "Random Forest",
    "xgboost": "XGBoost",
}


def _safe_float(v) -> float:
    return round(float(v), 6)


# ── Binary conversion + validation ────────────────────────────────────────────

def _to_binary(series: pd.Series, col_name: str = "column") -> np.ndarray:
    """
    Convert a pandas Series to a strictly binary (0/1) int numpy array.

    Accepts:
      - int/float columns with values 0 or 1 (including 0.0/1.0)
      - string columns with values "0" or "1"

    Raises ValueError with a clear message if any value is outside {0, 1}.
    Always returns a plain numpy array (never pyarrow-backed).
    """
    numeric = pd.to_numeric(series, errors="coerce")
    if numeric.isna().any():
        # Non-numeric strings — accept only "0" / "1"
        cleaned = series.astype(str).str.strip()
        if not cleaned.isin(["0", "1"]).all():
            bad = sorted(set(cleaned[~cleaned.isin(["0", "1"])].tolist()))[:5]
            raise ValueError(
                f"Column '{col_name}' must contain only 0/1 values. "
                f"Found non-binary values: {bad}. "
                f"Select the correct target or prediction column."
            )
        return np.array(cleaned.tolist(), dtype=int)

    arr_int = numeric.fillna(0).astype(int)
    unique = set(arr_int.tolist())
    if not unique.issubset({0, 1}):
        bad = sorted(unique - {0, 1})[:5]
        raise ValueError(
            f"Column '{col_name}' must contain only 0/1 values. "
            f"Found: {bad}. "
            f"Make sure you selected the correct column (not ID, SEX, or RAC1P)."
        )
    # Force plain numpy — avoids pyarrow-backed Series on newer pandas
    return np.array(arr_int.tolist(), dtype=int)


def _as_protected(series: pd.Series) -> np.ndarray:
    """Keep protected attribute as plain numpy str array — never cast to int."""
    return np.array(series.fillna("unknown").astype(str).tolist(), dtype=str)


# ── Performance metrics ────────────────────────────────────────────────────────

def perf_metrics(y_true: np.ndarray, y_pred: np.ndarray) -> Dict[str, float]:
    return {
        "accuracy": _safe_float(accuracy_score(y_true, y_pred)),
        "precision": _safe_float(precision_score(y_true, y_pred, zero_division=0)),
        "recall": _safe_float(recall_score(y_true, y_pred, zero_division=0)),
        "f1": _safe_float(f1_score(y_true, y_pred, zero_division=0)),
    }


# ── ML model map ───────────────────────────────────────────────────────────────

def _build_model_map(random_state: int) -> Dict[str, Any]:
    models: Dict[str, Any] = {
        "logistic_regression": LogisticRegression(max_iter=1000, random_state=random_state),
        "random_forest": RandomForestClassifier(n_estimators=100, random_state=random_state, n_jobs=-1),
    }
    try:
        from xgboost import XGBClassifier
        models["xgboost"] = XGBClassifier(
            random_state=random_state,
            eval_metric="logloss",
            use_label_encoder=False,
            verbosity=0,
        )
    except Exception:
        pass
    return models


# ── ML preprocessing ───────────────────────────────────────────────────────────

def preprocess(
    df: pd.DataFrame,
    target_col: str,
    protected_col: str,
) -> Tuple[np.ndarray, np.ndarray, np.ndarray, List[str]]:
    df = df.copy()

    # Target — binary, validated
    y = _to_binary(df[target_col], target_col)

    # Protected — always string, never int
    protected = _as_protected(df[protected_col])

    # Feature columns: everything except target and protected
    feature_cols = [c for c in df.columns if c not in (target_col, protected_col)]
    if not feature_cols:
        raise ValueError(
            f"No feature columns remain after excluding '{target_col}' and '{protected_col}'. "
            "Add more columns or choose different target/protected columns."
        )

    X = df[feature_cols].copy()

    # Separate numeric and categorical — never apply median to string columns
    num_cols = X.select_dtypes(include="number").columns.tolist()
    cat_cols = X.select_dtypes(exclude="number").columns.tolist()

    # Use pandas directly (avoids pyarrow-backed array issues with SimpleImputer)
    for col in num_cols:
        X[col] = pd.to_numeric(X[col], errors="coerce")
        X[col] = X[col].fillna(float(X[col].median()))

    for col in cat_cols:
        X[col] = X[col].astype(str).fillna("unknown")
        mode = X[col].mode()
        X[col] = X[col].fillna(mode.iloc[0] if len(mode) > 0 else "unknown")
        le = LabelEncoder()
        X[col] = le.fit_transform(X[col].astype(str))

    # Force plain numpy array — avoids pyarrow indexing errors in train_test_split
    return np.array(X, dtype=float), y, protected, feature_cols


# ── Classical ML analysis ──────────────────────────────────────────────────────

def run_ml_analysis(df: pd.DataFrame, req: AnalyzeMLRequest) -> Dict:
    X, y, protected, feature_cols = preprocess(df, req.target_column, req.protected_attribute)

    X_train, X_test, y_train, y_test, prot_train, prot_test = train_test_split(
        X, y, protected,
        test_size=req.test_size,
        random_state=req.random_state,
        stratify=y if len(np.unique(y)) == 2 else None,
    )

    model_map = _build_model_map(req.random_state)
    results = []
    best_model_name = None
    best_accuracy = -1.0

    for model_key in req.models:
        if model_key not in model_map:
            continue
        clf = model_map[model_key]
        clf.fit(X_train, y_train)
        y_pred = clf.predict(X_test)

        perf = perf_metrics(y_test, y_pred)
        fairness = compute_fairness_metrics(y_test, y_pred, prot_test)
        groups = compute_group_analysis(y_test, y_pred, prot_test)
        bl = bias_level(fairness["dp_diff"])
        rec = recommendation(fairness["dp_diff"], MODEL_DISPLAY.get(model_key, model_key))

        if perf["accuracy"] > best_accuracy:
            best_accuracy = perf["accuracy"]
            best_model_name = model_key

        results.append({
            "model": model_key,
            "display_name": MODEL_DISPLAY.get(model_key, model_key),
            "performance": perf,
            "fairness": fairness,
            "bias_level": bl,
            "recommendation": rec,
            "group_analysis": groups,
        })

    tradeoff = [
        {
            "model": r["display_name"],
            "accuracy": r["performance"]["accuracy"],
            "dp_diff": r["fairness"]["dp_diff"],
            "f1": r["performance"]["f1"],
        }
        for r in results
    ]

    return {
        "results": results,
        "best_model": best_model_name,
        "best_display_name": MODEL_DISPLAY.get(best_model_name or "", best_model_name or ""),
        "tradeoff_data": tradeoff,
        "feature_columns": feature_cols,
        "test_size": int(len(y_test)),
        "train_size": int(len(y_train)),
    }


# ── Existing predictions analysis ─────────────────────────────────────────────

def run_predictions_analysis(df: pd.DataFrame, req: AnalyzePredictionsRequest) -> Dict:
    """
    Direct evaluation — no model training, no full-dataframe preprocessing.
    Only the 3 needed columns are used.
    """
    # Drop rows where any of the 3 key columns is null, then work on clean subset
    needed = [req.target_column, req.prediction_column, req.protected_attribute]
    sub = df[needed].dropna().reset_index(drop=True)

    y_true = _to_binary(sub[req.target_column], req.target_column)
    y_pred = _to_binary(sub[req.prediction_column], req.prediction_column)
    protected = _as_protected(sub[req.protected_attribute])

    perf = perf_metrics(y_true, y_pred)
    fairness = compute_fairness_metrics(y_true, y_pred, protected)
    groups = compute_group_analysis(y_true, y_pred, protected)
    bl = bias_level(fairness["dp_diff"])
    rec = recommendation(fairness["dp_diff"], req.prediction_column)

    return {
        "model": req.prediction_column,
        "display_name": req.prediction_column,
        "performance": perf,
        "fairness": fairness,
        "bias_level": bl,
        "recommendation": rec,
        "group_analysis": groups,
        "total_records": int(len(y_true)),
    }


# ── LLM fairness analysis ──────────────────────────────────────────────────────

def run_llm_analysis(df: pd.DataFrame, req: AnalyzeLLMRequest) -> Dict:
    """
    Direct evaluation of multiple prediction columns — no model training,
    no full-dataframe preprocessing, no median on strings.
    """
    # Base columns always needed
    base_cols = [req.target_column, req.protected_attribute] + list(req.prediction_columns)
    existing = [c for c in base_cols if c in df.columns]
    sub = df[existing].dropna(subset=[req.target_column, req.protected_attribute]).reset_index(drop=True)

    y_true = _to_binary(sub[req.target_column], req.target_column)
    protected = _as_protected(sub[req.protected_attribute])

    results = []
    for col in req.prediction_columns:
        if col not in sub.columns:
            continue

        # Drop rows where this prediction column is null
        mask = sub[col].notna()
        yt = y_true[mask]
        yp = _to_binary(sub.loc[mask, col], col)
        prot = protected[mask]

        perf = perf_metrics(yt, yp)
        fairness = compute_fairness_metrics(yt, yp, prot)
        groups = compute_group_analysis(yt, yp, prot)
        bl = bias_level(fairness["dp_diff"])
        rec = recommendation(fairness["dp_diff"], col)

        results.append({
            "model": col,
            "display_name": col,
            "performance": perf,
            "fairness": fairness,
            "bias_level": bl,
            "recommendation": rec,
            "group_analysis": groups,
        })

    tradeoff = [
        {
            "model": r["display_name"],
            "accuracy": r["performance"]["accuracy"],
            "dp_diff": r["fairness"]["dp_diff"],
            "f1": r["performance"]["f1"],
        }
        for r in results
    ]

    best = max(results, key=lambda r: r["performance"]["accuracy"]) if results else None

    return {
        "results": results,
        "best_model": best["model"] if best else None,
        "best_display_name": best["display_name"] if best else None,
        "tradeoff_data": tradeoff,
        "total_records": int(len(y_true)),
    }
