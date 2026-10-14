import os
from pathlib import Path

from dotenv import load_dotenv

# Loaded here (not just in db.py) because this module is imported first —
# otherwise FRONTEND_URL/BACKEND_URL/SMTP_* in .env are silently ignored.
load_dotenv(Path(__file__).resolve().parent.parent / ".env")

# Directory containing the trained model artifacts
MODELS_DIR = Path(__file__).resolve().parent.parent / "models"

# Public URLs of the frontend and this API itself — used to build CORS
# origins and OAuth redirect/callback URLs. Override in production.
FRONTEND_URL = os.environ.get("FRONTEND_URL", "http://localhost:3000")
BACKEND_URL = os.environ.get("BACKEND_URL", "http://localhost:8000")

# CORS: origins allowed to call this API (add your deployed frontend URL here).
# Next dev falls back to 3001/3002 whenever 3000 is already taken (e.g. another
# project, or a stale dev server from a previous run) — without these, that
# silent port bump breaks every fetch with an opaque "Failed to fetch" in the
# browser, since the request never even reaches this server. Harmless in
# production since FRONTEND_URL there is a real deployed URL, not localhost.
ALLOWED_ORIGINS = [
    o
    for o in [
        "http://localhost:3000",
        "http://localhost:3001",
        "http://localhost:3002",
        FRONTEND_URL,
    ]
    if o
]

# Minimum words required in the input text for a prediction to be considered
# reliable. The model was trained on ~50 concatenated forum posts per person;
# very short text gives noisy results.
MIN_WORD_COUNT = 100

# Hard cap to prevent abuse via huge payloads
MAX_CHARACTERS = 20000

AXIS_NAMES = ["IE", "NS", "TF", "JP"]
LETTER_MAP = {
    "IE": ("E", "I"),
    "NS": ("S", "N"),
    # Positive class (index 1) of every axis model is the I/N/F/J letter —
    # the TF model was trained with F as 1, so T must be index 0.
    "TF": ("T", "F"),
    "JP": ("P", "J"),
}

SESSION_TTL_SECONDS = 60 * 60 * 24 * 30  # 30 days
RESET_TOKEN_TTL_SECONDS = 60 * 60  # 1 hour

# SMTP settings for password-reset emails. When SMTP_HOST is unset (e.g. in
# local dev with no mail provider configured), the reset link is logged to
# the server console instead of emailed — lets the flow be tested end to end
# without needing real mail credentials.
SMTP_HOST = os.environ.get("SMTP_HOST")
SMTP_PORT = int(os.environ.get("SMTP_PORT", "587"))
SMTP_USER = os.environ.get("SMTP_USER")
SMTP_PASSWORD = os.environ.get("SMTP_PASSWORD")
EMAIL_FROM = os.environ.get("EMAIL_FROM", "no-reply@mindprint.local")
