from fastapi import Depends, FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from starlette.requests import Request

from . import auth, history  # , oauth  (Google sign-in disabled for now)
from .auth import get_optional_user
from .config import ALLOWED_ORIGINS, LETTER_MAP, MAX_CHARACTERS, MIN_WORD_COUNT
from .db import init_db
from .history_store import add_entry as add_history_entry
from .model import get_predictor
from .quiz_scoring import allocate_questions, analyze_text, follow_ups, score_answers
from .rate_limit import limiter
from .schemas import AnalyzeRequest, AnalyzeResponse, PredictRequest, PredictResponse
from .seed import seed_demo_user
from .stats import get_stats, record_prediction

app = FastAPI(title="MBTI Personality Predictor API")
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS or ["*"],
    allow_methods=["GET", "POST", "PATCH", "DELETE"],
    allow_headers=["*"],
)

app.include_router(auth.router)
# app.include_router(oauth.router)  # Google sign-in disabled for now
app.include_router(history.router)


@app.on_event("startup")
def load_model():
    init_db()
    # Warms the model cache at startup instead of on the first request
    get_predictor()
    seed_demo_user()


@app.get("/health")
def health():
    return {"status": "ok"}


@app.get("/stats")
def stats():
    return get_stats()


def _clean_input(text: str) -> str:
    text = text.strip()
    if not text:
        raise HTTPException(status_code=422, detail="Text must not be empty.")
    if len(text) > MAX_CHARACTERS:
        raise HTTPException(
            status_code=422,
            detail=f"Text too long (max {MAX_CHARACTERS} characters).",
        )
    return text


@app.post("/analyze", response_model=AnalyzeResponse)
@limiter.limit("30/minute")
def analyze(request: Request, payload: AnalyzeRequest):
    """The model reads the person's writing first and plans the questions:
    how to split a quiz across dimensions, or which follow-ups free writing needs."""
    text = _clean_input(payload.text)
    predictor = get_predictor()
    analysis = analyze_text(predictor.predict(text), predictor.thresholds, predictor.axis_accuracy)
    allocation = (
        allocate_questions(analysis, payload.count, payload.max_per_dimension) if payload.count else {}
    )
    return AnalyzeResponse(
        axes=analysis,
        allocation=allocation,
        follow_ups={} if payload.count else follow_ups(analysis),
    )


@app.post("/predict", response_model=PredictResponse)
@limiter.limit("20/minute")
def predict(request: Request, payload: PredictRequest, user: dict | None = Depends(get_optional_user)):
    text = _clean_input(payload.text)

    is_quiz = payload.mode in ("quiz", "deepQuiz") and bool(payload.answers)
    word_count = len(text.split())
    warning = None
    if word_count < MIN_WORD_COUNT and not is_quiz:
        warning = (
            f"Your text is a bit short ({word_count} words). Add at least "
            f"{MIN_WORD_COUNT} words for a more accurate result."
        )

    predictor = get_predictor()
    result = predictor.predict(text)
    if payload.answers:
        result = score_answers(
            [a.model_dump() for a in payload.answers],
            result,
            predictor.thresholds,
            predictor.axis_accuracy,
            model_leads=not is_quiz,
        )
    axis_probs = {
        axis: data["probabilities"][LETTER_MAP[axis][1]]
        for axis, data in result["axes"].items()
    }
    record_prediction(result["predicted_type"], axis_probs)
    if user:
        add_history_entry(
            user["id"],
            {
                "predicted_type": result["predicted_type"],
                "axes": result["axes"],
                "word_count": word_count,
                "warning": warning,
                "signals": result["signals"],
                "test_mode": payload.mode,
            },
        )

    return PredictResponse(
        predicted_type=result["predicted_type"],
        axes=result["axes"],
        word_count=word_count,
        warning=warning,
        signals=result["signals"],
    )
