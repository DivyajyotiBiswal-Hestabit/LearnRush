import json
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
    with open(path, "w") as f:
        json.dump(feature_list, f, indent=4)