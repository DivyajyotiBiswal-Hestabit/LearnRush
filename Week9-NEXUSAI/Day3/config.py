import os
from dotenv import load_dotenv


load_dotenv()

LLM_CONFIG = {
    "config_list": [
        {
            "model": "llama-3.3-70b-versatile",
            "base_url": "https://api.groq.com/openai/v1",
            "api_key": os.getenv("GROQ_API_KEY"),
            "price": [0.0, 0.0],
        }
    ],
    "temperature": 0.1,
    "cache_seed": None,
}