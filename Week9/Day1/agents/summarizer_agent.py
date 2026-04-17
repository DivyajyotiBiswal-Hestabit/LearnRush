from config import SUMMARIZER_PROMPT, MEMORY_WINDOW
from Week9.Day1.utils import call_llm


class SummarizerAgent:
    def __init__(self):
        self.memory = []

    def run(self, research_output):
        self.memory.append({"role": "user", "content": research_output})

        self.memory = self.memory[-MEMORY_WINDOW:]

        response = call_llm(SUMMARIZER_PROMPT, self.memory)

        self.memory.append({"role": "assistant", "content": response})

        return response