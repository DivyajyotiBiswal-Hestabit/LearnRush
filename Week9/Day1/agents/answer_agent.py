from config import ANSWER_PROMPT, MEMORY_WINDOW
from Week9.Day1.utils import call_llm


class AnswerAgent:
    def __init__(self):
        self.memory = []

    def run(self, summary):
        self.memory.append({"role": "user", "content": summary})

        self.memory = self.memory[-MEMORY_WINDOW:]

        response = call_llm(ANSWER_PROMPT, self.memory)

        self.memory.append({"role": "assistant", "content": response})

        return response