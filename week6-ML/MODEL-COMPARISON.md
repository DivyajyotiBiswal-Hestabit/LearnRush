# MODEL COMPARISON REPORT

## 1. Objective

The goal of this project is to build a robust machine learning pipeline to predict the **content rating** of Netflix titles using structured and engineered features.

Initially, the target variable was **`type` (Movie vs TV Show)**. However, this resulted in near-perfect performance due to strong feature signals (e.g., duration, genre), making the task too trivial.

To ensure a more realistic and challenging problem, the target was updated to:

> **`rating` (multi-class classification)**

---

## 2. Dataset Characteristics

* Dataset: Netflix Titles Dataset
* Target: `rating`
* Problem Type: **Multi-class classification**
* Key Challenges:

  * High number of classes
  * Class imbalance (rare ratings)
  * Overlapping feature distributions

---

## 3. Models Evaluated

The following models were trained and evaluated:

1. Logistic Regression
2. Random Forest
3. Neural Network (MLPClassifier)
4. XGBoost

All models were trained using a unified pipeline with:

* Imputation
* Cross-validation (5-fold)
* Consistent evaluation metrics

---

## 4. Evaluation Metrics

The models were evaluated using:

* Accuracy
* Precision (weighted)
* Recall (weighted)
* F1 Score (weighted)
* ROC-AUC (One-vs-Rest)

---

## 5. Cross-Validation Results

| Model               | Accuracy | Precision | Recall   | F1 Score | ROC-AUC  |
| ------------------- | -------- | --------- | -------- | -------- | -------- |
| Logistic Regression | 0.44     | 0.39      | 0.44     | 0.36     | 0.76     |
| Random Forest       | 0.55     | 0.52      | 0.55     | 0.52     | 0.84     |
| Neural Network      | 0.46     | 0.44      | 0.46     | 0.44     | 0.79     |
| **XGBoost**         | **0.56** | **0.53**  | **0.56** | **0.53** | **0.89** |

---

## 6. Best Model Selection

The best model was selected based on **F1 Score**, which balances precision and recall for multi-class problems.

> **Selected Model: XGBoost**

### Test Performance:

* Accuracy: 0.56
* Precision: 0.54
* Recall: 0.56
* F1 Score: 0.54
* ROC-AUC: 0.89

---

## 7. Observations & Insights

### 7.1 Problem Difficulty

Predicting `rating` is significantly more challenging than predicting `type` because:

* It is a multi-class problem
* Classes are imbalanced
* Features do not strongly separate all categories

---

### 7.2 Model Behavior

* **Logistic Regression**

  * Underperforms due to linear assumptions
  * Struggles with complex feature interactions

* **Random Forest**

  * Captures non-linear relationships
  * Strong improvement over linear models

* **Neural Network**

  * Moderate performance
  * Requires more tuning for optimal results

* **XGBoost**

  * Best overall performer
  * Handles feature interactions and non-linearity effectively
  * Robust to noise and feature scaling

---

### 7.3 Metric Interpretation

* Accuracy is moderate (~56%), reflecting task difficulty
* ROC-AUC is high (~0.89), indicating strong class separation capability
* Weighted F1 Score provides a balanced evaluation across classes

---

## 8. Key Design Decisions

### 8.1 Target Selection

The target was changed from `type` to `rating` to:

* Avoid trivial classification
* Enable meaningful model comparison
* Reflect real-world ML complexity

---

### 8.2 Feature Engineering

* Controlled transformations (log only)
* Avoided excessive feature expansion
* Removed leakage-prone features

---

### 8.3 Class Imbalance Handling

SMOTE was disabled due to:

* Presence of rare classes with very few samples
* Risk of generating unreliable synthetic data

---

## 9. Conclusion

This project demonstrates a complete end-to-end ML pipeline with:

* Clean data preprocessing
* Thoughtful feature engineering
* Robust model comparison
* Realistic evaluation metrics

The final results reflect a **challenging, real-world classification problem**, where XGBoost performs best due to its ability to model complex relationships.

---

## 10. Future Improvements

* Hyperparameter tuning (GridSearch / Optuna)
* Feature importance analysis
* Dimensionality reduction (PCA)
* Handling rare classes more effectively
* Model explainability (SHAP)

---
