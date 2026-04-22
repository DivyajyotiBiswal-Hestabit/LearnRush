# import autogen
# from autogen import ConversableAgent, UserProxyAgent
# import sqlite3, csv, os, re
# from config import LLM_CONFIG
# from openai import OpenAI
# from dotenv import load_dotenv

# load_dotenv()

# # ===================== LLM CLIENT =====================
# client = OpenAI(
#     api_key=os.getenv("GROQ_API_KEY"),
#     base_url="https://api.groq.com/openai/v1",
# )

# MODEL = os.getenv("GROQ_MODEL")

# def call_llm(prompt: str, max_tokens: int = 300) -> str:
#     response = client.chat.completions.create(
#         model=MODEL,
#         messages=[{"role": "user", "content": prompt}],
#         temperature=0,
#         max_tokens=max_tokens,
#     )
#     return response.choices[0].message.content.strip()

# # ===================== PATHS =====================
# HERE = os.path.dirname(os.path.abspath(__file__))
# DEFAULT_DB = os.path.join(HERE, "nexus.db")

# # ===================== DB TOOLS =====================
# def run_sql(query: str, db_path: str = DEFAULT_DB) -> str:
#     try:
#         conn = sqlite3.connect(db_path)
#         cursor = conn.cursor()
#         cursor.execute(query)

#         if query.strip().upper().startswith("SELECT"):
#             rows = cursor.fetchall()
#             cols = [d[0] for d in cursor.description]
#             conn.close()

#             if not rows:
#                 return "No rows returned."

#             header = " | ".join(cols)
#             sep = "-" * len(header)
#             lines = [header, sep] + [
#                 " | ".join(str(c) for c in row) for row in rows
#             ]
#             return "\n".join(lines)
#         else:
#             conn.commit()
#             affected = cursor.rowcount
#             conn.close()
#             return f"OK. Rows affected: {affected}"

#     except Exception as e:
#         return f"SQL ERROR: {e}"


# def get_schema(db_path: str = DEFAULT_DB) -> str:
#     try:
#         conn = sqlite3.connect(db_path)
#         cursor = conn.cursor()

#         cursor.execute("SELECT name FROM sqlite_master WHERE type='table'")
#         tables = [r[0] for r in cursor.fetchall()]

#         if not tables:
#             conn.close()
#             return "Database has no tables."

#         parts = []
#         for t in tables:
#             cursor.execute(f"PRAGMA table_info({t})")
#             cols = ", ".join(f"{c[1]}({c[2]})" for c in cursor.fetchall())
#             parts.append(f"Table '{t}': {cols}")

#         conn.close()
#         return "\n".join(parts)

#     except Exception as e:
#         return f"SCHEMA ERROR: {e}"


# def import_csv(csv_path: str, table_name: str, db_path: str = DEFAULT_DB) -> str:
#     if not os.path.exists(csv_path):
#         return f"ERROR: CSV not found: {csv_path}"

#     try:
#         with open(csv_path, newline="") as f:
#             rows = list(csv.DictReader(f))

#         if not rows:
#             return "ERROR: CSV is empty."

#         cols = list(rows[0].keys())

#         conn = sqlite3.connect(db_path)
#         cur = conn.cursor()

#         cur.execute(f"DROP TABLE IF EXISTS {table_name}")

#         col_defs = ", ".join(f'"{c}" TEXT' for c in cols)
#         cur.execute(f"CREATE TABLE {table_name} ({col_defs})")

#         ph = ", ".join("?" * len(cols))
#         for row in rows:
#             cur.execute(
#                 f"INSERT INTO {table_name} VALUES ({ph})",
#                 [row[c] for c in cols]
#             )

#         conn.commit()
#         conn.close()

#         return f"Imported {len(rows)} rows into '{table_name}'. Columns: {cols}"

#     except Exception as e:
#         return f"IMPORT ERROR: {e}"

# # ===================== AGENT =====================
# DB_AGENT_PROMPT = """
# You are the DB Agent.

# You will be given SQL query results.

# STRICT RULES:
# - DO NOT generate your own numbers
# - DO NOT guess
# - DO NOT hallucinate
# - ONLY use the SQL result provided
# - If result contains the answer, return it directly
# - If result is empty, say "No result found"

# Return ONLY the final answer.
# End with [DB_DONE]
# """

# db_agent = ConversableAgent(
#     name="DBAgent",
#     system_message=DB_AGENT_PROMPT,
#     llm_config=LLM_CONFIG,
#     human_input_mode="NEVER",
#     max_consecutive_auto_reply=2,
#     is_termination_msg=lambda m: "[DB_DONE]" in m.get("content", ""),
# )

# # ===================== PROXY =====================
# class DBExecutorProxy(UserProxyAgent):
#     def __init__(self):
#         super().__init__(
#             name="DBProxy",
#             human_input_mode="NEVER",
#             max_consecutive_auto_reply=3,
#             code_execution_config=False,
#             is_termination_msg=lambda m: "[DB_DONE]" in m.get("content", ""),
#         )
#         self._executed = False

#     def generate_reply(self, messages=None, sender=None, **kwargs):
#         if self._executed:
#             return None

#         task = (messages or [{}])[-1].get("content", "")

#         result = self._process(task)

#         self._executed = True

#         return f"""
# SQL RESULT:
# {result}

# INSTRUCTION:
# Extract the FINAL answer ONLY from the SQL RESULT.
# Do NOT modify numbers.
# Do NOT add new values.

# Return answer and end with [DB_DONE].
# """

#     def _process(self, task: str) -> str:
#         results = []

#         # Extract paths
#         csv_match = re.search(r"([\w/\-\.]+\.csv)", task)
#         db_match = re.search(r"([\w/\-\.]+\.db)", task)
#         tbl_match = re.search(r"table[:\s'\"]+(\w+)", task, re.IGNORECASE)

#         csv_path = csv_match.group(1) if csv_match else None
#         db_path = db_match.group(1) if db_match else DEFAULT_DB
#         table_name = tbl_match.group(1) if tbl_match else "sales"

#         # Import CSV
#         if csv_path:
#             results.append(import_csv(csv_path, table_name, db_path))

#         # Get schema
#         schema = get_schema(db_path)
#         results.append("\n=== Schema ===")
#         results.append(schema)

#         # Generate SQL dynamically
#         sql_prompt = f"""
# You are an expert SQL generator.

# Given:
# User task: {task}

# Database schema:
# {schema}

# Rules:
# - Generate ONLY ONE valid SQLite SQL query
# - Use correct column names
# - Use CAST if needed (units → INTEGER, revenue → REAL)
# - Do NOT explain anything
# - Output ONLY SQL

# SQL:
# """

#         sql_query = call_llm(sql_prompt)

#         results.append("\n=== Generated SQL ===")
#         results.append(sql_query)

#         # Execute SQL
#         sql_result = run_sql(sql_query, db_path)

#         results.append("\n=== Query Result ===")
#         results.append(sql_result)

#         return "\n".join(results)


# def make_db_proxy() -> DBExecutorProxy:
#     return DBExecutorProxy()

import os, re, sqlite3, csv
from autogen import ConversableAgent, UserProxyAgent
from config import LLM_CONFIG
from openai import OpenAI
from dotenv import load_dotenv

load_dotenv()

# ===================== LLM =====================
client = OpenAI(
    api_key=os.getenv("GROQ_API_KEY"),
    base_url="https://api.groq.com/openai/v1",
)
MODEL = os.getenv("GROQ_MODEL")

def call_llm(prompt: str, max_tokens: int = 500) -> str:
    response = client.chat.completions.create(
        model=MODEL,
        messages=[{"role": "user", "content": prompt}],
        temperature=0,
        max_tokens=max_tokens,
    )
    return response.choices[0].message.content.strip()

# ===================== PATH =====================
HERE = os.path.dirname(os.path.abspath(__file__))
DEFAULT_DB = os.path.join(HERE, "nexus.db")

# ===================== DB CORE =====================
def run_sql(query: str, db_path: str = DEFAULT_DB) -> str:
    try:
        conn = sqlite3.connect(db_path)
        cur = conn.cursor()
        cur.execute(query)
        rows = cur.fetchall()
        cols = [d[0] for d in cur.description] if cur.description else []
        conn.close()
        if not rows:
            return "No rows returned."
        header = " | ".join(cols)
        divider = "-" * max(len(header), 10)
        data = [" | ".join(str(c) for c in row) for row in rows]
        return "\n".join([header, divider] + data)
    except Exception as e:
        return f"SQL ERROR: {e}"


def import_csv(csv_path: str, table_name: str, db_path: str = DEFAULT_DB):
    """Import CSV with auto-detected column types (TEXT / INTEGER / REAL)."""
    with open(csv_path, newline="") as f:
        rows = list(csv.DictReader(f))
    if not rows:
        raise ValueError(f"CSV '{csv_path}' is empty.")
    cols = list(rows[0].keys())

    def infer_type(col):
        try:
            vals = [float(r[col]) for r in rows]
            return "INTEGER" if all(v == int(v) for v in vals) else "REAL"
        except (ValueError, KeyError):
            return "TEXT"

    col_types = {c: infer_type(c) for c in cols}
    conn = sqlite3.connect(db_path)
    cur = conn.cursor()
    cur.execute(f"DROP TABLE IF EXISTS {table_name}")
    col_defs = ", ".join(f'"{c}" {col_types[c]}' for c in cols)
    cur.execute(f"CREATE TABLE {table_name} ({col_defs})")
    ph = ", ".join("?" * len(cols))
    for row in rows:
        typed = []
        for c in cols:
            v = row[c]
            if col_types[c] == "INTEGER":   typed.append(int(float(v)))
            elif col_types[c] == "REAL":    typed.append(float(v))
            else:                           typed.append(v)
        cur.execute(f'INSERT INTO "{table_name}" VALUES ({ph})', typed)
    conn.commit()
    conn.close()
    print(f"[DB] Imported {len(rows)} rows | Types: {col_types}")


def get_schema(table_name: str = "sales", db_path: str = DEFAULT_DB) -> str:
    """Read live schema from DB."""
    try:
        conn = sqlite3.connect(db_path)
        cur = conn.cursor()
        cur.execute(f"PRAGMA table_info({table_name})")
        rows = cur.fetchall()
        conn.close()
        if not rows:
            return f"{table_name}(product TEXT, region TEXT, units INTEGER, revenue REAL)"
        cols = ", ".join(f'{r[1]} {r[2]}' for r in rows)
        return f"{table_name}({cols})"
    except Exception:
        return f"{table_name}(product TEXT, region TEXT, units INTEGER, revenue REAL)"


def get_distinct_values(col: str, table_name: str = "sales", db_path: str = DEFAULT_DB) -> list:
    """Return distinct values for a text column (used for case correction)."""
    try:
        conn = sqlite3.connect(db_path)
        cur = conn.cursor()
        cur.execute(f'SELECT DISTINCT "{col}" FROM "{table_name}"')
        vals = [r[0] for r in cur.fetchall()]
        conn.close()
        return vals
    except Exception:
        return []


def fix_case_in_sql(sql: str, db_path: str, table_name: str = "sales") -> str:
    """
    BUG 1 FIX — Case-sensitive region/product filters.

    The LLM sometimes writes WHERE region = 'north' when the actual value
    stored is 'North'. This function looks up real values from the DB and
    replaces the filter value with the correctly-cased version.
    """
    pattern = re.compile(
        r"""(\bWHERE\b|\bAND\b|\bOR\b)\s+(\w+)\s*=\s*['"]([^'"]+)['"]""",
        re.IGNORECASE
    )
    def replacer(m):
        keyword, col, val = m.group(1), m.group(2), m.group(3)
        for dv in get_distinct_values(col, table_name, db_path):
            if str(dv).lower() == val.lower():
                return f"{keyword} {col} = '{dv}'"
        return m.group(0)
    return pattern.sub(replacer, sql)


def ensure_aggregation_in_sql(sql: str) -> str:
    """
    BUG 2 FIX — Raw ORDER BY revenue instead of ORDER BY SUM(revenue).

    Pattern:  ORDER BY revenue DESC  →  GROUP BY product ORDER BY SUM(revenue) DESC
    Only applies when there is no GROUP BY already present.
    """
    if re.search(r"ORDER BY\s+revenue\s+DESC", sql, re.IGNORECASE):
        if not re.search(r"GROUP BY", sql, re.IGNORECASE):
            sql = re.sub(
                r"ORDER BY\s+revenue\s+DESC",
                "GROUP BY product ORDER BY SUM(revenue) DESC",
                sql,
                flags=re.IGNORECASE
            )
    return sql


# ===================== AGENT =====================
DB_AGENT_PROMPT = """
You are a SQLite SQL generator.

Output ONLY a single valid SQLite SQL statement — no markdown, no explanation, no code fences.

Rules:
- End every query with a semicolon
- Never use CAST() — columns are correctly typed
- Always GROUP BY when using SUM() / COUNT() / AVG()
- For "highest / most / top 1": GROUP BY + ORDER BY SUM(col) DESC LIMIT 1
- For region/product filters: match casing exactly as in the schema
- Filter with WHERE before aggregation
"""

db_agent = ConversableAgent(
    name="DBAgent",
    system_message=DB_AGENT_PROMPT,
    llm_config=LLM_CONFIG,
    human_input_mode="NEVER",
    max_consecutive_auto_reply=1,   # agent replies once then stops
)


# ===================== RESULT FORMATTER =====================
def format_result(sql_result: str) -> str:
    lines = [l for l in sql_result.strip().split("\n") if l.strip()]
    if not lines or "SQL ERROR" in sql_result or sql_result == "No rows returned.":
        return sql_result
    data_lines = lines[2:] if len(lines) > 2 else []
    if not data_lines:
        return "No result found."
    if len(data_lines) == 1:
        cols = [c.strip() for c in data_lines[0].split("|")]
        if len(cols) == 1:
            return cols[0]
        headers = [h.strip() for h in lines[0].split("|")]
        return ", ".join(f"{h}: {v}" for h, v in zip(headers, cols))
    return sql_result   # multi-row: return full table


# ===================== PROXY =====================
class DBExecutorProxy(UserProxyAgent):
    def __init__(self):
        super().__init__(
            name="DBProxy",
            human_input_mode="NEVER",
            # BUG 3 FIX: max_consecutive_auto_reply=0 means the proxy replies
            # exactly once and then stops — the agent cannot send another SQL
            # query that would be executed again, causing a loop.
            max_consecutive_auto_reply=0,
            code_execution_config=False,
        )
        self._answered = False  # safety guard

    def generate_reply(self, messages=None, sender=None, **kwargs):
        # BUG 3 FIX: Hard guard — never reply twice in one conversation
        if self._answered:
            return None

        task = (messages or [{}])[-1].get("content", "")

        csv_match  = re.search(r"([\w./\-]+\.csv)", task)
        db_match   = re.search(r"([\w./\-]+\.db)",  task)
        csv_path   = csv_match.group(1) if csv_match else None
        db_path    = db_match.group(1)  if db_match  else DEFAULT_DB
        table_name = "sales"

        if csv_path:
            try:
                import_csv(csv_path, table_name, db_path)
            except Exception as e:
                self._answered = True
                return f"CSV import failed: {e} [DB_DONE]"

        schema = get_schema(table_name, db_path)

        # ── ANALYSIS MODE ─────────────────────────────────────────────────────
        if any(k in task.lower() for k in ["analyze", "analyse", "explain"]):
            queries = {
                "Total rows":            f"SELECT COUNT(*) AS total_rows FROM {table_name}",
                "Unique products":       f"SELECT COUNT(DISTINCT product) AS unique_products FROM {table_name}",
                "Unique regions":        f"SELECT COUNT(DISTINCT region) AS unique_regions FROM {table_name}",
                "Total revenue":         f"SELECT SUM(revenue) AS total_revenue FROM {table_name}",
                "Top product (revenue)": f"SELECT product, SUM(revenue) AS rev FROM {table_name} GROUP BY product ORDER BY rev DESC LIMIT 1",
                "Top region (units)":    f"SELECT region, SUM(units) AS u FROM {table_name} GROUP BY region ORDER BY u DESC LIMIT 1",
            }
            out = "\n\n".join(f"[{lbl}]\n{run_sql(q, db_path)}" for lbl, q in queries.items())
            self._answered = True
            return out + "\n\n[DB_DONE]"

        # ── NORMAL QUERY ──────────────────────────────────────────────────────
        sql_prompt = f"""Generate ONE SQLite SQL query.

User Question: {task}

Schema: {schema}

RULES:
- Output ONLY SQL, no markdown, no explanation
- Never CAST() — columns are already typed correctly
- Always GROUP BY when using SUM()/COUNT()/AVG()
- For "highest/top 1": GROUP BY + ORDER BY SUM(revenue) DESC LIMIT 1
- Text filters (WHERE region = ...): use exact casing from the schema
- End with semicolon
"""
        raw_sql = call_llm(sql_prompt)
        match = re.search(r"(SELECT\b.*?;)", raw_sql, re.DOTALL | re.IGNORECASE)
        if not match:
            self._answered = True
            return f"Failed to extract SQL:\n{raw_sql}\n[DB_DONE]"

        sql_query = match.group(1).strip()

        # Apply both case-fix and aggregation-fix
        sql_query = fix_case_in_sql(sql_query, db_path, table_name)
        sql_query = ensure_aggregation_in_sql(sql_query)

        print(f"\n[DB DEBUG] Final SQL:\n{sql_query}\n")

        sql_result = run_sql(sql_query, db_path)
        print(f"[DB DEBUG] Raw result:\n{sql_result}\n")

        answer = format_result(sql_result)
        self._answered = True
        return f"{answer} [DB_DONE]"


def make_db_proxy():
    return DBExecutorProxy()