import re
from src.generator.llm_client import LocalLLMClient


class SQLGenerator:
    def __init__(self, model_name: str = "Qwen/Qwen2-1.5B-Instruct"):
        self.llm = LocalLLMClient(model_name=model_name)

    def build_prompt(self, user_query: str, schema_text: str) -> str:
        prompt = f"""
You are a SQL generation assistant.

Rules:
- Convert the natural language question into ONE valid SQLite SQL query.
- Use ONLY the tables and columns listed in the schema.
- Output ONLY SQL.
- No markdown.
- No explanation.
- Only SELECT or WITH queries are allowed.
- Use explicit JOIN conditions when needed.

Schema:
{schema_text}

User Question:
{user_query}

SQL:
"""
        return prompt.strip()

    def extract_sql(self, raw_output: str) -> str:
        text = raw_output.strip()
        text = text.replace("```sql", "").replace("```", "").strip()

        match = re.search(r"(SELECT|WITH)\s.+", text, re.IGNORECASE | re.DOTALL)
        if match:
            text = match.group(0).strip()

        if ";" in text:
            text = text.split(";")[0].strip() + ";"
        else:
            text = text + ";"

        return text

    def generate_sql(self, user_query: str, schema_text: str) -> str:
        prompt = self.build_prompt(user_query, schema_text)
        raw_output = self.llm.generate(prompt, max_new_tokens=200)
        return self.extract_sql(raw_output)

    def regenerate_sql_with_error(self, user_query: str, schema_text: str, error_message: str) -> str:
        prompt = f"""
You are a SQL correction assistant.

The previous SQL query failed.

Rules:
- Generate ONE corrected SQLite SQL query.
- Use ONLY the schema below.
- Output ONLY SQL.
- No markdown.
- No explanation.
- Only SELECT or WITH queries are allowed.

Schema:
{schema_text}

User Question:
{user_query}

Database Error:
{error_message}

Corrected SQL:
"""
        raw_output = self.llm.generate(prompt, max_new_tokens=200)
        return self.extract_sql(raw_output)