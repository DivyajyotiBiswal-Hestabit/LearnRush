# Netflix Dataset EDA Report

**Dataset:** `netflix_titles.csv`  
**Number of rows:** 7787  
**Number of columns:** 12  

---

## 1️⃣ Column Overview

| Column Name     | Data Type | Missing Values | Notes |
|-----------------|-----------|----------------|-------|
| show_id         | object    | 0              | Unique identifier, dropped in processing |
| type            | object    | 0              | Categorical (Movie / TV Show) |
| title           | object    | 0              | Dropped in processing |
| director        | object    | 2173           | Missing values filled with mode |
| cast            | object    | 1673           | Missing values filled with mode |
| country         | object    | 299            | Missing values filled with mode |
| date_added      | datetime  | 0 (after cleaning) | Converted to year_added, month_added |
| release_year    | int64     | 0              | Numeric |
| rating          | object    | 0              | Categorical, encoded later |
| duration        | object    | 0              | Cleaned to numeric (`duration_clean`) |
| listed_in       | object    | 0              | Multi-category, encoded later |
| description     | object    | 0              | Dropped in processing |

---

## 2️⃣ Missing Values Heatmap

- `director`, `cast`, and `country` had missing values.
- All missing values were imputed using **mode** for categorical and **median** for numeric features.

![Missing Values Heatmap](figures/missing_values_heatmap.png)

---

## 3️⃣ Feature Distributions

### Numeric Features

- `release_year`:

![Release Year Distribution](figures/release_year_dist.png)

- `duration_clean`:

![Duration Distribution](figures/duration_dist.png)

### Categorical Features

- `type`:

![Type Distribution](figures/type_dist.png)

- `rating`:

![Rating Distribution](figures/rating_dist.png)

---

## 4️⃣ Target Distribution

- If we consider `type` as target:

![Target Distribution](figures/target_dist.png)

- Classes are **imbalanced** (more Movies than TV Shows), so SMOTE was applied during training.

---

## 5️⃣ Correlation Matrix

- Only numeric features (`release_year`, `duration_clean`, `year_added`, `month_added`) were included.
- `duration_clean` and `release_year` have low correlation with each other.

![Correlation Matrix](figures/correlation_matrix.png)

---

## 6️⃣ Observations

1. `director` and `cast` have many missing values — might require careful handling in modeling.  
2. `duration` is only meaningful for Movies; for TV Shows, it may represent number of seasons.  
3. Dataset has **class imbalance** (`type`), handled via SMOTE.  
4. Many categorical features need encoding (`rating`, `listed_in`, `country`).  
5. No extreme numeric outliers after Z-score/IQR filtering.  

---

**EDA Complete:** Dataset is clean, scaled, and ready for **train/validation/test split** and further modeling.