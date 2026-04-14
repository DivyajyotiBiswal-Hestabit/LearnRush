import io
from PyPDF2 import PdfReader


def parse_file(filename: str, content: bytes) -> str:
    if filename.endswith(".pdf"):
        reader = PdfReader(io.BytesIO(content))
        text = ""
        for page in reader.pages:
            text += page.extract_text() or ""
        return text

    elif filename.endswith(".txt"):
        return content.decode("utf-8")

    else:
        raise ValueError("Unsupported file format")