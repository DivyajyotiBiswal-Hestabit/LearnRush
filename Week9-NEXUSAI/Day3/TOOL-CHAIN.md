# TOOL-CHAIN.md
## Day 3 — Tool-Calling Agents (Code, Files, Database, Search)

---

## 1. Core Concept: Agents Using Real Tools

An agent without tools can only *reason*. With tools it can *act* on the real world:
- Execute code → get real output
- Query a database → get real data
- Read/write files → persist and retrieve information

AutoGen enables this via **function calling**: the LLM decides *which* tool to call and *with what arguments*, then the framework executes the Python function and feeds the result back.

```
User Query
    │
    ▼
Agent (LLM reasons)
    │
    ├─► Tool call: execute_python("import pandas...")
    │       └─► Python runs → output returned
    │
    ├─► Tool call: run_sql("SELECT ...")
    │       └─► SQLite executes → rows returned
    │
    └─► Tool call: read_csv("sales.csv")
            └─► File read → contents returned
```

---

## 2. How Function Calling Works (Without External APIs)

AutoGen implements function calling locally:

```python
# 1. Define tool schema (tells LLM what's available)
TOOLS = [{
    "type": "function",
    "function": {
        "name": "execute_python",
        "description": "Execute Python code and return output",
        "parameters": { ... }
    }
}]

# 2. Register actual Python function on the proxy
proxy.register_function(function_map={"execute_python": execute_python})

# 3. LLM decides to call it → AutoGen dispatches → result fed back
agent = ConversableAgent(llm_config={**LLM_CONFIG, "tools": TOOLS})
```

No OpenAI, no external API. The local Ollama model generates the tool-call JSON; AutoGen parses it and calls the real Python function.

---

## 3. Agents and Their Tools

### CodeAgent (`code_executor.py`)
| Tool | Description |
|------|-------------|
| `execute_python(code)` | Writes code to a temp file, runs it in subprocess, returns stdout |
| `run_shell(command)` | Runs safe shell commands (ls, cat, head, wc). Blocks rm/sudo/etc. |

**Key safety design:** `execute_python` uses `tempfile` + `subprocess` (not `exec()`), so it runs in an isolated OS process with a 30s timeout.

### DBAgent (`db_agent.py`)
| Tool | Description |
|------|-------------|
| `get_schema()` | Returns all table names and columns from SQLite |
| `run_sql(query)` | Executes any SQL; SELECT returns formatted table, others return rowcount |
| `import_csv(csv_path, table_name)` | Loads CSV into SQLite, auto-creates table from headers |

**ReAct pattern enforced:** System prompt requires `get_schema()` before any SQL, preventing hallucinated column names.

### FileAgent (`file_agent.py`)
| Tool | Description |
|------|-------------|
| `search_files(pattern)` | Glob search inside workspace (e.g. `*.csv`) |
| `read_file(filename)` | Read .txt file content |
| `write_file(filename, content)` | Write text to .txt file |
| `read_csv(filename)` | Read CSV as formatted table (capped at 20 rows) |
| `write_csv(filename, rows_json)` | Write CSV from JSON list of dicts |

**Security:** All file operations are sandboxed to `./workspace/`. Path traversal (`../`) is blocked.

---

## 4. ReAct Pattern in Tool-Calling Agents

Each agent's system prompt enforces the ReAct loop:

```
Thought:     What do I need to do?
Action:      <tool_call>
Observation: <tool output>
Thought:     What does this tell me? What's next?
Action:      <next tool_call>
...
Final Answer: <user-facing response>
[AGENT_DONE]
```

This makes reasoning transparent and debuggable — you can see every step the agent took.

---

## 5. Orchestrator Pipeline

```
User: "Analyze sales.csv and generate top 5 insights"
         │
         ▼
   Orchestrator (plans tasks via LLM → JSON)
         │
    ┌────┴──────────┬──────────────┐
    ▼               ▼              ▼
FileAgent       CodeAgent       DBAgent
(read CSV)   (pandas analysis) (SQL queries)
    │               │              │
    └───────────────┴──────────────┘
                    │
              SynthesisAgent
          (combines → 5 insights)
                    │
               Final Answer
```

The Orchestrator outputs a JSON plan:
```json
{
  "file_task": "Read sales.csv and return its contents",
  "code_task": "Compute top 5 products by revenue using pandas",
  "db_task":   "Import sales.csv and query top regions by total revenue"
}
```
Each sub-task runs independently, then a Synthesis Agent combines the outputs.

---

