import os
import numpy as np
import pandas as pd
from sklearn.preprocessing import LabelEncoder

from utils.helpers import (
    load_dataset,
    drop_columns,
    handle_missing_values,
    clean_duration,
    process_date,
    remove_duplicates
)
from utils.logger import get_logger
from features.build_features import build_features
from features.feature_selector import (
    correlation_threshold,
    mutual_information_selection,
    save_feature_list
)


def remove_outliers_iqr(df, cols, multiplier=1.5):
    """
    Apply IQR-based outlier filtering only on selected raw numeric columns.
    Safer than applying IQR on all engineered features.
    """
    valid_cols = [c for c in cols if c in df.columns]
    if not valid_cols:
        return df

    mask = pd.Series(True, index=df.index)

    for col in valid_cols:
        series = pd.to_numeric(df[col], errors="coerce")

        if series.isna().all():
            continue

        q1 = series.quantile(0.25)
        q3 = series.quantile(0.75)
        iqr = q3 - q1

        if pd.isna(iqr) or iqr == 0:
            continue

        lower = q1 - multiplier * iqr
        upper = q3 + multiplier * iqr

        col_mask = series.between(lower, upper, inclusive="both") | series.isna()
        mask &= col_mask

    before = len(df)
    df = df[mask].copy()
    after = len(df)

    print(f"IQR Outlier Removal: {before - after} rows removed using columns: {valid_cols}")
    return df


def run_pipeline(config):
    logger = get_logger(config["logs"]["log_file"])

    df = load_dataset(config["data"]["raw_path"])
    logger.info(f"Raw dataset shape: {df.shape}")

    df = drop_columns(df)
    df = handle_missing_values(df)
    df = clean_duration(df)
    df = process_date(df)
    df = remove_duplicates(df)

    # Apply IQR only on raw numeric columns
    numeric_outlier_cols = [c for c in ["duration", "release_year", "year_added"] if c in df.columns]
    if numeric_outlier_cols:
        df = remove_outliers_iqr(df, numeric_outlier_cols, multiplier=1.5)
        logger.info(f"Dataset shape after IQR outlier removal: {df.shape}")

    df = build_features(df, config)
    logger.info(f"Dataset shape after feature engineering: {df.shape}")

    target_col = config["target_column"]
    y_raw = df[target_col].copy()
    X = df.drop(columns=[target_col])

    label_encoder = LabelEncoder()
    y_encoded = label_encoder.fit_transform(y_raw.astype(str))

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

    X, dropped_corr = correlation_threshold(
        X,
        threshold=0.95,
        protected_cols=protected_cols
    )
    logger.info(f"Dropped highly correlated features: {dropped_corr}")

    X, selected_features = mutual_information_selection(
        X,
        y_encoded,
        top_k=25,
        protected_cols=protected_cols
    )
    logger.info(f"Selected top features: {selected_features}")

    os.makedirs("src/features", exist_ok=True)
    save_feature_list(selected_features, path="src/features/feature_list.json")

    final_df = X.copy()
    final_df[target_col] = y_raw
    final_df.to_csv(config["data"]["processed_path"], index=False)

    logger.info(f"Final processed dataset saved to {config['data']['processed_path']}")
    logger.info("Pipeline completed successfully")