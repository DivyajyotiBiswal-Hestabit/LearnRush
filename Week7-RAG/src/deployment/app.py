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
from PIL import Image
from transformers import BlipProcessor, BlipForConditionalGeneration


blip_processor = BlipProcessor.from_pretrained("Salesforce/blip-image-captioning-base")
blip_model = BlipForConditionalGeneration.from_pretrained("Salesforce/blip-image-captioning-base")


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

    return llm.generate(prompt, max_new_tokens=120)


@app.get("/")
def root():
    return {"status": "ok", "message": "Week7 Capstone RAG API running"}


from fastapi import UploadFile, File, Form
from src.utils.file_parser import parse_file
from src.utils.chunker import chunk_text
from src.embeddings.text_embedder import TextEmbedder
import numpy as np


UPLOAD_STORE = BASE_DIR / "uploaded_store.json"


def load_uploaded_store():
    if UPLOAD_STORE.exists():
        with open(UPLOAD_STORE, "r") as f:
            return json.load(f)
    return []


def save_uploaded_store(data):
    with open(UPLOAD_STORE, "w") as f:
        json.dump(data, f)


@app.post("/ask")
async def ask(
    query: str = Form(...),
    top_k: int = Form(5),
    file: UploadFile = File(None)
):
    try:
        memory_text = memory.get_recent_context_text()

        # =========================
        # FILE UPLOAD CASE
        # =========================
        if file:
            if not file.filename.lower().endswith((".pdf", ".txt", ".csv")):
                raise HTTPException(status_code=400, detail="Unsupported file type")

            content = await file.read()
            text = parse_file(file.filename, content)

            chunks = chunk_text(text, 800, 100)
            embeddings = embedder.embed_texts(chunks)

            store = load_uploaded_store()

            existing_chunks = {item["chunk"] for item in store}

            for c, e in zip(chunks, embeddings):
                if c not in existing_chunks:
                    store.append({
                        "chunk": c,
                        "embedding": e.tolist()
                    })

            save_uploaded_store(store)

            q_emb = embedder.embed_texts([query])[0]
            emb_np = np.array(embeddings)

            scores = np.dot(emb_np, q_emb)
            idx = np.argsort(scores)[-top_k:][::-1]

            retrieved = [chunks[i] for i in idx]

        # =========================
        # NO FILE CASE
        # =========================
        else:
            store = load_uploaded_store()

            if store:
                chunks = [x["chunk"] for x in store]
                embeddings = np.array([x["embedding"] for x in store])

                q_emb = embedder.embed_texts([query])[0]
                scores = np.dot(embeddings, q_emb)

                idx = np.argsort(scores)[-top_k:][::-1]
                retrieved = [chunks[i] for i in idx]

            else:
                data = context_builder.build(query=query, top_k=top_k)
                context = data["context"]
                sources = data["sources"]

                prompt = build_text_prompt(query, context, memory_text)
                answer = llm.generate(prompt)

                return {
                    "answer": answer,
                    "sources": sources,
                    "evaluation": evaluate_answer(answer, context)
                }

        context = "\n\n".join(retrieved)

        prompt = build_text_prompt(query, context, memory_text)
        draft = llm.generate(prompt, max_new_tokens=120)

        eval_res = evaluate_answer(draft, context)

        if eval_res["confidence_score"] < 0.5:
            final = refine_answer(query, context, draft, memory_text)
        else:
            final = draft

        memory.add_message("user", query)
        memory.add_message("assistant", final)

        return {
            "answer": final,
            "sources": [{"chunk": c[:200]} for c in retrieved],
            "evaluation": evaluate_answer(final, context)
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))



embedder = TextEmbedder()


@app.post("/ask-file")
async def ask_file(
    query: str = Form(...),
    top_k: int = Form(5),
    file: UploadFile = File(None)

):
    try:
        if file is None:
            raise HTTPException(status_code=400, detail="No file uploaded.")

        # 1. Read file
        content = await file.read()
        text = parse_file(file.filename, content)

        # 2. Chunk
        chunks = chunk_text(text, chunk_size=500, overlap=50)

        # 3. Embed
        embeddings = embedder.embed_texts(chunks)

        # 4. Query embedding
        q_emb = embedder.embed_texts([query])[0]

        # 5. Similarity search (cosine)
        scores = np.dot(embeddings, q_emb)
        top_indices = np.argsort(scores)[-top_k:][::-1]

        retrieved_chunks = [chunks[i] for i in top_indices]

        context = "\n\n".join(retrieved_chunks)

        # 6. Generate answer
        prompt = build_text_prompt(query, context, "")
        answer = llm.generate(prompt, max_new_tokens=200)

        eval_result = evaluate_answer(answer, context)

        return {
            "query": query,
            "answer": answer,
            "sources": [{"chunk": c[:200]} for c in retrieved_chunks],
            "evaluation": eval_result
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

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

            image = Image.open(req.image_path).convert("RGB")

            inputs = blip_processor(images=image, return_tensors="pt")
            out = blip_model.generate(**inputs)

            caption = blip_processor.decode(out[0], skip_special_tokens=True)
 
            return {
                "mode": req.mode,
                "image_path": req.image_path,
                "question": req.question,
                "answer": caption,
                "retrieved_results": [],  # no RAG here
                "evaluation": {
                    "note": "BLIP image captioning used"
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