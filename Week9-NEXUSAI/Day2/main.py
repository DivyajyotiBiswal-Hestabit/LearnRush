from orchestrator.planner import run


def main():
    query = input("Enter your query: ").strip()
    if not query:
        query = "Explain how neural networks learn"

    result = run(query)

    print("\n" + "="*60)
    print("EXECUTION TREE")
    print("="*60)

    print(f"\nQuery: {result['query']}")

    print("\nTask Graph:")
    for t in result["task_graph"]:
        deps = f"  (depends on: {t['depends_on']})" if t["depends_on"] else ""
        print(f"  {t['id']}: {t['description']}{deps}")

    print("\nWorker Results:")
    for tid, res in result["worker_results"].items():
        print(f"  [{tid}]: {res[:120]}...")

    print(f"\nReflection:\n  {result['reflection'][:200]}...")

    print(f"\nValidation Passed: {result['validation_passed']}")

    print("\nFinal Answer:")
    print(f"  {result['final_answer']}")
    print("="*60)


if __name__ == "__main__":
    main()