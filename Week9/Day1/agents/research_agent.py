from config import RESEARCH_PROMPT, MEMORY_WINDOW
from Week9.Day1.utils import call_llm


class ResearchAgent:
    def __init__(self):
        self.memory = []

    def run(self, user_query):
        self.memory.append({"role": "user", "content": user_query})

        # Memory window limit
        self.memory = self.memory[-MEMORY_WINDOW:]

        response = call_llm(RESEARCH_PROMPT, self.memory)

        self.memory.append({"role": "assistant", "content": response})

        return response