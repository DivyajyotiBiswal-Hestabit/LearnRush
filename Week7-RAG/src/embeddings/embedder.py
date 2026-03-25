from sentence_transformers import SentenceTransformer
import numpy as np


class LocalEmbedder:
    def __init__(self, model_name: str):
        self.model = SentenceTransformer(
            model_name,
            trust_remote_code=True
        )

        # Important: keep input length controlled
        self.model.max_seq_length = 512

    def embed_texts(self, texts, batch_size: int = 8):
        vectors = self.model.encode(
            texts,
            batch_size=batch_size,
            show_progress_bar=True,
            convert_to_numpy=True,
            normalize_embeddings=True
        )
        return vectors.astype("float32")

    def embed_query(self, query: str):
        vector = self.model.encode(
            [query],
            batch_size=1,
            convert_to_numpy=True,
            normalize_embeddings=True
        )
        return vector.astype("float32")