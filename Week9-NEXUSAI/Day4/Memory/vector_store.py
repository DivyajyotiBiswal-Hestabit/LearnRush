from __future__ import annotations
import json
import os
import time
from dataclasses import asdict, dataclass, field
from pathlib import Path
from typing import Optional

import numpy as np

_faiss = None
_SentenceTransformer = None


def _load_faiss():
    global _faiss
    if _faiss is None:
        import faiss  
        _faiss = faiss
    return _faiss


def _load_st():
    global _SentenceTransformer
    if _SentenceTransformer is None:
        from sentence_transformers import SentenceTransformer  
        _SentenceTransformer = SentenceTransformer
    return _SentenceTransformer

@dataclass
class MemoryChunk:
    """A single storable memory unit."""
    chunk_id: str
    text: str
    source: str                          
    timestamp: float = field(default_factory=time.time)
    metadata: dict = field(default_factory=dict)

    def to_dict(self) -> dict:
        return asdict(self)

    @classmethod
    def from_dict(cls, d: dict) -> "MemoryChunk":
        return cls(**d)


class FAISSVectorStore:

    INDEX_FILE    = "faiss_index.bin"
    METADATA_FILE = "faiss_metadata.json"

    def __init__(
        self,
        persist_dir: str | Path = "memory",
        model_name: str = "all-MiniLM-L6-v2",
        dimension: int = 384,
    ) -> None:
        self.persist_dir = Path(persist_dir)
        self.persist_dir.mkdir(parents=True, exist_ok=True)
        self.model_name  = model_name
        self.dimension   = dimension

        self._model  = None         
        self._index  = None          
        self._chunks: list[MemoryChunk] = []   

        self._load_or_create_index()


    def add(
        self,
        text: str,
        source: str = "session",
        chunk_id: str | None = None,
        **metadata,
    ) -> MemoryChunk:
        """
        Encode *text*, add its vector to the FAISS index, and persist.

        Returns the stored MemoryChunk.
        """
        if chunk_id is None:
            chunk_id = f"{source}_{int(time.time() * 1000)}"

        chunk = MemoryChunk(
            chunk_id=chunk_id,
            text=text,
            source=source,
            metadata=metadata,
        )

        vec = self._encode([text])           
        self._index.add(vec)
        self._chunks.append(chunk)
        self._persist()
        return chunk

    def add_batch(self, items: list[dict]) -> list[MemoryChunk]:
        """
        Bulk-add multiple chunks at once.

        Each item should have keys: text, source (opt), chunk_id (opt), + extras.
        """
        chunks, texts = [], []
        for item in items:
            text   = item.pop("text")
            source = item.pop("source", "session")
            cid    = item.pop("chunk_id", f"{source}_{int(time.time()*1000)}_{len(chunks)}")
            chunks.append(MemoryChunk(chunk_id=cid, text=text, source=source, metadata=item))
            texts.append(text)

        vecs = self._encode(texts)
        self._index.add(vecs)
        self._chunks.extend(chunks)
        self._persist()
        return chunks

    def search(
        self,
        query: str,
        k: int = 5,
        source_filter: str | None = None,
    ) -> list[tuple[MemoryChunk, float]]:
        """
        Retrieve the *k* most similar chunks to *query*.

        Parameters
        ----------
        query : str
            The user query / prompt to compare against stored chunks.
        k : int
            Number of neighbours to return.
        source_filter : str | None
            If set, only chunks with this source label are considered.

        Returns
        -------
        List of (MemoryChunk, distance) tuples, sorted ascending by distance
        (lower = more similar).
        """
        if self._index.ntotal == 0:
            return []

        q_vec = self._encode([query])
        actual_k = min(k * 3, self._index.ntotal)   # over-fetch to allow filtering
        distances, indices = self._index.search(q_vec, actual_k)

        results: list[tuple[MemoryChunk, float]] = []
        for dist, idx in zip(distances[0], indices[0]):
            if idx == -1:
                continue
            chunk = self._chunks[idx]
            if source_filter and chunk.source != source_filter:
                continue
            results.append((chunk, float(dist)))
            if len(results) == k:
                break

        return results

    def search_text(self, query: str, k: int = 5, source_filter: str | None = None) -> list[str]:
        """Convenience wrapper that returns only the text of matched chunks."""
        return [c.text for c, _ in self.search(query, k=k, source_filter=source_filter)]

    def get_context_block(
        self,
        query: str,
        k: int = 4,
        source_filter: str | None = None,
        header: str = "Relevant memories:",
    ) -> str:
        """
        Return a formatted string ready to inject into a system prompt.

        Example output
        --------------
        Relevant memories:
        [1] User's name is Alice. (source=fact, 2024-05-01)
        [2] User mentioned they prefer concise answers. (source=fact)
        """
        hits = self.search(query, k=k, source_filter=source_filter)
        if not hits:
            return ""
        lines = [header]
        for i, (chunk, dist) in enumerate(hits, 1):
            ts = time.strftime("%Y-%m-%d", time.localtime(chunk.timestamp))
            lines.append(f"[{i}] {chunk.text}  (source={chunk.source}, {ts}, dist={dist:.3f})")
        return "\n".join(lines)

    def delete(self, chunk_id: str) -> bool:
        """
        Remove a chunk by ID.
        FAISS flat indices do not support in-place removal, so we
        rebuild the index minus the deleted vector.
        """
        idx = next((i for i, c in enumerate(self._chunks) if c.chunk_id == chunk_id), None)
        if idx is None:
            return False

        self._chunks.pop(idx)
        self._rebuild_index()
        self._persist()
        return True

    def clear(self) -> None:
        """Wipe all stored vectors and metadata."""
        faiss = _load_faiss()
        self._index = faiss.IndexFlatL2(self.dimension)
        self._chunks.clear()
        self._persist()

    @property
    def size(self) -> int:
        return self._index.ntotal

    def __repr__(self) -> str:
        return f"FAISSVectorStore(size={self.size}, model={self.model_name})"

    # ── Private helpers ──────────────────────────

    def _get_model(self):
        if self._model is None:
            ST = _load_st()
            self._model = ST(self.model_name)
        return self._model

    def _encode(self, texts: list[str]) -> np.ndarray:
        model = self._get_model()
        vecs  = model.encode(texts, convert_to_numpy=True, normalize_embeddings=True)
        return vecs.astype("float32")

    def _load_or_create_index(self) -> None:
        faiss      = _load_faiss()
        idx_path   = self.persist_dir / self.INDEX_FILE
        meta_path  = self.persist_dir / self.METADATA_FILE

        if idx_path.exists() and meta_path.exists():
            self._index = faiss.read_index(str(idx_path))
            with open(meta_path) as f:
                raw = json.load(f)
            self._chunks = [MemoryChunk.from_dict(d) for d in raw]
            print(f"[VectorStore] Loaded {self._index.ntotal} vectors from {self.persist_dir}")
        else:
            self._index = faiss.IndexFlatL2(self.dimension)
            self._chunks = []
            print(f"[VectorStore] Created new index at {self.persist_dir}")

    def _persist(self) -> None:
        faiss = _load_faiss()
        faiss.write_index(self._index, str(self.persist_dir / self.INDEX_FILE))
        with open(self.persist_dir / self.METADATA_FILE, "w") as f:
            json.dump([c.to_dict() for c in self._chunks], f, indent=2)

    def _rebuild_index(self) -> None:
        """Rebuild the flat index from stored chunks (needed after deletion)."""
        faiss = _load_faiss()
        self._index = faiss.IndexFlatL2(self.dimension)
        if self._chunks:
            texts = [c.text for c in self._chunks]
            vecs  = self._encode(texts)
            self._index.add(vecs)

