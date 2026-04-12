import os
from typing import List, Dict, Optional

import requests

try:
    from .config import (
        DEFAULT_MAX_TOKENS,
        DEFAULT_TEMPERATURE,
        DEFAULT_TOP_P,
        DEFAULT_TOP_K,
        SYSTEM_PROMPT,
    )
except ImportError:
    from config import (
        DEFAULT_MAX_TOKENS,
        DEFAULT_TEMPERATURE,
        DEFAULT_TOP_P,
        DEFAULT_TOP_K,
        SYSTEM_PROMPT,
    )


LLAMA_SERVER_URL = "http://127.0.0.1:8080/completion"


class LlamaModelLoader:
    def __init__(self):
        self.server_url = LLAMA_SERVER_URL

    def build_prompt(
        self,
        user_prompt: str,
        system_prompt: Optional[str] = None,
        history: Optional[List[Dict[str, str]]] = None,
    ) -> str:
        system_prompt = system_prompt or SYSTEM_PROMPT
        history = history or []

        prompt_parts = [f"System: {system_prompt}"]

        for message in history:
            role = message.get("role", "user").capitalize()
            content = message.get("content", "")
            prompt_parts.append(f"{role}: {content}")

        prompt_parts.append(f"User: {user_prompt}")
        prompt_parts.append("Assistant:")

        return "\n".join(prompt_parts)

    def generate(
        self,
        prompt: str,
        max_tokens: int = DEFAULT_MAX_TOKENS,
        temperature: float = DEFAULT_TEMPERATURE,
        top_p: float = DEFAULT_TOP_P,
        top_k: int = DEFAULT_TOP_K,
    ) -> str:
        payload = {
            "prompt": prompt,
            "n_predict": max_tokens,
            "temperature": temperature,
            "top_p": top_p,
            "top_k": top_k,
            "stop": ["User:", "System:"],
            "stream": False,
        }

        response = requests.post(self.server_url, json=payload, timeout=300)
        response.raise_for_status()
        data = response.json()

        text = data.get("content", "").strip()

        if "Assistant:" in text:
            text = text.split("Assistant:")[-1].strip()

        return text

    def generate_chat(
        self,
        user_prompt: str,
        system_prompt: Optional[str] = None,
        history: Optional[List[Dict[str, str]]] = None,
        max_tokens: int = DEFAULT_MAX_TOKENS,
        temperature: float = DEFAULT_TEMPERATURE,
        top_p: float = DEFAULT_TOP_P,
        top_k: int = DEFAULT_TOP_K,
    ) -> str:
        final_prompt = self.build_prompt(
            user_prompt=user_prompt,
            system_prompt=system_prompt,
            history=history,
        )

        return self.generate(
            prompt=final_prompt,
            max_tokens=max_tokens,
            temperature=temperature,
            top_p=top_p,
            top_k=top_k,
        )