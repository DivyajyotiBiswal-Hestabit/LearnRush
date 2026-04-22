import autogen
from autogen import ConversableAgent
from autogen.agentchat.contrib.capabilities.transform_messages import TransformMessages
from autogen.agentchat.contrib.capabilities.transforms import MessageHistoryLimiter
from config import LLM_CONFIG

# System Prompt
ANSWER_SYSTEM_PROMPT = """
You are the Answer Agent.

YOUR ONLY JOB:
- Receive a structured summary (produced by the Summarizer Agent).
- Think step-by-step (ReAct: Reason, then Act).
- Compose a clear, friendly, and complete final answer for the end user.

STRICT RULES:
- Do NOT do new research. Do NOT re-summarize.
- Write in plain English suitable for any reader.
- End your response with the tag: [ANSWER_DONE]

REASONING FORMAT (ReAct pattern):
Thought: <what question does this summary answer?>
Action: <compose a direct answer from the summary>
Observation: <draft checked for completeness>
Final Answer: <polished, user-facing response>
[ANSWER_DONE]
""".strip()

# Agent Definition
answer_agent = ConversableAgent(
    name="AnswerAgent",
    system_message=ANSWER_SYSTEM_PROMPT,
    llm_config=LLM_CONFIG,
    human_input_mode="NEVER",
    max_consecutive_auto_reply=10,
)

TransformMessages(
    transforms=[MessageHistoryLimiter(max_messages=10)]
).add_to_agent(answer_agent)