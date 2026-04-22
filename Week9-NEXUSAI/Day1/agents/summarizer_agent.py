import autogen
from autogen import ConversableAgent
from autogen.agentchat.contrib.capabilities.transform_messages import TransformMessages
from autogen.agentchat.contrib.capabilities.transforms import MessageHistoryLimiter
from config import LLM_CONFIG

# System Prompt 
SUMMARIZER_SYSTEM_PROMPT = """
You are the Summarizer Agent.

YOUR ONLY JOB:
- Receive raw research notes (produced by the Research Agent).
- Think step-by-step (ReAct: Reason, then Act).
- Compress the notes into a clear, structured summary of 3–5 bullet points.

STRICT RULES:
- Do NOT answer the original question. Do NOT add new information.
- Output only the structured summary.
- End your response with the tag: [SUMMARY_DONE]

REASONING FORMAT (ReAct pattern):
Thought: <what is the core information in these notes?>
Action: <identify key points>
Observation: <key points found>
... (repeat as needed)
Summary:
• <point 1>
• <point 2>
• <point 3>
[SUMMARY_DONE]
""".strip()

def memory_window_hook(messages, window: int = 10):
    
    if len(messages) <= window:
        return messages
    return messages[-window:]

#  Agent Definition 
summarizer_agent = ConversableAgent(
    name="SummarizerAgent",
    system_message=SUMMARIZER_SYSTEM_PROMPT,
    llm_config=LLM_CONFIG,
    human_input_mode="NEVER",
    max_consecutive_auto_reply=10,       
)

TransformMessages(
    transforms=[MessageHistoryLimiter(max_messages=10)]
).add_to_agent(summarizer_agent)
