from __future__ import annotations

import json
import os
from pathlib import Path
from typing import Dict, List
import re

import yaml
from tqdm import tqdm

from src.embeddings.embedder import LocalEmbedder
from src.utils.loaders import detect_and_load
from src.utils.logger import setup_logger
from src.utils.text_utils import clean_text, chunk_text
from src.vectorstore.faiss_store import FaissVectorStore


def infer_tags(filename: str):
    stem = Path(filename).stem.lower()
    parts = re.split(r'[_\-\s]+', stem)
    tags = [p for p in parts if p]
    return tags


def save_json(path: str, data) -> None:
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)


def main():
    with open("src/config/settings.yaml", "r", encoding="utf-8") as f:
        cfg = yaml.safe_load(f)

    raw_dir = cfg["paths"]["raw_dir"]
    cleaned_dir = cfg["paths"]["cleaned_dir"]
    chunks_dir = cfg["paths"]["chunks_dir"]
    vectorstore_dir = cfg["paths"]["vectorstore_dir"]
    logs_dir = cfg["paths"]["logs_dir"]

    chunk_size = cfg["chunking"]["chunk_size"]
    chunk_overlap = cfg["chunking"]["chunk_overlap"]
    min_chunk_chars = cfg["chunking"]["min_chunk_chars"]
    default_tags = cfg["metadata"]["default_tags"]

    logger = setup_logger(logs_dir)
    embedder = LocalEmbedder(cfg["models"]["embedding_model"])

    raw_files = [
        os.path.join(raw_dir, f)
        for f in os.listdir(raw_dir)
        if os.path.isfile(os.path.join(raw_dir, f))
    ]

    if not raw_files:
        logger.warning("No files found in data/raw")
        return

    all_chunks: List[Dict] = []

    logger.info("Starting ingestion pipeline")

    for file_path in tqdm(raw_files, desc="Loading files"):
        filename = os.path.basename(file_path)
        logger.info(f"Loading file: {filename}")

        try:
            docs = detect_and_load(file_path)
        except Exception as e:
            logger.exception(f"Failed to load {filename}: {e}")
            continue

        cleaned_pages = []

        for page_doc in docs:
            raw_text = page_doc["text"]
            page_number = page_doc.get("page_number")
            cleaned = clean_text(raw_text)

            if not cleaned:
                continue

            cleaned_pages.append(
                {
                    "page_number": page_number,
                    "text": cleaned,
                }
            )

        save_json(
            os.path.join(cleaned_dir, f"{Path(filename).stem}_cleaned.json"),
            cleaned_pages,
        )

        file_tags = list(set(default_tags + infer_tags(filename)))

        chunk_counter = 0
        for page in cleaned_pages:
            page_number = page["page_number"]
            page_text = page["text"]

            page_chunks = chunk_text(
                page_text,
                chunk_size=chunk_size,
                chunk_overlap=chunk_overlap,
                min_chunk_chars=min_chunk_chars,
            )

            for chunk in page_chunks:
                chunk_id = f"{Path(filename).stem}_chunk_{chunk_counter:04d}"
                all_chunks.append(
                    {
                        "chunk_id": chunk_id,
                        "source_file": filename,
                        "page_number": page_number,
                        "tags": file_tags,
                        "text": chunk,
                    }
                )
                chunk_counter += 1

        save_json(
            os.path.join(chunks_dir, f"{Path(filename).stem}_chunks.json"),
            [c for c in all_chunks if c["source_file"] == filename],
        )

    if not all_chunks:
        logger.warning("No chunks created")
        return

    logger.info(f"Created {len(all_chunks)} chunks")

    texts = [c["text"] for c in all_chunks]
    vectors = embedder.embed_texts(texts)
    logger.info(f"Generated embeddings with shape: {vectors.shape}")

    store = FaissVectorStore(dim=vectors.shape[1])
    store.add(vectors, all_chunks)

    os.makedirs(vectorstore_dir, exist_ok=True)
    store.save(
        index_path=os.path.join(vectorstore_dir, "index.faiss"),
        metadata_path=os.path.join(vectorstore_dir, "index_meta.json"),
    )

    logger.info("Saved FAISS index and metadata")
    logger.info("Day 1 ingestion pipeline completed successfully")


if __name__ == "__main__":
    main()