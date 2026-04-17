import pandas as pd


class FileAgent:
    def read(self, file_path):
        try:
            if file_path.endswith(".csv"):
                df = pd.read_csv(file_path)
                return df.head().to_string()

            elif file_path.endswith(".txt"):
                with open(file_path, "r") as f:
                    return f.read()

            else:
                return "Unsupported file type"

        except Exception as e:
            return str(e)