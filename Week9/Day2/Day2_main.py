from orchestrator.planner import Planner
from orchestrator.executor import Executor
from agents.reflection_agent import ReflectionAgent
from agents.validator import ValidatorAgent


def main():
    query = input("Enter your question: ")

    planner = Planner()
    executor = Executor()
    reflector = ReflectionAgent()
    validator = ValidatorAgent()

    print("\n--- PLANNER (TASK GRAPH) ---")
    plan = planner.create_plan(query)

    for task in plan:
        print(task)

    print("\n--- EXECUTION (DAG) ---")
    results = executor.execute(plan)

    combined_output = "\n".join(results.values())
    print(combined_output)

    print("\n--- REFLECTION ---")
    structured_input = f"""
    Ensure output contains:

    1. Definition
    2. Causes
    3. Effects

    Content:
    {combined_output}
    """

    improved = reflector.improve(structured_input)
    print(improved)

    print("\n--- VALIDATION ---")
    validation = validator.validate(improved)
    print(validation)

    # Retry loop
    retries = 2
    while validation["status"] == "INVALID" and retries > 0:
        print("\n--- RETRYING ---")
        improved = reflector.improve(improved, validation["reason"])
        validation = validator.validate(improved)
        retries -= 1

    print("\n--- FINAL ANSWER ---")
    print(improved)


if __name__ == "__main__":
    main()