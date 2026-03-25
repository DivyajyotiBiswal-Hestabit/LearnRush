# RAG Architecture — Day 1 (Local Ingestion + Retrieval Pipeline)

## 1. Objective

The goal of Day 1 is to build the **retrieval backbone of a Retrieval-Augmented Generation (RAG) system**.

This includes:

* Loading enterprise documents
* Cleaning and structuring text
* Splitting into meaningful chunks
* Generating semantic embeddings locally
* Indexing embeddings for fast similarity search
* Retrieving relevant context for user queries

This pipeline forms the **foundation for later stages**, where a generator (LLM) will use retrieved context to produce answers.

---

## 2. Supported Data Sources

The ingestion pipeline supports the following document formats:

* **PDF** — multi-page documents (page-aware extraction)
* **TXT** — plain text files
* **DOCX** — structured documents
* **CSV** — tabular data converted to text

> Note: Image files (JPG/PNG) are excluded in Day 1 and handled in Day 3 (Image RAG).

---

## 3. System Architecture Overview

```
Raw Documents
      ↓
Document Loaders
      ↓
Text Cleaning
      ↓
Chunking (with overlap)
      ↓
Metadata Tagging
      ↓
Embedding Generation (local)
      ↓
FAISS Vector Index
      ↓
Retriever (Query → Similar Chunks)
```

---

## 4. Data Ingestion Pipeline

### 4.1 Document Loading

Each file is processed using format-specific loaders:

* PDF → extracted page-wise
* TXT/DOCX → full text extraction
* CSV → converted into structured text

Each document is converted into a uniform structure:

```
{
  "text": "...",
  "page_number": <optional>
}
```

---

### 4.2 Text Cleaning

Cleaning removes noise and normalizes text:

* extra whitespace removal
* newline normalization
* null character cleanup

This ensures consistent chunking and embedding quality.

---

### 4.3 Chunking Strategy

Text is split into overlapping chunks to preserve context.

**Configuration:**

* Chunk size: **600 tokens**
* Overlap: **100 tokens**

**Why overlap is important:**

* Prevents loss of context at chunk boundaries
* Improves retrieval quality for long documents

---

### 4.4 Metadata Tagging

Each chunk is enriched with metadata:

```
{
  "chunk_id": "...",
  "source_file": "...",
  "page_number": ...,
  "tags": [...],
  "text": "..."
}
```

Metadata enables:

* traceability (where the answer came from)
* future filtering (e.g., document type, domain)
* explainability of results

---

## 5. Embedding Generation

### Model Used

* **BGE-small (BAAI/bge-small-en-v1.5)**

### Reason for Selection

Originally, GTE-base was planned. However, due to runtime instability in the local environment, BGE-small was used to ensure reliable execution while maintaining semantic performance.

### Embedding Details

* Output dimension: **384**
* Normalized embeddings used
* Max sequence length capped at **512 tokens**

---

## 6. Vector Store (FAISS)

### Index Type

* **FAISS IndexFlatIP (Inner Product)**

### Why this works

* Embeddings are normalized → inner product ≈ cosine similarity
* Fast and efficient for local semantic search

### Stored Components

* Vector embeddings
* Metadata (stored separately as JSON)

---

## 7. Retriever Design

### Query Flow

```
User Query
    ↓
Query Embedding
    ↓
FAISS Similarity Search
    ↓
Top-K Results Returned
```

### Output Example

Each retrieved result contains:

* similarity score
* source file
* page number
* chunk ID
* chunk text

---

## 8. Observations from Testing

* Relevant chunks (e.g., `people-1000.csv`) are correctly ranked highest for matching queries
* Some semantically related but less precise results may appear in top-k

### Reason

Semantic search prioritizes similarity, not exact matching.

### Future Improvement

* metadata filtering
* hybrid search (BM25 + vector)
* reranking models

---

## 9. System Strengths

* Fully local pipeline (no dependency on external APIs)
* Modular architecture (easy to extend)
* Supports multiple document formats
* Metadata-aware retrieval
* Scalable to large datasets

---


## 12. Conclusion

Day 1 successfully implements the **retrieval backbone of a RAG system**.

The system can:

* ingest enterprise documents
* convert them into structured chunks
* generate embeddings locally
* store them in a vector index
* retrieve relevant context for user queries

