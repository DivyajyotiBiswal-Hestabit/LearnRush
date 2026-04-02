import re


def normalize_text(text: str) -> str:
    text = text.lower().strip()
    text = re.sub(r"\s+", " ", text)
    return text


def context_match_score(answer: str, context: str) -> float:
    """
    Lightweight overlap-based score.
    """
    answer_tokens = set(normalize_text(answer).split())
    context_tokens = set(normalize_text(context).split())

    if not answer_tokens:
        return 0.0

    overlap = answer_tokens.intersection(context_tokens)
    return round(len(overlap) / max(len(answer_tokens), 1), 4)


def faithfulness_score(answer: str, context: str) -> float:
    """
    Simple proxy: same as overlap-based grounding score,
    but slightly stricter by using only meaningful tokens.
    """
    stop_words = {
        "the", "a", "an", "is", "are", "was", "were", "to", "of", "and", "in",
        "for", "on", "at", "it", "this", "that", "with", "as", "by", "or"
    }

    answer_tokens = [t for t in normalize_text(answer).split() if t not in stop_words]
    context_tokens = set(t for t in normalize_text(context).split() if t not in stop_words)

    if not answer_tokens:
        return 0.0

    grounded = sum(1 for t in answer_tokens if t in context_tokens)
    return round(grounded / len(answer_tokens), 4)


def detect_hallucination(answer: str, context: str) -> bool:
    """
    Flag as hallucination if grounding is too low.
    """
    score = faithfulness_score(answer, context)
    return score < 0.35


def confidence_score(answer: str, context: str) -> float:
    cm = context_match_score(answer, context)
    fs = faithfulness_score(answer, context)

    confidence = (cm * 0.4) + (fs * 0.6)
    return round(confidence, 4)


def evaluate_answer(answer: str, context: str) -> dict:
    cm = context_match_score(answer, context)
    fs = faithfulness_score(answer, context)
    hallucinated = detect_hallucination(answer, context)
    confidence = confidence_score(answer, context)

    return {
        "context_match_score": cm,
        "faithfulness_score": fs,
        "hallucination_detected": hallucinated,
        "confidence_score": confidence
    }