## 1. Overview

This report documents the quantisation of a fine-tuned LLM into multiple formats.

The goal was to reduce model size and improve inference efficiency while maintaining acceptable output quality.

The model was converted into:
- FP16 (baseline)
- INT8
- INT4
- GGUF (llama.cpp format)

---

## 2. Why Quantisation

Quantisation reduces numerical precision of model weights to achieve:

- Lower memory usage
- Faster inference (in some setups)
- Better deployability on low-resource systems

Trade-off:
- Reduced precision → slight quality degradation

---

## 3. Quantisation Methods Used

### FP16
- Full precision baseline
- Highest memory usage
- Best output quality

### INT8
- 8-bit quantisation using BitsAndBytes
- Balanced performance
- Moderate memory reduction

### INT4
- 4-bit quantisation (NF4)
- Aggressive compression
- Slight quality degradation

### GGUF
- Converted using llama.cpp
- Optimized for CPU inference
- Smallest footprint

---

## 4. Results

| Format | Size (MB) | Speed (sec) | Quality |
|--------|-----------|-------------|---------|
| FP16   | 2955.33   | 3.78        | Moderate|
| INT8   | 1697.44   | 9.87        | Good    |
| INT4   | 1148.37   | 4.67        | Best    |
| GGUF   | 1570.29   | 4.6         | Good    |

---

## 5. Observations

- FP16 showed the fastest inference in this Colab setup
- INT8 introduced additional overhead, resulting in slower inference
- INT4 provided a good balance between memory and speed
- GGUF significantly reduced model size and enabled CPU-friendly deployment
- Quantisation does not always guarantee speed improvement depending on hardware and backend

---

## 6. Memory vs Accuracy Trade-off

| Precision | Memory  | Speed   | Accuracy |
|---------- |-------- |---------|----------|
| FP16      | High    | Fast    | Moderate |
| INT8      | Medium  | Slower  | Good     |  
| INT4      | Lowest  | Moderate| Best     |
| GGUF      | Low     | Moderate| Good     |

---

## 7. llama.cpp and GGUF

The model was converted to GGUF format using llama.cpp.

### Benefits:
- Enables CPU inference
- No GPU required
- Lightweight deployment
- Suitable for edge environments

---

## 9. Conclusion

Quantisation was successfully applied across multiple formats.

Key takeaways:
- INT8 provides a balanced trade-off
- INT4 offers strong compression with acceptable quality
- GGUF is best suited for deployment scenarios
- QLoRA + quantisation enables efficient LLM deployment on limited hardware

---

## 10. Final Verdict

This step successfully demonstrates:

- Model compression
- Performance comparison
- Deployment readiness

The model is now ready for:
- optimized inference
- CPU deployment (GGUF)
- production serving in constrained environments