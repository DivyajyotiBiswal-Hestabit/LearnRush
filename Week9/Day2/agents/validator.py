from utils import call_llm
from config import VALIDATOR_PROMPT


class ValidatorAgent:
    def validate(self, output):
        messages = [{"role": "user", "content": output}]
        response = call_llm(VALIDATOR_PROMPT, messages)

        if "VALID" in response:
            return {"status": "VALID", "reason": ""}
        else:
            return {"status": "INVALID", "reason": response}