import os

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MODEL_PATH = os.path.abspath(
    os.path.join(BASE_DIR, "..", "Day3", "quantized", "model.gguf")
)
LLAMA_CLI_PATH = os.path.join(
    BASE_DIR,
    "llama.cpp",
    "build",
    "bin",
    "llama-cli"
)

HOST = os.getenv("HOST", "0.0.0.0")
PORT = int(os.getenv("PORT", 8000))

DEFAULT_MAX_TOKENS = int(os.getenv("DEFAULT_MAX_TOKENS", 128))
DEFAULT_TEMPERATURE = float(os.getenv("DEFAULT_TEMPERATURE", 0.7))
DEFAULT_TOP_P = float(os.getenv("DEFAULT_TOP_P", 0.9))
DEFAULT_TOP_K = int(os.getenv("DEFAULT_TOP_K", 40))

LOG_DIR = os.getenv("LOG_DIR", os.path.join(BASE_DIR, "logs"))
LOG_FILE = os.path.join(LOG_DIR, "app.log")

SYSTEM_PROMPT = """You are a safe healthcare reasoning and extraction assistant.
You must provide educational, non-diagnostic, non-prescriptive answers.
Do not claim certainty about diagnosis.
If symptoms may be serious, advise medical evaluation in a safe and cautious tone."""