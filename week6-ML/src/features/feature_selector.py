import numpy as np
import pandas as pd
from sklearn.feature_selection import mutual_info_classif, RFE
from sklearn.ensemble import RandomForestClassifier
import json

def correlation_threshold(df, threshold=0.9):
    """
    Remove highly correlated features above the threshold.
    """
    corr_matrix = df.corr().abs()
    upper = corr_matrix.where(np.triu(np.ones(corr_matrix.shape), k=1).astype(bool))
    to_drop = [column for column in upper.columns if any(upper[column] > threshold)]
    df = df.drop(columns=to_drop)
    return df, to_drop

def mutual_information_selection(X, y, top_k=20):
    """
    Select top_k features using mutual information.
    """
    mi = mutual_info_classif(X, y, discrete_features="auto")
    mi_series = pd.Series(mi, index=X.columns)
    mi_series = mi_series.sort_values(ascending=False)
    selected_features = mi_series.head(top_k).index.tolist()
    return X[selected_features], selected_features

def rfe_selection(X, y, n_features=20):
    """
    Select features using RFE with RandomForestClassifier.
    """
    model = RandomForestClassifier(n_estimators=50, random_state=42)
    rfe = RFE(model, n_features_to_select=n_features)
    rfe.fit(X, y)
    selected_features = X.columns[rfe.support_].tolist()
    return X[selected_features], selected_features

def save_feature_list(feature_list, path="features/feature_list.json"):
    with open(path, "w") as f:
        json.dump(feature_list, f, indent=4)