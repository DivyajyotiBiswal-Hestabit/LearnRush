from utils import call_llm
from config import WORKER_PROMPT


class WorkerAgent:
    def execute(self, task):
        messages = [{"role": "user", "content": task}]
        return call_llm(WORKER_PROMPT, messages)