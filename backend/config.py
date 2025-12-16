"""Configuration for the LLM Council."""

import os
import tempfile
from dotenv import load_dotenv

load_dotenv()

# OpenRouter API key
OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY")

# Council members - list of OpenRouter model identifiers
# Council members - list of OpenRouter model identifiers
# Using free/cheap models to ensures it works for all users
COUNCIL_MODELS = [
    "google/gemini-2.0-flash-exp:free",
    "meta-llama/llama-3-8b-instruct:free",
    "mistralai/mistral-7b-instruct:free",
    "huggingfaceh4/zephyr-7b-beta:free",
]

# Chairman model - synthesizes final response
CHAIRMAN_MODEL = "meta-llama/llama-3-8b-instruct:free"

# OpenRouter API endpoint
OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions"

# Data directory for conversation storage
# Data directory for conversation storage
# Default to local data directory
DATA_DIR = "data/conversations"

# If we are on Vercel (or if the local data dir is not writable), use temp dir
if os.getenv("VERCEL"):
    DATA_DIR = os.path.join(tempfile.gettempdir(), "data", "conversations")
