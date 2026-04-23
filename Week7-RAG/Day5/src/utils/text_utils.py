from __future__ import annotations

import re
from typing import List


def clean_text(text: str) -> str:
    text = text.replace("\x00", " ")
    text = re.sub(r"[ \t]+", " ", text)
    text = re.sub(r"\n{3,}", "\n\n", text)
    text = re.sub(r"\s+\n", "\n", text)
    return text.strip()


def simple_tokenize(text: str) -> List[str]:
    """
    Lightweight token approximation for chunk sizing.
    Good enough for Day 1.
    """
    return text.split()


def chunk_text(
    text: str,
    chunk_size: int = 600,
    chunk_overlap: int = 100,
    min_chunk_chars: int = 80,
) -> List[str]:
    tokens = simple_tokenize(text)

    if not tokens:
        return []

    chunks = []
    start = 0
    step = chunk_size - chunk_overlap

    while start < len(tokens):
        end = min(start + chunk_size, len(tokens))
        chunk = " ".join(tokens[start:end]).strip()
        if len(chunk) >= min_chunk_chars:
            chunks.append(chunk)
        if end == len(tokens):
            break
        start += step

    return chunks