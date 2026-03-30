from PIL import Image
import torch
from transformers import CLIPProcessor, CLIPModel


class CLIPEmbedder:
    def __init__(self, model_name: str = "openai/clip-vit-base-patch32"):
        self.device = "cuda" if torch.cuda.is_available() else "cpu"
        self.model = CLIPModel.from_pretrained(model_name).to(self.device)
        self.processor = CLIPProcessor.from_pretrained(model_name)

    def _normalize(self, tensor: torch.Tensor) -> torch.Tensor:
        return tensor / tensor.norm(dim=-1, keepdim=True)

    def embed_images(self, image_paths):
        images = [Image.open(path).convert("RGB") for path in image_paths]
        inputs = self.processor(images=images, return_tensors="pt", padding=True)
        inputs = {k: v.to(self.device) for k, v in inputs.items()}

        with torch.no_grad():
            vision_outputs = self.model.vision_model(pixel_values=inputs["pixel_values"])
            pooled = vision_outputs.pooler_output
            features = self.model.visual_projection(pooled)

        features = self._normalize(features)
        return features.cpu().numpy().astype("float32")

    def embed_texts(self, texts):
        inputs = self.processor(
            text=texts,
            return_tensors="pt",
            padding=True,
            truncation=True
        )
        inputs = {k: v.to(self.device) for k, v in inputs.items()}

        with torch.no_grad():
            text_outputs = self.model.text_model(
                input_ids=inputs["input_ids"],
                attention_mask=inputs["attention_mask"]
            )
            pooled = text_outputs.pooler_output
            features = self.model.text_projection(pooled)

        features = self._normalize(features)
        return features.cpu().numpy().astype("float32")