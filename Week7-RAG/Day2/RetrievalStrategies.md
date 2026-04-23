# RETRIEVAL STRATEGIES — DAY 2 (ADVANCED RETRIEVAL)

## 1. Objective

The goal of Day 2 is to improve retrieval quality in a RAG system by introducing advanced techniques such as hybrid search, reranking, diversity optimization, and context engineering.

The focus is on:
- improving precision
- reducing hallucination
- ensuring traceability of retrieved evidence

---

## 2. Why Advanced Retrieval is Needed

Basic semantic retrieval (vector similarity) has limitations:

- may miss exact keyword matches
- can retrieve semantically similar but irrelevant chunks
- often returns redundant chunks
- lacks ranking based on query-specific importance

To solve this, we introduce advanced retrieval strategies.

---

## 3. Hybrid Retrieval (Semantic + Keyword)

### Definition

Hybrid retrieval combines:

- Semantic search (embeddings)
- Keyword search (BM25 or term matching)

### Why it matters

- Semantic search captures meaning
- Keyword search captures exact matches

### Example

Query:
```
"credit underwriting policy 2024"
```

- Semantic search → finds related financial concepts  
- Keyword search → ensures exact match of "2024" and "policy"

### Implementation Strategy

```
final_score = α * semantic_score + (1 - α) * keyword_score
```

Where:
- α controls importance of semantic vs keyword

---

## 4. Reranking

### Definition

Reranking reorders retrieved results using a more accurate scoring method.

### Types

#### 4.1 Cosine Reranking
- Uses embedding similarity again but on a smaller set
- Faster but less precise

#### 4.2 Cross-Encoder Reranking
- Evaluates (query, document) pair together
- More accurate but slower

### Why it matters

Initial retrieval may return:
- loosely relevant chunks
- partially relevant chunks

Reranking ensures:
- best matches are placed at top

---

## 5. Max Marginal Relevance (MMR)

### Definition

MMR balances:
- relevance to query
- diversity among results

### Problem solved

Without MMR:
- top results may be very similar (duplicates)

With MMR:
- results are diverse and cover different aspects

### Formula

```
MMR = λ * relevance - (1 - λ) * similarity_to_selected
```

Where:
- λ controls relevance vs diversity

---

## 6. Chunk Deduplication

### Definition

Removing duplicate or near-duplicate chunks from retrieval results.

### Why it matters

- prevents repeated information
- improves context quality
- reduces token waste in LLM input

### Techniques

- exact text match removal
- similarity threshold filtering
- hash-based deduplication

---

## 7. Metadata Filtering

### Definition

Filtering documents based on metadata before retrieval.


### Why it matters

- reduces search space
- improves relevance
- enables enterprise-level querying

---

## 8. Context Engineering

### Definition

Selecting and structuring retrieved chunks before sending to the LLM.

### Key Factors

#### 8.1 Top-K Selection
- choose best k results
- balance between coverage and noise

#### 8.2 Ordering
- most relevant first

#### 8.3 Chunk Size Optimization
- avoid too large chunks (token overflow)
- avoid too small chunks (loss of context)

---

## 9. Reducing Hallucination

Advanced retrieval reduces hallucination by:

- grounding answers in retrieved evidence
- filtering irrelevant chunks
- improving ranking accuracy
- ensuring traceable sources

---

## 10. Retrieval Pipeline (Final Flow)

```
User Query
     ↓
Embedding Generation
     ↓
Semantic Retrieval (FAISS)
     ↓
Keyword Retrieval (BM25)
     ↓
Hybrid Score Combination
     ↓
Reranking
     ↓
MMR (diversity selection)
     ↓
Deduplication
     ↓
Metadata Filtering
     ↓
Context Builder
     ↓
LLM (Generator)
```

---



