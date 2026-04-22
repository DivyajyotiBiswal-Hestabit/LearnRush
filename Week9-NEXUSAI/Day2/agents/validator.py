import os
from dotenv import load_dotenv
from openai import OpenAI

load_dotenv()

client = OpenAI(
    api_key=os.getenv("GROQ_API_KEY"),
    base_url="https://api.groq.com/openai/v1",
)

MODEL = os.getenv("GROQ_MODEL")

def call_llm(prompt: str) -> str:
    response = client.chat.completions.create(
        model=MODEL,
        messages=[
            {"role": "user", "content": prompt}
        ],
        temperature=0.2,
        max_tokens=300,
    )
    return response.choices[0].message.content.strip()

class ValidatorAgent:
    def validate(self, query: str, answer: str) -> dict:
        prompt = (
            f"You are a validator. Check if this answer properly addresses the query.\n\n"
            f"Query: {query}\n\n"
            f"Answer: {answer}\n\n"
            f"If the answer is good, reply: PASSED\n"
            f"If there are issues, reply: FAILED: <reason>, then write a corrected answer.\n"
        )

        result = call_llm(prompt)

        if result.upper().startswith("PASSED"):
            return {"passed": True, "answer": answer}
        else:
            
            lines = result.split("\n", 1)
            corrected = lines[1].strip() if len(lines) > 1 else answer
            return {"passed": False, "answer": corrected or answer}