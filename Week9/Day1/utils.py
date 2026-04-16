import requests
from config import MODEL

OLLAMA_URL = "http://localhost:11434/api/generate"


def call_llm(system_prompt, messages):
    conversation = ""

    for msg in messages:
        role = msg["role"]
        content = msg["content"]

        if role == "user":
            conversation += f"User: {content}\n"
        else:
            conversation += f"Assistant: {content}\n"

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

    return response.json()["response"]