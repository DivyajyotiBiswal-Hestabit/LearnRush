import re
import sqlite3
from typing import Any, Dict, List

from src.generator.sql_generator import SQLGenerator
from src.utils.schema_loader import load_sqlite_schema, format_schema_for_prompt


FORBIDDEN_SQL_PATTERNS = [
    r"\bINSERT\b",
    r"\bUPDATE\b",
    r"\bDELETE\b",
    r"\bDROP\b",
    r"\bALTER\b",
    r"\bTRUNCATE\b",
    r"\bCREATE\b",
    r"\bATTACH\b",
    r"\bDETACH\b",
    r"\bPRAGMA\b",
]


def validate_sql(sql: str) -> None:
    sql_clean = sql.strip()

    if not sql_clean:
        raise ValueError("Generated SQL is empty.")

    if not (sql_clean.upper().startswith("SELECT") or sql_clean.upper().startswith("WITH")):
        raise ValueError("Only SELECT or WITH queries are allowed.")

    for pattern in FORBIDDEN_SQL_PATTERNS:
        if re.search(pattern, sql_clean, re.IGNORECASE):
            raise ValueError(f"Unsafe SQL detected: {pattern}")

    if ";" in sql_clean[:-1]:
        raise ValueError("Multiple SQL statements are not allowed.")


def execute_sql(db_path: str, sql: str) -> List[Dict[str, Any]]:
    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()

    cursor.execute(sql)
    rows = cursor.fetchall()
    result = [dict(row) for row in rows]

    conn.close()
    return result


def summarize_results(user_query: str, rows: List[Dict[str, Any]]) -> str:
    if not rows:
        return "No rows were returned for this query."

    if len(rows) == 1:
        row = rows[0]
        row_text = ", ".join(f"{k}={v}" for k, v in row.items())
        return f"For '{user_query}', the result is: {row_text}."

    preview = rows[:5]
    lines = [f"The query returned {len(rows)} rows. Here are the first {len(preview)} rows:"]
    for idx, row in enumerate(preview, 1):
        row_text = ", ".join(f"{k}={v}" for k, v in row.items())
        lines.append(f"{idx}. {row_text}")

    return "\n".join(lines)


class SQLQAPipeline:
    def __init__(self, db_path: str = "src/data/sql/company.db", model_name: str = "Qwen/Qwen2-1.5B-Instruct"):
        self.db_path = db_path
        self.generator = SQLGenerator(model_name=model_name)

    def run(self, user_query: str):
        schema = load_sqlite_schema(self.db_path)
        schema_text = format_schema_for_prompt(schema)

        sql = self.generator.generate_sql(user_query, schema_text)

        try:
            validate_sql(sql)
            rows = execute_sql(self.db_path, sql)
        except Exception as e:
            corrected_sql = self.generator.regenerate_sql_with_error(
                user_query=user_query,
                schema_text=schema_text,
                error_message=str(e)
            )
            validate_sql(corrected_sql)
            rows = execute_sql(self.db_path, corrected_sql)
            sql = corrected_sql

        summary = summarize_results(user_query, rows)

        return {
            "question": user_query,
            "sql": sql,
            "results": rows,
            "summary": summary
        }


if __name__ == "__main__":
    pipeline = SQLQAPipeline()

    print("\n🗄 SQL-QA Engine (type 'exit' to quit)\n")

    while True:
        query = input("Enter question: ").strip()

        if query.lower() in ["exit", "quit"]:
            print("Exiting...")
            break

        if not query:
            print("Please enter a valid question.\n")
            continue

        try:
            output = pipeline.run(query)

            print("\n=== GENERATED SQL ===")
            print(output["sql"])

            print("\n=== SUMMARY ===")
            print(output["summary"])

            print("\n=== RAW RESULTS (first 5) ===")
            for row in output["results"][:5]:
                print(row)

        except Exception as e:
            print(f"\nError: {e}")

        print("\n" + "-" * 60 + "\n")