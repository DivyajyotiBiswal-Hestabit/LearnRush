import os
import pickle
import warnings

import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
import shap

from sklearn.preprocessing import LabelEncoder

warnings.filterwarnings("ignore")


def load_config():
    import yaml
    with open("src/config/config.yaml", "r") as f:
        return yaml.safe_load(f)


def load_data(config):
    df = pd.read_csv(config["data"]["processed_path"])
    target = config["target_column"]

    df = df.dropna(subset=[target]).copy()
    X = df.drop(columns=[target])
    y = df[target]

    label_encoder = LabelEncoder()
    y = label_encoder.fit_transform(y)

    return X, y


def main():
    os.makedirs("src/evaluation", exist_ok=True)

    config = load_config()
    X, y = load_data(config)

    with open("src/models/best_model.pkl", "rb") as f:
        model = pickle.load(f)

    imputer = model.named_steps["imputer"]
    estimator = model.named_steps["model"]

    X_imp = imputer.transform(X)
    X_imp_df = pd.DataFrame(X_imp, columns=X.columns)

    sample_size = min(300, len(X_imp_df))
    X_sample = X_imp_df.sample(sample_size, random_state=42)

    # Tree models
    if estimator.__class__.__name__ in ["XGBClassifier", "RandomForestClassifier", "LGBMClassifier"]:
        explainer = shap.TreeExplainer(estimator)
        shap_values = explainer.shap_values(X_sample)

        plt.figure()
        shap.summary_plot(shap_values, X_sample, show=False)
        plt.tight_layout()
        plt.savefig("src/evaluation/shap_summary.png", bbox_inches="tight")
        plt.close()

    # Linear models
    elif estimator.__class__.__name__ == "LogisticRegression":
        explainer = shap.LinearExplainer(estimator, X_sample)
        shap_values = explainer.shap_values(X_sample)

        plt.figure()
        shap.summary_plot(shap_values, X_sample, show=False)
        plt.tight_layout()
        plt.savefig("src/evaluation/shap_summary.png", bbox_inches="tight")
        plt.close()

    # Fallback for neural network / other models
    else:
        background = X_sample.iloc[:50]
        explain_data = X_sample.iloc[:100]

        def predict_fn(data):
            return estimator.predict_proba(data)

        explainer = shap.KernelExplainer(predict_fn, background)
        shap_values = explainer.shap_values(explain_data, nsamples=100)

        plt.figure()
        shap.summary_plot(shap_values, explain_data, show=False)
        plt.tight_layout()
        plt.savefig("src/evaluation/shap_summary.png", bbox_inches="tight")
        plt.close()

    print("SHAP summary plot saved to: src/evaluation/shap_summary.png")


if __name__ == "__main__":
    main()