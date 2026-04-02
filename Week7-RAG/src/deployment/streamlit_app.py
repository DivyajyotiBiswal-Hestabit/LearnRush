import streamlit as st
import requests
import os
import tempfile

API_BASE = "http://127.0.0.1:8000"

st.set_page_config(page_title="Week7 Capstone RAG", layout="wide")
st.title("RAG System")

st.markdown(
    """
### Capabilities

This system enables:

- 🔎 **Text RAG** — Ask questions over documents  
- 🖼️ **Multimodal Image RAG** — Search and reason over images  
- 🗄️ **SQL QA** — Query structured databases using natural language  

Explore each tab to interact with different capabilities.
"""
)

tab1, tab2, tab3 = st.tabs(["Text RAG", "Image RAG", "SQL QA"])


def render_eval(eval_data):
    if not eval_data:
        return

    st.subheader("Evaluation")
    col1, col2, col3, col4 = st.columns(4)

    col1.metric("Context Match", eval_data.get("context_match_score", 0))
    col2.metric("Faithfulness", eval_data.get("faithfulness_score", 0))
    col3.metric("Confidence", eval_data.get("confidence_score", 0))
    col4.metric("Hallucination", str(eval_data.get("hallucination_detected", False)))


def save_uploaded_file(uploaded_file):
    temp_dir = tempfile.gettempdir()
    file_path = os.path.join(temp_dir, uploaded_file.name)

    with open(file_path, "wb") as f:
        f.write(uploaded_file.getbuffer())

    return file_path


def handle_response(response):
    if response.status_code != 200:
        st.error(f"API error {response.status_code}")
        st.code(response.text)
        return None

    try:
        return response.json()
    except Exception:
        st.error("Response was not valid JSON.")
        st.code(response.text)
        return None


with tab1:
    st.header("Ask Text RAG")

    text_query = st.text_area("Enter your question", height=120, key="text_query")
    top_k = st.slider("Top K", min_value=1, max_value=10, value=5, key="text_topk")

    if st.button("Ask Text RAG"):
        if not text_query.strip():
            st.warning("Please enter a question.")
        else:
            try:
                response = requests.post(
                    f"{API_BASE}/ask",
                    json={"query": text_query, "top_k": top_k},
                    timeout=600
                )
                data = handle_response(response)
                if not data:
                    st.stop()

                st.subheader("Answer")
                st.write(data.get("answer", ""))

                render_eval(data.get("evaluation"))

                st.subheader("Sources")
                for src in data.get("sources", []):
                    st.json(src)

                st.subheader("Trace")
                st.json(data.get("trace", {}))

            except Exception as e:
                st.error(f"Request failed: {e}")


with tab2:
    st.header("Ask Image RAG")

    image_mode = st.selectbox(
        "Choose image mode",
        ["text_to_image", "image_to_image", "image_to_text"],
        key="image_mode"
    )

    top_k = st.slider("Top K", min_value=1, max_value=10, value=5, key="image_topk")

    if image_mode == "text_to_image":
        text_query = st.text_area(
            "Enter your text query",
            value="Find images related to sales charts",
            height=120,
            key="img_text_query"
        )

        if st.button("Run Text → Image"):
            try:
                response = requests.post(
                    f"{API_BASE}/ask-image",
                    json={
                        "mode": "text_to_image",
                        "query": text_query,
                        "top_k": top_k
                    },
                    timeout=600
                )
                data = handle_response(response)
                if not data:
                    st.stop()

                st.subheader("Answer")
                st.write(data.get("answer", ""))

                render_eval(data.get("evaluation"))

                results = data.get("retrieved_results", [])
                st.subheader("Retrieved Results")
                st.success(f"Found {len(results)} relevant images")

                for item in results:
                    image_path = (
                        item.get("raw_image_path")
                        or item.get("original_image_path")
                        or item.get("image_path")
                        or item.get("processed_image_path")
                    )

                    if image_path and os.path.exists(image_path):
                        st.image(image_path, use_container_width=True)

                    st.markdown(f"**Source:** {item.get('source_file', 'N/A')}")
                    score = item.get("score")
                    if score is not None:
                        st.markdown(f"**Score:** {score:.4f}")

                    if item.get("caption"):
                        st.markdown(f"**Caption:** {item.get('caption')}")

                    if item.get("ocr_text"):
                        st.markdown(f"**OCR:** {item.get('ocr_text')[:200]}")

                    st.divider()

                st.subheader("Trace")
                st.json(data.get("trace", {}))

            except Exception as e:
                st.error(f"Request failed: {e}")

    elif image_mode == "image_to_image":
        uploaded_file = st.file_uploader(
            "Upload an image",
            type=["png", "jpg", "jpeg"],
            key="image_upload_image_to_image"
        )

        image_path = None
        if uploaded_file is not None:
            image_path = save_uploaded_file(uploaded_file)
            st.image(image_path, caption="Uploaded Image", use_container_width=True)

        if st.button("Run Image → Image"):
            if uploaded_file is None:
                st.warning("Please upload an image.")
            else:
                try:
                    response = requests.post(
                        f"{API_BASE}/ask-image",
                        json={
                            "mode": "image_to_image",
                            "image_path": image_path,
                            "top_k": top_k
                        },
                        timeout=600
                    )
                    data = handle_response(response)
                    if not data:
                        st.stop()

                    results = data.get("retrieved_results", [])
                    st.subheader("Retrieved Similar Images")
                    st.success(f"Found {len(results)} relevant images")

                    for item in results:
                        image_path = (
                            item.get("raw_image_path")
                            or item.get("original_image_path")
                            or item.get("image_path")
                            or item.get("processed_image_path")
                        )

                        if image_path and os.path.exists(image_path):
                            st.image(image_path, use_container_width=True)

                        st.markdown(f"**Source:** {item.get('source_file', 'N/A')}")
                        score = item.get("score")
                        if score is not None:
                            st.markdown(f"**Score:** {score:.4f}")

                        if item.get("caption"):
                            st.markdown(f"**Caption:** {item.get('caption')}")

                        if item.get("ocr_text"):
                            st.markdown(f"**OCR:** {item.get('ocr_text')[:200]}")

                        st.divider()
  
                    st.subheader("Trace")
                    st.json(data.get("trace", {}))

                except Exception as e:
                    st.error(f"Request failed: {e}")

    elif image_mode == "image_to_text":
        uploaded_file = st.file_uploader(
            "Upload an image",
            type=["png", "jpg", "jpeg"],
            key="image_upload_image_to_text"
        )

        image_path = None
        if uploaded_file is not None:
            image_path = save_uploaded_file(uploaded_file)
            st.image(image_path, caption="Uploaded Image", use_container_width=True)

        image_question = st.text_area(
            "Enter your question about the image",
            value="What does this image show?",
            height=120,
            key="img2text_question"
        )

        if st.button("Run Image → Text"):
            if uploaded_file is None:
                st.warning("Please upload an image.")
            else:
                try:
                    response = requests.post(
                        f"{API_BASE}/ask-image",
                        json={
                            "mode": "image_to_text",
                            "image_path": image_path,
                            "question": image_question,
                            "top_k": top_k
                        },
                        timeout=600
                    )
                    data = handle_response(response)
                    if not data:
                        st.stop()

                    st.subheader("Answer")
                    st.write(data.get("answer", ""))

                    render_eval(data.get("evaluation"))

                    results = data.get("retrieved_results", [])
                    st.subheader("Retrieved Results")
                    st.success(f"Found {len(results)} relevant images")

                    for item in results:
                        result_image_path = item.get("processed_image_path")

                        if result_image_path and os.path.exists(result_image_path):
                            st.image(result_image_path, use_container_width=True)

                        st.markdown(f"**Source:** {item.get('source_file', 'N/A')}")
                        score = item.get("score")
                        if score is not None:
                            st.markdown(f"**Score:** {score:.4f}")

                        if item.get("caption"):
                            st.markdown(f"**Caption:** {item.get('caption')}")

                        if item.get("ocr_text"):
                            st.markdown(f"**OCR:** {item.get('ocr_text')[:200]}")

                        st.divider()

                    st.subheader("Trace")
                    st.json(data.get("trace", {}))

                except Exception as e:
                    st.error(f"Request failed: {e}")


with tab3:
    st.header("Ask SQL QA")

    sql_query = st.text_area(
        "Enter your SQL-style natural language question",
        value="Show total sales by Arijit Singh in 2023",
        height=120,
        key="sql_query"
    )

    if st.button("Ask SQL QA"):
        if not sql_query.strip():
            st.warning("Please enter a question.")
        else:
            try:
                response = requests.post(
                    f"{API_BASE}/ask-sql",
                    json={"query": sql_query},
                    timeout=600
                )
                data = handle_response(response)
                if not data:
                    st.stop()

                st.subheader("Generated SQL")
                st.code(data.get("sql", ""), language="sql")

                st.subheader("Answer")
                st.write(data.get("answer", ""))

                render_eval(data.get("evaluation"))

                st.subheader("Results")
                results = data.get("results", [])
                if results:
                    st.dataframe(results, use_container_width=True)
                else:
                    st.info("No rows returned.")

                st.subheader("Trace")
                st.json(data.get("trace", {}))

            except Exception as e:
                st.error(f"Request failed: {e}")