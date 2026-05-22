import numpy as np
from typing import List, Dict, Any


def _safe_float(v: float) -> float:
    return round(float(v), 6)


def demographic_parity_diff(y_pred: np.ndarray, protected: np.ndarray) -> float:
    groups = np.unique(protected)
    rates = [float(y_pred[protected == g].mean()) for g in groups if (protected == g).sum() > 0]
    return _safe_float(max(rates) - min(rates)) if len(rates) >= 2 else 0.0


def equal_opportunity_diff(y_true: np.ndarray, y_pred: np.ndarray, protected: np.ndarray) -> float:
    groups = np.unique(protected)
    tprs = []
    for g in groups:
        mask = (protected == g) & (y_true == 1)
        if mask.sum() > 0:
            tprs.append(float(y_pred[mask].mean()))
    return _safe_float(max(tprs) - min(tprs)) if len(tprs) >= 2 else 0.0


def equalized_odds_diff(y_true: np.ndarray, y_pred: np.ndarray, protected: np.ndarray) -> float:
    groups = np.unique(protected)
    diffs = []
    for label in [0, 1]:
        rates = []
        for g in groups:
            mask = (protected == g) & (y_true == label)
            if mask.sum() > 0:
                rates.append(float(y_pred[mask].mean()))
        if len(rates) >= 2:
            diffs.append(max(rates) - min(rates))
    return _safe_float(max(diffs)) if diffs else 0.0


def compute_fairness_metrics(y_true: np.ndarray, y_pred: np.ndarray, protected: np.ndarray) -> Dict[str, float]:
    return {
        "dp_diff": demographic_parity_diff(y_pred, protected),
        "eo_diff": equal_opportunity_diff(y_true, y_pred, protected),
        "eodds_diff": equalized_odds_diff(y_true, y_pred, protected),
    }


def compute_group_analysis(y_true: np.ndarray, y_pred: np.ndarray, protected: np.ndarray) -> List[Dict[str, Any]]:
    rows = []
    for g in sorted(np.unique(protected), key=lambda x: str(x)):
        mask = protected == g
        yt, yp = y_true[mask], y_pred[mask]
        if len(yt) == 0:
            continue
        tp = int(((yt == 1) & (yp == 1)).sum())
        fp = int(((yt == 0) & (yp == 1)).sum())
        tn = int(((yt == 0) & (yp == 0)).sum())
        fn = int(((yt == 1) & (yp == 0)).sum())
        tpr = tp / (tp + fn) if (tp + fn) > 0 else 0.0
        fpr = fp / (fp + tn) if (fp + tn) > 0 else 0.0
        acc = (tp + tn) / len(yt)
        rows.append({
            "group": str(g),
            "count": int(mask.sum()),
            "selection_rate": _safe_float(float(yp.mean())),
            "accuracy": _safe_float(acc),
            "tpr": _safe_float(tpr),
            "fpr": _safe_float(fpr),
        })
    return rows


def bias_level(dp: float) -> str:
    if dp < 0.02:
        return "low"
    elif dp < 0.05:
        return "moderate"
    else:
        return "high"


def recommendation(dp: float, model_name: str) -> str:
    lvl = bias_level(dp)
    if lvl == "low":
        return f"{model_name} shows low demographic parity difference (DP diff = {dp:.3f}). The model can be deployed with standard monitoring procedures."
    elif lvl == "moderate":
        return f"{model_name} shows moderate demographic parity difference (DP diff = {dp:.3f}). Consider applying bias mitigation techniques (e.g., reweighting or threshold adjustment) before deployment."
    else:
        return f"{model_name} shows high demographic parity difference (DP diff = {dp:.3f}). Bias mitigation is strongly recommended before any production deployment."
