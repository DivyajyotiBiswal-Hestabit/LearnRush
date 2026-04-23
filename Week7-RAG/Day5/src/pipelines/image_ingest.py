import json
import os
from pathlib import Path

import faiss
import numpy as np
import torch
from PIL import Image
from transformers import BlipProcessor, BlipForConditionalGeneration

from src.embeddings.clip_embedder import CLIPEmbedder
from src.utils.image_utils import preprocess_image
from src.utils.ocr_utils import extract_ocr_text
from src.utils.pdf_image_utils import extract_pdf_pages_as_images


SUPPORTED_IMAGE_EXTS = {".png", ".jpg", ".jpeg"}
SUPPORTED_DOC_EXTS = {".pdf"}


def generate_caption(image_path, processor, model, device):
    image = Image.open(image_path).convert("RGB")
    inputs = processor(images=image, return_tensors="pt").to(device)

    with torch.no_grad():
        out = model.generate(**inputs, max_new_tokens=40)

    caption = processor.decode(out[0], skip_special_tokens=True)
    return caption.strip()


def build_image_metadata_record(image_id, source_file, processed_path, ocr_text, caption):
    return {
        "image_id": image_id,
        "source_file": source_file,
        "processed_image_path": processed_path,
        "ocr_text": ocr_text,
        "caption": caption
    }


def main():
    raw_dir = "src/data/images/raw"
    processed_dir = "src/data/images/processed"
    meta_dir = "src/data/multimodal/metadata"
    vector_dir = "src/vectorstore"

    os.makedirs(processed_dir, exist_ok=True)
    os.makedirs(meta_dir, exist_ok=True)
    os.makedirs(vector_dir, exist_ok=True)

    clip_embedder = CLIPEmbedder()

    device = "cuda" if torch.cuda.is_available() else "cpu"
    blip_processor = BlipProcessor.from_pretrained("Salesforce/blip-image-captioning-base")
    blip_model = BlipForConditionalGeneration.from_pretrained(
        "Salesforce/blip-image-captioning-base"
    ).to(device)

    candidate_images = []

    for fname in os.listdir(raw_dir):
        path = os.path.join(raw_dir, fname)
        ext = Path(fname).suffix.lower()

        if ext in SUPPORTED_IMAGE_EXTS:
            candidate_images.append(path)

        elif ext in SUPPORTED_DOC_EXTS:
            pdf_output_dir = os.path.join(processed_dir, f"{Path(fname).stem}_pdf_pages")
            page_images = extract_pdf_pages_as_images(path, pdf_output_dir)
            candidate_images.extend(page_images)

    all_metadata = []
    processed_paths = []

    for idx, img_path in enumerate(candidate_images):
        stem = Path(img_path).stem
        processed_path = os.path.join(processed_dir, f"{stem}_processed.png")

        preprocess_image(img_path, processed_path)
        ocr_text = extract_ocr_text(processed_path)
        caption = generate_caption(processed_path, blip_processor, blip_model, device)

        image_id = f"img_{idx:04d}"
        source_file = os.path.basename(img_path)

        record = build_image_metadata_record(
            image_id=image_id,
            source_file=source_file,
            processed_path=processed_path,
            ocr_text=ocr_text,
            caption=caption
        )

        all_metadata.append(record)
        processed_paths.append(processed_path)

    if not processed_paths:
        print("No images found for ingestion.")
        return

    vectors = clip_embedder.embed_images(processed_paths)
    dim = vectors.shape[1]

    index = faiss.IndexFlatIP(dim)
    index.add(vectors)

    faiss.write_index(index, os.path.join(vector_dir, "image_index.faiss"))

    with open(os.path.join(vector_dir, "image_index_meta.json"), "w", encoding="utf-8") as f:
        json.dump(all_metadata, f, ensure_ascii=False, indent=2)

    print(f"Ingested {len(processed_paths)} images successfully.")


if __name__ == "__main__":
    main()