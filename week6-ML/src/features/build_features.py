import pandas as pd
import numpy as np


GENRE_KEYWORDS = [
    "Drama", "Comedy", "Action", "Romantic", "Horror",
    "Documentaries", "Kids", "Family", "International", "Crime"
]

MATURE_WORDS = ["murder", "violence", "crime", "dark", "war", "killer"]
KIDS_WORDS = ["family", "kids", "school", "adventure", "animated", "friendship"]


def map_rating_group(value):
    val = str(value).strip().upper()

    kids = {"TV-Y", "TV-Y7", "TV-G", "G"}
    teen = {"PG", "TV-PG", "PG-13", "TV-14"}
    adult = {"R", "NC-17", "TV-MA"}
    other = {"NR", "UR"}

    if val in kids:
        return "kids"
    if val in teen:
        return "teen"
    if val in adult:
        return "adult"
    return "other"


def add_target_group(df, target_col):
    """
    Handles both cases:
    1. target_col itself is 'rating'
    2. target_col is a derived column like 'rating_group' and raw source is 'rating'
    """
    if target_col in df.columns:
        df[target_col] = df[target_col].apply(map_rating_group)
    elif "rating" in df.columns:
        df[target_col] = df["rating"].apply(map_rating_group)
    else:
        raise KeyError(
            f"Neither target column '{target_col}' nor raw source column 'rating' found in dataframe."
        )
    return df


def add_type_feature(df):
    if "type" in df.columns:
        df["is_movie"] = (df["type"].astype(str).str.lower() == "movie").astype(int)
        df["is_tv_show"] = (df["type"].astype(str).str.lower() == "tv show").astype(int)
    return df


def add_genre_features(df):
    if "listed_in" not in df.columns:
        return df

    listed = df["listed_in"].fillna("").astype(str)
    df["genre_count"] = listed.apply(lambda x: len([g for g in x.split(",") if g.strip()]))

    for genre in GENRE_KEYWORDS:
        col = f"genre_{genre.lower().replace(' ', '_')}"
        df[col] = listed.str.contains(genre, case=False, regex=False).astype(int)

    return df


def add_people_count_features(df):
    if "cast" in df.columns:
        df["cast_count"] = df["cast"].fillna("").astype(str).apply(
            lambda x: len([v for v in x.split(",") if v.strip()])
        )
    if "director" in df.columns:
        df["director_count"] = df["director"].fillna("").astype(str).apply(
            lambda x: len([v for v in x.split(",") if v.strip()])
        )
    if "country" in df.columns:
        df["country_count"] = df["country"].fillna("").astype(str).apply(
            lambda x: len([v for v in x.split(",") if v.strip()])
        )
    return df


def add_date_features(df):
    current_year = 2026

    if "release_year" in df.columns:
        df["release_age"] = current_year - df["release_year"]
        df["release_decade"] = (df["release_year"] // 10) * 10

    if "year_added" in df.columns and "release_year" in df.columns:
        df["years_to_platform"] = df["year_added"] - df["release_year"]

    return df


def add_duration_features(df):
    if "duration" in df.columns:
        df["duration"] = pd.to_numeric(df["duration"], errors="coerce")
        df["duration_log"] = np.log1p(df["duration"].fillna(0))
        df["is_short_duration"] = (df["duration"] <= 60).astype(int)
        df["is_medium_duration"] = ((df["duration"] > 60) & (df["duration"] <= 120)).astype(int)
        df["is_long_duration"] = (df["duration"] > 120).astype(int)
    return df


def add_text_features(df):
    for col in ["title", "description"]:
        if col not in df.columns:
            df[col] = ""

    title_text = df["title"].fillna("").astype(str)
    desc_text = df["description"].fillna("").astype(str)
    combined = (title_text + " " + desc_text).str.lower()

    df["title_len"] = title_text.str.len()
    df["description_len"] = desc_text.str.len()
    df["text_len"] = combined.str.len()

    df["has_mature_words"] = combined.apply(
        lambda x: int(any(word in x for word in MATURE_WORDS))
    )
    df["has_kids_words"] = combined.apply(
        lambda x: int(any(word in x for word in KIDS_WORDS))
    )

    if "genre_kids" in df.columns and "genre_family" in df.columns:
        df["kids_score"] = (
            df["has_kids_words"] +
            df["genre_kids"] +
            df["genre_family"]
        )
    else:
        df["kids_score"] = df["has_kids_words"]

    df["is_kids_like"] = (df["kids_score"] > 0).astype(int)

    if "duration" in df.columns:
        duration_num = pd.to_numeric(df["duration"], errors="coerce").fillna(0)
        df["short_kids_content"] = (
            (duration_num < 60) & (df["has_kids_words"] == 1)
        ).astype(int)

    return df


def add_frequency_features(df):
    for col in ["director", "cast", "country", "listed_in"]:
        if col in df.columns:
            freq = df[col].fillna("unknown").astype(str).value_counts()
            df[f"{col}_freq"] = df[col].fillna("unknown").astype(str).map(freq)
            df[f"{col}_freq_log"] = np.log1p(df[f"{col}_freq"])
    return df


def drop_correlated_features(df, config):
    """
    Drops correlated / redundant features listed in config.yaml
    Example:
    drop_correlated_features:
      - listed_in_freq
      - country_freq
      - is_short_duration
      - release_decade
    """
    cols_to_drop = config.get("drop_correlated_features", [])
    existing_cols_to_drop = [col for col in cols_to_drop if col in df.columns]

    if existing_cols_to_drop:
        df = df.drop(columns=existing_cols_to_drop)
        print(f"Dropped configured correlated features: {existing_cols_to_drop}")
    else:
        print("No configured correlated features found to drop.")

    return df


def finalize_features(df, target_col):
    # keep only target as raw categorical; convert remaining object cols safely
    object_cols = [c for c in df.select_dtypes(include="object").columns if c != target_col]

    # one-hot low-cardinality columns only
    low_card_cols = [c for c in object_cols if df[c].nunique() <= 15]
    if low_card_cols:
        df = pd.get_dummies(df, columns=low_card_cols, drop_first=True)

    # drop high-cardinality raw text cols after derived features
    drop_cols = [
        "title", "description", "director", "cast", "country",
        "listed_in", "type", "date_added", "duration_raw"
    ]

    # prevent leakage if target is derived from raw rating
    if target_col != "rating" and "rating" in df.columns:
        drop_cols.append("rating")

    df = df.drop(columns=drop_cols, errors="ignore")

    # fill remaining missing values
    for col in df.columns:
        if col == target_col:
            continue

        if pd.api.types.is_numeric_dtype(df[col]):
            df[col] = df[col].fillna(df[col].median())
        else:
            df[col] = df[col].fillna("unknown")

    return df


def build_features(df, config):
    target_col = config["target_column"]

    df = add_target_group(df, target_col)
    df = add_type_feature(df)
    df = add_genre_features(df)
    df = add_people_count_features(df)
    df = add_date_features(df)
    df = add_duration_features(df)
    df = add_text_features(df)
    df = add_frequency_features(df)

    
    df = drop_correlated_features(df, config)

    df = finalize_features(df, target_col)

    return df