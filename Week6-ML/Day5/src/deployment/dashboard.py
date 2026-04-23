import requests
import streamlit as st

API_URL = "http://localhost:8000/predict"
HEALTH_URL = "http://localhost:8000/health"

st.set_page_config(page_title="Week 6 ML Dashboard", layout="wide")

st.title("Know about your Movies")
st.write("Enter feature values and get prediction")

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
    genre_kids = st.selectbox("genre_kids", [0, 1], index=0)
    duration = st.number_input("duration", value=95.0)
    genre_family = st.selectbox("genre_family", [0, 1], index=0)
    genre_international = st.selectbox("genre_international", [0, 1], index=0)
    genre_drama = st.selectbox("genre_drama", [0, 1], index=0)
    title_len = st.number_input("title_len", value=18.0)
    release_year = st.number_input("release_year", value=2018.0)
    director_freq_log = st.number_input("director_freq_log", value=2.5)

with col2:
    years_to_platform = st.number_input("years_to_platform", value=2.0)
    has_kids_words = st.selectbox("has_kids_words", [0, 1], index=0)
    has_mature_words = st.selectbox("has_mature_words", [0, 1], index=0)
    is_long_duration = st.selectbox("is_long_duration", [0, 1], index=0)
    genre_comedy = st.selectbox("genre_comedy", [0, 1], index=0)
    description_len = st.number_input("description_len", value=120.0)
    genre_romantic = st.selectbox("genre_romantic", [0, 1], index=0)

with col3:
    year_added = st.number_input("year_added", value=2020.0)
    cast_count = st.number_input("cast_count", value=8.0)
    genre_crime = st.selectbox("genre_crime", [0, 1], index=0)
    is_movie = st.selectbox("is_movie", [0, 1], index=1)
    genre_horror = st.selectbox("genre_horror", [0, 1], index=0)
    genre_action = st.selectbox("genre_action", [0, 1], index=0)
    month_added = st.number_input("month_added", value=7.0)

actual_label = st.text_input("actual_label (optional)", value="")

payload = {
    "features": {
        "genre_kids": float(genre_kids),
        "duration": float(duration),
        "genre_family": float(genre_family),
        "genre_international": float(genre_international),
        "genre_drama": float(genre_drama),
        "title_len": float(title_len),
        "release_year": float(release_year),
        "director_freq_log": float(director_freq_log),
        "years_to_platform": float(years_to_platform),
        "has_kids_words": float(has_kids_words),
        "has_mature_words": float(has_mature_words),
        "is_long_duration": float(is_long_duration),
        "genre_comedy": float(genre_comedy),
        "description_len": float(description_len),
        "genre_romantic": float(genre_romantic),
        "year_added": float(year_added),
        "cast_count": float(cast_count),
        "genre_crime": float(genre_crime),
        "is_movie": float(is_movie),
        "genre_horror": float(genre_horror),
        "genre_action": float(genre_action),
        "month_added": float(month_added),
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