
## Overview

This project implements a **hybrid memory system** for an AI assistant.
It combines:

* **Session Memory** → short-term conversation context
* **Vector Memory (FAISS)** → semantic knowledge retrieval
* **Long-Term Memory (SQLite)** → persistent Q&A storage

The goal is to make the AI:

* Context-aware
* Consistent across conversations
* Capable of recalling relevant past knowledge

---

## Memory Components

### 1. Session Memory (Short-Term)

**File:** `session_memory.py`

* Stores recent conversation (last N messages)
* Acts like a sliding window
* Helps in maintaining immediate context

```python
window_size = 10
```

**Use Case:**

* Follow-up questions
* “Explain again”
* Conversation continuity

---

### 2. Vector Memory (Semantic Memory)

**File:** `vector_store.py`

* Uses:

  * `SentenceTransformer (all-MiniLM-L6-v2)`
  * `FAISS IndexFlatL2`
* Stores **summarized knowledge as embeddings**
* Retrieves based on **semantic similarity**

### Retrieval Logic

* Encode query → vector
* Search FAISS index
* Apply filters:

  * Distance threshold (`dist < 0.6`)
  * Keyword overlap check

```python
if dist > 0.6: continue
if match < 2: continue
```

**Use Case:**

* Concept recall
* Similar question matching
* Knowledge reuse

---

### 3. Long-Term Memory (Persistent Memory)

**File:** `long_term.py`

* Uses SQLite database
* Stores:

  * User query
  * Summarized response

### Retrieval Logic

* Fetch recent entries
* Match query words with past queries
* Require minimum overlap:

```python
common = query_words & q_words
if len(common) >= 2:
```

**Use Case:**

* Exact or near-exact question recall
* Reinforcing previous learning

---

## Memory Flow

### 1. User Input

```text
User → Query
```

---

### 2. Memory Retrieval

* Vector DB → semantic matches
* Long-term DB → keyword matches

```text
Vector Memory + Long-Term Memory → Combined Context
```

---

### 3. Filtering (IMPORTANT)

* Remove irrelevant memory
* Remove:

  * “explain again” patterns
  * meta AI responses

---

### 4. LLM Response

```text
System Prompt + Memory Context + Query → Response
```

---

### 5. Storage Pipeline

#### Step 1: Summarization

* Extract **only factual knowledge**
* No conversational/meta content

#### Step 2: Store

* Vector DB → embedding
* Long-term DB → query + summary

---

## Special Handling

### "Explain Again"

* NEVER stored in memory
* Uses `last_response` instead

```python
if query.lower() in ["explain again", "repeat", "again"]:
    # use last_response
```

---

## Memory Cleaning Rules

The system avoids storing:

* AI behavior instructions
* “when user asks...” patterns
* generic explanation templates

---



## Final Behavior

| Scenario              | Behavior                |
| --------------------- | ----------------------- |
| New question          | Fresh answer            |
| Similar past question | Uses memory             |
| Explain again         | Uses last response only |
| Irrelevant memory     | Ignored                 |

---




