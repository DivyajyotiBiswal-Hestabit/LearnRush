import json
import logging
import os
import uuid
from datetime import datetime
from typing import List, Optional

from fastapi import FastAPI, HTTPException, Request
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field

from .config import LOG_DIR, LOG_FILE, SYSTEM_PROMPT
from .model_loader import LlamaModelLoader

os.makedirs(LOG_DIR, exist_ok=True)

logging.basicConfig(
    filename=LOG_FILE,
    level=logging.INFO,
    format="%(asctime)s | %(levelname)s | %(message)s",
)

logger = logging.getLogger("llm_api")

app = FastAPI(
    title="Local LLM API",
    description="Quantized GGUF-powered local LLM service",
    version="1.0.0",
)

model = LlamaModelLoader()


class GenerateRequest(BaseModel):
    prompt: str
    system_prompt: Optional[str] = Field(default=SYSTEM_PROMPT)
    max_tokens: int = 128
    temperature: float = 0.7
    top_p: float = 0.9
    top_k: int = 40


class ChatMessage(BaseModel):
    role: str
    content: str


class ChatRequest(BaseModel):
    message: str
    history: Optional[List[ChatMessage]] = Field(default_factory=list)
    system_prompt: Optional[str] = Field(default=SYSTEM_PROMPT)
    max_tokens: int = 128
    temperature: float = 0.7
    top_p: float = 0.9
    top_k: int = 40


def make_request_id() -> str:
    return str(uuid.uuid4())


def log_request(request_id: str, endpoint: str, payload: dict):
    logger.info(
        json.dumps(
            {
                "request_id": request_id,
                "endpoint": endpoint,
                "type": "request",
                "payload": payload,
            }
        )
    )


def log_response(request_id: str, endpoint: str, output: str):
    logger.info(
        json.dumps(
            {
                "request_id": request_id,
                "endpoint": endpoint,
                "type": "response",
                "response_preview": output[:500],
            }
        )
    )


@app.middleware("http")
async def add_request_id(request: Request, call_next):
    request_id = make_request_id()
    request.state.request_id = request_id
    response = await call_next(request)
    response.headers["X-Request-ID"] = request_id
    return response


@app.get("/")
def root():
    return {"status": "ok", "message": "Local LLM API is running"}


@app.post("/generate")
def generate(request: Request, payload: GenerateRequest):
    request_id = request.state.request_id

    try:
        log_request(request_id, "/generate", payload.dict())

        final_prompt = model.build_prompt(
            user_prompt=payload.prompt,
            system_prompt=payload.system_prompt,
            history=[],
        )

        output = model.generate(
            prompt=final_prompt,
            max_tokens=payload.max_tokens,
            temperature=payload.temperature,
            top_p=payload.top_p,
            top_k=payload.top_k,
        )

        log_response(request_id, "/generate", output)

        return {
            "request_id": request_id,
            "timestamp": datetime.utcnow().isoformat(),
            "prompt": payload.prompt,
            "response": output,
        }

    except Exception as e:
        logger.exception(f"Generate failed | request_id={request_id} | error={str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/chat")
def chat(request: Request, payload: ChatRequest):
    request_id = request.state.request_id

    try:
        log_request(request_id, "/chat", payload.dict())

        history = [msg.dict() for msg in payload.history] if payload.history else []

        output = model.generate_chat(
            user_prompt=payload.message,
            system_prompt=payload.system_prompt,
            history=history,
            max_tokens=payload.max_tokens,
            temperature=payload.temperature,
            top_p=payload.top_p,
            top_k=payload.top_k,
        )

        updated_history = history + [
            {"role": "user", "content": payload.message},
            {"role": "assistant", "content": output},
        ]

        log_response(request_id, "/chat", output)

        return {
            "request_id": request_id,
            "timestamp": datetime.utcnow().isoformat(),
            "message": payload.message,
            "response": output,
            "history": updated_history,
        }

    except Exception as e:
        logger.exception(f"Chat failed | request_id={request_id} | error={str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/generate/stream")
def generate_stream(request: Request, payload: GenerateRequest):
    request_id = request.state.request_id

    try:
        log_request(request_id, "/generate/stream", payload.dict())

        final_prompt = model.build_prompt(
            user_prompt=payload.prompt,
            system_prompt=payload.system_prompt,
            history=[],
        )

        output = model.generate(
            prompt=final_prompt,
            max_tokens=payload.max_tokens,
            temperature=payload.temperature,
            top_p=payload.top_p,
            top_k=payload.top_k,
        )

        log_response(request_id, "/generate/stream", output)

        def streamer():
            for chunk in output.split():
                yield chunk + " "

        return StreamingResponse(streamer(), media_type="text/plain")

    except Exception as e:
        logger.exception(
            f"Streaming generate failed | request_id={request_id} | error={str(e)}"
        )
        raise HTTPException(status_code=500, detail=str(e))