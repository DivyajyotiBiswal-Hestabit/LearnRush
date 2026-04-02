import os
import json
from typing import Dict, Any

import numpy as np
import pandas as pd
from dotenv import load_dotenv

load_dotenv()

PROCESSED_DATA_PATH = os.getenv("REFERENCE_DATA_PATH", "src/data/processed/final.csv")
FEATURE_LIST_PATH = os.getenv("FEATURE_LIST_PATH", "src/features/feature_list.json")
PREDICTION_LOG_PATH = os.getenv("PREDICTION_LOG_PATH", "src/logs/prediction_logs.csv")
DRIFT_REPORT_PATH = os.getenv("DRIFT_REPORT_PATH", "src/monitoring/drift_report.json")
TARGET_COLUMN = os.getenv("TARGET_COLUMN", "rating")


def load_feature_list():
    with open(FEATURE_LIST_PATH, "r") as f:
        return json.load(f)


def load_reference_data(feature_list):
    df = pd.read_csv(PROCESSED_DATA_PATH)
    if TARGET_COLUMN in df.columns:
        df = df.drop(columns=[TARGET_COLUMN])
    return df[feature_list].copy()


def load_prediction_features(feature_list):
    if not os.path.exists(PREDICTION_LOG_PATH):
        return pd.DataFrame(columns=feature_list), pd.DataFrame()

    logs = pd.read_csv(PREDICTION_LOG_PATH, on_bad_lines="skip")

    if logs.empty:
        return pd.DataFrame(columns=feature_list), logs

    feature_rows = []
    for _, row in logs.iterrows():
        feat = row.get("features_json")
        if pd.isna(feat):
            continue

        try:
            feat_dict = json.loads(feat)
        except Exception:
            continue

        feature_rows.append({f: feat_dict.get(f, np.nan) for f in feature_list})

    pred_df = pd.DataFrame(feature_rows)
    return pred_df, logs


def psi(expected, actual, buckets=10):
    expected = np.array(expected, dtype=float)
    actual = np.array(actual, dtype=float)

    expected = expected[~np.isnan(expected)]
    actual = actual[~np.isnan(actual)]

    if len(expected) == 0 or len(actual) == 0:
        return None

    breakpoints = np.percentile(expected, np.linspace(0, 100, buckets + 1))
    breakpoints = np.unique(breakpoints)

    if len(breakpoints) < 3:
        return 0.0

    expected_counts, _ = np.histogram(expected, bins=breakpoints)
    actual_counts, _ = np.histogram(actual, bins=breakpoints)

    expected_pct = expected_counts / max(expected_counts.sum(), 1)
    actual_pct = actual_counts / max(actual_counts.sum(), 1)

    expected_pct = np.where(expected_pct == 0, 1e-6, expected_pct)
    actual_pct = np.where(actual_pct == 0, 1e-6, actual_pct)

    return float(np.sum((actual_pct - expected_pct) * np.log(actual_pct / expected_pct)))


def accuracy_decay(logs: pd.DataFrame):
    if "actual_label" not in logs.columns:
        return {"status": "actual labels not available"}

    label_col = "predicted_label" if "predicted_label" in logs.columns else "prediction"
    if label_col not in logs.columns:
        return {"status": "prediction labels not available"}

    valid = logs.dropna(subset=["actual_label", label_col]).copy()
    if valid.empty:
        return {"status": "actual labels not available"}

    valid["correct"] = (
        valid["actual_label"].astype(str).str.strip().str.lower()
        == valid[label_col].astype(str).str.strip().str.lower()
    ).astype(int)

    overall_accuracy = float(valid["correct"].mean())
    last_20 = valid.tail(20)
    rolling_accuracy = float(last_20["correct"].mean()) if len(last_20) > 0 else None

    return {
        "status": "computed",
        "comparison_column": label_col,
        "overall_logged_accuracy": overall_accuracy,
        "last_20_accuracy": rolling_accuracy
    }


def main():
    drift_dir = os.path.dirname(DRIFT_REPORT_PATH)
    if drift_dir:
        os.makedirs(drift_dir, exist_ok=True)

    feature_list = load_feature_list()
    ref_df = load_reference_data(feature_list)
    pred_df, logs = load_prediction_features(feature_list)

    report: Dict[str, Any] = {
        "reference_rows": int(len(ref_df)),
        "prediction_rows": int(len(pred_df)),
        "feature_drift": {},
        "accuracy_decay": accuracy_decay(logs)
    }

    if pred_df.empty:
        report["status"] = "No prediction logs available yet"
    else:
        for col in feature_list:
            report["feature_drift"][col] = {
                "reference_mean": float(ref_df[col].mean()) if col in ref_df else None,
                "prediction_mean": float(pred_df[col].mean()) if col in pred_df else None,
                "psi": psi(ref_df[col], pred_df[col])
            }

        report["status"] = "Drift analysis completed"

    with open(DRIFT_REPORT_PATH, "w") as f:
        json.dump(report, f, indent=4)

    print(f"Drift report saved to: {DRIFT_REPORT_PATH}")


if __name__ == "__main__":
    main()