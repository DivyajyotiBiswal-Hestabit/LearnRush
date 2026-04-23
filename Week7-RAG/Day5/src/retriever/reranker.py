from sentence_transformers import SentenceTransformer, CrossEncoder


class Reranker:
    def __init__(self, embed_model: str, use_cross_encoder: bool = False):
        self.embedder = SentenceTransformer(embed_model)
        self.use_cross_encoder = use_cross_encoder

        if use_cross_encoder:
            self.cross_encoder = CrossEncoder("cross-encoder/ms-marco-MiniLM-L-6-v2")

    def cosine_rerank(self, query, results):
        q_vec = self.embedder.encode(query, normalize_embeddings=True)

        texts = [r["text"] for r in results]
        doc_vecs = self.embedder.encode(texts, normalize_embeddings=True)

        for r, vec in zip(results, doc_vecs):
            r["rerank_score"] = float(q_vec @ vec)

        return sorted(results, key=lambda x: x["rerank_score"], reverse=True)

    def cross_rerank(self, query, results):
        pairs = [(query, r["text"]) for r in results]
        scores = self.cross_encoder.predict(pairs)

        for r, score in zip(results, scores):
            r["rerank_score"] = float(score)

        return sorted(results, key=lambda x: x["rerank_score"], reverse=True)

    def rerank(self, query, results):
        if self.use_cross_encoder:
            return self.cross_rerank(query, results)
        return self.cosine_rerank(query, results)