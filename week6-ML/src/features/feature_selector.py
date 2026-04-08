import json
import os
import numpy as np
import pandas as pd
from sklearn.feature_selection import mutual_info_classif


def correlation_threshold(df, threshold=0.95, protected_cols=None):
    """
    Drop one feature from highly correlated pairs.
    Protected columns are preserved when possible.
    """
    protected_cols = protected_cols or []
    numeric_df = df.select_dtypes(include=[np.number]).copy()

    corr_matrix = numeric_df.corr().abs()
    upper = corr_matrix.where(np.triu(np.ones(corr_matrix.shape), k=1).astype(bool))

    to_drop = []

    for column in upper.columns:
        high_corr_features = upper.index[upper[column] > threshold].tolist()
        if high_corr_features:
            if column in protected_cols:
                continue

            if any(f in protected_cols for f in high_corr_features):
                to_drop.append(column)
            else:
                to_drop.append(column)

    to_drop = list(dict.fromkeys(to_drop))
    filtered_df = df.drop(columns=[c for c in to_drop if c in df.columns], errors="ignore")

    return filtered_df, to_drop


def _detect_discrete_features(X):
    """
    Detect discrete features for MI:
    bool, integer, and binary float columns.
    """
    discrete_mask = []

    for col in X.columns:
        series = X[col]

        if pd.api.types.is_bool_dtype(series):
            discrete_mask.append(True)
        elif pd.api.types.is_integer_dtype(series):
            discrete_mask.append(True)
        elif pd.api.types.is_float_dtype(series):
            unique_vals = set(series.dropna().unique())
            discrete_mask.append(unique_vals.issubset({0.0, 1.0}))
        else:
            discrete_mask.append(False)

    return discrete_mask


def mutual_information_selection(X, y, top_k=25, protected_cols=None):
    """
    Select top features using MI for classification.
    Preserves important protected columns.
    """
    protected_cols = protected_cols or []

    X_numeric = X.select_dtypes(include=[np.number]).copy()

    nunique = X_numeric.nunique()
    constant_cols = nunique[nunique <= 1].index.tolist()
    if constant_cols:
        X_numeric = X_numeric.drop(columns=constant_cols)

    if X_numeric.empty:
        return X, list(X.columns)

    discrete_mask = _detect_discrete_features(X_numeric)

    mi = mutual_info_classif(
        X_numeric,
        y,
        discrete_features=discrete_mask,
        random_state=42
    )

    mi_series = pd.Series(mi, index=X_numeric.columns).sort_values(ascending=False)
    mi_series = mi_series[mi_series > 0]

    if mi_series.empty:
        selected_features = X_numeric.columns.tolist()
        return X[selected_features], selected_features

    selected_features = mi_series.head(min(top_k, len(mi_series))).index.tolist()

    for col in protected_cols:
        if col in X.columns and col not in selected_features:
            selected_features.append(col)

    selected_features = [c for c in dict.fromkeys(selected_features) if c in X.columns]

    return X[selected_features], selected_features


def save_feature_list(feature_list, path="src/features/feature_list.json"):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "w") as f:
        json.dump(feature_list, f, indent=4)


def main():
    DATA_PATH = "src/data/processed/final.csv"
    TARGET = "rating"

    df = pd.read_csv(DATA_PATH)

    if TARGET not in df.columns:
        raise ValueError(
            f"Target column '{TARGET}' not found in dataset. Available columns: {df.columns.tolist()}"
        )

    X = df.drop(columns=[TARGET])
    y = df[TARGET]

    protected_cols = [
        "kids_score",
        "mature_score",
        "has_kids_words",
        "has_mature_words",
        "genre_kids",
        "genre_family",
        "genre_horror",
        "genre_crime",
        "is_movie",
        "short_kids_content",
        "long_mature_content",
        "kids_genre_score",
        "mature_genre_score",
    ]

    X_corr_filtered, dropped_corr_features = correlation_threshold(
        X,
        threshold=0.95,
        protected_cols=protected_cols
    )

    print("Dropped due to high correlation:")
    print(dropped_corr_features)

    X_selected, selected_features = mutual_information_selection(
        X_corr_filtered,
        y,
        top_k=25,
        protected_cols=protected_cols
    )

    print("\nSelected features after mutual information:")
    print(selected_features)

    save_feature_list(selected_features)

    print("\nfeature_list.json updated successfully!")
    print(f"Total selected features: {len(selected_features)}")


if __name__ == "__main__":
    main()