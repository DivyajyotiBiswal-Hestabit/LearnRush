# MULTIMODAL RAG 

## 1. Objective

The goal of this module is to build a **Multimodal RAG (Retrieval-Augmented Generation) system** capable of handling images along with text.

The system processes images, extracts information, generates embeddings, and enables retrieval and question answering over visual data.

---

## 2. Learning Outcomes

This implementation demonstrates:

- Handling images inside a RAG pipeline
- Generating and storing vision embeddings
- Performing OCR extraction from images
- Generating image captions
- Supporting image similarity search
- Producing grounded answers from image evidence

---

## 3. Supported Input Types

The system supports ingestion of:

- PNG images
- JPG / JPEG images
- Scanned PDFs (converted into images)
- Forms and diagrams

---

## 4. System Outputs

For each image, the system generates:

- OCR text (via Tesseract)
- Caption (via BLIP)
- CLIP embedding (image vector)
- Metadata record
- Multimodal vector index entry (FAISS)

---

## 5. Architecture Overview

```
Raw Images / PDFs
        ↓
Image Preprocessing (OpenCV)
        ↓
OCR Extraction (Tesseract)
        ↓
Caption Generation (BLIP)
        ↓
CLIP Embedding Generation
        ↓
FAISS Multimodal Index
        ↓
Retriever + Generator (Qwen2)
```

---

## 6. Core Components

### 6.1 OCR (Tesseract)

- Extracts visible text from images
- Useful for forms, charts, and scanned documents
- Output quality depends on image clarity and preprocessing

---

### 6.2 Caption Generation (BLIP)

- Generates a natural-language description of the image
- Helps provide semantic context when OCR is insufficient
- Typically produces high-level descriptions, not detailed reasoning

---

### 6.3 CLIP Embeddings

- Maps images and text into a shared vector space
- Enables:
  - Text → Image retrieval
  - Image → Image retrieval

---

### 6.4 Multimodal Vector Database (FAISS)

- Stores normalized CLIP embeddings
- Enables fast similarity search
- Metadata stored separately (JSON)

---

### 6.5 Grounded Generator (Qwen2)

- Takes retrieved evidence:
  - OCR text
  - captions
  - similarity results
- Generates natural language answers
- Constrained to:
  - avoid hallucination
  - express uncertainty when needed

---

## 7. Query Modes

### 7.1 Text → Image

User query → CLIP text embedding → retrieve similar images

Example:

Query: "engineering diagram"  
→ returns matching diagrams

---

### 7.2 Image → Image

Input image → CLIP image embedding → retrieve similar images

Used for:

- duplicate detection
- visual similarity search

---

### 7.3 Image → Text Answer

Input image + question → retrieve evidence → generate answer

Pipeline:

Image → Retrieval → OCR + Caption → Qwen2 → Answer

Example:

Query: "What does this chart show?"  
→ system explains using OCR + caption

---

## 8. Grounded Answering Strategy

To reduce hallucination, the system:

- Uses only retrieved evidence
- Avoids guessing beyond OCR/caption
- Explicitly mentions uncertainty when:
  - OCR is noisy
  - labels are unclear

---


## 11. Why This Is Multimodal RAG

The system combines:

- Vision (image embeddings via CLIP)
- Language (OCR + captions)
- Retrieval (FAISS index)
- Generation (Qwen2)

This enables cross-modal understanding:

- text ↔ image
- image ↔ text

---

