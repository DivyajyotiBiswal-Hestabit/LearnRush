# src/features/build_features.py

import pandas as pd
import numpy as np
from sklearn.preprocessing import OneHotEncoder, LabelEncoder
from sklearn.feature_extraction.text import TfidfVectorizer

# ---------------- FEATURE ENGINEERING ---------------- #

def extract_datetime_features(df, date_column="date_added"):
    """
    Safely extract year, month, day features from a datetime column.
    If column doesn't exist or is already numeric, skip .dt.
    """
    if date_column in df.columns:
        if not np.issubdtype(df[date_column].dtype, np.number):
            df[date_column] = pd.to_datetime(df[date_column], errors="coerce")
            df["year_added"] = df[date_column].dt.year
            df["month_added"] = df[date_column].dt.month
            df["day_added"] = df[date_column].dt.day
            df = df.drop(columns=[date_column])
    return df

def numerical_transformations(df, numeric_cols):
    """
    Apply log, sqrt, and square transformations to numeric columns.
    """
    for col in numeric_cols:
        df[f"{col}_log"] = np.log1p(df[col].fillna(0))
        df[f"{col}_sqrt"] = np.sqrt(df[col].fillna(0))
        df[f"{col}_square"] = np.power(df[col].fillna(0), 2)
    return df

def encode_categorical_features(df, categorical_cols, method="label"):
    """
    Encode categorical features. Supports label encoding and one-hot encoding.
    """
    df_copy = df.copy()
    
    if method == "label":
        encoder = LabelEncoder()
        for col in categorical_cols:
            df_copy[col] = df_copy[col].fillna("unknown")
            df_copy[col] = encoder.fit_transform(df_copy[col].astype(str))
    elif method == "onehot" and categorical_cols:
        ohe = OneHotEncoder(sparse=False, drop="first")
        encoded = ohe.fit_transform(df_copy[categorical_cols].fillna("unknown"))
        ohe_df = pd.DataFrame(encoded, columns=ohe.get_feature_names_out(categorical_cols))
        df_copy = pd.concat([df_copy.drop(columns=categorical_cols), ohe_df], axis=1)
    
    return df_copy

def text_vectorization(df, text_cols, max_features=50):
    """
    Apply TF-IDF vectorization to text columns. Fill NaNs with empty strings.
    """
    for col in text_cols:
        df[col] = df[col].fillna("")
        tfidf = TfidfVectorizer(max_features=max_features)
        vec = tfidf.fit_transform(df[col].astype(str))
        tfidf_df = pd.DataFrame(vec.toarray(), columns=[f"{col}_tfidf_{i}" for i in range(vec.shape[1])])
        df = pd.concat([df.drop(columns=[col]), tfidf_df], axis=1)
    return df

def generate_additional_features(df):
    """
    Generate extra features like ratios, text length, numeric sums.
    """
    if "duration" in df.columns and "year_added" in df.columns:
        df["duration_per_year"] = df["duration"].fillna(0) / df["year_added"].replace(0, 1)

    if "rating" in df.columns:
        df["rating_len"] = df["rating"].fillna("unknown").astype(str).apply(len)

    numeric_cols = df.select_dtypes(include=np.number).columns
    df["numeric_sum"] = df[numeric_cols].sum(axis=1)
    
    return df

def build_features(df, config):
    """
    Main feature engineering pipeline for Day 2.
    """
    # datetime features
    df = extract_datetime_features(df, date_column="date_added")
    
    # numerical transformations
    numeric_cols = df.select_dtypes(include=np.number).columns.tolist()
    df = numerical_transformations(df, numeric_cols)
    
    # categorical encoding
    categorical_cols = df.select_dtypes(include="object").columns.tolist()
    df = encode_categorical_features(df, categorical_cols, method="label")
    
    # text vectorization (optional)
    text_cols = []  # e.g., add 'cast', 'director' if needed
    df = text_vectorization(df, text_cols, max_features=50)
    
    # additional features
    df = generate_additional_features(df)
    
    # Fill remaining NaNs just in case
    df = df.fillna(0)
    
    return df