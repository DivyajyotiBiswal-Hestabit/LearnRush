# 🚀 Week 6 ML API — Deployment Notes

## 📌 Overview

This project provides a production-ready Machine Learning API built using FastAPI.
The API serves predictions from a trained model and logs every request for monitoring and drift analysis.

---

## 🧱 Architecture

### 🔹 Training (Offline)

* `main.py` → Runs full ML pipeline
* `src/training/train.py` → Model training
* `src/training/tuning.py` → Hyperparameter tuning
* Output:

  * `src/models/best_model.pkl`
  * `src/evaluation/metrics.json`

---

### 🔹 Serving (Online)

* `src/deployment/api.py` → FastAPI application
* Exposes:

  * `/docs` → Swagger UI
  * `/predict` → Model inference
  * `/health` → Service health check

---

### 🔹 Monitoring

* `src/monitoring/drift_checker.py`
* Uses:

  * `prediction_logs.csv`
* Generates:

  * `drift_report.json`

---

## 🐳 Docker Deployment

### 🔹 Build Image

```bash
docker build -f src/deployment/Dockerfile -t week6-ml-api .
```

---

### 🔹 Run Container

```bash
docker run --rm -p 8000:8000 -v "$(pwd)/src/logs:/app/src/logs" week6-ml-api
```

---

## 🌐 Access API

| Endpoint     | URL                          |
| ------------ | ---------------------------- |
| Swagger UI   | http://localhost:8000/docs   |
| Health Check | http://localhost:8000/health |

---

## 📥 Prediction Request Format

```json
{
  "features": {
    "listed_in_log": 1.10,
    "listed_in": 2,
    "director_log": 1.79,
    "cast_log": 2.30,
    "director": 5,
    "cast": 10,
    "duration_log": 4.51,
    "country": 1,
    "country_log": 1.39,
    "release_year": 2020,
    "year_added": 2021,
    "month_added": 7
  },
  "actual_label": null
}
```

---

## 📤 Prediction Response Example

```json
{
  "request_id": "uuid",
  "model_version": "v1",
  "prediction": 4,
  "confidence": 0.27,
  "ignored_extra_features": []
}
```

---

## 📊 Logging

### 🔹 Prediction Logs

* File: `src/logs/prediction_logs.csv`
* Automatically created on first `/predict` call
* Logged fields:

  * timestamp
  * request_id
  * model_version
  * prediction
  * confidence
  * actual_label
  * features_json

---

## ⚙️ Environment Variables

Example `.env`:

```env
MODEL_DIR=src/models
MODEL_VERSION=v1
MODEL_FILE=best_model.pkl
FEATURE_LIST_PATH=src/features/feature_list.json
PREDICTION_LOG_PATH=/app/src/logs/prediction_logs.csv
REFERENCE_DATA_PATH=src/data/processed/final.csv
DRIFT_REPORT_PATH=src/monitoring/drift_report.json
TARGET_COLUMN=rating
PORT=8000
```

---

## ⚠️ Important Notes

### 1. Model must exist before deployment

Ensure:

```text
src/models/best_model.pkl
```

Otherwise API will fail to start.

---

### 2. Logs folder must exist

```bash
mkdir -p src/logs
```

---

### 3. Do NOT run `main.py` for inference

* `main.py` is for training only
* Docker runs FastAPI directly via Uvicorn

---

### 4. Logging only happens on `/predict`

* Starting container does NOT create logs
* Logs are created only after hitting `/predict`

---

## 🧠 Monitoring Flow

```text
/predict → prediction_logs.csv → drift_checker.py → drift_report.json
```

---

## 🔥 Production Improvements (Future Work)

* Log rotation (avoid large CSV files)
* Move logs → database (PostgreSQL / MongoDB)
* Add authentication (JWT / API keys)
* Add rate limiting
* Add model versioning endpoint
* CI/CD pipeline for auto deployment

---

## ✅ Final Workflow

```bash
# 1. Train model (once)
python main.py

# 2. Build Docker image
docker build -f src/deployment/Dockerfile -t week6-ml-api .

# 3. Run API
docker run --rm -p 8000:8000 \
-v "$(pwd)/src/logs:/app/src/logs" \
week6-ml-api

# 4. Open Swagger
http://localhost:8000/docs



