from utils import call_llm
from config import REFLECTION_PROMPT


class ReflectionAgent:
    def improve(self, output, feedback=None):
        prompt = output

        if feedback:
            prompt += f"\n\nFix the following issues:\n{feedback}"

        messages = [{"role": "user", "content": prompt}]
        return call_llm(REFLECTION_PROMPT, messages)