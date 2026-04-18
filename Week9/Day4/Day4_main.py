from utils import call_llm
from memory.session_memory import SessionMemory
from memory.vector_store import VectorStore
from memory.long_term import LongTermMemory

SYSTEM_PROMPT = """
You are a smart AI assistant.

STRICT RULES:
- Always answer in English
- If user asks "explain again", explain the LAST answer better
- Do NOT explain what "explain again" means
- If past memory is relevant, use it naturally
- If not relevant, ignore it
"""

session = SessionMemory()
vector_db = VectorStore()
long_db = LongTermMemory()

last_query = None
last_response = None

def summarize(text):
    prompt = """
Extract ONLY factual knowledge.

STRICT:
- Only definitions / concepts
- ONLY USE English Language
- DO NOT USE ANY OTHER Language
- NO explanation patterns
- NO "user asked"
- NO instructions
- NO meta text

Return 3-5 bullet points ONLY.
"""

    result = call_llm(prompt, [{"role": "user", "content": text}])
    
    # 🔥 HARD FILTER (extra safety)
    if "explain" in result.lower():
        return ""

    return result.strip()


def format_memory(vector_results, long_results):
    
    if long_results:
        return long_results[0]

    if vector_results:
        return vector_results[0]

    return ""


def run():
    global last_query, last_response

    while True:
        query = input("\nUser: ").strip()

        if query.lower() == "exit":
            print("Exiting...")
            break

        if query.lower() in ["explain again", "repeat", "again"]:

            messages = [
                {"role": "system", "content": SYSTEM_PROMPT},
                {
                    "role": "user",
                    "content": f"Explain this again clearly and simply:\n{last_answer}"
                }
            ]

            response = call_llm("", messages)
            print("\nAI:", response)
            last_answer = last_response
            continue
            

        # 🔥 MEMORY RETRIEVAL
        vector_results = vector_db.search(query)
        long_results = long_db.search(query)

        memory_context = format_memory(vector_results, long_results)

        if memory_context:
            print("\n--- MEMORY USED ---")
            print(memory_context)

        # 🔥 LLM CALL
        messages = [
            {
                "role": "system",
                "content": SYSTEM_PROMPT + "\nMemory:\n" + memory_context
            },
            {"role": "user", "content": query}
        ]

        response = call_llm("", messages)
        print("\nAI:", response)

        # 🔥 STORE SESSION
        session.add("user", query)
        session.add("assistant", response)


        # 🔥 SAVE LAST FOR "EXPLAIN AGAIN"
        last_query = query
        last_response = response

        if query.lower() in ["explain again", "repeat", "again"]:
            continue

        # 🔥 CLEAN SUMMARY
        summary = summarize(query + "\n" + response)

        if summary and len(summary) > 30:
            vector_db.add(summary)
            long_db.add(query, summary)


if __name__ == "__main__":
    run()