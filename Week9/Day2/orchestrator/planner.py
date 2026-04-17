import json
from utils import call_llm
from config import PLANNER_PROMPT


class Planner:

    def extract_json(self, text):
        start = text.find("[")
        end = text.rfind("]")
        if start != -1 and end != -1:
            return text[start:end+1]
        return None

    def clean_topic(self, query):
        query = query.lower().replace(",", "")
        remove_words = [
            "what", "is", "explain", "its",
            "and", "causes", "effects"
        ]
        words = [w for w in query.split() if w not in remove_words]
        return " ".join(words[:2])

    def normalize_ids(self, plan):
        id_mapping = {}

        for i, task in enumerate(plan):
            old_id = task["id"]
            new_id = i + 1
            id_mapping[old_id] = new_id
            task["id"] = new_id

        for task in plan:
            task["depends_on"] = [id_mapping.get(dep, dep) for dep in task["depends_on"]]

        return plan

    def create_plan(self, query):
        messages = [{"role": "user", "content": query}]
        raw_plan = call_llm(PLANNER_PROMPT, messages)

        print("\nRAW PLAN:\n", raw_plan)

        json_str = self.extract_json(raw_plan)

        if json_str:
            try:
                plan = json.loads(json_str)

                if isinstance(plan, list) and len(plan) >= 2:
                    plan = self.normalize_ids(plan)
                    return plan

            except:
                pass

        # fallback (guaranteed 3 tasks)
        topic = self.clean_topic(query)

        return [
            {"id": 1, "task": f"Define {topic}", "depends_on": []},
            {"id": 2, "task": f"Explain causes of {topic}", "depends_on": [1]},
            {"id": 3, "task": f"Explain effects of {topic}", "depends_on": [1]},
        ]