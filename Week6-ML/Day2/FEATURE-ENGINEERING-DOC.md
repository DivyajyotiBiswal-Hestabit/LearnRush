# 📌Feature Engineering 

##  Objective

The goal of feature engineering is to transform raw Netflix dataset attributes into meaningful numerical representations that improve model performance for predicting **content category**:

* `kids`
* `teen`
* `adult`
* `other`

---

##  Source Data

Input dataset:

```
src/data/processed/final.csv
```

Target column:

```
rating → mapped to → rating_group
```

---

##  Target Transformation

The original `rating` column is mapped into 4 categories:

| Rating Values           | Group |
| ----------------------- | ----- |
| TV-Y, TV-Y7, TV-G, G    | kids  |
| PG, TV-PG, PG-13, TV-14 | teen  |
| R, NC-17, TV-MA         | adult |
| NR, UR                  | other |

---

##  Feature Engineering Pipeline

Feature engineering is implemented in:

```
src/features/build_features.py
```

---

#  Feature Categories

---

## 1️ Genre-Based Features

Derived from `listed_in` column.

### 🔹 Binary Genre Flags

Each genre is converted into a binary indicator:

* `genre_kids`
* `genre_family`
* `genre_action`
* `genre_comedy`
* `genre_drama`
* `genre_horror`
* `genre_crime`
* `genre_romantic`
* `genre_international`

 Purpose:

* Captures content type explicitly
* Helps model learn genre-to-audience mapping

---

### 🔹 Genre Count

```
genre_count = number of genres in a title
```

 Purpose:

* More genres → more complex content

---

### 🔹 Genre Frequency

```
listed_in_freq = frequency of genre combinations
listed_in_freq_log = log-transformed frequency
```

 Purpose:

* Popular genres influence prediction
* Log transform reduces skew

---

## 2️ Kids & Maturity Signals

### 🔹 Kids Keywords Features

Based on predefined keywords:

```
KIDS_WORDS = ["family", "kids", "school", "adventure", "animated", "friendship"]
```

Features:

* `has_kids_words`
* `kids_score`
* `is_kids_like`

 Purpose:

* Detect child-friendly content beyond ratings

---

### 🔹 Mature Content Detection

Based on:

```
MATURE_WORDS = ["murder", "violence", "crime", "dark", "war", "killer"]
```

Feature:

* `has_mature_words`

 Purpose:

* Identify adult-oriented content

---

### 🔹 Short Kids Content

```
short_kids_content = (is_short_duration AND kids indicators)
```

 Purpose:

* Captures cartoons / short children's content

---

## 3️ Duration-Based Features

From `duration` column:

* `duration`
* `is_medium_duration`
* `is_long_duration`

 Purpose:

* Kids → shorter
* Adults → longer

---

## 4️ Text-Based Features

Derived from `title`, `description`:

* `text_len`
* `title_len`

 Purpose:

* Longer descriptions often indicate complex content

---

## 5️ Popularity / Frequency Features

From categorical columns:

* `director_freq`
* `cast_freq`
* `cast_count`
* `country_freq_log`

 Purpose:

* Popular actors/directors influence content type

---

## 6️ Temporal Features

From `date_added` and `release_year`:

* `release_year`
* `year_added`
* `month_added`
* `day_added`

 Purpose:

* Captures temporal trends in content

---

## 7️ Content Type Feature

* `is_movie`

 Purpose:

* Movies vs TV Shows behave differently

---

#  Removed Features (Correlation Reduction)

Highly correlated features were removed to avoid redundancy:

| Removed Feature   | Reason                        |
| ----------------- | ----------------------------- |
| listed_in_freq    | duplicate of log version      |
| country_freq      | replaced by log version       |
| is_short_duration | redundant with duration flags |
| release_decade    | redundant with release_year   |

 Benefit:

* Reduces multicollinearity
* Improves model generalization

---

#  Final Feature Set

Total features used:

```
30 features
```

Saved in:

```
src/features/feature_list.json
```

---

# 🔧 Feature Selection

Two-step selection process:

### 1. Correlation Filtering

* Remove features with correlation > threshold

### 2. Mutual Information

* Select top-K informative features

---

#  Why This Feature Engineering Works

### ✔ Captures Multiple Dimensions

* Content type → genres
* Audience signals → kids/mature indicators
* Structure → duration
* Context → time-based features
* Popularity → frequency encoding

---

### ✔ Handles Non-Linearity

* Log transformations
* Binary indicators
* Interaction features

---

### ✔ Improves Model Performance

* Reduced noise
* Reduced redundancy
* Better separability of classes

---

#  Summary

This feature engineering pipeline:

* Converts raw Netflix data into structured signals
* Extracts semantic meaning (kids vs adult content)
* Reduces dimensionality and correlation
* Produces a clean, optimized feature set for modeling

---

#  Related Files

```
src/features/build_features.py
src/features/feature_list.json
src/config/config.yaml
```

---

# Final Note

Feature engineering is the **most important part of this project** —
it directly impacts model performance more than algorithm choice.

---
