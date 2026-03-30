from src.generator.llm_client import LocalLLMClient


def build_image_prompt(user_query: str, results: list) -> str:
    if not results:
        return (
            "You are a grounded multimodal RAG assistant.\n"
            "No image evidence was retrieved.\n"
            "Answer: No relevant image evidence was found."
        )

    evidence_blocks = []
    for i, item in enumerate(results[:3], 1):
        evidence_blocks.append(
            f"[Evidence {i}]\n"
            f"Source File: {item.get('source_file')}\n"
            f"Similarity Score: {item.get('score', 0):.4f}\n"
            f"Caption: {item.get('caption', '')}\n"
            f"OCR Text: {item.get('ocr_text', '')[:500]}\n"
        )

    evidence = "\n".join(evidence_blocks)

    prompt = f"""
You are a grounded multimodal RAG assistant.

Your task:
- Answer ONLY from the retrieved image evidence below.
- Do NOT guess beyond the available evidence.
- If OCR text is noisy or unclear, explicitly say that confidence is limited.
- Prefer cautious, evidence-based wording.
- If the image type is clear but fine details are unclear, say what is clear and what is uncertain.

User Question:
{user_query}

Retrieved Image Evidence:
{evidence}

Write a concise answer grounded only in the evidence.
"""
    return prompt.strip()


class ImageAnswerGenerator:
    def __init__(self, model_name: str = "Qwen/Qwen2-1.5B-Instruct"):
        self.llm = LocalLLMClient(model_name=model_name)

    def answer(self, user_query: str, results: list) -> str:
        prompt = build_image_prompt(user_query, results)
        return self.llm.generate(prompt, max_new_tokens=220)