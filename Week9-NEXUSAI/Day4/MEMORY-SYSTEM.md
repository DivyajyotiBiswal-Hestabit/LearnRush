# MEMORY-SYSTEM.md
## Day 4 — Agent Memory System

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        Agent (AutoGen + Mistral)                │
└────────────────────────────┬────────────────────────────────────┘
                             │  query
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                       Memory Manager                            │
│                                                                 │
│   ┌─────────────────┐  ┌──────────────────┐  ┌──────────────┐  │
│   │  Session Memory │  │  Vector Store    │  │  Long-Term   │  │
│   │  (in-process)   │  │  (FAISS)         │  │  (SQLite)    │  │
│   │                 │  │                  │  │              │  │
│   │  • Sliding      │  │  • Semantic      │  │  • Episodic  │  │
│   │    window       │  │    similarity    │  │    memory    │  │
│   │  • Current      │  │    search        │  │  • Semantic  │  │
│   │    conversation │  │  • Persistent    │  │    facts     │  │
│   │  • AutoGen msg  │  │    FAISS index   │  │  • Full-text │  │
│   │    formatting   │  │  • Fact + chunk  │  │    search    │  │
│   └─────────────────┘  │    storage       │  └──────────────┘  │
│                         └──────────────────┘                   │
└─────────────────────────────────────────────────────────────────┘
                             │  context block
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│               Mistral LLM (via AutoGen / OpenAI-compat API)     │
│                       Generates response                        │
└─────────────────────────────────────────────────────────────────┘
```

---

## Memory Types

### 1. Short-Term Memory — `session_memory.py`

| Property | Detail |
|---|---|
| Storage | Python list (in-process) |
| Lifetime | Current process / session |
| Capacity | Configurable sliding window (default 20 turns) |
| Eviction | Oldest turns dropped when window overflows |
| Format | AutoGen-compatible `{"role": ..., "content": ...}` dicts |

**Episodic vs Semantic distinction here:** Session memory is purely *episodic* — it records *what happened* in this conversation in order.

```python
sm = SessionMemory(max_turns=20, system_prompt="You are helpful.")
sm.add("user", "My name is Alice.")
sm.add("assistant", "Hello Alice!")
messages = sm.to_autogen_messages(inject_context="[recalled facts here]")
```

---

### 2. Vector Memory — `vector_store.py`

| Property | Detail |
|---|---|
| Storage | FAISS `IndexFlatL2` (exact k-NN, persisted to disk) |
| Encoding | `sentence-transformers/all-MiniLM-L6-v2` (384-dim) |
| Retrieval | k Nearest Neighbours by L2 distance |
| Persistence | `memory/faiss_index.bin` + `memory/faiss_metadata.json` |

**Episodic vs Semantic distinction here:** The vector store holds both:
- **Semantic chunks** — facts, knowledge snippets (`source="fact"`)
- **Episodic summaries** — past session summaries (`source="episodic"`)

```python
store = FAISSVectorStore(persist_dir="memory")
store.add("User's name is Alice.", source="fact")
store.add("We discussed FAISS yesterday.", source="episodic")

# Recall at query time
context = store.get_context_block("Who is the user?", k=3)
# → injects into system prompt
```

---

### 3. Long-Term Memory — `long_term.py` → `memory/long_term.db`

| Property | Detail |
|---|---|
| Storage | SQLite (WAL mode) |
| Tables | `episodic_memory`, `semantic_memory` |
| Querying | Keyword search + structured filters (topic, confidence) |
| Persistence | Survives process restarts indefinitely |

#### Episodic Memory table
Stores full session transcripts with a short summary.
```sql
id, session_id, content (full transcript), summary, created_at, metadata
```

#### Semantic Memory table
Stores extracted facts with confidence scoring.
```sql
id, fact, topic, confidence, created_at, updated_at, metadata
```

```python
ltm = LongTermMemory("memory/long_term.db")

# Save an episode after a session ends
ltm.save_episode(content=transcript, session_id="sess_001", summary="...")

# Store a fact
ltm.upsert_fact("User prefers Python.", topic="user_profile", confidence=0.95)

# Search
ltm.search_facts("Python")        # keyword search
ltm.get_facts(topic="user_profile")  # structured query
```

---

## Query Flow (End-to-End)

```
User sends: "What programming languages do I like?"
                          │
                          ▼
         MemoryManager.prepare_messages(query)
                          │
             ┌────────────┴──────────────┐
             │                           │
             ▼                           ▼
   VectorStore.search()          (session history
   "What programming languages   already in window)
    do I like?"
             │
    Returns top-4 similar chunks:
    • "User prefers Python over JS"  (fact, dist=0.12)
    • "Discussion about FastAPI"     (episodic, dist=0.31)
             │
             ▼
   Context block injected into system prompt:
   "[Recalled memories]
    [1] User prefers Python over JS (fact, 2024-05-01)
    [2] Discussion about FastAPI    (episodic, 2024-04-30)"
             │
             ▼
   AutoGen sends full message list to Mistral API
             │
             ▼
   Mistral generates: "Based on what you've told me,
                       you enjoy Python especially for..."
             │
             ▼
   MemoryManager.record_response(reply)
   MemoryManager.extract_and_learn_facts(user_message)
             │
             ▼
   New facts → FAISS + SQLite
```

---
