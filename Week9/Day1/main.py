from agents.research_agent import ResearchAgent
from agents.summarizer_agent import SummarizerAgent
from agents.answer_agent import AnswerAgent


def main():
    query = input("Enter your question: ")

    research_agent = ResearchAgent()
    summarizer_agent = SummarizerAgent()
    answer_agent = AnswerAgent()

    print("\n--- Research Agent ---")
    research_output = research_agent.run(query)
    print(research_output)

    print("\n--- Summarizer Agent ---")
    summary = summarizer_agent.run(research_output)
    print(summary)

    print("\n--- Answer Agent ---")
    final_answer = answer_agent.run(summary)
    print(final_answer)


if __name__ == "__main__":
    main()