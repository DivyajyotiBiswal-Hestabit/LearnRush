from src.retriever.hybrid_retriever import HybridRetriever


class ContextBuilder:
    def __init__(self):
        self.retriever = HybridRetriever()

    def build(self, query, top_k=5, max_chars=3000):
        results = self.retriever.retrieve(query, top_k=top_k)

        context = []
        sources = []
        total_len = 0

        for i, r in enumerate(results, 1):
            source_file = r.get("source_file", "unknown")
            page_number = r.get("page_number", "NA")
            chunk_text = r.get("text", "")
            chunk_id = r.get("chunk_id", f"chunk_{i}")

            block = f"[{i}] {source_file} (p:{page_number})\n{chunk_text}\n"

            if total_len + len(block) > max_chars:
                break

            context.append(block)
            total_len += len(block)

            sources.append({
                "rank": i,
                "source": source_file,
                "chunk_id": chunk_id
            })

        return {
            "query": query,
            "context": "\n".join(context),
            "sources": sources
        }