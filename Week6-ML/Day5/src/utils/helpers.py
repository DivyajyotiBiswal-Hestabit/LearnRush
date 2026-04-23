import pandas as pd
import numpy as np
import yaml
import hashlib

from sklearn.model_selection import train_test_split
from scipy import stats


def load_config(path):
    with open(path, "r") as f:
        return yaml.safe_load(f)


def load_dataset(path):
    return pd.read_csv(path)


def drop_columns(df):
    drop_cols = ["show_id"]
    return df.drop(columns=drop_cols, errors="ignore")


def remove_duplicates(df):
    return df.drop_duplicates()


def handle_missing_values(df):
    for col in df.columns:
        if pd.api.types.is_numeric_dtype(df[col]):
            df[col] = df[col].fillna(df[col].median())
        else:
            mode = df[col].mode()
            df[col] = df[col].fillna(mode.iloc[0] if not mode.empty else "unknown")
    return df


def process_date(df):
    if "date_added" in df.columns:
        df["date_added"] = df["date_added"].astype(str).str.strip()
        df["date_added"] = pd.to_datetime(df["date_added"], errors="coerce")
        df["year_added"] = df["date_added"].dt.year
        df["month_added"] = df["date_added"].dt.month
        df["day_added"] = df["date_added"].dt.day
    return df


def clean_duration(df):
    if "duration" in df.columns:
        df["duration_raw"] = df["duration"].astype(str)
        df["duration"] = df["duration_raw"].str.extract(r"(\d+)").astype(float)
    return df


def split_dataset(X, y, config):
    train_size = config["split"]["train_size"]
    val_size = config["split"]["val_size"]

    X_train, X_temp, y_train, y_temp = train_test_split(
        X,
        y,
        test_size=(1 - train_size),
        random_state=42,
        stratify=y
    )

    val_ratio = val_size / (val_size + config["split"]["test_size"])

    X_val, X_test, y_val, y_test = train_test_split(
        X_temp,
        y_temp,
        test_size=(1 - val_ratio),
        random_state=42,
        stratify=y_temp
    )

    return X_train, X_val, X_test, y_train, y_val, y_test


def dataset_hash(file_path):
    with open(file_path, "rb") as f:
        return hashlib.md5(f.read()).hexdigest()