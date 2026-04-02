import os
import json
import pickle
import warnings

import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns

from sklearn.model_selection import (
    train_test_split,
    StratifiedKFold,
    cross_validate,
    GridSearchCV,
    RandomizedSearchCV
)
from sklearn.pipeline import Pipeline
from sklearn.impute import SimpleImputer
from sklearn.metrics import (
    accuracy_score,
    precision_score,
    recall_score,
    f1_score,
    roc_auc_score,
    confusion_matrix
)
from sklearn.preprocessing import LabelEncoder, StandardScaler
from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import RandomForestClassifier
from sklearn.neural_network import MLPClassifier
from sklearn.cluster import KMeans

warnings.filterwarnings("ignore")


def load_config():
    import yaml
    with open("src/config/config.yaml", "r") as f:
        return yaml.safe_load(f)


def load_data(config):
    return pd.read_csv(config["data"]["processed_path"])


def prepare_data(df, target_column):
    df = df.dropna(subset=[target_column]).copy()

    X = df.drop(columns=[target_column])
    y = df[target_column].astype(str)

    label_encoder = LabelEncoder()
    y = label_encoder.fit_transform(y)

    return X, y, label_encoder


def make_dirs():
    os.makedirs("src/tuning", exist_ok=True)
    os.makedirs("src/evaluation", exist_ok=True)
    os.makedirs("src/models", exist_ok=True)


def evaluate_cv(model, X, y, cv):
    scoring = {
        "accuracy": "accuracy",
        "precision_weighted": "precision_weighted",
        "recall_weighted": "recall_weighted",
        "f1_weighted": "f1_weighted",
        "f1_macro": "f1_macro",
        "roc_auc_ovr": "roc_auc_ovr"
    }

    scores = cross_validate(
        model,
        X,
        y,
        cv=cv,
        scoring=scoring,
        return_train_score=True,
        n_jobs=-1
    )

    return {
        "train_accuracy_mean": float(np.mean(scores["train_accuracy"])),
        "val_accuracy_mean": float(np.mean(scores["test_accuracy"])),
        "train_f1_weighted_mean": float(np.mean(scores["train_f1_weighted"])),
        "val_f1_weighted_mean": float(np.mean(scores["test_f1_weighted"])),
        "train_f1_macro_mean": float(np.mean(scores["train_f1_macro"])),
        "val_f1_macro_mean": float(np.mean(scores["test_f1_macro"])),
        "accuracy_mean": float(np.mean(scores["test_accuracy"])),
        "precision_weighted_mean": float(np.mean(scores["test_precision_weighted"])),
        "recall_weighted_mean": float(np.mean(scores["test_recall_weighted"])),
        "f1_weighted_mean": float(np.mean(scores["test_f1_weighted"])),
        "f1_macro_mean": float(np.mean(scores["test_f1_macro"])),
        "roc_auc_ovr_mean": float(np.mean(scores["test_roc_auc_ovr"]))
    }


def tune_logistic_grid(X, y, cv):
    pipe = Pipeline([
        ("imputer", SimpleImputer(strategy="median")),
        ("scaler", StandardScaler()),
        ("model", LogisticRegression(
            max_iter=2000,
            solver="saga",
            class_weight="balanced"
        ))
    ])

    param_grid = {
        "model__penalty": ["l1", "l2"],
        "model__C": [0.01, 0.1, 1.0, 10.0]
    }

    search = GridSearchCV(
        pipe,
        param_grid=param_grid,
        scoring="f1_weighted",
        cv=cv,
        n_jobs=-1
    )
    search.fit(X, y)
    return search.best_estimator_, search.best_params_, float(search.best_score_)


def tune_rf_random(X, y, cv):
    pipe = Pipeline([
        ("imputer", SimpleImputer(strategy="median")),
        ("model", RandomForestClassifier(
            random_state=42,
            class_weight="balanced"
        ))
    ])

    param_dist = {
        "model__n_estimators": [100, 200, 300, 500],
        "model__max_depth": [None, 5, 10, 20],
        "model__min_samples_split": [2, 5, 10],
        "model__min_samples_leaf": [1, 2, 4]
    }

    search = RandomizedSearchCV(
        pipe,
        param_distributions=param_dist,
        n_iter=15,
        scoring="f1_weighted",
        cv=cv,
        random_state=42,
        n_jobs=-1
    )
    search.fit(X, y)
    return search.best_estimator_, search.best_params_, float(search.best_score_)


def tune_mlp_random(X, y, cv):
    pipe = Pipeline([
        ("imputer", SimpleImputer(strategy="median")),
        ("scaler", StandardScaler()),
        ("model", MLPClassifier(random_state=42, max_iter=500))
    ])

    param_dist = {
        "model__hidden_layer_sizes": [(64,), (128,), (128, 64), (256, 128)],
        "model__alpha": [0.0001, 0.001, 0.01],
        "model__learning_rate_init": [0.0005, 0.001, 0.005]
    }

    search = RandomizedSearchCV(
        pipe,
        param_distributions=param_dist,
        n_iter=10,
        scoring="f1_weighted",
        cv=cv,
        random_state=42,
        n_jobs=-1
    )
    search.fit(X, y)
    return search.best_estimator_, search.best_params_, float(search.best_score_)


def tune_xgb_optuna(X, y, cv):
    try:
        import optuna
        from xgboost import XGBClassifier
    except Exception:
        return None, None, None, "Optuna/XGBoost not available"

    def objective(trial):
        model = Pipeline([
            ("imputer", SimpleImputer(strategy="median")),
            ("model", XGBClassifier(
                n_estimators=trial.suggest_int("n_estimators", 150, 500),
                max_depth=trial.suggest_int("max_depth", 3, 10),
                learning_rate=trial.suggest_float("learning_rate", 0.01, 0.2, log=True),
                subsample=trial.suggest_float("subsample", 0.7, 1.0),
                colsample_bytree=trial.suggest_float("colsample_bytree", 0.7, 1.0),
                reg_alpha=trial.suggest_float("reg_alpha", 0.0, 3.0),
                reg_lambda=trial.suggest_float("reg_lambda", 0.5, 6.0),
                min_child_weight=trial.suggest_int("min_child_weight", 1, 8),
                gamma=trial.suggest_float("gamma", 0.0, 2.0),
                objective="multi:softprob",
                eval_metric="mlogloss",
                random_state=42
            ))
        ])

        scores = cross_validate(
            model,
            X,
            y,
            cv=cv,
            scoring={"f1_weighted": "f1_weighted"},
            n_jobs=-1
        )
        return float(np.mean(scores["test_f1_weighted"]))

    study = optuna.create_study(direction="maximize")
    study.optimize(objective, n_trials=50, show_progress_bar=False)

    best_params = study.best_trial.params

    from xgboost import XGBClassifier

    best_model = Pipeline([
        ("imputer", SimpleImputer(strategy="median")),
        ("model", XGBClassifier(
            n_estimators=best_params["n_estimators"],
            max_depth=best_params["max_depth"],
            learning_rate=best_params["learning_rate"],
            subsample=best_params["subsample"],
            colsample_bytree=best_params["colsample_bytree"],
            reg_alpha=best_params["reg_alpha"],
            reg_lambda=best_params["reg_lambda"],
            min_child_weight=best_params["min_child_weight"],
            gamma=best_params["gamma"],
            objective="multi:softprob",
            eval_metric="mlogloss",
            random_state=42
        ))
    ])

    best_model.fit(X, y)
    return best_model, best_params, float(study.best_value), None


def feature_importance_plot(model, feature_names, path):
    final_model = model.named_steps["model"]

    if hasattr(final_model, "feature_importances_"):
        importances = final_model.feature_importances_
    elif hasattr(final_model, "coef_"):
        coef = final_model.coef_
        if coef.ndim == 2:
            importances = np.mean(np.abs(coef), axis=0)
        else:
            importances = np.abs(coef)
    else:
        return

    fi = pd.DataFrame({
        "feature": feature_names,
        "importance": importances
    }).sort_values("importance", ascending=False).head(20)

    plt.figure(figsize=(10, 8))
    sns.barplot(data=fi, x="importance", y="feature")
    plt.title("Feature Importance")
    plt.tight_layout()
    plt.savefig(path)
    plt.close()


def error_analysis_heatmap(y_true, y_pred, path):
    cm = confusion_matrix(y_true, y_pred)
    plt.figure(figsize=(10, 8))
    sns.heatmap(cm, annot=True, fmt="d", cmap="Blues")
    plt.title("Error Analysis Heatmap (Confusion Matrix)")
    plt.xlabel("Predicted")
    plt.ylabel("Actual")
    plt.tight_layout()
    plt.savefig(path)
    plt.close()


def error_clustering(X_test, y_test, y_pred, path):
    X_test_reset = X_test.reset_index(drop=True)
    y_test_reset = pd.Series(y_test).reset_index(drop=True)
    y_pred_series = pd.Series(y_pred).reset_index(drop=True)

    error_mask = y_test_reset != y_pred_series
    errors = X_test_reset[error_mask].copy()

    if len(errors) < 3:
        payload = {"message": "Not enough misclassified samples for clustering."}
        with open(path, "w") as f:
            json.dump(payload, f, indent=4)
        return

    n_clusters = min(3, len(errors))
    km = KMeans(n_clusters=n_clusters, random_state=42, n_init=10)
    clusters = km.fit_predict(errors)

    cluster_counts = pd.Series(clusters).value_counts().sort_index()
    payload = {
        "num_errors": int(len(errors)),
        "n_clusters": int(n_clusters),
        "cluster_counts": {str(k): int(v) for k, v in cluster_counts.items()}
    }

    with open(path, "w") as f:
        json.dump(payload, f, indent=4)


def fit_test_metrics(model, X_train, y_train, X_test, y_test):
    model.fit(X_train, y_train)
    y_pred = model.predict(X_test)

    if hasattr(model, "predict_proba"):
        y_prob = model.predict_proba(X_test)
        try:
            roc_auc = roc_auc_score(y_test, y_prob, multi_class="ovr")
        except Exception:
            roc_auc = None
    else:
        roc_auc = None

    metrics = {
        "accuracy": float(accuracy_score(y_test, y_pred)),
        "precision_weighted": float(precision_score(y_test, y_pred, average="weighted", zero_division=0)),
        "recall_weighted": float(recall_score(y_test, y_pred, average="weighted", zero_division=0)),
        "f1_weighted": float(f1_score(y_test, y_pred, average="weighted", zero_division=0)),
        "f1_macro": float(f1_score(y_test, y_pred, average="macro", zero_division=0)),
        "roc_auc_ovr": float(roc_auc) if roc_auc is not None else None
    }
    return model, y_pred, metrics


def main():
    make_dirs()

    config = load_config()
    df = load_data(config)
    X, y, label_encoder = prepare_data(df, config["target_column"])

    label_classes = label_encoder.classes_.tolist()
    with open("src/models/label_classes.json", "w") as f:
        json.dump(label_classes, f, indent=4)

    cv = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)

    log_model, log_params, log_score = tune_logistic_grid(X, y, cv)
    rf_model, rf_params, rf_score = tune_rf_random(X, y, cv)
    mlp_model, mlp_params, mlp_score = tune_mlp_random(X, y, cv)
    xgb_model, xgb_params, xgb_score, xgb_error = tune_xgb_optuna(X, y, cv)

    tuned_candidates = {
        "logistic_regression_tuned": (log_model, log_params, log_score),
        "random_forest_tuned": (rf_model, rf_params, rf_score),
        "neural_network_tuned": (mlp_model, mlp_params, mlp_score)
    }

    if xgb_model is not None:
        tuned_candidates["xgboost_tuned"] = (xgb_model, xgb_params, xgb_score)

    best_name = max(tuned_candidates, key=lambda k: tuned_candidates[k][2])
    best_model, best_params, best_cv_score = tuned_candidates[best_name]

    X_train, X_test, y_train, y_test = train_test_split(
        X, y,
        test_size=0.2,
        stratify=y,
        random_state=42
    )

    best_model, y_pred, test_metrics = fit_test_metrics(
        best_model, X_train, y_train, X_test, y_test
    )

    with open("src/models/best_model.pkl", "wb") as f:
        pickle.dump(best_model, f)

    feature_importance_plot(
        best_model,
        X.columns.tolist(),
        "src/evaluation/feature_importance.png"
    )

    error_analysis_heatmap(
        y_test,
        y_pred,
        "src/evaluation/error_heatmap.png"
    )

    error_clustering(
        X_test,
        pd.Series(y_test),
        pd.Series(y_pred),
        "src/tuning/error_clusters.json"
    )

    tuned_cv_results = evaluate_cv(best_model, X, y, cv)

    results = {
        "tuned_models": {
            "logistic_regression_tuned": {
                "best_params": log_params,
                "best_cv_f1_weighted": log_score
            },
            "random_forest_tuned": {
                "best_params": rf_params,
                "best_cv_f1_weighted": rf_score
            },
            "neural_network_tuned": {
                "best_params": mlp_params,
                "best_cv_f1_weighted": mlp_score
            }
        },
        "best_model": best_name,
        "best_model_params": best_params,
        "best_model_cv_f1_weighted": best_cv_score,
        "best_model_test_metrics": test_metrics,
        "bias_variance_analysis": {
            "train_f1_weighted_mean": tuned_cv_results["train_f1_weighted_mean"],
            "val_f1_weighted_mean": tuned_cv_results["val_f1_weighted_mean"],
            "train_f1_macro_mean": tuned_cv_results["train_f1_macro_mean"],
            "val_f1_macro_mean": tuned_cv_results["val_f1_macro_mean"],
            "train_accuracy_mean": tuned_cv_results["train_accuracy_mean"],
            "val_accuracy_mean": tuned_cv_results["val_accuracy_mean"]
        }
    }

    if xgb_model is not None:
        results["tuned_models"]["xgboost_tuned"] = {
            "best_params": xgb_params,
            "best_cv_f1_weighted": xgb_score
        }
    if xgb_error is not None:
        results["xgboost_status"] = xgb_error

    with open("src/tuning/results.json", "w") as f:
        json.dump(results, f, indent=4)

    print("Tuning completed")
    print("Best tuned model:", best_name)
    print("Results saved to: src/tuning/results.json")
    print("Feature importance saved to: src/evaluation/feature_importance.png")
    print("Error heatmap saved to: src/evaluation/error_heatmap.png")


if __name__ == "__main__":
    main()