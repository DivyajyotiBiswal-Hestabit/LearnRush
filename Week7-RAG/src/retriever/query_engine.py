import os
import re
import yaml

from src.embeddings.embedder import LocalEmbedder
from src.vectorstore.faiss_store import FaissVectorStore


class QueryEngine:
    def __init__(self, config_path: str = "src/config/settings.yaml"):
        with open(config_path, "r", encoding="utf-8") as f:
            self.cfg = yaml.safe_load(f)

        self.embedder = LocalEmbedder(self.cfg["models"]["embedding_model"])

        vectorstore_dir = self.cfg["paths"]["vectorstore_dir"]
        self.index_path = os.path.join(vectorstore_dir, "index.faiss")
        self.meta_path = os.path.join(vectorstore_dir, "index_meta.json")

        self.store = FaissVectorStore.load(self.index_path, self.meta_path)
        self.top_k = self.cfg["retrieval"]["top_k"]

    def extract_source_filter(self, query: str):
        match = re.search(r'([\w\-.]+\.(csv|pdf|txt|docx))', query.lower())
        return match.group(1) if match else None

    def search(self, query: str, top_k: int = None):
        k = top_k or self.top_k

        # Search a wider pool first, then filter if needed
        qv = self.embedder.embed_query(query)
        results = self.store.search(qv, top_k=50)

        source_filter = self.extract_source_filter(query)

        if source_filter:
            filtered = [
                r for r in results
                if r["source_file"].lower() == source_filter
            ]
            if filtered:
                return filtered[:k]

        return results[:k]


if __name__ == "__main__":
    engine = QueryEngine()

    print("\n🔍 RAG Query Engine (type 'exit' to quit)\n")

    while True:
        query = input("Enter query: ").strip()

        if query.lower() in ["exit", "quit"]:
            print("Exiting...")
            break

        if not query:
            print("Please enter a valid query.\n")
            continue

        source_filter = engine.extract_source_filter(query)
        if source_filter:
            print(f"\nDetected source filter: {source_filter}")

        results = engine.search(query)

        if not results:
            print("No results found.\n")
            print("-" * 60 + "\n")
            continue

        for i, item in enumerate(results, 1):
            print(f"\nResult {i}")
            print(f"Score      : {item['score']:.4f}")
            print(f"Source     : {item['source_file']}")
            print(f"Page       : {item['page_number']}")
            print(f"Chunk ID   : {item['chunk_id']}")
            print(f"Tags       : {item['tags']}")
            print(f"Text       : {item['text'][:500]}...")

        print("\n" + "-" * 60 + "\n")