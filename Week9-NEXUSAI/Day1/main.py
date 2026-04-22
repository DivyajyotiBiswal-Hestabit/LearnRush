import autogen
from agents.research_agent import research_agent
from agents.summarizer_agent import summarizer_agent
from agents.answer_agent import answer_agent

# Silent Proxy 
def make_relay(name: str) -> autogen.UserProxyAgent:
    """Create a non-interactive relay proxy."""
    return autogen.UserProxyAgent(
        name=name,
        human_input_mode="NEVER",
        max_consecutive_auto_reply=1,
        code_execution_config=False,
        is_termination_msg=lambda msg: False,   
    )


def last_reply(chat_result) -> str:

    history = chat_result.chat_history

    if hasattr(chat_result, "summary") and chat_result.summary:
        return chat_result.summary.strip()

    if len(history) >= 2:
        return history[1]["content"].strip()

    for msg in reversed(history):
        if msg.get("role") == "assistant":
            return msg["content"].strip()

    return ""

def run_pipeline(user_query: str) -> str:
    print("\n" + "=" * 60)
    print(f"USER QUERY: {user_query}")
    print("=" * 60)

    print("\n[STEP 1] Research Agent is working …")
    relay1 = make_relay("Relay_to_Research")
    result1 = relay1.initiate_chat(
        research_agent,
        message=user_query,
        max_turns=1,
        silent=True,
    )
    research_notes = last_reply(result1)
    print(f"\n--- Research Notes ---\n{research_notes}\n")

    print("[STEP 2] Summarizer Agent is working …")
    relay2 = make_relay("Relay_to_Summarizer")
    result2 = relay2.initiate_chat(
        summarizer_agent,
        message=research_notes,
        max_turns=1,
        silent=True,
    )
    summary = last_reply(result2)
    print(f"\n--- Summary ---\n{summary}\n")

    print("[STEP 3] Answer Agent is working …")
    relay3 = make_relay("Relay_to_Answer")
    result3 = relay3.initiate_chat(
        answer_agent,
        message=summary,
        max_turns=1,
        silent=True,
    )
    final_answer = last_reply(result3)

    print("\n" + "=" * 60)
    print("FINAL ANSWER TO USER:")
    print("=" * 60)
    print(final_answer)
    print("=" * 60 + "\n")

    return final_answer

if __name__ == "__main__":
    print("Multi-Agent Pipeline — Day 1")
    print("Agents: Research → Summarizer → Answer")

    while True:
        query = input("\nEnter your query: ").strip()

        if query.lower() == "exit":
            print("Exiting...")
            break

        run_pipeline(query)
    
