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
            block = f"[{i}] {r['source_file']} (p:{r.get('page_number')})\n{r['text']}\n"

            if total_len + len(block) > max_chars:
                break

            context.append(block)
            total_len += len(block)

            sources.append({
                "rank": i,
                "source": r["source_file"],
                "chunk_id": r["chunk_id"]
            })

        return {
            "query": query,
            "context": "\n".join(context),
            "sources": sources
        }
if __name__ == "__main__":
    builder = ContextBuilder()

    print("\n📦 Context Builder (type 'exit' to quit)\n")

    while True:
        query = input("Enter query: ").strip()

        if query.lower() in ["exit", "quit"]:
            print("Exiting...")
            break

        if not query:
            print("Please enter a valid query.\n")
            continue

        result = builder.build(query=query, top_k=5)

        print("\n=== FINAL CONTEXT ===\n")
        print(result["context"][:3000])

        print("\n=== TRACE SOURCES ===")
        for src in result["sources"]:
            print(src)

        print("\n" + "-" * 60 + "\n")