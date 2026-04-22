import os
import json
import re
import requests
from agents.worker_agent import WorkerAgent
from agents.validator import ValidatorAgent
from dotenv import load_dotenv
from openai import OpenAI

load_dotenv()

client = OpenAI(
    api_key=os.getenv("GROQ_API_KEY"),
    base_url="https://api.groq.com/openai/v1",
)

MODEL = os.getenv("GROQ_MODEL")

def call_llm(prompt: str, max_tokens: int = 400) -> str:
    response = client.chat.completions.create(
        model=MODEL,
        messages=[
            {"role": "user", "content": prompt}
        ],
        temperature=0.3,
        max_tokens=max_tokens,
    )
    return response.choices[0].message.content.strip()

def fallback_tasks(query: str) -> list:
    return [
        {"id": "t1", "description": f"Gather information about: {query}", "depends_on": []},
        {"id": "t2", "description": f"Analyze key points of: {query}", "depends_on": []},
        {"id": "t3", "description": f"Write a complete answer about: {query}", "depends_on": ["t1", "t2"]},
    ]

def generate_task_graph(query: str) -> list:
#     prompt = (
#     f"Break this query into exactly 3 sub-tasks.\n"
#     f"Return ONLY valid JSON.\n"
#     f"Do NOT include markdown, explanations, or code blocks.\n"
#     f"Ensure the output starts with [ and ends with ].\n\n"
#     f"Query: {query}\n\n"
#     f"Output format:\n"
#     f'[{{"id":"t1","description":"...","depends_on":[]}},'
#     f'{{"id":"t2","description":"...","depends_on":[]}},'
#     f'{{"id":"t3","description":"...","depends_on":["t1","t2"]}}]'
# )
    prompt = (
    f"Break this query into sub-tasks.\n"
    f"Each task must include: id, description, depends_on.\n"
    f"Use depends_on ONLY if a task truly requires another.\n"
    f"If tasks are independent, keep depends_on empty.\n"
    f"Return ONLY JSON list.\n\n"
    f"Query: {query}"
)
    raw = call_llm(prompt, max_tokens=300)

    cleaned = raw.strip()

    cleaned = cleaned.replace("```json", "").replace("```", "").strip()

    match = re.search(r'\[.*\]', cleaned, re.DOTALL)

    if not match:
        print("  [Planner] No JSON found, using fallback task graph.")
        return fallback_tasks(query)

    json_str = match.group()

    try:
        tasks = json.loads(json_str)

        for t in tasks:
            if not all(k in t for k in ["id", "description", "depends_on"]):
                raise ValueError("Invalid task format")

        return tasks

    except Exception as e:
        print(f"  [Planner] JSON parse failed ({e}), using fallback task graph.")
        return fallback_tasks(query)


def build_waves(tasks: list) -> list:
    """Topological sort — groups tasks into sequential waves for execution."""
    completed = set()
    remaining = {t["id"]: t for t in tasks}
    waves = []

    while remaining:
        wave = [
            tid for tid, t in remaining.items()
            if all(dep in completed for dep in t.get("depends_on", []))
        ]
        if not wave:
            wave = list(remaining.keys())  
        waves.append(wave)
        for tid in wave:
            completed.add(tid)
            del remaining[tid]

    return waves


def reflect(query: str, tasks: list, results: dict) -> str:
    task_outputs = "\n".join(
        f"- {t['id']}: {results.get(t['id'], '')}" for t in tasks
    )
    prompt = (
        f"Synthesize these task results into one clear answer for the query.\n\n"
        f"Query: {query}\n\n"
        f"Task results:\n{task_outputs}\n\n"
        f"Write a coherent final answer:"
    )
    return call_llm(prompt, max_tokens=400)


def run(query: str) -> dict:
    print(f"\n[Planner] Query: {query}")

    # Step 1 — Generate task graph
    print("[Planner] Generating task graph...")
    tasks = generate_task_graph(query)
    task_map = {t["id"]: t for t in tasks}
    print(f"[Planner] {len(tasks)} tasks: {[t['id'] for t in tasks]}")

    # Step 2 — Run workers wave by wave
    waves = build_waves(tasks)
    results = {}
    worker = WorkerAgent()

    print(f"[Planner] Executing {len(waves)} wave(s)...")
    for i, wave in enumerate(waves):
        print(f"[Planner] Wave {i+1}: {wave}")
        for tid in wave:
            results[tid] = worker.execute(task_map[tid], results)

    # Step 3 — Reflection
    print("[Planner] Running reflection...")
    reflection = reflect(query, tasks, results)

    # Step 4 — Validation
    print("[Planner] Running validation...")
    validator = ValidatorAgent()
    validation = validator.validate(query, reflection)

    return {
        "query": query,
        "task_graph": tasks,
        "worker_results": results,
        "reflection": reflection,
        "validation_passed": validation["passed"],
        "final_answer": validation["answer"]
    }