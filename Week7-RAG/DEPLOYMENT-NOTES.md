# Week 7 — Capstone RAG System

## Deployment Notes

---

## Overview

This project implements a **production-style Retrieval-Augmented Generation (RAG) system** with:

* Text-based retrieval (Text RAG)
* Multimodal image reasoning (Image RAG)
* Natural language to SQL querying (SQL QA)
* Conversational memory
* Evaluation & hallucination detection
* Debug trace logging

---

## System Architecture

### Core Components

| Layer                | Description                                                 |
| -------------------- | ----------------------------------------------------------- |
| **API Layer**        | FastAPI (`app.py`) exposes `/ask`, `/ask-image`, `/ask-sql` |
| **LLM Layer**        | Local LLM (`Qwen2-1.5B-Instruct`)                           |
| **Retriever Layer**  | Hybrid retriever (text) + FAISS (image)                     |
| **Memory Layer**     | Local file-based memory (`memory_store.json`)               |
| **Evaluation Layer** | Context match, faithfulness, hallucination detection        |
| **Logging Layer**    | Chat logs (`CHAT-LOGS.json`) with trace                     |

---

##  Setup Instructions

### Create virtual environment

```bash
python3 -m venv venv
source venv/bin/activate
```

---

### Install dependencies

```bash
pip install -r requirements.txt
```

If not available:

```bash
pip install fastapi uvicorn streamlit transformers torch faiss-cpu pillow
```

---

### Run Backend API

```bash
PYTHONPATH=. uvicorn src.deployment.app:app --reload
```

API will start at:

```
http://127.0.0.1:8000
```

---

### Run Streamlit UI

```bash
streamlit run src/deployment/streamlit_app.py
```

UI will open in browser.

---

## API Endpoints

### `/ask` — Text RAG

* Input:

```json
{
  "query": "What is revenue growth?",
  "top_k": 5
}
```

* Features:

  * Retrieval + generation
  * Memory integration
  * Refinement loop
  * Evaluation

---

### `/ask-image` — Multimodal RAG

Supports 3 modes:

#### 1. Text → Image

```json
{
  "mode": "text_to_image",
  "query": "sales chart",
  "top_k": 5
}
```

#### 2. Image → Image

```json
{
  "mode": "image_to_image",
  "image_path": "path/to/image.jpg"
}
```

#### 3. Image → Text

```json
{
  "mode": "image_to_text",
  "image_path": "path/to/image.jpg",
  "question": "What does this image show?"
}
```

---

### `/ask-sql` — SQL QA

```json
{
  "query": "Show total sales in 2023"
}
```

* Generates SQL
* Executes against SQLite
* Returns results + summary

---

## Memory System

* Stores last **10 messages**
* File: `memory_store.json`
* Used in:

  * Prompt context
  * Multi-turn conversation

---

## Evaluation System

### Text & Image RAG

* Context Match Score
* Faithfulness Score
* Hallucination Detection
* Confidence Score

### SQL QA (Custom Evaluation)

* Based on:

  * SQL execution success
  * Result presence
  * Value grounding in answer

---

## Trace & Logging

Each request logs:

* Query
* Retrieved context
* Draft answer
* Final answer
* Evaluation scores
* Memory snapshot
* Timing metrics

Stored in:

```
CHAT-LOGS.json
```

---

## Performance Observability

Each response includes:

* Retrieval time
* Generation time
* Refinement time
* Total latency

---

## Final Note

This system demonstrates:

* End-to-end RAG pipeline design
* Multimodal reasoning
* Structured + unstructured data handling
* Evaluation + observability
* Production-style API architecture

---
