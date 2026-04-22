
## Execution Flow
 
```
User Query
    │
    ▼
┌─────────────────────────────┐
│     ORCHESTRATOR/PLANNER    │
│  orchestrator/planner.py    │
│                             │
│  1. generate_task_graph()   │  ← Decomposes query into DAG tasks
│  2. build_waves()           │  ← Topological sort → parallel waves
│  3. Coordinates all agents  │
└────────────┬────────────────┘
             │  Task Graph (DAG)
             ▼
┌─────────────────────────────┐
│      WORKER AGENTS          │
│  agents/worker_agent.py     │
│                             │
│  Wave 1 (parallel):         │
│  ┌────────┐  ┌────────┐     │
│  │  t1    │  │  t2    │     │  ← asyncio.gather
│  └────────┘  └────────┘     │
│                             │
│  Wave 2 (after Wave 1):     │
│  ┌────────┐                 │
│  │  t3    │                 │  ← depends_on t1, t2
│  └────────┘                 │
└────────────┬────────────────┘
             │  All task results
             ▼
┌─────────────────────────────┐
│      REFLECTION AGENT       │
│  (inline in planner.py)     │
│                             │
│  Synthesizes all worker     │
│  outputs into one answer    │
└────────────┬────────────────┘
             │  Synthesized answer
             ▼
┌─────────────────────────────┐
│      VALIDATOR AGENT        │
│  agents/validator.py        │
│                             │
│  Checks relevance +         │
│  completeness               │
│  passed=false → correction  │
└────────────┬────────────────┘
             │
             ▼
        Final Answer ✔
```
 
## DAG Task Graph
 
```
t1 (no deps) ──┐
               ├──► t3 (depends on t1, t2)
t2 (no deps) ──┘
 
Wave 1: [t1, t2]  →  run in parallel
Wave 2: [t3]      →  run after Wave 1
```
 
## Execution Tree (JSON response shape)
 
```json
{
  "query": "...",
  "task_graph": [
    {"id": "t1", "description": "...", "depends_on": []},
    {"id": "t2", "description": "...", "depends_on": []},
    {"id": "t3", "description": "...", "depends_on": ["t1", "t2"]}
  ],
  "stages": [
    {"stage": "workers",    "waves": [["t1","t2"], ["t3"]]},
    {"stage": "reflection", "output": "..."},
    {"stage": "validation", "output": {"passed": true, "issues": [], "answer": "..."}}
  ],
  "final_answer": "...",
  "validation_passed": true
}
```

 
 