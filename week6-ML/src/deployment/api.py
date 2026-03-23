import os
import json
import uuid
import pickle
from datetime import datetime
from typing import Any, Dict, Optional

import pandas as pd
from fastapi import FastAPI, HTTPException, Request
from pydantic import BaseModel, Field
from dotenv import load_dotenv

load_dotenv()

APP_NAME = "week6-ml-api"
MODEL_DIR = os.getenv("MODEL_DIR", "src/models")
MODEL_VERSION = os.getenv("MODEL_VERSION", "v1")
MODEL_FILE = os.getenv("MODEL_FILE", "best_model.pkl")
FEATURE_LIST_PATH = os.getenv("FEATURE_LIST_PATH", "src/features/feature_list.json")
LABEL_CLASSES_PATH = os.getenv("LABEL_CLASSES_PATH", "src/models/label_classes.json")
PREDICTION_LOG_PATH = os.getenv("PREDICTION_LOG_PATH", "src/logs/prediction_logs.csv")
PORT = int(os.getenv("PORT", "8000"))

app = FastAPI(title=APP_NAME)


class PredictionRequest(BaseModel):
    features: Dict[str, float] = Field(
        ...,
        description="Model features as numeric key-value pairs"
    )
    actual_label: Optional[Any] = Field(
        default=None,
        description="Optional true label for later monitoring"
    )


def load_model():
    model_path = os.path.join(MODEL_DIR, MODEL_FILE)
    if not os.path.exists(model_path):
        raise FileNotFoundError(f"Model not found at {model_path}")

    with open(model_path, "rb") as f:
        model = pickle.load(f)

    return model


def load_feature_list():
    if not os.path.exists(FEATURE_LIST_PATH):
        raise FileNotFoundError(f"Feature list not found at {FEATURE_LIST_PATH}")

    with open(FEATURE_LIST_PATH, "r") as f:
        return json.load(f)


def load_label_classes():
    if not os.path.exists(LABEL_CLASSES_PATH):
        return None

    with open(LABEL_CLASSES_PATH, "r") as f:
        return json.load(f)


def log_prediction(row: Dict[str, Any]):
    log_dir = os.path.dirname(PREDICTION_LOG_PATH)
    if log_dir:
        os.makedirs(log_dir, exist_ok=True)

    df_row = pd.DataFrame([row])

    if os.path.exists(PREDICTION_LOG_PATH):
        df_row.to_csv(PREDICTION_LOG_PATH, mode="a", header=False, index=False)
    else:
        df_row.to_csv(PREDICTION_LOG_PATH, index=False)


MODEL = load_model()
FEATURE_LIST = load_feature_list()
LABEL_CLASSES = load_label_classes()


@app.middleware("http")
async def add_request_id(request: Request, call_next):
    request_id = str(uuid.uuid4())
    request.state.request_id = request_id
    response = await call_next(request)
    response.headers["X-Request-ID"] = request_id
    return response


@app.get("/")
def home():
    return {
        "message": "Week 6 ML API is running",
        "docs_url": "/docs",
        "health_url": "/health"
    }


@app.get("/health")
def health():
    return {
        "status": "ok",
        "model_version": MODEL_VERSION,
        "model_file": MODEL_FILE,
        "feature_count": len(FEATURE_LIST),
        "label_classes_loaded": LABEL_CLASSES is not None
    }


@app.post("/predict")
def predict(payload: PredictionRequest, request: Request):
    request_id = request.state.request_id

    incoming_features = payload.features
    missing = [f for f in FEATURE_LIST if f not in incoming_features]
    extra = [f for f in incoming_features if f not in FEATURE_LIST]

    if missing:
        raise HTTPException(
            status_code=400,
            detail={
                "message": "Missing required features",
                "missing_features": missing
            }
        )

    try:
        X = pd.DataFrame(
            [[incoming_features[f] for f in FEATURE_LIST]],
            columns=FEATURE_LIST
        )

        raw_prediction = MODEL.predict(X)[0]
        prediction = raw_prediction.item() if hasattr(raw_prediction, "item") else raw_prediction

        predicted_label = prediction
        if LABEL_CLASSES is not None:
            predicted_label = LABEL_CLASSES[int(prediction)]

        confidence = None
        if hasattr(MODEL, "predict_proba"):
            probs = MODEL.predict_proba(X)[0]
            confidence = float(max(probs))

        log_row = {
            "timestamp": datetime.utcnow().isoformat() + "Z",
            "request_id": request_id,
            "model_version": MODEL_VERSION,
            "prediction": int(prediction) if isinstance(prediction, (int, float)) else prediction,
            "predicted_label": predicted_label,
            "confidence": confidence,
            "actual_label": payload.actual_label,
            "features_json": json.dumps(incoming_features)
        }

        log_prediction(log_row)

        return {
            "request_id": request_id,
            "model_version": MODEL_VERSION,
            "prediction": int(prediction) if isinstance(prediction, (int, float)) else prediction,
            "predicted_label": predicted_label,
            "confidence": confidence,
            "ignored_extra_features": extra
        }

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail={"message": "Prediction failed", "error": str(e)}
        )


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("src.deployment.api:app", host="0.0.0.0", port=PORT, reload=True)