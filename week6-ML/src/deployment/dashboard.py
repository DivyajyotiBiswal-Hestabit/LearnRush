import requests
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
    listed_in_freq = st.number_input("listed_in_freq", value=120.0)
    listed_in_freq_log = st.number_input("listed_in_freq_log", value=4.79)
    genre_kids = st.selectbox("genre_kids", [0, 1], index=0)
    duration = st.number_input("duration", value=95.0)
    genre_family = st.selectbox("genre_family", [0, 1], index=0)
    country_freq_log = st.number_input("country_freq_log", value=5.10)
    country_freq = st.number_input("country_freq", value=165.0)
    genre_international = st.selectbox("genre_international", [0, 1], index=1)
    genre_count = st.number_input("genre_count", value=2.0)
    director_freq = st.number_input("director_freq", value=45.0)

with col2:
    is_short_duration = st.selectbox("is_short_duration", [0, 1], index=0)
    genre_drama = st.selectbox("genre_drama", [0, 1], index=1)
    release_year = st.number_input("release_year", value=2018.0)
    is_medium_duration = st.selectbox("is_medium_duration", [0, 1], index=1)
    has_mature_words = st.selectbox("has_mature_words", [0, 1], index=1)
    genre_comedy = st.selectbox("genre_comedy", [0, 1], index=0)
    cast_freq = st.number_input("cast_freq", value=180.0)
    is_movie = st.selectbox("is_movie", [0, 1], index=1)
    release_decade = st.number_input("release_decade", value=2010.0)
    genre_romantic = st.selectbox("genre_romantic", [0, 1], index=0)

with col3:
    text_len = st.number_input("text_len", value=250.0)
    is_long_duration = st.selectbox("is_long_duration", [0, 1], index=0)
    day_added = st.number_input("day_added", value=12.0)
    genre_horror = st.selectbox("genre_horror", [0, 1], index=0)
    has_kids_words = st.selectbox("has_kids_words", [0, 1], index=0)
    title_len = st.number_input("title_len", value=18.0)
    genre_action = st.selectbox("genre_action", [0, 1], index=1)
    year_added = st.number_input("year_added", value=2020.0)
    cast_count = st.number_input("cast_count", value=8.0)
    genre_crime = st.selectbox("genre_crime", [0, 1], index=1)

actual_label = st.text_input("actual_label (optional)", value="")

payload = {
    "features": {
        "listed_in_freq": float(listed_in_freq),
        "listed_in_freq_log": float(listed_in_freq_log),
        "genre_kids": float(genre_kids),
        "duration": float(duration),
        "genre_family": float(genre_family),
        "country_freq_log": float(country_freq_log),
        "country_freq": float(country_freq),
        "genre_international": float(genre_international),
        "genre_count": float(genre_count),
        "director_freq": float(director_freq),
        "is_short_duration": float(is_short_duration),
        "genre_drama": float(genre_drama),
        "release_year": float(release_year),
        "is_medium_duration": float(is_medium_duration),
        "has_mature_words": float(has_mature_words),
        "genre_comedy": float(genre_comedy),
        "cast_freq": float(cast_freq),
        "is_movie": float(is_movie),
        "release_decade": float(release_decade),
        "genre_romantic": float(genre_romantic),
        "text_len": float(text_len),
        "is_long_duration": float(is_long_duration),
        "day_added": float(day_added),
        "genre_horror": float(genre_horror),
        "has_kids_words": float(has_kids_words),
        "title_len": float(title_len),
        "genre_action": float(genre_action),
        "year_added": float(year_added),
        "cast_count": float(cast_count),
        "genre_crime": float(genre_crime),
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
            st.metric("Confidence", f"{result.get('confidence', 0):.4f}" if result.get("confidence") is not None else "N/A")
        with c3:
            st.metric("Prediction Code", str(result.get("prediction", "N/A")))

        st.write("### Full Response")
        st.json(result)

    except requests.exceptions.RequestException as e:
        st.error(f"API request failed: {e}")
    except Exception as e:
        st.error(f"Unexpected error: {e}")