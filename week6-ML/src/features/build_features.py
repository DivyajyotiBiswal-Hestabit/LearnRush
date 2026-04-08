import pandas as pd
import numpy as np


GENRE_KEYWORDS = [
    "Drama", "Comedy", "Action", "Romantic", "Horror",
    "Documentaries", "Kids", "Family", "International", "Crime"
]

MATURE_WORDS = [
    "murder", "violence", "crime", "dark", "war", "killer",
    "death", "revenge", "blood", "sexual", "drug", "gang"
]

KIDS_WORDS = [
    "family", "kids", "school", "adventure", "animated",
    "friendship", "magic", "animal", "fun", "children"
]


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
        type_lower = df["type"].fillna("").astype(str).str.lower()
        df["is_movie"] = (type_lower == "movie").astype(int)
    return df


def add_genre_features(df):
    if "listed_in" not in df.columns:
        return df

    listed = df["listed_in"].fillna("").astype(str)

    for genre in GENRE_KEYWORDS:
        col = f"genre_{genre.lower().replace(' ', '_')}"
        df[col] = listed.str.contains(genre, case=False, regex=False).astype(int)

    return df


def add_people_features(df):
    if "cast" in df.columns:
        df["cast_count"] = df["cast"].fillna("").astype(str).apply(
            lambda x: len([v.strip() for v in x.split(",") if v.strip()])
        )

    if "director" in df.columns:
        freq = df["director"].fillna("unknown").astype(str).value_counts()
        mapped = df["director"].fillna("unknown").astype(str).map(freq)
        df["director_freq_log"] = np.log1p(mapped)

    return df


def add_date_features(df):
    if "release_year" in df.columns:
        df["release_year"] = pd.to_numeric(df["release_year"], errors="coerce")

    if "year_added" in df.columns:
        df["year_added"] = pd.to_numeric(df["year_added"], errors="coerce")

    if "month_added" in df.columns:
        df["month_added"] = pd.to_numeric(df["month_added"], errors="coerce")

    if "release_year" in df.columns and "year_added" in df.columns:
        df["years_to_platform"] = df["year_added"] - df["release_year"]

    return df


def add_duration_features(df):
    if "duration" in df.columns:
        df["duration"] = pd.to_numeric(df["duration"], errors="coerce")
        df["is_long_duration"] = (df["duration"] > 120).astype(int)
    return df


def add_text_features(df):
    if "title" not in df.columns:
        df["title"] = ""
    if "description" not in df.columns:
        df["description"] = ""

    title_text = df["title"].fillna("").astype(str)
    desc_text = df["description"].fillna("").astype(str)
    combined = (title_text + " " + desc_text).str.lower()

    df["title_len"] = title_text.str.len()
    df["description_len"] = desc_text.str.len()

    df["has_kids_words"] = combined.apply(
        lambda x: int(any(word in x for word in KIDS_WORDS))
    )
    df["has_mature_words"] = combined.apply(
        lambda x: int(any(word in x for word in MATURE_WORDS))
    )

    return df


def drop_correlated_features(df, config):
    cols_to_drop = config.get("drop_correlated_features", [])
    existing_cols_to_drop = [col for col in cols_to_drop if col in df.columns]

    if existing_cols_to_drop:
        df = df.drop(columns=existing_cols_to_drop)
        print(f"Dropped configured correlated features: {existing_cols_to_drop}")
    else:
        print("No configured correlated features found to drop.")

    return df


def finalize_features(df, target_col):
    object_cols = [c for c in df.select_dtypes(include="object").columns if c != target_col]

    low_card_cols = [c for c in object_cols if df[c].nunique() <= 12]
    if low_card_cols:
        df = pd.get_dummies(df, columns=low_card_cols, drop_first=True)

    drop_cols = [
        "title",
        "description",
        "director",
        "cast",
        "country",
        "listed_in",
        "type",
        "date_added",
        "duration_raw"
    ]

    if target_col != "rating" and "rating" in df.columns:
        drop_cols.append("rating")

    df = df.drop(columns=drop_cols, errors="ignore")

    for col in df.columns:
        if col == target_col:
            continue

        if pd.api.types.is_numeric_dtype(df[col]):
            df[col] = df[col].fillna(df[col].median())
        else:
            df[col] = df[col].fillna("unknown")

    keep_cols = [target_col]

    preferred_features = [
        "genre_kids",
        "genre_family",
        "has_kids_words",
        "genre_crime",
        "genre_horror",
        "has_mature_words",
        "genre_comedy",
        "genre_action",
        "genre_drama",
        "genre_romantic",
        "genre_international",
        "duration",
        "is_long_duration",
        "release_year",
        "years_to_platform",
        "year_added",
        "month_added",
        "title_len",
        "description_len",
        "cast_count",
        "director_freq_log",
        "is_movie",
    ]

    for col in preferred_features:
        if col in df.columns:
            keep_cols.append(col)

    df = df[keep_cols].copy()
    return df


def build_features(df, config):
    target_col = config["target_column"]

    df = add_target_group(df, target_col)
    df = add_type_feature(df)
    df = add_genre_features(df)
    df = add_people_features(df)
    df = add_date_features(df)
    df = add_duration_features(df)
    df = add_text_features(df)
    df = drop_correlated_features(df, config)
    df = finalize_features(df, target_col)

    return df