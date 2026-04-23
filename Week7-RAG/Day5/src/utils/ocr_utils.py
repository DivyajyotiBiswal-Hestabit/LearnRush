import pytesseract
from PIL import Image


def extract_ocr_text(image_path: str) -> str:
    image = Image.open(image_path)
    text = pytesseract.image_to_string(image)
    return text.strip()