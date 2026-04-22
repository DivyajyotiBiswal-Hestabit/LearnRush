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
        temperature=0.3,
        max_tokens=200,
    )
    return response.choices[0].message.content.strip()


class WorkerAgent:
    def execute(self, task: dict, prior_results: dict) -> str:
        task_id = task["id"]
        description = task["description"]
        deps = task.get("depends_on", [])

        # Build context from dependency outputs
        context = ""
        if deps:
            context = "\n\nContext from prior tasks:\n" + "\n".join(
                f"- {d}: {prior_results[d]}" for d in deps if d in prior_results
            )

        prompt = f"Complete this task in 2-3 sentences:\nTask: {description}{context}"
        result = call_llm(prompt)
        print(f"  [Worker {task_id}] done")
        return result