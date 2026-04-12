import streamlit as st
import requests

st.set_page_config(page_title="Local LLM Chat", layout="wide")
st.title("Your Medical Assisstant")

API_URL = "http://127.0.0.1:8000/chat"

if "history" not in st.session_state:
    st.session_state.history = []

for msg in st.session_state.history:
    with st.chat_message(msg["role"]):
        st.write(msg["content"])

user_input = st.chat_input("Type your message...")

if user_input:
    with st.chat_message("user"):
        st.write(user_input)

    with st.spinner("Generating..."):
        payload = {
            "message": user_input,
            "history": st.session_state.history,
            "max_tokens": 128,
            "temperature": 0.7,
            "top_p": 0.9,
            "top_k": 40,
        }

        response = requests.post(API_URL, json=payload, timeout=300)

        if response.status_code != 200:
            st.error(f"API Error {response.status_code}")
            st.code(response.text)
            st.stop()

        data = response.json()
        assistant_reply = data["response"]
        request_id = data["request_id"]

    st.session_state.history.append({"role": "user", "content": user_input})
    st.session_state.history.append({"role": "assistant", "content": assistant_reply})

    with st.chat_message("assistant"):
        st.write(assistant_reply)
        st.caption(f"Request ID: {request_id}")