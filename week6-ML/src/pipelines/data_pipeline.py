# src/pipelines/data_pipeline.py

from utils.helpers import (
    load_dataset,
    drop_columns,
    handle_missing_values,
    clean_duration,
    process_date,
    encode_categorical,
    remove_duplicates,
    remove_outliers_zscore,
    scale_features,
    split_dataset,
    handle_class_imbalance
)

from utils.logger import get_logger
from features.build_features import build_features
from features.feature_selector import (
    correlation_threshold,
    mutual_information_selection,
    save_feature_list
)
import os

def run_pipeline(config):
    logger = get_logger(config["logs"]["log_file"])

    # ---------------- LOAD DATA ---------------- #
    df = load_dataset(config["data"]["raw_path"])
    logger.info(f"Raw dataset shape: {df.shape}")

    df = drop_columns(df)
    df = handle_missing_values(df)
    df = clean_duration(df)
    df = process_date(df)
    df = encode_categorical(df)
    df = remove_duplicates(df)
    df = remove_outliers_zscore(df, config["outliers"]["threshold"])

    # ---------------- FEATURE ENGINEERING ---------------- #
    df = build_features(df, config)
    logger.info(f"Dataset shape after feature engineering: {df.shape}")

    # ---------------- FEATURE SELECTION ---------------- #
    X = df.drop(config["target_column"], axis=1)
    y = df[config["target_column"]].fillna("unknown")  # safeguard for NaNs

    # Correlation-based filtering
    X, dropped_corr = correlation_threshold(X, threshold=0.9)

    # Mutual information selection
    X, selected_features = mutual_information_selection(X, y, top_k=20)

    # Save selected features
    os.makedirs("src/features", exist_ok=True)
    save_feature_list(selected_features, path="src/features/feature_list.json")
    logger.info(f"Selected top features: {selected_features}")

    # ---------------- SCALE & SPLIT ---------------- #
    df_selected = X.copy()
    df_selected[config["target_column"]] = y

    df_scaled = scale_features(df_selected, config["target_column"], config["scaling"]["method"])

    X_final = df_scaled.drop(config["target_column"], axis=1)
    y_final = df_scaled[config["target_column"]]

    X_train, X_val, X_test, y_train, y_val, y_test = split_dataset(X_final, y_final, config)
    logger.info("Dataset split into train, validation, and test sets")

    # ---------------- HANDLE CLASS IMBALANCE ---------------- #
    if config["class_imbalance"]["use_smote"]:
        X_train, y_train = handle_class_imbalance(X_train, y_train)
        logger.info("Class imbalance handled using SMOTE")

    logger.info("Pipeline completed successfully")