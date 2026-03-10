import pandas as pd
import numpy as np
import yaml
import hashlib

from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler, MinMaxScaler
from sklearn.preprocessing import LabelEncoder
from imblearn.over_sampling import SMOTE
from scipy import stats


# ---------------- CONFIG ---------------- #

def load_config(path):
    with open(path, "r") as f:
        return yaml.safe_load(f)


# ---------------- DATA LOADING ---------------- #

def load_dataset(path):
    df = pd.read_csv(path)
    return df


# ---------------- DATA CLEANING ---------------- #

def drop_columns(df):

    drop_cols = ["show_id", "title", "description"]

    df = df.drop(columns=drop_cols)

    return df


def remove_duplicates(df):
    return df.drop_duplicates()


# ---------------- MISSING VALUES ---------------- #

def handle_missing_values(df):

    for col in df.columns:

        # if column is numeric
        if pd.api.types.is_numeric_dtype(df[col]):
            df[col] = df[col].fillna(df[col].median())

        # if column is categorical
        else:
            df[col] = df[col].fillna(df[col].mode()[0])

    return df


# ---------------- FEATURE ENGINEERING ---------------- #

def process_date(df):

    # remove leading/trailing spaces
    df["date_added"] = df["date_added"].str.strip()

    # convert to datetime
    df["date_added"] = pd.to_datetime(df["date_added"], errors="coerce")

    # extract features
    df["year_added"] = df["date_added"].dt.year
    df["month_added"] = df["date_added"].dt.month

    # drop original column
    df = df.drop(columns=["date_added"])

    return df


def clean_duration(df):

    df["duration"] = df["duration"].str.extract(r"(\d+)")

    df["duration"] = df["duration"].astype(float)

    return df


# ---------------- ENCODING ---------------- #

def encode_categorical(df):

    encoder = LabelEncoder()

    categorical_cols = df.select_dtypes(include="object").columns

    for col in categorical_cols:

        df[col] = encoder.fit_transform(df[col].astype(str))

    return df


# ---------------- OUTLIER DETECTION ---------------- #

def remove_outliers_zscore(df, threshold):

    numeric_cols = df.select_dtypes(include=np.number)

    z = np.abs(stats.zscore(numeric_cols))

    df = df[(z < threshold).all(axis=1)]

    return df


def remove_outliers_iqr(df):

    numeric_cols = df.select_dtypes(include=np.number)

    for col in numeric_cols:

        Q1 = df[col].quantile(0.25)
        Q3 = df[col].quantile(0.75)

        IQR = Q3 - Q1

        lower = Q1 - 1.5 * IQR
        upper = Q3 + 1.5 * IQR

        df = df[(df[col] >= lower) & (df[col] <= upper)]

    return df


# ---------------- FEATURE SCALING ---------------- #

def scale_features(df, target, method):

    X = df.drop(target, axis=1)
    y = df[target]

    if method == "standard":
        scaler = StandardScaler()
    else:
        scaler = MinMaxScaler()

    X_scaled = scaler.fit_transform(X)

    X_scaled = pd.DataFrame(X_scaled, columns=X.columns)

    df = pd.concat([X_scaled, y.reset_index(drop=True)], axis=1)

    return df


# ---------------- DATA SPLITTING ---------------- #

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


# ---------------- CLASS IMBALANCE ---------------- #

def handle_class_imbalance(X, y):

    smote = SMOTE(random_state=42)

    X_res, y_res = smote.fit_resample(X, y)

    return X_res, y_res


# ---------------- DATASET VERSIONING ---------------- #

def dataset_hash(file_path):

    with open(file_path, "rb") as f:

        return hashlib.md5(f.read()).hexdigest()