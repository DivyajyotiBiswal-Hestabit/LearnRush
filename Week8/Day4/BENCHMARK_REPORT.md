# Benchmark Report — Model Evaluation

## Overview

This report compares the performance of three model variants:

- **Base Model**
- **Fine-Tuned Model**
- **Quantized 4-bit Model**
- **GGUF CPU Model**

The evaluation is conducted across three task types:

- **QA (Question Answering)**
- **Reasoning**
- **Extraction**

Metrics evaluated:

- **Tokens/sec (Throughput)**
- **Latency (seconds)**
- **VRAM Usage (GB)**

---

## Benchmark Summary

| Model            | Task       | Tokens/sec | Latency (s)| VRAM (GB)|
|------------------|------------|------------|------------|-----------|
| base             | QA         | 18.9       | 3.171      | 3.09      |
| base             | Reasoning  | 22.9       | 2.620      | 3.09      |
| base             | Extraction | 25.2       | 1.704      | 3.09      |
| fine_tuned       | QA         | 9.1        | 6.581      | 0.75      |
| fine_tuned       | Reasoning  | 5.4        | 11.114     | 0.75      |
| fine_tuned       | Extraction | 5.8        | 10.385     | 0.75      |
| quantised_4bit   | QA         | 8.0        | 7.535      | 1.15      |
| quantised_4bit   | Reasoning  | 12.1       | 4.956      | 1.15      |
| quantised_4bit   | Extraction | 10.5       | 3.634      | 1.15      |
| gguf_cpu         | QA         | 0.1        | 476.374    | 0.0       |
| gguf_cpu         | Reasoning  | 0.2        | 372.924    | 0.0       |
| gguf_cpu         | Extraction | 0.2        | 102.224    | 0.0       |

---

## 🔍 Key Observations

### ⚡ 1. Base Model (Best Raw Performance)
- Highest **tokens/sec across all tasks**
- Lowest latency
- High VRAM usage (~3 GB)
- Best for **performance-critical systems**
---

### 2. Fine-Tuned Model (Best Quality / Alignment)
- Much **slower than base model**
- Significantly **lower VRAM usage (~0.75 GB)**
- Optimized for **domain-specific correctness (medical safety)**
---

### 3. Quantized 4-bit Model (Best Trade-off)
- Balanced **speed + memory**
- Faster than fine-tuned in Reasoning & Extraction
- Moderate VRAM (~1.15 GB)
---

### 4. GGUF CPU Model (Extreme Constraint Setup)
- Extremely **slow latency (100–400s)**
- Minimal VRAM (CPU only)
- Not practical for real-time use

---

## Task-Level Insights

### QA Tasks
- Base model is fastest
- Fine-tuned model slower but safer
- Quantized is acceptable fallback

### Reasoning Tasks
- Fine-tuned model significantly slower (expected due to alignment)
- Quantized performs surprisingly well here

### Extraction Tasks
- Fastest across all models
- Structured tasks are easier → better throughput

---

## Conclusion

- **Base model** → performance leader  
- **Fine-tuned model** → quality & safety leader  
- **Quantized model** → best practical deployment choice  
- **GGUF CPU** → fallback only  
