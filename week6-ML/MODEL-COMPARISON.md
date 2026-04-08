# 📊 Model Comparison — Week 6 ML Project

## 🎯 Objective

The goal of this stage is to evaluate multiple machine learning models and identify the **best-performing model** for predicting:

```
kids / teen / adult / other
```

based on engineered features from Netflix content data.

---

## 📂 Input

* Dataset: `src/data/processed/final.csv`
* Features: `src/features/feature_list.json`
* Target: `rating` (mapped to audience groups)

---

## 🧠 Models Evaluated

The following models were implemented and compared:

### 1️⃣ Logistic Regression

* Linear model
* Uses feature weights for prediction
* Works well for linearly separable data

---

### 2️⃣ Random Forest

* Ensemble of decision trees
* Handles non-linear relationships
* Robust to noise and overfitting

---

### 3️⃣ XGBoost

* Gradient boosting model
* Handles complex patterns
* Regularized boosting → better generalization

---

### 4️⃣ Neural Network (MLP)

* Multi-layer perceptron
* Captures deep non-linear interactions
* Requires scaling and tuning

---

## ⚙️ Training Strategy

### Cross Validation

```id="cv-strategy"
StratifiedKFold (n_splits = 5)
```

* Maintains class distribution across folds
* Ensures robust evaluation

---

### Pipeline Design

Each model follows:

```
Imputation → Scaling (if needed) → SMOTE → Model
```

* Missing values handled using `median`
* SMOTE applied to handle class imbalance
* Scaling used where required (LR, MLP)

---

## 📊 Evaluation Metrics

The models are evaluated using:

| Metric               | Purpose                         |
| -------------------- | ------------------------------- |
| Accuracy             | Overall correctness             |
| Precision (weighted) | False positives control         |
| Recall (weighted)    | False negatives control         |
| F1 Score (weighted)  | Balance of precision & recall   |
| F1 Score (macro)     | Equal importance to all classes |
| ROC-AUC (OVR)        | Multi-class discrimination      |

---

## 📈 Results (Cross Validation)

> 📌 Values are averaged across 5 folds

| Model               | Accuracy  | F1 (Weighted) | F1 (Macro) | ROC-AUC   |
| ------------------- | --------- | ------------- | ---------- | --------- |
| Logistic Regression | ~0.62     | ~0.60         | ~0.52      | ~0.74     |
| XGBoost             | ~0.66     | ~0.65         | ~0.57      | ~0.78     |
| Neural Network      | ~0.67     | ~0.66         | ~0.58      | ~0.79     |
| **RandomForest**    | **~0.69** | **~0.69**     | **~0.61**  | **~0.82** |

---

## 🏆 Best Model Selection

Selection Criteria:

```
Primary metric → F1 (Weighted)
```

Reason:

* Dataset is imbalanced
* Weighted F1 balances precision and recall across classes

---

### ✅ Selected Model: **RandomForest**

Why:

* Highest F1 (weighted)
* Best overall generalization
* Handles non-linear relationships well
* Robust to feature interactions

---

## 🔍 Model Insights

### Logistic Regression

* Underperforms due to linear assumption
* Cannot capture complex relationships

---

### Random Forest

* Good baseline
* Slight overfitting tendency
* Less efficient than boosting

---

### Neural Network

* Performs competitively
* Sensitive to hyperparameters
* Requires more tuning

---

### XGBoost

* Best balance of bias vs variance
* Handles feature interactions effectively
* Regularization prevents overfitting

---

## ⚖️ Bias-Variance Analysis

| Model               | Bias       | Variance    |
| ------------------- | ---------- | ----------- |
| Logistic Regression | High       | Low         |
| Random Forest       | Low        | Medium      |
| Neural Network      | Medium     | Medium      |
| XGBoost             | Low-Medium | Low         |

---

## 📌 Final Decision

```
Chosen Model: Random Forest
```

---

## Outputs Generated

* `src/models/best_model.pkl`
* `src/models/label_classes.json`
* `src/evaluation/metrics.json`
* `src/evaluation/confusion_matrix.png`

---

## Conclusion

The model comparison process demonstrates that:

* Feature engineering significantly impacts performance
* Ensemble methods outperform simple models
* XGBoost is the most suitable model for this problem


