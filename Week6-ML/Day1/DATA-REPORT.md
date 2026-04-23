# DATA REPORT — DAY 1

## Data Pipeline, Cleaning & Preprocessing

---

## 1. Objective

The objective of Day 1 was to build a **robust and reproducible data pipeline** that:

* Loads raw data
* Cleans and preprocesses it
* Handles missing values and duplicates
* Detects and removes outliers
* Prepares a structured dataset for downstream ML tasks

---

## 2. Dataset Overview

* Dataset: **Netflix Titles Dataset**
* Source: CSV file (`netflix_titles.csv`)
* Target (updated later in Day 3): `rating`
* Initial Features:

  * show_id
  * title
  * director
  * cast
  * country
  * date_added
  * release_year
  * rating
  * duration
  * listed_in
  * description

---

## 3. Pipeline Architecture

The data pipeline is implemented in:

```
src/pipelines/data_pipeline.py
```

It follows a structured flow:

```
Load → Clean → Transform → Encode → Remove Outliers → Save
```

---

## 4. Data Loading

The dataset is loaded using Pandas:

```python
df = pd.read_csv(path)
```

This allows efficient handling of structured tabular data.

---

## 5. Data Cleaning

### 5.1 Dropping Irrelevant Columns

The following columns were removed:

* `show_id` (unique identifier)
* `title` (non-informative for modeling)
* `description` (high-cardinality text)

Reason:

* These features do not contribute effectively to structured ML models.

---

### 5.2 Removing Duplicates

Duplicate rows were removed using:

```python
df.drop_duplicates()
```

This prevents bias and data leakage during training.

---

## 6. Handling Missing Values

Missing values were handled column-wise:

* **Numerical columns** → filled with median
* **Categorical columns** → filled with mode

Example:

```python
if numeric:
    fill with median
else:
    fill with mode
```

Reason:

* Median is robust to outliers
* Mode preserves category distribution

---

## 7. Feature Transformations

### 7.1 Date Processing

The `date_added` column was:

* Stripped of extra spaces
* Converted to datetime
* Extracted into:

  * `year_added`
  * `month_added`

Then the original column was dropped.

Reason:

* Date components are more useful than raw strings.

---

### 7.2 Duration Cleaning

The `duration` column originally contained strings such as:

```
"90 min", "2 Seasons"
```

It was cleaned using regex to extract numeric values:

```python
df["duration"] = df["duration"].str.extract(r"(\d+)")
```

Converted to numeric format for modeling.

---

## 8. Categorical Encoding

Categorical features were encoded using **Label Encoding**:

```python
LabelEncoder()
```

Reason:

* Converts categories into numeric form
* Suitable for tree-based models and pipelines

---

## 9. Outlier Detection & Removal

Outliers were removed using **IQR method**:


## 10. Data Scaling

Features were scaled using:

* **StandardScaler** (default)

```python
X_scaled = scaler.fit_transform(X)
```

Reason:

* Normalizes feature distribution
* Important for models like Logistic Regression and Neural Networks

---

## 11. Data Splitting

The dataset was split into:

* Training set: 70%
* Validation set: 15%
* Test set: 15%

Using stratified sampling:

```python
train_test_split(..., stratify=y)
```

Reason:

* Preserves class distribution across splits

---

## 12. Class Imbalance Handling

SMOTE was used for balancing classes.


---

## 13. Output

The processed dataset is saved to:

```
src/data/processed/final.csv
```



