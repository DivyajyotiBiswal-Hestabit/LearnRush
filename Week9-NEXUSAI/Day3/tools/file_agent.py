import autogen
from autogen import ConversableAgent, UserProxyAgent
import csv, os, glob, json, re
from config import LLM_CONFIG

HERE      = os.path.dirname(os.path.abspath(__file__))
WORKSPACE = os.path.join(HERE, "workspace")
os.makedirs(WORKSPACE, exist_ok=True)

def _safe_path(filename: str) -> str:
    safe = os.path.realpath(os.path.join(WORKSPACE, os.path.basename(filename)))
    if not safe.startswith(os.path.realpath(WORKSPACE)):
        raise ValueError("Path traversal blocked.")
    return safe

def read_file(filename: str) -> str:
    try:
        path = _safe_path(filename)
        if not os.path.exists(path):
            return f"ERROR: '{filename}' not found in workspace."
        with open(path) as f:
            content = f.read()
        return content if content.strip() else "(empty file)"
    except Exception as e:
        return f"READ ERROR: {e}"

def write_file(filename: str, content: str) -> str:
    try:
        path = _safe_path(filename)
        with open(path, "w") as f:
            f.write(content)
        return f"Written {len(content)} chars to '{filename}'."
    except Exception as e:
        return f"WRITE ERROR: {e}"

def read_csv(filename: str, max_rows: int = 50) -> str:
    try:
        path = _safe_path(filename)
        if not os.path.exists(path):
            return f"ERROR: '{filename}' not found in workspace."
        with open(path, newline="") as f:
            rows = list(csv.DictReader(f))
        if not rows:
            return "CSV is empty."
        cols   = list(rows[0].keys())
        header = " | ".join(cols)
        sep    = "-" * len(header)
        lines  = [header, sep]
        for row in rows[:max_rows]:
            lines.append(" | ".join(str(row[c]) for c in cols))
        if len(rows) > max_rows:
            lines.append(f"... ({len(rows)-max_rows} more rows)")
        lines.append(f"\nTotal rows: {len(rows)} | Columns: {cols}")
        return "\n".join(lines)
    except Exception as e:
        return f"CSV READ ERROR: {e}"

def write_csv(filename: str, rows_json: str) -> str:
    try:
        rows = json.loads(rows_json)
        if not rows:
            return "ERROR: empty rows."
        path = _safe_path(filename)
        cols = list(rows[0].keys())
        with open(path, "w", newline="") as f:
            w = csv.DictWriter(f, fieldnames=cols)
            w.writeheader()
            w.writerows(rows)
        return f"CSV written: '{filename}' — {len(rows)} rows, columns: {cols}"
    except Exception as e:
        return f"CSV WRITE ERROR: {e}"

def search_files(pattern: str) -> str:
    try:
        matches = glob.glob(os.path.join(WORKSPACE, pattern))
        if not matches:
            return f"No files found matching '{pattern}'."
        return "\n".join(
            f"{os.path.basename(m)} ({os.path.getsize(m)} bytes)" for m in matches
        )
    except Exception as e:
        return f"SEARCH ERROR: {e}"

TOOLS   = []
TOOL_MAP = {
    "read_file":    read_file,
    "write_file":   write_file,
    "read_csv":     read_csv,
    "write_csv":    write_csv,
    "search_files": search_files,
}

# System Prompt 
FILE_AGENT_PROMPT = """
You are the File Agent. You will be given file contents or operation results directly.
Your job is to summarise or answer based on the data provided.
Be concise and factual. End your response with [FILE_DONE].
""".strip()

file_agent = ConversableAgent(
    name="FileAgent",
    system_message=FILE_AGENT_PROMPT,
    llm_config=LLM_CONFIG,
    human_input_mode="NEVER",
    max_consecutive_auto_reply=2,
    is_termination_msg=lambda m: "[FILE_DONE]" in m.get("content", ""),
)

class FileExecutorProxy(UserProxyAgent):
    """
    Parses the incoming task, executes the right file tool directly,
    then forwards real results to the FileAgent for summarisation.
    Terminates after one round of real results.
    """
    def __init__(self):
        super().__init__(
            name="FileProxy",
            human_input_mode="NEVER",
            max_consecutive_auto_reply=2,
            code_execution_config=False,
            is_termination_msg=lambda m: "[FILE_DONE]" in m.get("content", ""),
        )
        self._executed = False

    def generate_reply(self, messages=None, sender=None, **kwargs):
        if self._executed:
            return None   

        last_msg = (messages or [{}])[-1].get("content", "").lower()
        result   = self._dispatch(last_msg)
        self._executed = True

        # Feed the real result back to the agent for summarisation
        return f"Here is the real file data:\n\n{result}\n\nNow summarise this and end with [FILE_DONE]."

    def _dispatch(self, task: str) -> str:
        """Pick and execute the right tool based on keywords in the task."""
        
        fname = self._extract_filename(task)

        if any(k in task for k in ["search", "list", "find", "what files"]):
            pattern = fname if fname else "*.csv"
            return search_files(pattern)

        if any(k in task for k in ["read csv", "read sales", "open csv",
                                    "contents of", "full contents", ".csv"]):
            filename = fname if fname else "sales.csv"
            return read_csv(filename)

        if any(k in task for k in ["read", "open", "show", "return", "contents"]):
            if fname:
                if fname.endswith(".csv"):
                    return read_csv(fname)
                return read_file(fname)
            
            return read_csv("sales.csv")

        if any(k in task for k in ["write", "save", "create"]):
            if fname:
                return f"(Write operation needs content — please specify content)"
            return "No filename provided for write operation."

        return read_csv("sales.csv")

    @staticmethod
    def _extract_filename(text: str) -> str | None:
        """Pull a filename like 'sales.csv' or 'notes.txt' from task text."""
        m = re.search(r"[\w\-]+\.(csv|txt|json)", text, re.IGNORECASE)
        return m.group(0) if m else None

def make_file_proxy() -> FileExecutorProxy:
    return FileExecutorProxy()

