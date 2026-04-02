import os
import re
import yaml
import numpy as np
from rank_bm25 import BM25Okapi

from src.embeddings.embedder import LocalEmbedder
from src.vectorstore.faiss_store import FaissVectorStore
from src.retriever.reranker import Reranker
from src.retriever.mmr import mmr


class HybridRetriever:
    def __init__(self, config_path="src/config/settings.yaml"):
        with open(config_path) as f:
            self.cfg = yaml.safe_load(f)

        model_name = self.cfg["models"]["embedding_model"]

        self.embedder = LocalEmbedder(model_name)
        self.reranker = Reranker(model_name, use_cross_encoder=False)

        vs_dir = self.cfg["paths"]["vectorstore_dir"]
        self.store = FaissVectorStore.load(
            os.path.join(vs_dir, "index.faiss"),
            os.path.join(vs_dir, "index_meta.json")
        )

        self.metadata = self.store.metadata
        self.top_k = self.cfg["retrieval"]["top_k"]

        # BM25 setup
        self.corpus = [m["text"] for m in self.metadata]
        self.tokenized = [doc.lower().split() for doc in self.corpus]
        self.bm25 = BM25Okapi(self.tokenized)

    def extract_source(self, query):
        m = re.search(r'([\w\-.]+\.(csv|pdf|txt|docx))', query.lower())
        return m.group(1) if m else None

    def semantic(self, query):
        qv = self.embedder.embed_query(query)
        return self.store.search(qv, top_k=20)

    def keyword(self, query):
        tokens = query.lower().split()
        scores = self.bm25.get_scores(tokens)

        results = []
        for i, score in enumerate(scores):
            r = dict(self.metadata[i])
            r["keyword_score"] = float(score)
            results.append(r)

        results.sort(key=lambda x: x["keyword_score"], reverse=True)
        return results[:20]

    def filter(self, results, source=None, filters=None):
        if source:
            results = [r for r in results if r["source_file"].lower() == source]

        if filters:
            for k, v in filters.items():
                results = [
                    r for r in results
                    if str(r.get(k, "")).lower() == str(v).lower()
                ]

        return results

    def deduplicate(self, results):
        seen = set()
        out = []

        for r in results:
            key = (r["source_file"], r["chunk_id"])
            if key not in seen:
                seen.add(key)
                out.append(r)

        return out

    def retrieve(self, query, top_k=None, filters=None):
        k = top_k or self.top_k

        source = self.extract_source(query)

        sem = self.semantic(query)
        key = self.keyword(query)

        sem = self.filter(sem, source, filters)
        key = self.filter(key, source, filters)

        merged = self.deduplicate(sem + key)

        # Rerank
        reranked = self.reranker.rerank(query, merged)

        # MMR
        texts = [r["text"] for r in reranked]
        doc_vecs = self.embedder.embed_texts(texts)
        query_vec = self.embedder.embed_query(query)[0]

        final = mmr(query_vec, doc_vecs, reranked, top_k=k)

        return final
    
if __name__ == "__main__":
    retriever = HybridRetriever()

    print("\n🔎 Hybrid Retriever (type 'exit' to quit)\n")

    while True:
        query = input("Enter query: ").strip()

        if query.lower() in ["exit", "quit"]:
            print("Exiting...")
            break

        if not query:
            print("Please enter a valid query.\n")
            continueimport requests
import streamlit as st

API_URL = "http://localhost:8000/predict"
HEALTH_URL = "http://localhost:8000/health"

st.set_page_config(page_title="Week 6 ML Dashboard", layout="wide")

st.title("Know about your Movies")
st.write("Enter feature values and get prediction")

# Health check
with st.expander("API Health Check", expanded=False):
    if st.button("Check API Health"):
        try:
            response = requests.get(HEALTH_URL, timeout=10)
            response.raise_for_status()
            st.success("API is running")
            st.json(response.json())
        except Exception as e:
            st.error(f"API health check failed: {e}")

st.subheader("Input Features")

col1, col2, col3 = st.columns(3)

with col1:
    listed_in_freq_log = st.number_input("listed_in_freq_log", value=4.79)
    kids_score = st.number_input("kids_score", value=1.0)
    is_kids_like = st.selectbox("is_kids_like", [0, 1], index=0)
    genre_kids = st.selectbox("genre_kids", [0, 1], index=0)
    duration = st.number_input("duration", value=95.0)
    country_freq_log = st.number_input("country_freq_log", value=5.10)
    genre_family = st.selectbox("genre_family", [0, 1], index=0)
    genre_international = st.selectbox("genre_international", [0, 1], index=1)
    genre_count = st.number_input("genre_count", value=2.0)
    director_freq = st.number_input("director_freq", value=45.0)

with col2:
    genre_comedy = st.selectbox("genre_comedy", [0, 1], index=0)
    genre_drama = st.selectbox("genre_drama", [0, 1], index=1)
    is_long_duration = st.selectbox("is_long_duration", [0, 1], index=0)
    text_len = st.number_input("text_len", value=250.0)
    genre_horror = st.selectbox("genre_horror", [0, 1], index=0)
    is_medium_duration = st.selectbox("is_medium_duration", [0, 1], index=1)
    genre_crime = st.selectbox("genre_crime", [0, 1], index=1)
    title_len = st.number_input("title_len", value=18.0)
    release_year = st.number_input("release_year", value=2018.0)
    is_movie = st.selectbox("is_movie", [0, 1], index=1)

with col3:
    short_kids_content = st.selectbox("short_kids_content", [0, 1], index=0)
    has_kids_words = st.selectbox("has_kids_words", [0, 1], index=0)
    genre_action = st.selectbox("genre_action", [0, 1], index=1)
    day_added = st.number_input("day_added", value=12.0)
    year_added = st.number_input("year_added", value=2020.0)
    month_added = st.number_input("month_added", value=7.0)
    genre_romantic = st.selectbox("genre_romantic", [0, 1], index=0)
    cast_count = st.number_input("cast_count", value=8.0)
    cast_freq = st.number_input("cast_freq", value=180.0)
    has_mature_words = st.selectbox("has_mature_words", [0, 1], index=1)

actual_label = st.text_input("actual_label (optional)", value="")

payload = {
    "features": {
        "listed_in_freq_log": float(listed_in_freq_log),
        "kids_score": float(kids_score),
        "is_kids_like": float(is_kids_like),
        "genre_kids": float(genre_kids),
        "duration": float(duration),
        "country_freq_log": float(country_freq_log),
        "genre_family": float(genre_family),
        "genre_international": float(genre_international),
        "genre_count": float(genre_count),
        "director_freq": float(director_freq),
        "genre_comedy": float(genre_comedy),
        "genre_drama": float(genre_drama),
        "is_long_duration": float(is_long_duration),
        "text_len": float(text_len),
        "genre_horror": float(genre_horror),
        "is_medium_duration": float(is_medium_duration),
        "genre_crime": float(genre_crime),
        "title_len": float(title_len),
        "release_year": float(release_year),
        "is_movie": float(is_movie),
        "short_kids_content": float(short_kids_content),
        "has_kids_words": float(has_kids_words),
        "genre_action": float(genre_action),
        "day_added": float(day_added),
        "year_added": float(year_added),
        "month_added": float(month_added),
        "genre_romantic": float(genre_romantic),
        "cast_count": float(cast_count),
        "cast_freq": float(cast_freq),
        "has_mature_words": float(has_mature_words),
    },
    "actual_label": actual_label if actual_label.strip() else None
}

st.subheader("Request Preview")
st.json(payload)

if st.button("Predict", type="primary"):
    try:
        response = requests.post(API_URL, json=payload, timeout=20)
        response.raise_for_status()
        result = response.json()

        st.success("Prediction successful")

        c1, c2, c3 = st.columns(3)
        with c1:
            st.metric("Predicted Label", str(result.get("predicted_label", "N/A")))
        with c2:
            st.metric(
                "Confidence",
                f"{result.get('confidence', 0):.4f}" if result.get("confidence") is not None else "N/A"
            )
        with c3:
            st.metric("Prediction Code", str(result.get("prediction", "N/A")))

        st.write("### Full Response")
        st.json(result)

    except requests.exceptions.RequestException as e:
        st.error(f"API request failed: {e}")
    except Exception as e:
        st.error(f"Unexpected error: {e}")

        results = retriever.retrieve(query, top_k=5)

        if not results:
            print("No results found.\n")
            print("-" * 60 + "\n")
            continue

        for i, item in enumerate(results, 1):
            print(f"\nResult {i}")
            print(f"Source        : {item['source_file']}")
            print(f"Page          : {item.get('page_number')}")
            print(f"Chunk ID      : {item['chunk_id']}")
            print(f"Rerank Score  : {item.get('rerank_score', 0):.4f}")
            print(f"Tags          : {item.get('tags', [])}")
            print(f"Text          : {item['text'][:500]}...")

        print("\n" + "-" * 60 + "\n")