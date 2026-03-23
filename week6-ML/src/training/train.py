import os
import json
import pickle
import warnings

import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
from imblearn.pipeline import Pipeline as ImbPipeline
from imblearn.over_sampling import SMOTE
from sklearn.preprocessing import LabelEncoder, StandardScaler
from sklearn.model_selection import cross_validate, StratifiedKFold, train_test_split
from sklearn.impute import SimpleImputer
from sklearn.metrics import (
    accuracy_score,
    precision_score,
    recall_score,
    f1_score,
    roc_auc_score,
    confusion_matrix,
    ConfusionMatrixDisplay
)
from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier
from sklearn.neural_network import MLPClassifier

warnings.filterwarnings("ignore")


def load_config():
    import yaml
    with open("src/config/config.yaml", "r") as f:
        return yaml.safe_load(f)


def load_data(config):
    return pd.read_csv(config["data"]["processed_path"])


def build_models(use_smote=True):
    sampler = SMOTE(random_state=42) if use_smote else "passthrough"

    models = {
        "logistic_regression": ImbPipeline([
            ("imputer", SimpleImputer(strategy="median")),
            ("scaler", StandardScaler()),
            ("smote", sampler),
            ("model", LogisticRegression(
                max_iter=2000,
                penalty="l2",
                C=1.0,
                class_weight="balanced"
            ))
        ]),
        "random_forest": ImbPipeline([
            ("imputer", SimpleImputer(strategy="median")),
            ("smote", sampler),
            ("model", RandomForestClassifier(
                n_estimators=400,
                max_depth=None,
                min_samples_split=4,
                min_samples_leaf=2,
                class_weight="balanced",
                random_state=42
            ))
        ]),
        "neural_network": ImbPipeline([
            ("imputer", SimpleImputer(strategy="median")),
            ("scaler", StandardScaler()),
            ("smote", sampler),
            ("model", MLPClassifier(
                hidden_layer_sizes=(128, 64),
                activation="relu",
                alpha=0.001,
                max_iter=500,
                random_state=42
            ))
        ])
    }

    try:
        from xgboost import XGBClassifier
        models["xgboost"] = ImbPipeline([
            ("imputer", SimpleImputer(strategy="median")),
            ("smote", sampler),
            ("model", XGBClassifier(
                n_estimators=400,
                max_depth=5,
                learning_rate=0.05,
                subsample=0.9,
                colsample_bytree=0.9,
                eval_metric="mlogloss",
                random_state=42
            ))
        ])
    except Exception:
        models["gradient_boosting_fallback"] = ImbPipeline([
            ("imputer", SimpleImputer(strategy="median")),
            ("model", GradientBoostingClassifier(random_state=42))
        ])

    return models


def evaluate_models_cv(X, y, models):
    scoring = {
        "accuracy": "accuracy",
        "precision": "precision_weighted",
        "recall": "recall_weighted",
        "f1": "f1_weighted",
        "roc_auc": "roc_auc_ovr"
    }

    cv = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)
    results = {}

    for name, model in models.items():
        scores = cross_validate(
            model,
            X,
            y,
            cv=cv,
            scoring=scoring,
            return_train_score=False,
            n_jobs=-1
        )
        results[name] = {
            "accuracy_mean": float(np.mean(scores["test_accuracy"])),
            "precision_mean": float(np.mean(scores["test_precision"])),
            "recall_mean": float(np.mean(scores["test_recall"])),
            "f1_mean": float(np.mean(scores["test_f1"])),
            "roc_auc_mean": float(np.mean(scores["test_roc_auc"]))
        }

    return results


def select_best_model(results):
    return max(results, key=lambda m: results[m]["f1_mean"])


def fit_and_save_best_model(X_train, y_train, X_test, y_test, best_name, models):
    model = models[best_name]
    model.fit(X_train, y_train)

    y_pred = model.predict(X_test)

    roc_auc = None
    if hasattr(model, "predict_proba"):
        y_prob = model.predict_proba(X_test)
        if y_prob.shape[1] == 2:
            roc_auc = roc_auc_score(y_test, y_prob[:, 1])
        else:
            roc_auc = roc_auc_score(y_test, y_prob, multi_class="ovr")

    test_metrics = {
        "accuracy": float(accuracy_score(y_test, y_pred)),
        "precision": float(precision_score(y_test, y_pred, average="weighted", zero_division=0)),
        "recall": float(recall_score(y_test, y_pred, average="weighted", zero_division=0)),
        "f1_score": float(f1_score(y_test, y_pred, average="weighted", zero_division=0)),
        "roc_auc": float(roc_auc) if roc_auc is not None else None
    }

    os.makedirs("src/models", exist_ok=True)
    with open("src/models/best_model.pkl", "wb") as f:
        pickle.dump(model, f)

    os.makedirs("src/evaluation", exist_ok=True)
    cm = confusion_matrix(y_test, y_pred)
    disp = ConfusionMatrixDisplay(confusion_matrix=cm)
    disp.plot()
    plt.title(f"Confusion Matrix - {best_name}")
    plt.tight_layout()
    plt.savefig("src/evaluation/confusion_matrix.png")
    plt.close()

    return test_metrics


def save_metrics(cv_results, best_model_name, test_metrics):
    payload = {
        "cross_validation_results": cv_results,
        "best_model": best_model_name,
        "best_model_test_metrics": test_metrics
    }

    with open("src/evaluation/metrics.json", "w") as f:
        json.dump(payload, f, indent=4)


def main():
    config = load_config()
    df = load_data(config)

    target = config["target_column"]
    df = df.dropna(subset=[target]).copy()

    X = df.drop(columns=[target])
    y_raw = df[target].astype(str)

    label_encoder = LabelEncoder()
    y = label_encoder.fit_transform(y_raw)
    label_classes = list(label_encoder.classes_)

    os.makedirs("src/models", exist_ok=True)
    with open("src/models/label_classes.json", "w") as f:
        json.dump(label_classes, f, indent=4)

    models = build_models(use_smote=config["class_imbalance"]["use_smote"])

    cv_results = evaluate_models_cv(X, y, models)
    best_model_name = select_best_model(cv_results)

    X_train, X_test, y_train, y_test = train_test_split(
        X, y,
        test_size=0.2,
        stratify=y,
        random_state=42
    )

    test_metrics = fit_and_save_best_model(
        X_train, y_train, X_test, y_test, best_model_name, models
    )

    save_metrics(cv_results, best_model_name, test_metrics)

    print("Training completed")
    print("Best model:", best_model_name)
    print("Metrics saved to: src/evaluation/metrics.json")
    print("Best model saved to: src/models/best_model.pkl")
    print("Label classes saved to: src/models/label_classes.json")


if __name__ == "__main__":
    main()