from orchestrator import plan_and_execute

def main():
    print("=" * 65)
    print("  Day 3 — Tool-Calling Agents Pipeline")
    print("  Agents: FileAgent → CodeAgent → DBAgent → Synthesis")
    print("=" * 65)

    query = input("\nEnter your query (or press Enter for default):\n> ").strip()
    if not query:
        query = "Analyze sales.csv and generate top 5 insights"

    final_answer = plan_and_execute(query)

    print(final_answer)

if __name__ == "__main__":
    main()