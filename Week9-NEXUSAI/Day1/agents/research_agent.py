import autogen
from autogen import ConversableAgent
from autogen.agentchat.contrib.capabilities.transform_messages import TransformMessages
from autogen.agentchat.contrib.capabilities.transforms import MessageHistoryLimiter
from config import LLM_CONFIG

# System Prompt 
RESEARCH_SYSTEM_PROMPT = """
You are the Research Agent.

YOUR ONLY JOB:
- Receive a topic or question from the user.
- Think step-by-step (ReAct: Reason, then Act).
- Gather and return thorough raw information: facts, figures, context, sources.

STRICT RULES:
- Do NOT summarize. Do NOT give a final answer.
- Output only raw, detailed research notes.
- End your response with the tag: [RESEARCH_DONE]

REASONING FORMAT (ReAct pattern):
Thought: <what you need to find out>
Action: <what information you are recalling or retrieving>
Observation: <what you found>
... (repeat as needed)
Final Research Notes: <all gathered information>
[RESEARCH_DONE]
""".strip()

#  Agent Definition 
research_agent = ConversableAgent(
    name="ResearchAgent",
    system_message=RESEARCH_SYSTEM_PROMPT,
    llm_config=LLM_CONFIG,
    human_input_mode="NEVER",            
    max_consecutive_auto_reply=10,
)

TransformMessages(
    transforms=[MessageHistoryLimiter(max_messages=10)]
).add_to_agent(research_agent)

