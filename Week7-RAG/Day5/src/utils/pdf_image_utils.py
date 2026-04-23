import fitz
import os


def extract_pdf_pages_as_images(pdf_path: str, output_dir: str):
    os.makedirs(output_dir, exist_ok=True)
    doc = fitz.open(pdf_path)
    output_paths = []

    for i, page in enumerate(doc):
        pix = page.get_pixmap(matrix=fitz.Matrix(2, 2))
        out_path = os.path.join(output_dir, f"{os.path.basename(pdf_path)}_page_{i+1}.png")
        pix.save(out_path)
        output_paths.append(out_path)

    return output_paths