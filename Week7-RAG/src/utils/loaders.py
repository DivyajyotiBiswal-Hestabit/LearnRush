import os
from pathlib import Path
import pandas as pd
from docx import Document
from pypdf import PdfReader

def load_pdf(path: str):
    reader = PdfReader(path)
    pages = []
    for i, page in enumerate(reader.pages):
        text = page.extract_text() or ""
        pages.append({
            "text": text,
            "page_number": i + 1
        })
    return pages

def load_txt(path: str):
    text = Path(path).read_text(encoding="utf-8", errors="ignore")
    return [{"text": text, "page_number": None}]

def load_docx(path: str):
    doc = Document(path)
    paragraphs = [p.text for p in doc.paragraphs if p.text.strip()]
    text = "\n".join(paragraphs)
    return [{"text": text, "page_number": None}]

def load_csv(path: str):
    df = pd.read_csv(path)
    text = df.to_csv(index=False)
    return [{"text": text, "page_number": None}]

def detect_and_load(path: str):
    ext = os.path.splitext(path)[1].lower()

    if ext == ".pdf":
        return load_pdf(path)
    elif ext == ".txt":
        return load_txt(path)
    elif ext == ".docx":
        return load_docx(path)
    elif ext == ".csv":
        return load_csv(path)
    else:
        raise ValueError(f"Unsupported file type: {ext}")