import json
import os
import re
import time
from datetime import datetime
from pathlib import Path

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel

from src.memory.memory_store import MemoryStore
from src.evaluation.rag_eval import evaluate_answer
from src.generator.llm_client import LocalLLMClient
from src.pipelines.context_builder import ContextBuilder
from src.retriever.image_search import ImageSearchEngine
from src.pipelines.sql_pipeline import SQLQAPipeline


BASE_DIR = Path(__file__).resolve().parents[1]
MEMORY_PATH = BASE_DIR / "memory_store.json"
CHAT_LOG_PATH = BASE_DIR / "CHAT-LOGS.json"
DB_PATH = BASE_DIR / "data" / "sql" / "company.db"

app = FastAPI(title="Week7 Capstone RAG System")

memory = MemoryStore(memory_path=str(MEMORY_PATH), max_messages=10)
llm = LocalLLMClient(model_name="Qwen/Qwen2-1.5B-Instruct")
context_builder = ContextBuilder()
sql_pipeline = SQLQAPipeline(llm=llm, db_path=str(DB_PATH))

_image_engine = None


def get_image_engine():
    global _image_engine
    if _image_engine is None:
        _image_engine = ImageSearchEngine(llm=llm)
    return _image_engine


class AskRequest(BaseModel):
    query: str
    top_k: int = 5


from typing import Optional, Literal

class AskImageRequest(BaseModel):
    mode: Literal["text_to_image", "image_to_image", "image_to_text"]
    query: Optional[str] = None
    image_path: Optional[str] = None
    question: Optional[str] = "Explain this image."
    top_k: int = 5


class AskSQLRequest(BaseModel):
    query: str


def append_chat_log(record: dict):
    logs = []
    if CHAT_LOG_PATH.exists():
        try:
            with open(CHAT_LOG_PATH, "r", encoding="utf-8") as f:
                logs = json.load(f)
        except Exception:
            logs = []

    logs.append(record)

    with open(CHAT_LOG_PATH, "w", encoding="utf-8") as f:
        json.dump(logs, f, ensure_ascii=False, indent=2)


def normalize_for_match(text: str) -> str:
    text = str(text).lower().strip()
    text = re.sub(r"\s+", " ", text)
    return text


def value_present_in_answer(answer: str, value) -> bool:
    answer_norm = normalize_for_match(answer)
    value_norm = normalize_for_match(value)

    if value_norm in answer_norm:
        return True

    try:
        numeric_value = float(value)
        if str(numeric_value) in answer_norm:
            return True
        if str(int(numeric_value)) in answer_norm:
            return True
        if f"{numeric_value:.2f}" in answer_norm:
            return True
    except Exception:
        pass

    return False


def evaluate_sql_answer(answer: str, sql: str, rows: list) -> dict:
    """
    Dynamic SQL-specific evaluation.

    Logic:
    - If rows are returned, score depends on how many row values appear in answer.
    - If no rows are returned, answer should honestly mention that.
    - SQL text is included only for traceability/context, not direct scoring.
    """
    if rows is None:
        return {
            "context_match_score": 0.0,
            "faithfulness_score": 0.0,
            "hallucination_detected": True,
            "confidence_score": 0.0
        }

    answer_norm = normalize_for_match(answer)

    if len(rows) == 0:
        no_result_phrases = [
            "no rows",
            "no result",
            "not found",
            "no data",
            "no records",
            "no rows were returned"
        ]
        grounded_empty = any(phrase in answer_norm for phrase in no_result_phrases)

        context_match = 1.0 if grounded_empty else 0.4
        faithfulness = 1.0 if grounded_empty else 0.5
        confidence = round((context_match * 0.4) + (faithfulness * 0.6), 4)

        return {
            "context_match_score": round(context_match, 4),
            "faithfulness_score": round(faithfulness, 4),
            "hallucination_detected": not grounded_empty,
            "confidence_score": confidence
        }

    preview_rows = rows[:3]
    flat_values = []
    for row in preview_rows:
        flat_values.extend(list(row.values()))

    if not flat_values:
        return {
            "context_match_score": 0.5,
            "faithfulness_score": 0.5,
            "hallucination_detected": False,
            "confidence_score": 0.5
        }

    matched = sum(1 for v in flat_values if value_present_in_answer(answer, v))
    value_coverage = matched / len(flat_values)

    # Slight boost because answer comes from executed SQL, not free-form retrieval only
    context_match = round(value_coverage, 4)
    faithfulness = round(min(1.0, 0.7 + (0.3 * value_coverage)), 4)
    confidence = round((context_match * 0.4) + (faithfulness * 0.6), 4)

    return {
        "context_match_score": context_match,
        "faithfulness_score": faithfulness,
        "hallucination_detected": confidence < 0.5,
        "confidence_score": confidence
    }


def build_text_prompt(query: str, context: str, memory_text: str) -> str:
    return f"""
You are a grounded enterprise RAG assistant.

Rules:
- Answer only from the provided context and conversation memory.
- Do not invent unsupported facts.
- If context is weak or insufficient, explicitly say so.
- Be concise but useful.

Conversation Memory:
{memory_text}

Retrieved Context:
{context}

User Question:
{query}

Answer:
""".strip()


def refine_answer(query: str, context: str, draft_answer: str, memory_text: str) -> str:
    prompt = f"""
You are reviewing a draft answer in a grounded RAG system.

Rules:
- Improve clarity and faithfulness.
- Remove unsupported claims.
- Keep the answer grounded only in the context and memory.
- If the draft is too confident, reduce confidence.
- If evidence is insufficient, say so clearly.

Conversation Memory:
{memory_text}

Context:
{context}

User Question:
{query}

Draft Answer:
{draft_answer}

Refined Answer:
""".strip()

    return llm.generate(prompt, max_new_tokens=160)


@app.get("/")
def root():
    return {"status": "ok", "message": "Week7 Capstone RAG API running"}


@app.post("/ask")
def ask(req: AskRequest):
    try:
        started = time.perf_counter()

        memory_text = memory.get_recent_context_text()

        t1 = time.perf_counter()
        retrieved = context_builder.build(query=req.query, top_k=req.top_k)
        retrieval_ms = round((time.perf_counter() - t1) * 1000, 2)

        context = retrieved["context"]
        sources = retrieved["sources"]

        if not context.strip():
            response = {
                "query": req.query,
                "answer": "I could not find enough supporting context to answer this reliably.",
                "sources": [],
                "evaluation": {
                    "context_match_score": 0.0,
                    "faithfulness_score": 0.0,
                    "hallucination_detected": True,
                    "confidence_score": 0.0
                },
                "trace": {
                    "draft_answer": "",
                    "memory_used": memory.get_recent_messages(),
                    "timings": {
                        "retrieval_ms": retrieval_ms
                    },
                    "reason": "No retrieval context found"
                }
            }
            return response

        prompt = build_text_prompt(req.query, context, memory_text)

        t2 = time.perf_counter()
        draft_answer = llm.generate(prompt, max_new_tokens=180)
        generation_ms = round((time.perf_counter() - t2) * 1000, 2)

        draft_eval = evaluate_answer(draft_answer, context)

        refinement_ms = 0.0
        if draft_eval["confidence_score"] < 0.7 or draft_eval["faithfulness_score"] < 0.7:
            t3 = time.perf_counter()
            final_answer = refine_answer(req.query, context, draft_answer, memory_text)
            refinement_ms = round((time.perf_counter() - t3) * 1000, 2)
        else:
            final_answer = draft_answer

        t4 = time.perf_counter()
        eval_result = evaluate_answer(final_answer, context)
        evaluation_ms = round((time.perf_counter() - t4) * 1000, 2)

        memory.add_message("user", req.query)
        memory.add_message("assistant", final_answer)

        total_ms = round((time.perf_counter() - started) * 1000, 2)

        record = {
            "timestamp": datetime.utcnow().isoformat(),
            "endpoint": "/ask",
            "query": req.query,
            "context": context,
            "sources": sources,
            "draft_answer": draft_answer,
            "final_answer": final_answer,
            "evaluation": eval_result,
            "memory_snapshot": memory.get_recent_messages(),
            "trace": {
                "timings": {
                    "retrieval_ms": retrieval_ms,
                    "generation_ms": generation_ms,
                    "refinement_ms": refinement_ms,
                    "evaluation_ms": evaluation_ms,
                    "total_ms": total_ms
                }
            }
        }
        append_chat_log(record)

        return {
            "query": req.query,
            "answer": final_answer,
            "sources": sources,
            "evaluation": eval_result,
            "trace": {
                "draft_answer": draft_answer,
                "memory_used": memory.get_recent_messages(),
                "timings": {
                    "retrieval_ms": retrieval_ms,
                    "generation_ms": generation_ms,
                    "refinement_ms": refinement_ms,
                    "evaluation_ms": evaluation_ms,
                    "total_ms": total_ms
                },
                "context_chars": len(context),
                "retrieval_count": len(sources)
            }
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"/ask failed: {str(e)}")


@app.post("/ask-image")
def ask_image(req: AskImageRequest):
    try:
        started = time.perf_counter()
        image_engine = get_image_engine()

        if req.mode == "text_to_image":
            if not req.query or not req.query.strip():
                raise ValueError("`query` is required for text_to_image mode.")

            t1 = time.perf_counter()
            results, answer = image_engine.answer_from_text_query(
                query=req.query,
                top_k=req.top_k
            )
            retrieval_ms = round((time.perf_counter() - t1) * 1000, 2)

            context = "\n\n".join(
                [
                    f"Source: {r.get('source_file', 'unknown')}\n"
                    f"Caption: {r.get('caption', '')}\n"
                    f"OCR: {r.get('ocr_text', '')}"
                    for r in results[:3]
                ]
            )

            eval_result = evaluate_answer(answer, context)
            total_ms = round((time.perf_counter() - started) * 1000, 2)

            return {
                "mode": req.mode,
                "query": req.query,
                "answer": answer,
                "retrieved_results": results,
                "evaluation": eval_result,
                "trace": {
                    "timings": {
                        "retrieval_ms": retrieval_ms,
                        "total_ms": total_ms
                    },
                    "retrieval_count": len(results)
                }
            }

        elif req.mode == "image_to_image":
            if not req.image_path or not req.image_path.strip():
                raise ValueError("`image_path` is required for image_to_image mode.")

            if not os.path.exists(req.image_path):
                raise ValueError(f"Image not found: {req.image_path}")

            t1 = time.perf_counter()
            results = image_engine.search_by_image(
                image_path=req.image_path,
                top_k=req.top_k
            )
            retrieval_ms = round((time.perf_counter() - t1) * 1000, 2)

            total_ms = round((time.perf_counter() - started) * 1000, 2)

            return {
                "mode": req.mode,
                "image_path": req.image_path,
                "retrieved_results": results,
                "trace": {
                    "timings": {
                        "retrieval_ms": retrieval_ms,
                        "total_ms": total_ms
                    },
                    "retrieval_count": len(results)
                }
            }

        elif req.mode == "image_to_text":
            if not req.image_path or not req.image_path.strip():
                raise ValueError("`image_path` is required for image_to_text mode.")

            if not os.path.exists(req.image_path):
                raise ValueError(f"Image not found: {req.image_path}")

            memory_text = memory.get_recent_context_text()

            t1 = time.perf_counter()
            results, image_answer = image_engine.answer_from_image_query(
                image_path=req.image_path,
                user_question=req.question or "Explain this image.",
                top_k=req.top_k
            )
            retrieval_ms = round((time.perf_counter() - t1) * 1000, 2)

            context = "\n\n".join(
                [
                    f"Source: {r.get('source_file', 'unknown')}\n"
                    f"Caption: {r.get('caption', '')}\n"
                    f"OCR: {r.get('ocr_text', '')}"
                    for r in results[:3]
                ]
            )

            draft_eval = evaluate_answer(image_answer, context)

            refinement_ms = 0.0
            if draft_eval["confidence_score"] < 0.7 or draft_eval["faithfulness_score"] < 0.7:
                t2 = time.perf_counter()
                final_answer = refine_answer(
                    req.question or "Explain this image.",
                    context,
                    image_answer,
                    memory_text
                )
                refinement_ms = round((time.perf_counter() - t2) * 1000, 2)
            else:
                final_answer = image_answer

            t3 = time.perf_counter()
            eval_result = evaluate_answer(final_answer, context)
            evaluation_ms = round((time.perf_counter() - t3) * 1000, 2)

            memory.add_message("user", req.question or "Explain this image.")
            memory.add_message("assistant", final_answer)

            total_ms = round((time.perf_counter() - started) * 1000, 2)

            return {
                "mode": req.mode,
                "image_path": req.image_path,
                "question": req.question,
                "answer": final_answer,
                "retrieved_results": results,
                "evaluation": eval_result,
                "trace": {
                    "draft_answer": image_answer,
                    "memory_used": memory.get_recent_messages(),
                    "timings": {
                        "retrieval_ms": retrieval_ms,
                        "refinement_ms": refinement_ms,
                        "evaluation_ms": evaluation_ms,
                        "total_ms": total_ms
                    },
                    "retrieval_count": len(results)
                }
            }

        else:
            raise ValueError(f"Unsupported mode: {req.mode}")

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"/ask-image failed: {str(e)}")


@app.post("/ask-sql")
def ask_sql(req: AskSQLRequest):
    try:
        started = time.perf_counter()

        memory_text = memory.get_recent_context_text()

        t1 = time.perf_counter()
        sql_output = sql_pipeline.run(req.query)
        sql_ms = round((time.perf_counter() - t1) * 1000, 2)

        final_answer = sql_output["summary"]

        t2 = time.perf_counter()
        eval_result = evaluate_sql_answer(
            answer=final_answer,
            sql=sql_output["sql"],
            rows=sql_output["results"]
        )
        evaluation_ms = round((time.perf_counter() - t2) * 1000, 2)

        memory.add_message("user", req.query)
        memory.add_message("assistant", final_answer)

        total_ms = round((time.perf_counter() - started) * 1000, 2)

        record = {
            "timestamp": datetime.utcnow().isoformat(),
            "endpoint": "/ask-sql",
            "query": req.query,
            "sql": sql_output["sql"],
            "results": sql_output["results"],
            "draft_answer": final_answer,
            "final_answer": final_answer,
            "evaluation": eval_result,
            "memory_snapshot": memory.get_recent_messages(),
            "trace": {
                "timings": {
                    "sql_ms": sql_ms,
                    "evaluation_ms": evaluation_ms,
                    "total_ms": total_ms
                }
            }
        }
        append_chat_log(record)

        return {
            "query": req.query,
            "sql": sql_output["sql"],
            "answer": final_answer,
            "results": sql_output["results"],
            "evaluation": eval_result,
            "trace": {
                "draft_answer": final_answer,
                "memory_used": memory.get_recent_messages(),
                "timings": {
                    "sql_ms": sql_ms,
                    "evaluation_ms": evaluation_ms,
                    "total_ms": total_ms
                },
                "result_count": len(sql_output["results"])
            }
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"/ask-sql failed: {str(e)}")