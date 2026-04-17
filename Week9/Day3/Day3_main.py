from orchestrator import Orchestrator


def main():
    query = input("Enter your query: ")

    orchestrator = Orchestrator()

    result = orchestrator.run(query)

    print("\nFINAL OUTPUT")
    print(result)


if __name__ == "__main__":
    main()