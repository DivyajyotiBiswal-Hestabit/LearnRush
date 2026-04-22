import os
from pathlib import Path
from dotenv import load_dotenv
load_dotenv()

BASE_DIR    = Path(__file__).parent.parent
NEXUS_DIR   = BASE_DIR / "nexus_ai"
LOGS_DIR    = BASE_DIR / "logs"
OUTPUTS_DIR = BASE_DIR / "outputs"
DATA_DIR    = BASE_DIR / "data"
MEMORY_DIR  = BASE_DIR / "data" / "memory"

for d in [LOGS_DIR, OUTPUTS_DIR, DATA_DIR, MEMORY_DIR]:
    d.mkdir(parents=True, exist_ok=True)

LLM_PROVIDER   = "groq"
GROQ_API_KEY   = os.getenv("GROQ_API_KEY")         
GROQ_BASE_URL  = "https://api.groq.com/openai/v1"

# Model tiers  (Groq model names)
MODELS = {
    "fast":     "llama-3.1-8b-instant",      # lightweight tasks
    "balanced": "llama-3.3-70b-versatile",   # most agents
    "powerful": "llama-3.3-70b-versatile",   # orchestrator / critic
}

DEFAULT_MODEL       = MODELS["balanced"]
ORCHESTRATOR_MODEL  = MODELS["powerful"]
CRITIC_MODEL        = MODELS["powerful"]
CODER_MODEL         = MODELS["balanced"]

MAX_ROUNDS          = 20          # max conversation turns per task
MAX_CONSECUTIVE_AUTO_REPLY = 5   # per agent
TEMPERATURE         = 0.3
MAX_TOKENS          = 4096
REQUEST_TIMEOUT     = 120

EMBEDDING_MODEL     = "sentence-transformers/all-MiniLM-L6-v2"
FAISS_INDEX_PATH    = str(MEMORY_DIR / "faiss.index")
MEMORY_METADATA_PATH = str(MEMORY_DIR / "metadata.json")
SESSION_LOG_PATH    = str(MEMORY_DIR / "sessions.json")
TOP_K_RECALL        = 5           # how many memories to surface per query
MEMORY_THRESHOLD    = 0.70        # cosine-similarity threshold

MAX_PLAN_DEPTH      = 6           # max sub-tasks per plan
PLAN_RETRY_LIMIT    = 3           # retries on failed task nodes

LOG_LEVEL           = "DEBUG"
LOG_FILE            = str(LOGS_DIR / "nexus.log")
TRACE_FILE          = str(LOGS_DIR / "trace.jsonl")

CODE_OUTPUT_DIR     = str(OUTPUTS_DIR / "code")
REPORT_OUTPUT_DIR   = str(OUTPUTS_DIR / "reports")
CHART_OUTPUT_DIR    = str(OUTPUTS_DIR / "charts")

for d in [CODE_OUTPUT_DIR, REPORT_OUTPUT_DIR, CHART_OUTPUT_DIR]:
    Path(d).mkdir(parents=True, exist_ok=True)

AGENT_ROLES = {
    "orchestrator": "Routes tasks, manages agent lifecycle, drives DAG execution.",
    "planner":      "Decomposes goals into ordered sub-tasks; builds execution DAG.",
    "researcher":   "Gathers facts, synthesises knowledge; returns structured findings.",
    "coder":        "Writes, refines, and saves production-quality code.",
    "analyst":      "Processes data, identifies patterns, produces business insights.",
    "critic":       "Reviews outputs for correctness, quality, gaps; scores work.",
    "optimizer":    "Improves prior outputs; applies self-reflection feedback.",
    "validator":    "Runs checks / tests; certifies readiness or flags failures.",
    "reporter":     "Compiles final reports with summaries, findings, and recommendations.",
}