import json
import os
import re
from pathlib import Path

import faiss

from src.embeddings.clip_embedder import CLIPEmbedder
from src.generator.image_answer import ImageAnswerGenerator


def clean_ocr_text(text: str) -> str:
    if not text:
        return ""

    text = text.replace("\x0c", " ")
    text = re.sub(r"\s+", " ", text).strip()
    return text


def estimate_ocr_quality(text: str) -> float:
    if not text:
        return 0.0

    words = text.split()
    if not words:
        return 0.0

    alpha_words = sum(1 for w in words if re.search(r"[A-Za-z]", w))
    noisy_words = sum(1 for w in words if re.search(r"[^A-Za-z0-9,%().:/\-]", w))

    alpha_ratio = alpha_words / len(words)
    noise_penalty = noisy_words / len(words)

    score = max(0.0, min(1.0, alpha_ratio - 0.5 * noise_penalty))
    return score


def build_fallback_answer(results):
    if not results:
        return "No relevant image evidence was found."

    top = results[0]
    caption = (top.get("caption") or "").strip()
    ocr = clean_ocr_text(top.get("ocr_text") or "")
    score = top.get("score", 0.0)
    ocr_quality = estimate_ocr_quality(ocr)

    answer_parts = [
        f"The most relevant retrieved image is `{top.get('source_file', 'unknown')}` with similarity score {score:.4f}."
    ]

    if caption:
        answer_parts.append(f"BLIP caption suggests the image shows: {caption}.")
    else:
        answer_parts.append("No caption was generated for the image.")

    if ocr:
        answer_parts.append(f"Visible extracted text includes: {ocr[:300]}.")
    else:
        answer_parts.append("No useful OCR text could be extracted from the image.")

    if ocr_quality >= 0.7:
        answer_parts.append(
            "OCR quality appears reasonably usable, so the interpretation can rely partially on extracted text."
        )
    elif ocr_quality >= 0.35:
        answer_parts.append(
            "OCR quality is moderate, so this should be treated as a best-effort interpretation."
        )
    else:
        answer_parts.append(
            "OCR quality is poor or noisy, so I cannot make a fully reliable detailed claim from the extracted text alone."
        )

    answer_parts.append(
        "This answer is grounded in retrieved image evidence, OCR text, and caption output."
    )

    return "\n\n".join(answer_parts)


class ImageSearchEngine:
    def __init__(self, llm):
        self.embedder = CLIPEmbedder()
        self.answer_generator = ImageAnswerGenerator(llm=llm)

        base_dir = Path(__file__).resolve().parents[1]
        index_path = base_dir / "vectorstore" / "image_index.faiss"
        meta_path = base_dir / "vectorstore" / "image_index_meta.json"

        if not index_path.exists():
            raise FileNotFoundError(
                f"{index_path} not found. Run `PYTHONPATH=. python -m src.pipelines.image_ingest` first."
            )

        if not meta_path.exists():
            raise FileNotFoundError(
                f"{meta_path} not found. Run `PYTHONPATH=. python -m src.pipelines.image_ingest` first."
            )

        self.index = faiss.read_index(str(index_path))

        with open(meta_path, "r", encoding="utf-8") as f:
            self.metadata = json.load(f)

    def search_by_text(self, query: str, top_k: int = 5):
        qv = self.embedder.embed_texts([query])
        scores, indices = self.index.search(qv, top_k)

        results = []
        for score, idx in zip(scores[0], indices[0]):
            if idx == -1:
                continue
            item = dict(self.metadata[idx])
            item["score"] = float(score)
            results.append(item)

        return results

    def search_by_image(self, image_path: str, top_k: int = 5):
        if not os.path.exists(image_path):
            raise FileNotFoundError(f"Image not found: {image_path}")

        qv = self.embedder.embed_images([image_path])
        scores, indices = self.index.search(qv, top_k)

        results = []
        for score, idx in zip(scores[0], indices[0]):
            if idx == -1:
                continue
            item = dict(self.metadata[idx])
            item["score"] = float(score)
            results.append(item)

        return results

    def answer_from_text_query(self, query: str, top_k: int = 5):
        results = self.search_by_text(query, top_k=top_k)
        try:
            answer = self.answer_generator.answer(query, results)
        except Exception:
            answer = build_fallback_answer(results)
        return results, answer

    def answer_from_image_query(self, image_path: str, user_question: str = "Explain this image.", top_k: int = 5):
        results = self.search_by_image(image_path, top_k=top_k)
        try:
            answer = self.answer_generator.answer(user_question, results)
        except Exception:
            answer = build_fallback_answer(results)
        return results, answer