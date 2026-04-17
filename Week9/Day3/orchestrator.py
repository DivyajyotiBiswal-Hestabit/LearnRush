import json
import re
from utils import call_llm
from config import ORCHESTRATOR_PROMPT
from tools.code_executor import CodeExecutor
from tools.db_agent import DBAgent
from tools.file_agent import FileAgent


class Orchestrator:
    def __init__(self):
        self.code = CodeExecutor()
        self.db = DBAgent()
        self.file = FileAgent()

    # Extract JSON from LLM
    def extract_json(self, text):
        match = re.search(r"\[.*\]", text, re.DOTALL)
        return match.group(0) if match else None

    # Extract file path from USER query 
    def extract_path_from_query(self, query):
        match = re.search(r"[\w\-/]+\.((csv|txt|db))", query)
        return match.group(0) if match else None

    # Planning
    def plan(self, query):
        messages = [{"role": "user", "content": query}]
        raw = call_llm(ORCHESTRATOR_PROMPT, messages)

        print("\nRAW PLAN:\n", raw)

        json_str = self.extract_json(raw)
        if json_str:
            try:
                return json.loads(json_str)
            except:
                pass

        return []

    # Execution
    def execute(self, plan, query):
        results = {}

        for step in plan:
            tool = step["tool"]

            print(f"\n--- STEP {step['step']} | {tool} ---")

            # FILE AGENT 
            if tool == "file_agent":
                path = self.extract_path_from_query(query)

                if path:
                    output = self.file.read(path)
                else:
                    output = "No file path found in query"

            # CODE AGENT
            elif tool == "code_executor":
                output = self.code.execute(step["input"])

            # DB AGENT
            elif tool == "db_agent":
                db_path = self.extract_path_from_query(query)

                if db_path:
                    output = self.db.run_query(db_path, "SELECT * FROM sqlite_master LIMIT 5")
                else:
                    output = "No DB file found"

            else:
                output = "Unknown tool"

            print(output)
            results[step["step"]] = output

        return results

    # Run Orchestrator
    def run(self, query):
        plan = self.plan(query)

        if not plan:
            return "Planning failed"

        if "analyze" in query.lower():
            file_path = self.extract_path_from_query(query)

            if file_path:
                plan.append({
                    "step": len(plan) + 1,
                    "tool": "code_executor",
                    "input": f"import pandas as pd\ndf = pd.read_csv('{file_path}')\nprint(df.describe())"
                })

        results = self.execute(plan, query)

        return results[max(results.keys())]