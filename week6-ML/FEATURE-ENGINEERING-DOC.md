# FEATURE ENGINEERING REPORT — DAY 2

## Feature Creation, Transformation & Selection

---

## 1. Objective

The objective of Day 2 was to transform the cleaned dataset into a **machine learning-ready feature set** by:

* Creating meaningful features
* Applying controlled transformations
* Encoding categorical variables
* Selecting the most relevant features
* Avoiding data leakage and overfitting

---

## 2. Pipeline Overview

Feature engineering is implemented in:

```text
src/features/build_features.py
src/features/feature_selector.py
```

Flow:

```text
Clean Data → Feature Engineering → Feature Selection → Save Features
```

---

## 3. Feature Engineering Techniques

### 3.1 Datetime Feature Extraction

The `date_added` column was processed to extract:

* `year_added`
* `month_added`
* `day_added`

Then the original column was removed.

Reason:

* Models cannot directly use raw datetime strings
* Extracted features capture temporal patterns

---

### 3.2 Numerical Transformations

Only **log transformation** was applied:

```python
df[f"{col}_log"] = np.log1p(df[col])
```

Reason:

* Reduces skewness
* Handles large value ranges
* Prevents over-expansion of features

⚠️ Note:
Square and square-root transformations were intentionally removed to avoid excessive feature generation and overfitting.

---

### 3.3 Categorical Encoding

Categorical variables were encoded using **Label Encoding**:

```python
LabelEncoder()
```

Reason:

* Converts categories into numerical form
* Efficient for tree-based models

Important:

* The **target column (`rating`) was excluded** from encoding to avoid leakage

---

### 3.4 Text Features (Optional)

TF-IDF vectorization module was implemented but not used:

```python
text_cols = []
```

Reason:

* Text features like `cast` and `director` can be high-dimensional
* Excluded to maintain model simplicity and stability

---

### 3.5 Additional Feature Engineering

Minimal feature generation was applied:

* Removed:

  * `numeric_sum` (global aggregation → potential leakage)
  * `duration_per_year` (derived from strong feature)

Reason:

* Avoid creating features that indirectly reveal the target
* Maintain realistic model performance

---

## 4. Data Leakage Prevention

Several steps were taken to prevent leakage:

* Removed target-derived features (e.g., `rating_len`)
* Excluded target column from transformations
* Dropped overly strong proxy features during modeling
* Avoided excessive feature combinations

---

## 5. Feature Selection

Feature selection was performed in two stages:

### 5.1 Correlation-Based Filtering

Highly correlated features (> 0.9) were removed:

```python
correlation_threshold()
```

Reason:

* Reduces redundancy
* Improves model generalization

---

### 5.2 Mutual Information Selection

Top features were selected using:

```python
mutual_info_classif()
```

* Top 20 features retained

Reason:

* Captures non-linear relationships
* Identifies most informative features

---

## 6. Final Feature Set

The selected features were saved in:

```text
src/features/feature_list.json
```

These features are used for:

* Model training
* Consistent inference pipeline

---

## 7. Design Decisions

### 7.1 Controlled Feature Expansion

* Limited transformations to avoid overfitting
* Avoided unnecessary polynomial features

---

### 7.2 Simplicity Over Complexity

* Prioritized stable, interpretable features
* Avoided high-dimensional text representations

---

### 7.3 Leakage Awareness

* Removed features that could indirectly encode the target
* Ensured transformations are independent of labels

---

## 8. Observations

* Excessive feature engineering can artificially inflate performance
* Simpler, controlled transformations lead to more realistic results
* Feature selection significantly reduces noise and improves model stability

---

## 9. Conclusion

The feature engineering pipeline successfully:

* Converts raw data into structured features
* Maintains data integrity
* Avoids leakage and overfitting
* Produces a robust feature set for model training


