from utils.helpers import (
    load_dataset,
    drop_columns,
    handle_missing_values,
    clean_duration,
    process_date,
    remove_duplicates,
    remove_outliers_zscore
)
from utils.logger import get_logger
from features.build_features import build_features
from features.feature_selector import (
    correlation_threshold,
    mutual_information_selection,
    save_feature_list
)
import os
from sklearn.preprocessing import LabelEncoder


def run_pipeline(config):
    logger = get_logger(config["logs"]["log_file"])

    df = load_dataset(config["data"]["raw_path"])
    logger.info(f"Raw dataset shape: {df.shape}")

    df = drop_columns(df)
    df = handle_missing_values(df)
    df = clean_duration(df)
    df = process_date(df)
    df = remove_duplicates(df)

    numeric_outlier_cols = [c for c in ["duration", "release_year", "year_added"] if c in df.columns]
    if numeric_outlier_cols:
        df = remove_outliers_zscore(
            df,
            config["outliers"]["threshold"],
            exclude_cols=[]
        )

    df = build_features(df, config)
    logger.info(f"Dataset shape after feature engineering: {df.shape}")

    target_col = config["target_column"]
    y_raw = df[target_col].copy()
    X = df.drop(columns=[target_col])

    # Temporary encoding only for feature selection
    label_encoder = LabelEncoder()
    y_encoded = label_encoder.fit_transform(y_raw.astype(str))

    X, dropped_corr = correlation_threshold(X, threshold=0.95)
    logger.info(f"Dropped highly correlated features: {dropped_corr}")

    X, selected_features = mutual_information_selection(X, y_encoded, top_k=30)
    logger.info(f"Selected top features: {selected_features}")

    os.makedirs("src/features", exist_ok=True)
    save_feature_list(selected_features, path="src/features/feature_list.json")

    # Save original target labels, not encoded integers
    final_df = X.copy()
    final_df[target_col] = y_raw
    final_df.to_csv(config["data"]["processed_path"], index=False)

    logger.info(f"Final processed dataset saved to {config['data']['processed_path']}")
    logger.info("Pipeline completed successfully")