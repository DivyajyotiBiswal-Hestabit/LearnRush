
## 1. Overview

This report documents the Day 2 implementation of **Parameter-Efficient Fine-Tuning (PEFT)** using **QLoRA** on a healthcare instruction dataset.

The objective was to fine-tune a lightweight LLM in a **Colab environment** using memory-efficient techniques and save only adapter weights.

The model was trained to behave as a:

> Clinical Text Extraction + Symptom Reasoning Assistant

---

## 2. Model Used

- **Base Model:** Qwen/Qwen2.5-1.5B-Instruct  
- **Reason:**
  - Lightweight and Colab-friendly
  - Instruction-tuned base
  - Suitable for low-resource fine-tuning

---

## 3. Training Setup

Training was performed in **Google Colab (GPU enabled)**.

### Libraries Used
- transformers
- peft
- accelerate
- bitsandbytes
- datasets
- trl

---

## 4. Fine-Tuning Method

### Approach
- **PEFT (Parameter Efficient Fine-Tuning)**
- **QLoRA (LoRA on 4-bit quantized model)**

### Key Components
- LoRA adapters applied to attention layers
- Base model frozen
- Only adapter parameters trained

---

## 5. Quantization (BitsAndBytes)

The model was loaded using **4-bit quantization**:

- Quantization type: **NF4**
- Double quantization: enabled
- Compute dtype: float16

### Benefits
- Reduced GPU memory usage
- Enabled training on Colab GPU
- Faster experimentation

---

## 6. LoRA Configuration

```text
r = 16
lora_alpha = 32
lora_dropout = 0.05
target_modules = ["q_proj", "v_proj"]
bias = none
task_type = CAUSAL_LM

---

## 7. Training Hyperparameters

- Learning Rate: 2e-4
- Batch Size: 4
- Epochs: 3
- Max Length: 256
- Precision: fp16
- Gradient Checkpointing: Enabled

### 8. Inference Testing

A healthcare prompt was tested after training.

Observation:
- Model responded in instruction format
- Some outputs required further tuning/validation
- Demonstrated successful integration of training pipeline

### 9. Conclusion

- QLoRA fine-tuning completed
- 4-bit model training achieved
- LoRA adapters applied correctly
- Memory-efficient training demonstrated
- Adapter weights saved