import sys, os, json, csv, re

TOOLS_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "tools")
sys.path.insert(0, TOOLS_DIR)

from autogen import ConversableAgent, UserProxyAgent
from file_agent    import file_agent,  make_file_proxy
from code_executor import code_agent,  make_code_proxy
from db_agent      import db_agent,    make_db_proxy
from config import LLM_CONFIG

WORKSPACE = os.path.join(TOOLS_DIR, "workspace")
os.makedirs(WORKSPACE, exist_ok=True)

def last_reply(chat_result) -> str:
    if hasattr(chat_result, "summary") and chat_result.summary:
        return chat_result.summary.strip()
    history = chat_result.chat_history
    if len(history) >= 2:
        return history[1]["content"].strip()
    for msg in reversed(history):
        if msg.get("role") == "assistant":
            return msg["content"].strip()
    return ""

CODE_KEYWORDS = [
    "write code", "give code", "generate code", "code for",
    "implement", "write a", "create a function", "write function",
    "write script", "write program", "build a", "make a",
    "algorithm", "sorting", "searching", "fibonacci", "binary search",
    "linear search", "bubble sort", "linked list", "stack", "queue",
    "recursion", "dynamic programming", "write me",
]

DATA_KEYWORDS = [
    "analyze", "analyse", "insights", "sales.csv", "csv",
    "top 5", "top 3", "revenue", "sales data",
]

DB_KEYWORDS = [
    "database", "sqlite", "sql", "query", "table", "select",
    "insert", "db",
]

FILE_KEYWORDS = [
    "read file", "open file", "list files", "show files",
    "write to file", "save to file", "txt", ".csv",
]

def detect_intent(query: str) -> str:
    q = query.lower()
    if any(k in q for k in CODE_KEYWORDS):
        return "CODE_ONLY"
    if any(k in q for k in DATA_KEYWORDS):
        return "DATA"
    if any(k in q for k in DB_KEYWORDS):
        return "DB_ONLY"
    if any(k in q for k in FILE_KEYWORDS):
        return "FILE_ONLY"
    return _llm_detect_intent(query)

def _llm_detect_intent(query: str) -> str:
    """Fallback: ask LLM to classify intent when rules don't match."""
    classifier = ConversableAgent(
        name="IntentClassifier",
        system_message="""
Classify the user query into exactly one of these intents:
  CODE_ONLY  - user wants code written/generated
  DATA       - user wants data analysis (files + code + database)
  FILE_ONLY  - user wants file operations only
  DB_ONLY    - user wants database queries only

Reply with ONLY the intent label, nothing else.
""".strip(),
        llm_config=LLM_CONFIG,
        human_input_mode="NEVER",
        max_consecutive_auto_reply=1,
    )
    relay = UserProxyAgent(name="IntentRelay", human_input_mode="NEVER",
                           max_consecutive_auto_reply=1, code_execution_config=False)
    r = relay.initiate_chat(classifier, message=query, max_turns=1, silent=True)
    label = last_reply(r).strip().upper()
    if label not in ("CODE_ONLY", "DATA", "FILE_ONLY", "DB_ONLY"):
        return "CODE_ONLY"   
    return label

def seed_sales_csv():
    path = os.path.join(WORKSPACE, "sales.csv")
    if os.path.exists(path):
        return path
    with open(path, "w", newline="") as f:
        w = csv.writer(f)
        w.writerow(["product", "region", "units", "revenue"])
        w.writerows([
            ["Widget A", "North",  120, 14400],
            ["Widget B", "South",  85,  8500],
            ["Widget A", "East",   210, 25200],
            ["Widget C", "West",   40,  2400],
            ["Widget B", "North",  175, 17500],
            ["Widget A", "South",  320, 38400],
            ["Widget C", "East",   90,  5400],
            ["Widget B", "West",   65,  6500],
            ["Widget D", "North",  55,  3300],
            ["Widget D", "South",  200, 12000],
        ])
    print(f"  [seed] sales.csv → {path}")
    return path

def _run_code_only(query: str) -> str:
    print("\n[CODE AGENT] Generating and saving code …")
    cp = make_code_proxy(query=query)
    r = cp.initiate_chat(code_agent, message=query, max_turns=8, silent=False)
    return last_reply(r)

def _run_file_only(query: str) -> str:
    print("\n[FILE AGENT] Running …")

    fp = make_file_proxy()

    # 🔥 STEP 1: Execute tool FIRST (this is the fix)
    tool_result = fp._dispatch(query.lower())

    # 🔥 STEP 2: Send real data to LLM for summarization
    r = fp.initiate_chat(
        file_agent,
        message=(
            f"Here is the real file data:\n\n{tool_result}\n\n"
            f"Summarise this clearly and end with [FILE_DONE]."
        ),
        max_turns=2,
        silent=False
    )

    return last_reply(r)

def _run_db_only(query: str) -> str:
    print("\n[DB AGENT] Running …")
    db_path = os.path.join(TOOLS_DIR, "nexus.db")
    task = f"{query}\nDB path: {db_path}"
    dp = make_db_proxy()
    r = dp.initiate_chat(db_agent, message=task, max_turns=5, silent=False)
    return last_reply(r)

def _run_data_pipeline(query: str) -> str:
    """Dynamic, query-driven data pipeline (FIXED)."""

    seed_sales_csv()
    db_path = os.path.join(TOOLS_DIR, "nexus.db")
    csv_path = os.path.join(WORKSPACE, "sales.csv")

    # ================= CODE AGENT =================
    print("\n[CODE AGENT] Analysing data …")
    cp = make_code_proxy(query=query)

    code_task = f"""
Load the dataset from: {csv_path}

Answer this EXACT query:
{query}

Rules:
- Use pandas
- Apply filtering BEFORE aggregation if needed
- Do NOT compute unrelated metrics
- Print ONLY the final answer clearly
"""

    r2 = cp.initiate_chat(code_agent, message=code_task, max_turns=8, silent=False)
    code_out = last_reply(r2)

    # ================= DB AGENT =================
    print("\n[DB AGENT] Running SQL queries …")
    dp = make_db_proxy()

    db_task = f"""
User Query: {query}

CSV Path: {csv_path}
Table: sales
DB path: {db_path}

Instructions:
- Import CSV into database
- Generate SQL to answer the query
- Return ONLY the result
"""

    r3 = dp.initiate_chat(db_agent, message=db_task, max_turns=5, silent=False)
    db_out = last_reply(r3)

    # ================= SYNTHESIS =================
    print("\n[SYNTHESIS] Combining outputs …")

    synth = ConversableAgent(
        name="SynthesisAgent",
        system_message="""
You are a precise answer generator.

Rules:
- Return ONLY the final answer to the query
- Do NOT generate insights
- Do NOT hallucinate
- Prefer exact numeric answer
""".strip(),
        llm_config=LLM_CONFIG,
        human_input_mode="NEVER",
        max_consecutive_auto_reply=1,
    )

    sr = UserProxyAgent(
        name="SynthRelay",
        human_input_mode="NEVER",
        max_consecutive_auto_reply=1,
        code_execution_config=False
    )

    rs = sr.initiate_chat(
        synth,
        message=f"""
User Query:
{query}

Code Output:
{code_out}

DB Output:
{db_out}

Final Answer:
""".strip(),
        max_turns=1,
        silent=True
    )

    return last_reply(rs)

def plan_and_execute(user_query: str) -> str:
    intent = detect_intent(user_query)
    print(f"\n[ORCHESTRATOR] Intent detected → {intent}")

    if intent == "CODE_ONLY":
        return _run_code_only(user_query)
    elif intent == "FILE_ONLY":
        return _run_file_only(user_query)
    elif intent == "DB_ONLY":
        return _run_db_only(user_query)
    else:  # DATA
        return _run_data_pipeline(user_query)