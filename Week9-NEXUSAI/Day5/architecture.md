# NEXUS AI — Architecture Document

## 1. System Overview

NEXUS AI is a **Planner–Executor multi-agent system** built on the following design principles:

- **Separation of concerns** — each agent has exactly one responsibility
- **DAG-based execution** — tasks form a dependency graph, not a linear chain
- **Memory-first design** — every agent retrieves relevant context before acting
- **Feedback loops** — Critic + Optimizer implement continuous self-improvement
- **Observable by default** — every event is logged and traced

---

## 2. High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         USER / CLI                          │
└─────────────────────────┬───────────────────────────────────┘
                          │  goal string
                          ▼
┌─────────────────────────────────────────────────────────────┐
│                       NexusAI (main.py)                     │
│  • Session management                                       │
│  • Pipeline orchestration                                   │
│  • Result aggregation                                       │
└──┬──────────┬──────────┬──────────┬──────────┬───────────── ┘
   │          │          │          │          │
   ▼          ▼          ▼          ▼          ▼
 Orch.    Planner    DAG Exec   Critic/Opt  Reporter
   │          │          │          │          │
   └──────────┴──────────┴──────────┴──────────┘
                          │
              ┌───────────▼───────────┐
              │      Agent Factory    │
              │  registry pattern     │
              └───────────┬───────────┘
                          │ instantiates
          ┌───────────────┼───────────────┐
          ▼               ▼               ▼
      Researcher        Coder          Analyst
      Validator      (more agents)    (etc.)
          │               │               │
          └───────────────┼───────────────┘
                          ▼
              ┌───────────────────────┐
              │      GroqClient       │
              │  (OpenAI-compatible)  │
              └───────────────────────┘
                          │
              ┌───────────▼───────────┐
              │     Memory Manager    │
              │  ┌─────────────────┐  │
              │  │ Short-term dict │  │
              │  ├─────────────────┤  │
              │  │  FAISS index    │  │
              │  ├─────────────────┤  │
              │  │  Session log    │  │
              │  └─────────────────┘  │
              └───────────────────────┘
```

---

## 3. DAG Execution Model

### 3.1 Plan Generation

The **PlannerAgent** receives the user goal and produces a JSON array:

```json
[
  { "name": "market_research",     "agent": "researcher", "deps": [],                  "prompt": "..." },
  { "name": "technical_stack",     "agent": "researcher", "deps": [],                  "prompt": "..." },
  { "name": "mvp_code",            "agent": "coder",      "deps": ["technical_stack"],  "prompt": "..." },
  { "name": "business_analysis",   "agent": "analyst",    "deps": ["market_research"],  "prompt": "..." },
  { "name": "final_strategy",      "agent": "analyst",    "deps": ["business_analysis", "mvp_code"], "prompt": "..." }
]
```

### 3.2 Graph Structure

```
market_research ──────────────► business_analysis ─► final_strategy
technical_stack ──► mvp_code ────────────────────────────────────────►
```

- Nodes with no pending dependencies → **ready queue**
- Nodes execute as soon as their deps complete
- Failed nodes trigger retry (up to `max_retries=2`), then skip dependents

### 3.3 Node Lifecycle

```
PENDING → RUNNING → SUCCESS
                 ↘ FAILED (retry) → PENDING (retry < max)
                               ↘ FAILED (exhausted) → dependents: SKIPPED
```

---

## 4. Memory Architecture

### 4.1 Three-tier memory

| Tier | Store | Scope | Persistence |
|------|-------|-------|-------------|
| Short-term | Python dict | Current process | In-memory only |
| Long-term | FAISS IndexFlatIP | All sessions | `data/memory/faiss.index` |
| Session | JSON file | Per session | `data/memory/sessions.json` |

### 4.2 Memory flow

```
Agent.run(task)
    │
    ├─1. recall_as_context(task)
    │      └─► FAISS search (top-5, threshold=0.70)
    │          └─► Format as bullet list → injected into system prompt
    │
    ├─2. get_history_as_string()
    │      └─► Last 8 messages from session log
    │
    ├─3. [execute LLM call with injected context]
    │
    └─4. summarise_and_store(output)
           └─► Extractive 3-sentence summary
               └─► Embedded + stored in FAISS
```

### 4.3 Embedding strategy

```
SentenceTransformer (preferred)          TF-IDF fallback
    all-MiniLM-L6-v2                     Built-in pure Python
    dim=384                              dim=384 (zero-padded)
    L2-normalised                        Cosine similarity
    stored as float32                    stored as float32
```

---

## 5. Self-Reflection & Improvement Loop

```
Agent produces output
         │
         ▼
  BaseAgent.reflect(task, output)
         │
         ▼
  LLM self-scores 0-10 + suggests ONE improvement
         │
         ▼
  CriticAgent reviews all outputs
         │
         ▼
  OptimizerAgent applies feedback (up to 2 iterations)
         │
         ▼
  ValidatorAgent gates the result
         │
    PASS / FAIL
```

---

## 6. Agent Communication Pattern

Agents do **not** call each other directly. Communication happens through:

1. **DAG context** — `dag.get_context_for_node(id)` passes predecessor outputs
2. **Memory** — agents share knowledge via FAISS
3. **Orchestrator calls** — main pipeline passes outputs between stages

This design avoids tight coupling and makes each agent independently testable.

---

## 7. Observability Stack

### 7.1 Logs (`logs/nexus.log`)

```
2024-01-15 10:23:41 | INFO     | nexus.orchestrator  | [orchestrator] ✅ SUCCESS (2.3s) — Plan a startup...
2024-01-15 10:23:44 | INFO     | nexus.planner       | DAG built: 5 nodes, 4 edges
2024-01-15 10:23:51 | INFO     | nexus.coder         | Code saved → outputs/code/plan_a_startup.py
```

### 7.2 Traces (`logs/trace.jsonl`)

Every event is one JSON line:

```json
{"event":"TASK_START","agent":"researcher","task":"Market analysis for AI healthcare","session_id":"session_20240115_102341_abc123","ts":"2024-01-15T10:23:41Z"}
{"event":"DAG_SUCCESS","node":"a1b2c3d4","details":{"duration_s":3.2,"preview":"## Market Research\n..."},"session_id":"...","ts":"..."}
{"event":"REFLECTION","agent":"coder","score":8.5,"feedback":"Add type hints to all functions","session_id":"...","ts":"..."}
{"event":"MEMORY_SEARCH","query":"healthcare AI startup","hits":3,"session_id":"...","ts":"..."}
```

---

## 8. Failure Recovery

```
Node fails
    │
    ├─► OrchestratorAgent.recover_failure(node, reason)
    │       └─► LLM generates recovery strategy
    │
    ├─► Retry counter < max_retries?
    │       YES → reset to PENDING, re-queue
    │       NO  → mark FAILED, skip dependents
    │
    └─► Log error to trace + nexus.log
```

---

## 9. Scalability Considerations

- **Horizontal**: Each agent can run in a separate process/thread — just share MemoryManager
- **Parallel DAG**: Ready nodes at the same level can run concurrently (add `ThreadPoolExecutor`)
- **Memory scale**: Replace FAISS flat index with `IndexIVFFlat` for 1M+ vectors
- **Model routing**: `config.py` MODELS dict allows routing by task complexity
- **Caching**: Add Redis for LLM response caching on identical prompts