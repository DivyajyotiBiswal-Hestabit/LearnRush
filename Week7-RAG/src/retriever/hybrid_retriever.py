import os
import re
import yaml
import numpy as np
from rank_bm25 import BM25Okapi

from src.embeddings.embedder import LocalEmbedder
from src.vectorstore.faiss_store import FaissVectorStore
from src.retriever.reranker import Reranker
from src.retriever.mmr import mmr


class HybridRetriever:
    def __init__(self, config_path="src/config/settings.yaml"):
        with open(config_path) as f:
            self.cfg = yaml.safe_load(f)

        model_name = self.cfg["models"]["embedding_model"]

        self.embedder = LocalEmbedder(model_name)
        self.reranker = Reranker(model_name, use_cross_encoder=False)

        vs_dir = self.cfg["paths"]["vectorstore_dir"]
        self.store = FaissVectorStore.load(
            os.path.join(vs_dir, "index.faiss"),
            os.path.join(vs_dir, "index_meta.json")
        )

        self.metadata = self.store.metadata
        self.top_k = self.cfg["retrieval"]["top_k"]

        # BM25 setup
        self.corpus = [m["text"] for m in self.metadata]
        self.tokenized = [doc.lower().split() for doc in self.corpus]
        self.bm25 = BM25Okapi(self.tokenized)

    def extract_source(self, query):
        m = re.search(r'([\w\-.]+\.(csv|pdf|txt|docx))', query.lower())
        return m.group(1) if m else None

    def semantic(self, query):
        qv = self.embedder.embed_query(query)
        return self.store.search(qv, top_k=20)

    def keyword(self, query):
        tokens = query.lower().split()
        scores = self.bm25.get_scores(tokens)

        results = []
        for i, score in enumerate(scores):
            r = dict(self.metadata[i])
            r["keyword_score"] = float(score)
            results.append(r)

        results.sort(key=lambda x: x["keyword_score"], reverse=True)
        return results[:20]

    def filter(self, results, source=None, filters=None):
        if source:
            results = [r for r in results if r["source_file"].lower() == source]

        if filters:
            for k, v in filters.items():
                results = [
                    r for r in results
                    if str(r.get(k, "")).lower() == str(v).lower()
                ]

        return results

    def deduplicate(self, results):
        seen = set()
        out = []

        for r in results:
            key = (r["source_file"], r["chunk_id"])
            if key not in seen:
                seen.add(key)
                out.append(r)

        return out

    def retrieve(self, query, top_k=None, filters=None):
        k = top_k or self.top_k

        source = self.extract_source(query)

        sem = self.semantic(query)
        key = self.keyword(query)

        sem = self.filter(sem, source, filters)
        key = self.filter(key, source, filters)

        merged = self.deduplicate(sem + key)

        # Rerank
        reranked = self.reranker.rerank(query, merged)

        # MMR
        texts = [r["text"] for r in reranked]
        doc_vecs = self.embedder.embed_texts(texts)
        query_vec = self.embedder.embed_query(query)[0]

        final = mmr(query_vec, doc_vecs, reranked, top_k=k)

        return final
    
if __name__ == "__main__":
    retriever = HybridRetriever()

    print("\n🔎 Hybrid Retriever (type 'exit' to quit)\n")

    while True:
        query = input("Enter query: ").strip()

        if query.lower() in ["exit", "quit"]:
            print("Exiting...")
            break

        if not query:
            print("Please enter a valid query.\n")
            continue

        results = retriever.retrieve(query, top_k=5)

        if not results:
            print("No results found.\n")
            print("-" * 60 + "\n")
            continue

        for i, item in enumerate(results, 1):
            print(f"\nResult {i}")
            print(f"Source        : {item['source_file']}")
            print(f"Page          : {item.get('page_number')}")
            print(f"Chunk ID      : {item['chunk_id']}")
            print(f"Rerank Score  : {item.get('rerank_score', 0):.4f}")
            print(f"Tags          : {item.get('tags', [])}")
            print(f"Text          : {item['text'][:500]}...")

        print("\n" + "-" * 60 + "\n")