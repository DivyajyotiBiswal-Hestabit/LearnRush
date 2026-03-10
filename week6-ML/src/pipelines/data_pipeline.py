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


def run_pipeline(config):

    logger = get_logger(config["logs"]["log_file"])

    df = load_dataset(config["data"]["raw_path"])

    logger.info(f"Dataset shape {df.shape}")

    df = drop_columns(df)

    df = handle_missing_values(df)

    df = clean_duration(df)

    df = process_date(df)

    df = encode_categorical(df)

    df = remove_duplicates(df)

    df = remove_outliers_zscore(df, config["outliers"]["threshold"])

    df = scale_features(
        df,
        config["target_column"],
        config["scaling"]["method"]
    )

    df.to_csv(config["data"]["processed_path"], index=False)

    logger.info("Processed dataset saved")

    X = df.drop(config["target_column"], axis=1)
    y = df[config["target_column"]]

    X_train, X_val, X_test, y_train, y_val, y_test = split_dataset(X, y, config)

    if config["class_imbalance"]["use_smote"]:
        X_train, y_train = handle_class_imbalance(X_train, y_train)

    logger.info("Pipeline completed")