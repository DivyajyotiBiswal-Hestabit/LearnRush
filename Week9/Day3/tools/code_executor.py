import subprocess
import tempfile


class CodeExecutor:
    def execute(self, code):
        try:
            with tempfile.NamedTemporaryFile(mode="w", suffix=".py", delete=False) as f:
                f.write(code)
                path = f.name

            result = subprocess.run(
                ["python", path],
                capture_output=True,
                text=True,
                timeout=10
            )

            return result.stdout if result.stdout else result.stderr

        except Exception as e:
            return str(e)