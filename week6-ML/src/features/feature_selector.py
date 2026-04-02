import json
import os
import numpy as np
import pandas as pd
from sklearn.feature_selection import mutual_info_classif


def correlation_threshold(df, threshold=0.95):
    corr_matrix = df.corr().abs()
    upper = corr_matrix.where(np.triu(np.ones(corr_matrix.shape), k=1).astype(bool))
    to_drop = [column for column in upper.columns if any(upper[column] > threshold)]
    return df.drop(columns=to_drop), to_drop


def mutual_information_selection(X, y, top_k=30):
    mi = mutual_info_classif(X, y, discrete_features="auto", random_state=42)
    mi_series = pd.Series(mi, index=X.columns).sort_values(ascending=False)
    selected_features = mi_series.head(min(top_k, len(mi_series))).index.tolist()
    return X[selected_features], selected_features


def save_feature_list(feature_list, path="src/features/feature_list.json"):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "w") as f:
        json.dump(feature_list, f, indent=4)


def main():
    DATA_PATH = "src/data/processed/final.csv"
    TARGET = "rating"   # change this if your target column name is different

    df = pd.read_csv(DATA_PATH)

    if TARGET not in df.columns:
        raise ValueError(f"Target column '{TARGET}' not found in dataset. Available columns: {df.columns.tolist()}")

    X = df.drop(columns=[TARGET])
    y = df[TARGET]

    # Keep only numeric columns for correlation filtering
    X_numeric = X.select_dtypes(include=[np.number]).copy()

    # Step 1: correlation-based dropping
    X_corr_filtered, dropped_corr_features = correlation_threshold(X_numeric, threshold=0.80)

    print("Dropped due to high correlation:")
    print(dropped_corr_features)

    # Step 2: MI selection
    X_selected, selected_features = mutual_information_selection(X_corr_filtered, y, top_k=30)

    print("\nSelected features after mutual information:")
    print(selected_features)

    # Step 3: save selected features
    save_feature_list(selected_features)

    print("\nfeature_list.json updated successfully!")
    print(f"Total selected features: {len(selected_features)}")


if __name__ == "__main__":
    main()