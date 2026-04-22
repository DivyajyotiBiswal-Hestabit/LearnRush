# 🧠 NEXUS AI — Autonomous Multi-Agent System

> **Day 5 Capstone** — Production-grade autonomous AI system powered by **Groq (LLaMA 3.3)** with 9 specialized agents, DAG-based execution, FAISS persistent memory, and full observability.

---

## ✨ Features

| Capability | Implementation |
|------------|----------------|
| Multi-agent orchestration | 9 agents via AgentFactory + registry pattern |
| DAG-based planning | NetworkX DAG with topological execution |
| Tool use | File I/O, CSV analysis, code saving |
| Persistent memory | FAISS vector store (cross-session recall) |
| Session memory | Full conversation log (JSON) |
| Similarity-based recall | Cosine similarity via FAISS / TF-IDF fallback |
| Self-reflection | Every agent scores + critiques its own output |
| Self-improvement | Critic → Optimizer feedback loop |
| Multi-step planning | Planner decomposes goals into ordered DAG |
| Role switching | Agents can adopt alternate personas mid-task |
| Logs + Tracing | Structured logs + JSONL trace file |
| Failure recovery | Auto-retry + Orchestrator recovery strategies |

---

## 🗂️ Directory Structure

```
nexus_ai/
├── main.py                  # Entry point + NexusAI class
├── config.py                # All configuration
├── __init__.py
│
├── agents/
│   ├── base_agent.py        # Abstract base with reflection, memory, tracing
│   ├── agents.py            # All 9 specialized agents
│   └── registry.py          # Agent factory + registry
│
├── memory/
│   └── memory_manager.py    # FAISS + session store + short-term dict
│
└── utils/
    ├── dag.py               # DAG builder + executor
    ├── llm_client.py        # Groq API wrapper
    └── logger.py            # Structured logger + JSONL tracer

logs/
├── nexus.log                # Full application log
└── trace.jsonl              # Per-event JSONL trace

outputs/
├── code/                    # Auto-saved generated code
├── reports/                 # Final markdown reports
└── charts/                  # (reserved for future chart outputs)

data/
└── memory/
    ├── faiss.index          # Persistent vector index
    ├── metadata.json        # Memory metadata sidecar
    └── sessions.json        # Full conversation history
```

---

## 🚀 Quick Start

### 1. Install dependencies

```bash
pip install openai networkx numpy sentence-transformers faiss-cpu
# Optional (better embeddings):
# pip install sentence-transformers
```

### 2. Set your Groq API key

```bash
export GROQ_API_KEY="gsk_your_key_here"
# Get a free key at: https://console.groq.com
```

### 3. Run a demo task

```bash
cd /path/to/project
python -m nexus_ai.main --demo 1      # Plan a healthcare AI startup
python -m nexus_ai.main --demo 2      # Backend architecture
python -m nexus_ai.main --demo 3      # Business strategy from CSV
python -m nexus_ai.main --demo 4      # RAG pipeline design
```

### 4. Run your own task

```bash
python -m nexus_ai.main --task "Design a recommendation engine for e-commerce"
```

### 5. Generate code directly

```bash
python -m nexus_ai.main --code "FastAPI REST API with JWT auth and SQLAlchemy" --lang python
```

### 6. Analyse a CSV

```bash
python -m nexus_ai.main --csv sales_data.csv --task "Identify top revenue opportunities"
```

### 7. Interactive mode

```bash
python -m nexus_ai.main
# NEXUS> Plan a fintech startup targeting Gen Z
```

---

## 🐍 Python API

```python
from nexus_ai.main import NexusAI

nexus = NexusAI(api_key="gsk_...", session_id="my_project")

# Full pipeline
result = nexus.run("Plan a startup in AI for healthcare")

# Quick queries
answer  = nexus.ask("What is a transformer model?", agent="researcher")
code    = nexus.write_code("Build a Redis cache wrapper in Python")
insight = nexus.analyse_csv(open("data.csv").read())

# Access agents directly
plan   = nexus.planner.run("Design a SaaS billing system")
report = nexus.reporter.run("Summarise our Q3 findings", agent_outputs={...})
```

---

## 🤖 The 9 Agents

| Agent | Role |
|-------|------|
| **Orchestrator** | Routes tasks, manages agent lifecycle, drives DAG |
| **Planner** | Decomposes goals into DAG of sub-tasks |
| **Researcher** | Deep knowledge synthesis and fact gathering |
| **Coder** | Writes and saves production-quality code |
| **Analyst** | Data analysis + business intelligence |
| **Critic** | Reviews outputs, scores quality, flags issues |
| **Optimizer** | Applies critic feedback to improve outputs |
| **Validator** | Final gate — certifies readiness |
| **Reporter** | Compiles final polished reports |

---

## 🧠 Memory Architecture

```
Query
  │
  ├─► Short-term dict  (current session, in-memory)
  │
  ├─► FAISS vector store  (all sessions, disk-persistent)
  │      • Sentence-Transformers embeddings (or TF-IDF fallback)
  │      • Cosine similarity search
  │      • Threshold-filtered recall
  │
  └─► Session log JSON  (full conversation history)
```

Memory is **automatically injected** into every agent's system prompt via `recall_as_context()`.

---

## 📊 Execution Flow

```
User Goal
    │
    ▼
Orchestrator — analyses goal, sets strategy
    │
    ▼
Planner — produces JSON DAG plan
    │
    ▼
DAG Executor — runs agents in topological order
    │  (each node: run → reflect → store memory)
    │
    ▼
Critic — reviews all outputs
    │
    ▼
Optimizer — improves based on feedback
    │
    ▼
Validator — certifies quality
    │
    ▼
Reporter — compiles final report (saved to outputs/reports/)
```

---

## ⚙️ Configuration

Edit `nexus_ai/config.py`:

```python
# Models
MODELS = {
    "fast":     "llama-3.1-8b-instant",
    "balanced": "llama-3.3-70b-versatile",
    "powerful": "llama-3.3-70b-versatile",
}

# Memory
TOP_K_RECALL     = 5      # memories recalled per query
MEMORY_THRESHOLD = 0.70   # similarity threshold

# DAG
MAX_PLAN_DEPTH   = 6      # max sub-tasks per plan
PLAN_RETRY_LIMIT = 3      # retries on failed nodes
```

---

## 📁 Outputs

- **Code** → `outputs/code/*.py` (auto-saved by CoderAgent)
- **Reports** → `outputs/reports/*.md` (auto-saved by ReporterAgent)
- **Logs** → `logs/nexus.log` (structured text)
- **Traces** → `logs/trace.jsonl` (one JSON record per event)

---

## 🔧 Requirements

```
openai>=1.0          # Groq uses OpenAI-compatible API
networkx>=3.0        # DAG execution
numpy>=1.24          # Embeddings math
faiss-cpu>=1.7       # (optional) faster vector search
sentence-transformers>=2.2  # (optional) better embeddings
pandas>=2.0          # CSV analysis
```

---

## 📝 License

MIT — built for learning and production use.