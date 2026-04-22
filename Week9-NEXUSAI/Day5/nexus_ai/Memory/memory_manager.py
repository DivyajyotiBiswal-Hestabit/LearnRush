from __future__ import annotations

import hashlib
import json
import math
import time
from collections import defaultdict
from datetime import datetime
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple

from nexus_ai.config import (
    FAISS_INDEX_PATH,
    MEMORY_METADATA_PATH,
    SESSION_LOG_PATH,
    TOP_K_RECALL,
    MEMORY_THRESHOLD,
)
from nexus_ai.utils.logger import get_logger

logger = get_logger("memory")

try:
    import numpy as np
    _HAS_NUMPY = True
except ImportError:
    _HAS_NUMPY = False

try:
    import faiss
    _HAS_FAISS = True
except ImportError:
    _HAS_FAISS = False

try:
    from sentence_transformers import SentenceTransformer
    _HAS_ST = True
except ImportError:
    _HAS_ST = False


class _TFIDFEmbedder:
    """Minimal TF-IDF cosine embedder — works without any ML libs."""

    def __init__(self):
        self._corpus: List[str] = []
        self._vocab: Dict[str, int] = {}
        self._idf: Dict[int, float] = {}

    def _tokenise(self, text: str) -> List[str]:
        import re
        return re.findall(r"[a-z0-9]+", text.lower())

    def _tfidf_vec(self, text: str) -> List[float]:
        tokens = self._tokenise(text)
        tf: Dict[int, float] = defaultdict(float)
        for t in tokens:
            if t in self._vocab:
                tf[self._vocab[t]] += 1.0
        for idx in tf:
            tf[idx] = tf[idx] / len(tokens) * self._idf.get(idx, 1.0)
        dim = len(self._vocab) or 1
        vec = [0.0] * dim
        for idx, val in tf.items():
            if idx < dim:
                vec[idx] = val
        return vec

    def _norm(self, vec: List[float]) -> float:
        return math.sqrt(sum(v * v for v in vec)) or 1.0

    def fit(self, docs: List[str]):
        self._corpus = docs
        word_set: Dict[str, int] = {}
        for doc in docs:
            for t in set(self._tokenise(doc)):
                word_set[t] = word_set.get(t, 0) + 1
        self._vocab = {w: i for i, w in enumerate(sorted(word_set))}
        N = len(docs) or 1
        self._idf = {self._vocab[w]: math.log(N / (c + 1)) + 1
                     for w, c in word_set.items() if w in self._vocab}

    def encode(self, texts: List[str]) -> List[List[float]]:
        if not self._vocab:
            self.fit(texts)
        vecs = [self._tfidf_vec(t) for t in texts]
        return vecs

    def cosine(self, a: List[float], b: List[float]) -> float:
        dot = sum(x * y for x, y in zip(a, b))
        return dot / (self._norm(a) * self._norm(b))


class EmbeddingEngine:
    """Unified embedding interface — SentenceTransformer → TF-IDF fallback."""

    def __init__(self):
        self._st  = None
        self._tfidf = _TFIDFEmbedder()
        self._dim   = 384

        if _HAS_ST:
            try:
                from nexus_ai.config import EMBEDDING_MODEL
                self._st  = SentenceTransformer(EMBEDDING_MODEL)
                self._dim = self._st.get_sentence_embedding_dimension()
                logger.info(f"SentenceTransformer loaded (dim={self._dim})")
            except Exception as e:
                logger.warning(f"SentenceTransformer failed ({e}); using TF-IDF")
        else:
            logger.info("sentence-transformers not installed; using TF-IDF embedder")

    def encode(self, texts: List[str]) -> "np.ndarray":
        if self._st:
            import numpy as np
            vecs = self._st.encode(texts, show_progress_bar=False,
                                   normalize_embeddings=True)
            return vecs.astype("float32")

        # TF-IDF path
        self._tfidf.fit(texts)
        raw = self._tfidf.encode(texts)
        import numpy as np
        arr = np.zeros((len(raw), self._dim), dtype="float32")
        for i, v in enumerate(raw):
            for j, val in enumerate(v[:self._dim]):
                arr[i, j] = val
        # L2-normalise
        norms = np.linalg.norm(arr, axis=1, keepdims=True).clip(min=1e-9)
        return (arr / norms).astype("float32")

    @property
    def dim(self) -> int:
        return self._dim

class VectorStore:
    """FAISS IndexFlatIP (inner-product) store with JSON metadata sidecar."""

    def __init__(self, engine: EmbeddingEngine):
        self._engine   = engine
        self._meta: List[Dict] = []
        self._index    = None
        self._load()


    def _load(self):
        import numpy as np
        if _HAS_FAISS:
            if Path(FAISS_INDEX_PATH).exists():
                self._index = faiss.read_index(FAISS_INDEX_PATH)
                logger.info(f"FAISS index loaded ({self._index.ntotal} vectors)")
            else:
                self._index = faiss.IndexFlatIP(self._engine.dim)
        else:
            # Pure-numpy fallback
            self._vectors = np.zeros((0, self._engine.dim), dtype="float32")

        if Path(MEMORY_METADATA_PATH).exists():
            with open(MEMORY_METADATA_PATH, encoding="utf-8") as f:
                self._meta = json.load(f)

    def _save(self):
        if _HAS_FAISS and self._index is not None:
            faiss.write_index(self._index, FAISS_INDEX_PATH)
        with open(MEMORY_METADATA_PATH, "w", encoding="utf-8") as f:
            json.dump(self._meta, f, indent=2, ensure_ascii=False)


    def add(self, text: str, metadata: Dict) -> str:
        """Embed and store a text; return its unique ID."""
        import numpy as np
        uid = hashlib.md5((text + str(time.time())).encode()).hexdigest()[:12]
        vec = self._engine.encode([text])          # shape (1, dim)

        if _HAS_FAISS:
            self._index.add(vec)
        else:
            self._vectors = np.vstack([self._vectors, vec])

        self._meta.append({
            "id": uid, "text": text,
            "ts": datetime.utcnow().isoformat(),
            **metadata,
        })
        self._save()
        return uid

    def search(self, query: str, k: int = TOP_K_RECALL,
               threshold: float = MEMORY_THRESHOLD) -> List[Dict]:
        """Return top-k memories above similarity threshold."""
        import numpy as np
        if not self._meta:
            return []

        vec = self._engine.encode([query])          # (1, dim)
        k   = min(k, len(self._meta))

        if _HAS_FAISS:
            scores, idxs = self._index.search(vec, k)
            results = []
            for score, idx in zip(scores[0], idxs[0]):
                if idx >= 0 and float(score) >= threshold:
                    entry = dict(self._meta[idx])
                    entry["score"] = float(score)
                    results.append(entry)
        else:
            # numpy cosine fallback
            sims = (self._vectors @ vec.T).flatten()
            top_idxs = np.argsort(sims)[::-1][:k]
            results = []
            for idx in top_idxs:
                if sims[idx] >= threshold:
                    entry = dict(self._meta[idx])
                    entry["score"] = float(sims[idx])
                    results.append(entry)

        return results

    def __len__(self) -> int:
        return len(self._meta)


# ══════════════════════════════════════════════════════════════════════════════
#  Session store (conversation history)
# ══════════════════════════════════════════════════════════════════════════════

class SessionStore:
    """Stores full conversation history keyed by session_id."""

    def __init__(self):
        self._data: Dict[str, List[Dict]] = {}
        if Path(SESSION_LOG_PATH).exists():
            with open(SESSION_LOG_PATH, encoding="utf-8") as f:
                self._data = json.load(f)

    def append(self, session_id: str, role: str, content: str,
               agent: str = ""):
        self._data.setdefault(session_id, []).append({
            "role": role, "content": content,
            "agent": agent, "ts": datetime.utcnow().isoformat(),
        })
        self._flush()

    def get(self, session_id: str) -> List[Dict]:
        return self._data.get(session_id, [])

    def all_sessions(self) -> List[str]:
        return list(self._data.keys())

    def _flush(self):
        with open(SESSION_LOG_PATH, "w", encoding="utf-8") as f:
            json.dump(self._data, f, indent=2, ensure_ascii=False)


class MemoryManager:
    """
    Single entry-point for all memory operations.

    • short_term  — in-process dict, wiped per run
    • long_term   — FAISS vector store, persists across sessions
    • sessions    — full conversation log
    """

    def __init__(self, session_id: str):
        self.session_id  = session_id
        self._engine     = EmbeddingEngine()
        self._vector_db  = VectorStore(self._engine)
        self._session_db = SessionStore()
        self._short_term: Dict[str, Any] = {}
        logger.info(f"MemoryManager ready — session={session_id}, "
                    f"long_term_entries={len(self._vector_db)}")


    def store(self, key: str, value: Any):
        self._short_term[key] = value

    def retrieve(self, key: str, default: Any = None) -> Any:
        return self._short_term.get(key, default)


    def remember(self, text: str, metadata: Optional[Dict] = None) -> str:
        """Persist a fact/summary to the vector store."""
        meta = metadata or {}
        meta["session_id"] = self.session_id
        uid = self._vector_db.add(text, meta)
        logger.debug(f"Stored memory {uid}: {text[:60]}")
        return uid

    def recall(self, query: str, k: int = TOP_K_RECALL) -> List[Dict]:
        """Retrieve similar memories from all sessions."""
        hits = self._vector_db.search(query, k)
        logger.debug(f"Recall '{query[:40]}' → {len(hits)} hits")
        return hits

    def recall_as_context(self, query: str) -> str:
        """Return a formatted string of recalled memories for prompt injection."""
        hits = self.recall(query)
        if not hits:
            return ""
        lines = ["[Relevant memories from past sessions:]"]
        for h in hits:
            lines.append(f"• [{h.get('session_id','')} | score={h['score']:.2f}] "
                         f"{h['text'][:200]}")
        return "\n".join(lines)


    def log_message(self, role: str, content: str, agent: str = ""):
        self._session_db.append(self.session_id, role, content, agent)

    def get_history(self) -> List[Dict]:
        return self._session_db.get(self.session_id)

    def get_history_as_string(self, max_turns: int = 20) -> str:
        history = self.get_history()[-max_turns:]
        lines = []
        for m in history:
            prefix = f"[{m['agent']}]" if m.get("agent") else ""
            lines.append(f"{m['role'].upper()}{prefix}: {m['content'][:300]}")
        return "\n".join(lines)

    def summarise_and_store(self, text: str, tag: str = "summary"):
        """Auto-summarise long content and store as a memory."""
        import re
        sentences = re.split(r"(?<=[.!?])\s+", text.strip())
        summary   = " ".join(sentences[:3])
        self.remember(summary, {"tag": tag})
        return summary