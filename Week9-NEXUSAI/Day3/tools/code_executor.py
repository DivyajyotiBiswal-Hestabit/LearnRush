import autogen
from autogen import ConversableAgent, UserProxyAgent
import subprocess, tempfile, os, re
from config import LLM_CONFIG

HERE       = os.path.dirname(os.path.abspath(__file__))   
OUTPUT_DIR = os.path.join(os.path.dirname(HERE), "output") 
os.makedirs(OUTPUT_DIR, exist_ok=True)


def execute_python(code: str) -> str:
    """Run code in isolated subprocess, return stdout/stderr."""
    with tempfile.NamedTemporaryFile(suffix=".py", mode="w", delete=False) as f:
        f.write(code)
        tmp = f.name
    try:
        r = subprocess.run(["python3", tmp],
                           capture_output=True, text=True, timeout=30)
        return r.stdout.strip() or r.stderr.strip() or "No output."
    except subprocess.TimeoutExpired:
        return "ERROR: Timed out."
    except Exception as e:
        return f"ERROR: {e}"
    finally:
        os.unlink(tmp)

def save_code_to_file(code: str, filename: str) -> str:
    """Persist code to Day3/output/<filename>.py with strong guarantees"""

    #  Sanitize filename 
    base = re.sub(r"[^\w\-.]", "_", os.path.basename(filename))
    if not base.endswith(".py"):
        base += ".py"

    #  Resolve absolute output directory 
    output_dir = os.path.abspath(OUTPUT_DIR)

    #  Ensure directory exists
    try:
        os.makedirs(output_dir, exist_ok=True)
    except Exception as e:
        raise RuntimeError(f"Failed to create output directory: {output_dir}\n{e}")

    #  Build full path 
    path = os.path.join(output_dir, base)

    #  Write file safely 
    try:
        with open(path, "w", encoding="utf-8") as f:
            f.write(code)
    except Exception as e:
        raise RuntimeError(f"Failed to write file: {path}\n{e}")

    #  Verify file actually exists 
    if not os.path.exists(path):
        raise RuntimeError(f"File was not created: {path}")
    
    print(f"\n File saved at: {path}")
    print(f" Absolute dir : {output_dir}")
    print(f" CWD          : {os.getcwd()}")

    return path

def extract_code_block(text: str) -> str | None:
    """Pull the first ```python ... ``` block out of LLM reply."""
    m = re.search(r"```(?:python)?\s*\n(.*?)```", text, re.DOTALL)
    return m.group(1).strip() if m else None

def infer_filename(query: str, code: str) -> str:
    """Derive a snake_case filename from the user query."""
    name = query.lower()
    name = re.sub(r"[^a-z0-9\s]", "", name)
    name = "_".join(name.split()[:5])   # first 5 words
    return name + ".py"

TOOLS = []      
TOOL_MAP = {
    "execute_python":    execute_python,
    "save_code_to_file": save_code_to_file,
}

CODE_AGENT_PROMPT = """
You are the Code Agent. When asked to write code, reply with:

1. A brief one-line explanation of what the code does.
2. The complete, working Python code inside a single ```python ... ``` block.
3. The line: SAVE_AS: <filename.py>

Example response format:
This function performs linear search on a list.
```python
def linear_search(arr, target):
    for i, val in enumerate(arr):
        if val == target:
            return i
    return -1

# Demo
print(linear_search([3, 5, 1, 9], 1))
```
SAVE_AS: linear_search.py

RULES:
- Output exactly ONE ```python block.
- Always include a small demo/test at the bottom of the code so execution produces visible output.
- Always end with SAVE_AS: <filename>.
- Do not write multiple functions unless asked.
""".strip()

#  Agent 
code_agent = ConversableAgent(
    name="CodeAgent",
    system_message=CODE_AGENT_PROMPT,
    llm_config=LLM_CONFIG,
    human_input_mode="NEVER",
    max_consecutive_auto_reply=3,
    is_termination_msg=None,   
)

class CodeExecutorProxy(UserProxyAgent):
    """
    After the CodeAgent replies, this proxy:
      1. Extracts the ```python block
      2. Executes it
      3. Saves it to Day3/output/
      4. Reports back so the agent can confirm
    Terminates once a code block has been saved successfully.
    """
    def __init__(self, original_query: str):
        super().__init__(
            name="CodeProxy",
            human_input_mode="NEVER",
            max_consecutive_auto_reply=3,
            code_execution_config=False,
            is_termination_msg=lambda m: self._saved,
        )
        self._original_query = original_query
        self._saved = False

    def generate_reply(self, messages=None, sender=None, **kwargs):
        last = (messages or [{}])[-1].get("content", "")
        code = extract_code_block(last)

        if not code:
            return "Please provide the code inside a ```python block with SAVE_AS: filename.py at the end."

        # Execute
        output = execute_python(code)

        m = re.search(r"SAVE_AS:\s*(\S+\.py)", last)
        filename = m.group(1) if m else infer_filename(self._original_query, code)

        if output.startswith("ERROR"):
            return f"Execution failed:\n{output}\nPlease fix the code and try again."

        saved_path = save_code_to_file(code, filename)
        self._saved = True
        print(f"\n  Executed successfully")
        print(f"  Saved → {saved_path}")
        print(f"  Output: {output[:200]}")
        return None   # terminate

def make_code_proxy(query: str = "") -> CodeExecutorProxy:
    return CodeExecutorProxy(original_query=query)

