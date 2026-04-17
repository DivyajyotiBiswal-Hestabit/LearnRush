import requests
from config import MODEL

OLLAMA_URL = "http://localhost:11434/api/generate"


def call_llm(system_prompt, messages):
    conversation = ""

    for msg in messages:
        role = msg["role"]
        content = msg["content"]

        conversation += f"{role.upper()}: {content}\n"

    full_prompt = f"""
SYSTEM:
{system_prompt}

{conversation}
Assistant:
"""

    response = requests.post(
        OLLAMA_URL,
        json={
            "model": MODEL,
            "prompt": full_prompt,
            "stream": False,
            "temperature": 0.2
        }
    )

    res = response.json()
    return res.get("response", "Error: No response from model")