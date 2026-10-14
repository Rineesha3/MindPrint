"""
Loads the 4 axis CatBoost models + TF-IDF vectorizer + meta-feature scaler
once at import time, and exposes a single `predict_type(text)` function.

This mirrors the cleaning / feature-building logic used at training time —
keep it in sync if the training pipeline ever changes.

The axis models are loaded from standalone Python exports (models/axis_*.py,
made with `CatBoostClassifier.save_model(path, format="python")` from the
.cbm checkpoints) rather than the catboost package itself: Windows Smart App
Control blocks catboost's unsigned native DLL. Re-export them whenever the
.cbm files are retrained.
"""
import importlib.util
import json
import math
import pickle
import re
from functools import lru_cache

import numpy as np
import scipy.sparse as sp

from .config import AXIS_NAMES, LETTER_MAP, MODELS_DIR

URL_RE = re.compile(r"http\S+|www\.\S+")
NONALPHA_RE = re.compile(r"[^a-z\s]")
# Type names incl. plurals ("infps") and wildcards ("inxj", "xntp"). The training
# data is an MBTI forum where people constantly name their own type, so any of
# these left in lets a model "cheat" instead of learning personality signals.
MBTI_RE = re.compile(r"\b[iex][nsx][tfx][jpx]s?\b")
# Type-system jargon that leaks the label the same way: cognitive functions,
# temperament shorthand, and dichotomy nouns.
JARGON_RE = re.compile(
    r"\b(?:ni|ne|ti|te|fi|fe|si|se|nf|nt|sj|sp|sx|nfs|nts|sjs|sps|mbti|myers|briggs"
    r"|enneagram|intuitives?|sensors?|thinkers?|feelers?|judgers?|perceivers?)\b"
)
WS_RE = re.compile(r"\s+")


def clean_text(text: str) -> str:
    # Shared by inference and backend/training/train.py — keep them identical.
    text = text.lower().replace("|||", " ")
    text = URL_RE.sub(" ", text)
    text = NONALPHA_RE.sub(" ", text)
    text = MBTI_RE.sub(" ", text)
    text = JARGON_RE.sub(" ", text)
    text = WS_RE.sub(" ", text).strip()
    return text


# (feature_index, label, blurb-if-above-average, blurb-if-below-average)
# Indices match the columns produced by raw_meta_features(). n_posts, n_words,
# and n_links are excluded here — they're not meaningful, interpretable
# "writing style" signals the way the others are.
SIGNAL_FEATURES = [
    (2, "sentence length",
     "You tend to write in longer, more elaborate passages than most people.",
     "You tend to write in short, to-the-point passages rather than long elaborations."),
    (4, "exclamation marks",
     "Your writing uses more exclamation marks than average — often a sign of expressive, high-energy communication.",
     "You use very few exclamation marks — your tone reads as measured and even."),
    (5, "questions",
     "You ask more questions in your writing than most people — often linked to curious, exploratory thinking.",
     "You rarely pose questions in your writing, favoring statements over open questions."),
    (6, "trailing thoughts",
     'You trail off with "..." more than average — often a sign of reflective, in-the-moment thinking.',
     "You rarely trail off mid-thought — your sentences tend to resolve cleanly."),
    (7, "word complexity",
     "You tend to use longer, more complex words than average.",
     "You favor short, simple words over complex vocabulary."),
    (8, "emphasis/capitalization",
     "You use more capitalization and emphasis than most people's writing.",
     "Your writing uses minimal capitalization or emphasis, reading as understated."),
]


def writing_signals(meta_z: np.ndarray, top_n: int = 3) -> list:
    """Turn the standardized meta-features into the top N most notable,
    plain-language observations about the person's writing style — grounded
    in the actual features the model uses, not a generic word/sentence count."""
    scored = []
    for idx, label, above_blurb, below_blurb in SIGNAL_FEATURES:
        z = float(meta_z[0, idx])
        direction = "above" if z >= 0 else "below"
        blurb = above_blurb if z >= 0 else below_blurb
        scored.append((abs(z), label, direction, blurb))
    scored.sort(key=lambda x: x[0], reverse=True)
    return [
        {"feature": label, "direction": direction, "blurb": blurb}
        for _, label, direction, blurb in scored[:top_n]
    ]


def confidence_tier(prob_positive: float, threshold: float) -> str:
    """How far the model's probability sits from its *tuned* decision
    threshold (not a flat 0.5) — thresholds vary per axis (e.g. JP is 0.54),
    so a raw 51% reads very differently on JP than on IE (threshold 0.33)."""
    margin = abs(prob_positive - threshold)
    if margin >= 0.20:
        return "high"
    if margin >= 0.08:
        return "medium"
    return "low"


def raw_meta_features(raw_text: str) -> np.ndarray:
    posts = raw_text.split("|||")
    n_posts = max(len(posts), 1)
    joined = raw_text.lower()
    words = joined.split()
    n_words = len(words)
    avg_words_per_post = n_words / n_posts
    n_links = joined.count("http")
    n_excl = joined.count("!")
    n_quest = joined.count("?")
    n_ellipsis = joined.count("...")
    avg_word_len = float(np.mean([len(w) for w in words])) if n_words else 0.0
    n_caps = sum(1 for c in raw_text if c.isupper())
    cap_ratio = n_caps / max(len(raw_text), 1)
    return np.array([[n_posts, n_words, avg_words_per_post, n_links,
                       n_excl, n_quest, n_ellipsis, avg_word_len, cap_ratio]], dtype=float)


class ExportedAxisModel:
    """Binary CatBoost model exported to pure Python; mimics predict_proba
    for a single-row input."""

    def __init__(self, path):
        spec = importlib.util.spec_from_file_location(path.stem, path)
        module = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(module)
        self._apply = module.apply_catboost_model

    def predict_proba(self, X) -> np.ndarray:
        row = X.toarray()[0].tolist() if sp.issparse(X) else list(X[0])
        p = 1.0 / (1.0 + math.exp(-self._apply(row)))
        return np.array([[1.0 - p, p]])


class MBTIPredictor:
    def __init__(self):
        with open(MODELS_DIR / "vectorizer.pkl", "rb") as f:
            self.vectorizer = pickle.load(f)
        with open(MODELS_DIR / "meta_scaler.pkl", "rb") as f:
            self.scaler = pickle.load(f)
        with open(MODELS_DIR / "final_results.json") as f:
            results = json.load(f)
        self.thresholds = {axis: results[axis]["threshold"] for axis in AXIS_NAMES}
        self.axis_accuracy = {axis: results[axis]["test_acc"] for axis in AXIS_NAMES}

        self.models = {}
        for axis in AXIS_NAMES:
            self.models[axis] = ExportedAxisModel(MODELS_DIR / f"axis_{axis}.py")

    def predict(self, raw_text: str) -> dict:
        cleaned = clean_text(raw_text)
        Xt = self.vectorizer.transform([cleaned])
        meta = raw_meta_features(raw_text)
        meta_s = (meta - self.scaler["mean"]) / self.scaler["std"]
        X = sp.hstack([Xt, sp.csr_matrix(meta_s)]).tocsr()

        letters = []
        axes = {}
        for axis in AXIS_NAMES:
            proba = self.models[axis].predict_proba(X)[0]
            threshold = self.thresholds[axis]
            pred_idx = int(proba[1] >= threshold)
            letter = LETTER_MAP[axis][pred_idx]
            letters.append(letter)
            axes[axis] = {
                "predicted": letter,
                "probabilities": {
                    LETTER_MAP[axis][0]: round(float(proba[0]), 4),
                    LETTER_MAP[axis][1]: round(float(proba[1]), 4),
                },
                "confidence": confidence_tier(float(proba[1]), threshold),
                "axis_reliability": round(self.axis_accuracy[axis], 3),
            }

        return {
            "predicted_type": "".join(letters),
            "axes": axes,
            "signals": writing_signals(meta_s),
        }


@lru_cache(maxsize=1)
def get_predictor() -> MBTIPredictor:
    """Loaded once per process and cached — do not reload per-request."""
    return MBTIPredictor()
