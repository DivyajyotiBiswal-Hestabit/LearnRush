import faiss
import numpy as np
from sentence_transformers import SentenceTransformer


class VectorStore:
    def __init__(self):
        self.model = SentenceTransformer("all-MiniLM-L6-v2")
        self.index = faiss.IndexFlatL2(384)
        self.texts = []

    def add(self, text):
        if not text or len(text.strip()) < 30:
            return

        # avoid duplicates
        for t in self.texts:
            if text[:100] == t[:100]:
                return

        emb = self.model.encode([text])
        self.index.add(np.array(emb).astype("float32"))
        self.texts.append(text)

    def search(self, query, top_k=3):
        if not self.texts:
            return []

        q_vec = self.model.encode([query])
        D, I = self.index.search(np.array(q_vec).astype("float32"), top_k)

        results = []

        for dist, idx in zip(D[0], I[0]):
            if idx >= len(self.texts):
                continue

            text = self.texts[idx]

            # 🔥 STRICT similarity filter (smaller = better)
            if dist > 0.45:
                continue

            # 🔥 keyword match (extra safety)
            match = sum(1 for w in query.lower().split() if w in text.lower())
            if match < 2:
                continue

            results.append(f"[Vector Memory]\n{text}")

        return results[:2]