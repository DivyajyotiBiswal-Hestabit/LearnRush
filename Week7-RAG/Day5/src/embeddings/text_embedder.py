from sentence_transformers import SentenceTransformer


class TextEmbedder:
    def __init__(self):
        self.model = SentenceTransformer("BAAI/bge-small-en-v1.5")

    def embed_texts(self, texts):
        return self.model.encode(texts, normalize_embeddings=True)