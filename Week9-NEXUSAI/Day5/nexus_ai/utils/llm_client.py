from __future__ import annotations

import json
import time
from typing import Any, Dict, Generator, List, Optional

from nexus_ai.config import (
    GROQ_API_KEY,
    GROQ_BASE_URL,
    DEFAULT_MODEL,
    MAX_TOKENS,
    TEMPERATURE,
    REQUEST_TIMEOUT,
)
from nexus_ai.utils.logger import get_logger

logger = get_logger("llm")


class GroqClient:

    def __init__(self, api_key: str = "", model: str = DEFAULT_MODEL):
        self._api_key = api_key or GROQ_API_KEY
        self._model   = model
        self._client  = None
        self._init_client()

    def _init_client(self):
        try:
            from openai import OpenAI
            self._client = OpenAI(
                api_key=self._api_key,
                base_url=GROQ_BASE_URL,
                timeout=REQUEST_TIMEOUT,
            )
            logger.info(f"Groq client ready — model={self._model}")
        except ImportError:
            logger.warning("'openai' package not found. Install: pip install openai")
            self._client = None

    def chat(
        self,
        messages: List[Dict[str, str]],
        model: Optional[str] = None,
        temperature: float = TEMPERATURE,
        max_tokens: int = MAX_TOKENS,
        tools: Optional[List[Dict]] = None,
        stream: bool = False,
        retries: int = 3,
    ) -> str:
        """
        Send a chat request and return the assistant reply as a string.
        Supports tool_use blocks (returns JSON if a tool is called).
        """
        if self._client is None:
            return "[ERROR: openai package not installed — run: pip install openai]"

        m = model or self._model
        kwargs: Dict[str, Any] = dict(
            model=m,
            messages=messages,
            temperature=temperature,
            max_tokens=max_tokens,
        )
        if tools:
            kwargs["tools"] = tools
            kwargs["tool_choice"] = "auto"

        last_exc = None
        for attempt in range(retries):
            try:
                resp = self._client.chat.completions.create(**kwargs)
                msg  = resp.choices[0].message

                # Tool call path
                if msg.tool_calls:
                    calls = []
                    for tc in msg.tool_calls:
                        calls.append({
                            "tool": tc.function.name,
                            "args": json.loads(tc.function.arguments),
                        })
                    return json.dumps({"tool_calls": calls})

                return msg.content or ""

            except Exception as e:
                last_exc = e
                wait = 2 ** attempt
                logger.warning(f"Groq attempt {attempt+1}/{retries} failed: {e} — retry in {wait}s")
                time.sleep(wait)

        return f"[LLM_ERROR after {retries} retries: {last_exc}]"

    def system_user(self, system: str, user: str, **kw) -> str:
        messages = [
            {"role": "system",  "content": system},
            {"role": "user",    "content": user},
        ]
        return self.chat(messages, **kw)

    def complete(self, prompt: str, **kw) -> str:
        return self.system_user("You are a helpful AI assistant.", prompt, **kw)