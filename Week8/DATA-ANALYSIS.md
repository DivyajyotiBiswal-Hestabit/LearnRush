### 1. Dataset Overview

This dataset is designed for instruction tuning of a healthcare-focused LLM assistant with the capability to:

-Understand clinical-style text
-Extract structured health information
-Provide safe, non-diagnostic symptom reasoning
-Explain healthcare concepts in a patient-friendly manner

The dataset is intentionally built with a safety-first approach, avoiding diagnosis and treatment recommendations.

### 2. Objective

The goal of this dataset is to train a model that can act as a:

Clinical Text Extraction + Symptom Reasoning Assistant

The model is expected to:

-Extract structured information from clinical text
-Interpret symptom combinations safely
-Provide educational healthcare responses
-Avoid medical decision-making or prescriptions

### 3. Domain Selection

Domain: Healthcare (General Clinical + Symptom Understanding)

Why Healthcare?
-Real-world applicability
-High need for structured understanding of clinical text
-Strong use-case for extraction + reasoning tasks
-Safety Consideration

The dataset avoids:

-Diagnosis
-Prescription
-Medical certainty

Instead, it focuses on:

-“may be associated with…”
-“not enough to make a diagnosis…”
-“consult a healthcare professional…”

### 4. Dataset Structure

Format: JSONL

Each sample follows:

{"instruction":"...", "input":"...", "output":"..."}


### 5. Task Categories

The dataset contains 3 instruction types:

1. QA (Question Answering)

-Healthcare concept explanation
-Symptom explanation
-Preventive health knowledge
-Clinical terminology

2. Reasoning

-Symptom pattern interpretation
-Severity and duration-based reasoning
-Clinical note understanding
-Age/vitals-aware reasoning

3. Extraction

-Symptom extraction
-Duration/severity extraction
-Demographics extraction
-Vitals extraction
-Full structured clinical parsing


### 6. Final Dataset Distribution

| Category   | Count    |
| ---------- | -------- |
| QA         | 350      |
| Reasoning  | 350      |
| Extraction | 400      |
| **Total**  | **1100** |


### 7. Data Cleaning Strategy

A custom data_cleaner.py pipeline was used.

Cleaning Steps:

-Removed invalid JSON records
-Removed empty or malformed samples
-Normalized whitespace and formatting
-Removed unsafe medical outputs
-Removed repetitive or noisy samples
-Deduplicated exact matches

Safety Filters:

The dataset explicitly removes:

-Prescription instructions
-Dosage suggestions
-Direct diagnosis statements
-Overconfident claims

### 8. Tokenization Strategy

Tokenizer used:

Qwen/Qwen2.5-1.5B-Instruct


### 9. Token Length Analysis

Overall Full Prompt Tokens

Metric	Value

-Min	35
-Max	151
-Mean	85.96
-Median	68
-P90	135
-P95	139
-P99	144


Category-wise Insights

QA

-Short, concise responses
-Mean tokens ≈ 54

Reasoning

-Rich explanatory outputs
-Mean tokens ≈ 120

Extraction

-Structured outputs
-Mean tokens ≈ 83

### 10. Outlier Analysis

-Longest samples ≈ 150 tokens
-No extreme outliers detected
-P95 ≈ 139 tokens → acceptable


### 11. Train / Validation Split

-Split	Count
-Train	990
-Validation	110

Category Balance Maintained:

-QA: 315 / 35
-Reasoning: 315 / 35
-Extraction: 360 / 40

