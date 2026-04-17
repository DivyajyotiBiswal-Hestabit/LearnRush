## Overview

This project implements a **Tool-Calling Multi-Agent System** where an orchestrator dynamically selects and executes tools such as:

* File operations
* Python code execution
* Database querying

The system converts natural language queries into structured tool execution pipelines.

---

## Architecture

### Components

1. **Orchestrator**

   * Plans task execution using LLM
   * Decides which tools to call
   * Executes tools step-by-step

2. **Tools**

   * **File Agent** → Reads `.txt`, `.csv`
   * **Code Executor** → Runs Python code
   * **DB Agent** → Executes SQL queries

---

## Flow

User Query
↓
Orchestrator (LLM Planning)
↓
Tool Selection (JSON Plan)
↓
Execution Engine
↓
Final Output

---

## Example Execution

### Input

```
analyze data_samples/sales.csv
```

### Generated Plan (LLM)

```json
[
  {
    "step": 1,
    "tool": "file_agent",
    "input": "read sales_data_samples/sales.csv"
  }
]
```

### Actual Execution (Corrected)

Step 1 → File Agent

* Reads: `data_samples/sales.csv`

Step 2 → Code Executor (forced rule)

* Runs:

```python
import pandas as pd
df = pd.read_csv('data_samples/sales.csv')
print(df.describe())
```

---

## Key Features

### 1. Tool Calling

* Agents use real tools instead of generating text-only responses
* Supports Python execution, file reading, and database queries

---

### 2. LLM + Rule Hybrid System

The system does NOT fully trust the LLM.

**Problem:**
LLM may hallucinate file paths (e.g., `sales_data_samples/sales.csv`)

**Solution:**

* Extract file paths using regex from user query
* Override LLM-generated inputs

```python
def extract_path_from_query(query):
    match = re.search(r"[\w\-/]+\.((csv|txt|db))", query)
    return match.group(0)
```

---

### 3. Dynamic Tool Execution

* Tools are selected at runtime
* Each step is executed sequentially
* Output of one tool can feed into another

---

### 4. Safe Execution

* No blind execution of LLM-generated instructions
* Controlled environment for Python execution
* File access strictly based on user query

---

## Supported Tools

| Tool          | Functionality       |
| ------------- | ------------------- |
| file_agent    | Read `.txt`, `.csv` |
| code_executor | Execute Python code |
| db_agent      | Run SQL queries     |

---

## Concepts Implemented

* Tool Calling Agents
* System-to-tool execution
* Function calling without API
* File handling (read operations)
* Python execution engine
* Basic SQL querying
* LLM orchestration

---

## Limitations

* Limited error handling in code execution
* No sandboxing for Python execution
* DB agent runs fixed queries only
* No tool chaining based on intermediate outputs (future improvement)

---

## Future Improvements

* Pass outputs between tools dynamically
* Add secure Python sandboxing
* Expand DB querying capabilities
* Add memory and retrieval layer
* Improve planning accuracy

---

## Conclusion

This system demonstrates how to build a **real-world agent pipeline** where:

* LLM decides *what to do*
* System controls *how it is executed safely*

It marks the transition from simple chatbots to **autonomous AI systems with tool usage**.
