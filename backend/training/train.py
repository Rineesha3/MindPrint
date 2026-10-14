"""
Retrain the 4 per-axis CatBoost models without label leakage.

The original models learned to spot people naming their own type ("infps",
"intjs", "Ni", ...) in the MBTI forum dataset instead of personality signals.
This script:
  * removes type names (incl. plurals / x-wildcards) and type-system jargon
    (cognitive functions, dichotomy nouns) before vectorizing,
  * balances classes so a model can't win by always guessing I and N,
  * tunes each axis threshold on a validation split for balanced accuracy,
  * reports honest metrics on a held-out test split, for both the old and the
    new models, plus how well each model separates the quiz answer texts,
  * writes .cbm + plain-Python exports + vectorizer/scaler/results to OUT_DIR.

Run inside Docker (catboost's native DLL is blocked on the dev machine):
  docker run --rm -v <backend>:/backend -v <repo>/mbti_1.csv:/data/mbti_1.csv:ro \
    -v <repo>/frontend/lib:/questions:ro python:3.12-slim \
    sh -c "pip install -q -r /backend/training/requirements.txt && python /backend/training/train.py"
"""
import json
import pickle
import re
import sys
from pathlib import Path

import numpy as np
import pandas as pd
import scipy.sparse as sp
from catboost import CatBoostClassifier
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics import accuracy_score, balanced_accuracy_score, f1_score, roc_auc_score
from sklearn.model_selection import train_test_split

sys.path.insert(0, "/backend")
from app.model import clean_text, raw_meta_features  # noqa: E402  (shared with inference)

DATA = Path("/data/mbti_1.csv")
OLD_DIR = Path("/backend/models")
OUT_DIR = Path("/backend/models_new")
QUESTIONS = Path("/questions/questions.ts")
AXES = ["IE", "NS", "TF", "JP"]
POSITIVE = {"IE": "I", "NS": "N", "TF": "F", "JP": "J"}  # class 1 per axis (same as before)
SEED = 42


def labels(types: pd.Series, axis: str) -> np.ndarray:
    pos = AXES.index(axis)
    return (types.str[pos] == POSITIVE[axis]).astype(int).to_numpy()


def build_features(texts_clean, texts_raw, vectorizer, scaler):
    Xt = vectorizer.transform(texts_clean)
    meta = np.vstack([raw_meta_features(t) for t in texts_raw])
    meta_s = (meta - scaler["mean"]) / scaler["std"]
    return sp.hstack([Xt, sp.csr_matrix(meta_s)]).tocsr().astype(np.float32)


def evaluate(y, p, threshold):
    pred = (p >= threshold).astype(int)
    return {
        "accuracy": round(accuracy_score(y, pred), 4),
        "balanced_accuracy": round(balanced_accuracy_score(y, pred), 4),
        "macro_f1": round(f1_score(y, pred, average="macro"), 4),
        "auc": round(roc_auc_score(y, p), 4),
    }


def best_threshold(y, p):
    grid = np.arange(0.2, 0.81, 0.01)
    scores = [balanced_accuracy_score(y, (p >= t).astype(int)) for t in grid]
    return float(round(grid[int(np.argmax(scores))], 2))


def quiz_separation(predict_fn):
    """Mean (option toward the axis's class-1 letter) − (opposite option) prob."""
    if not QUESTIONS.exists():
        return None
    src = QUESTIONS.read_text(encoding="utf-8")
    dim_axis = {"Energy": "IE", "Perception": "NS", "Judgment": "TF", "Orientation": "JP"}
    # option "a" is E/S/T/J, "b" is I/N/F/P; class 1 is I/N/F/J
    b_is_positive = {"IE": True, "NS": True, "TF": True, "JP": False}
    out = {a: [] for a in AXES}
    for block in re.split(r"\n  \{\n", src)[1:]:
        dim = re.search(r'dimension: "(\w+)"', block)
        if not dim or dim.group(1) not in dim_axis:
            continue
        axis = dim_axis[dim.group(1)]
        snips = dict(re.findall(r'\{ id: "([abc])", label: ".*?", snippet: "(.*?)" \}', block))
        pa, pb = predict_fn(axis, snips["a"]), predict_fn(axis, snips["b"])
        out[axis].append((pb - pa) if b_is_positive[axis] else (pa - pb))
    return {
        a: {"mean_gap": round(float(np.mean(v)), 4), "right_direction": f"{sum(x > 0.02 for x in v)}/{len(v)}"}
        for a, v in out.items()
    }


def main():
    df = pd.read_csv(DATA)
    df["type"] = df["type"].str.upper()
    df["clean"] = df["posts"].map(clean_text)
    print(f"rows: {len(df)}", flush=True)

    train_df, test_df = train_test_split(df, test_size=0.15, stratify=df["type"], random_state=SEED)
    fit_df, val_df = train_test_split(train_df, test_size=0.15 / 0.85, stratify=train_df["type"], random_state=SEED)
    print(f"fit {len(fit_df)}  val {len(val_df)}  test {len(test_df)}", flush=True)

    vectorizer = TfidfVectorizer(
        max_features=6000, min_df=3, ngram_range=(1, 2), sublinear_tf=True
    ).fit(fit_df["clean"])
    meta_fit = np.vstack([raw_meta_features(t) for t in fit_df["posts"]])
    scaler = {"mean": meta_fit.mean(axis=0), "std": meta_fit.std(axis=0) + 1e-9}

    X_fit = build_features(fit_df["clean"], fit_df["posts"], vectorizer, scaler)
    X_val = build_features(val_df["clean"], val_df["posts"], vectorizer, scaler)
    X_test = build_features(test_df["clean"], test_df["posts"], vectorizer, scaler)

    # ---- old models, scored on the same (leak-cleaned) test text ----
    old_vec = pickle.load(open(OLD_DIR / "vectorizer.pkl", "rb"))
    old_scaler = pickle.load(open(OLD_DIR / "meta_scaler.pkl", "rb"))
    old_results = json.load(open(OLD_DIR / "final_results.json"))
    X_test_old = build_features(test_df["clean"], test_df["posts"], old_vec, old_scaler)
    old_models = {}
    report = {"old": {}, "new": {}}

    OUT_DIR.mkdir(exist_ok=True)
    new_models, thresholds, test_probs, old_probs = {}, {}, {}, {}
    for axis in AXES:
        y_fit, y_val, y_test = labels(fit_df["type"], axis), labels(val_df["type"], axis), labels(test_df["type"], axis)

        old = CatBoostClassifier()
        old.load_model(str(OLD_DIR / f"axis_ckpt_{axis}.cbm"))
        old_models[axis] = old
        old_probs[axis] = old.predict_proba(X_test_old)[:, 1]
        report["old"][axis] = evaluate(y_test, old_probs[axis], old_results[axis]["threshold"])

        model = CatBoostClassifier(
            iterations=1500,
            learning_rate=0.05,
            depth=6,
            l2_leaf_reg=5,
            auto_class_weights="Balanced",
            eval_metric="AUC",
            od_type="Iter",
            od_wait=100,
            random_seed=SEED,
            verbose=250,
            thread_count=-1,
        )
        print(f"\n== training {axis} ==", flush=True)
        model.fit(X_fit, y_fit, eval_set=(X_val, y_val), use_best_model=True)
        p_val = model.predict_proba(X_val)[:, 1]
        thresholds[axis] = best_threshold(y_val, p_val)
        test_probs[axis] = model.predict_proba(X_test)[:, 1]
        report["new"][axis] = evaluate(y_test, test_probs[axis], thresholds[axis])
        report["new"][axis]["threshold"] = thresholds[axis]
        report["new"][axis]["trees"] = model.tree_count_
        new_models[axis] = model
        print(axis, "old:", report["old"][axis], "\n   new:", report["new"][axis], flush=True)

    def exact(probs, ths):
        letters = []
        for axis in AXES:
            pos = probs[axis] >= ths[axis]
            first = {"IE": "E", "NS": "S", "TF": "T", "JP": "P"}[axis]
            letters.append(np.where(pos, POSITIVE[axis], first))
        pred = np.char.add(np.char.add(letters[0], letters[1]), np.char.add(letters[2], letters[3]))
        return round(float(np.mean(pred == test_df["type"].to_numpy())), 4)

    report["old"]["exact_type"] = exact(old_probs, {a: old_results[a]["threshold"] for a in AXES})
    report["new"]["exact_type"] = exact(test_probs, thresholds)

    # How well each model tells the quiz's opposite answers apart (bigger = better)
    def sep_fn(models, vec, scl):
        def f(axis, text):
            X = build_features([clean_text(text)], [text], vec, scl)
            return float(models[axis].predict_proba(X)[0, 1])
        return f

    report["old"]["quiz_separation"] = quiz_separation(sep_fn(old_models, old_vec, old_scaler))
    report["new"]["quiz_separation"] = quiz_separation(sep_fn(new_models, vectorizer, scaler))
    report["test_set_size"] = int(len(test_df))
    report["note"] = (
        "Old models were trained on an unknown split that likely overlaps this test set, "
        "so their numbers here are optimistic."
    )

    # ---- save new artifacts (same layout the backend already loads) ----
    for axis, model in new_models.items():
        model.save_model(str(OUT_DIR / f"axis_ckpt_{axis}.cbm"))
        model.save_model(str(OUT_DIR / f"axis_{axis}.py"), format="python")
    pickle.dump(vectorizer, open(OUT_DIR / "vectorizer.pkl", "wb"))
    pickle.dump(scaler, open(OUT_DIR / "meta_scaler.pkl", "wb"))
    final = {
        axis: {
            "test_acc": report["new"][axis]["balanced_accuracy"],
            "test_f1": report["new"][axis]["macro_f1"],
            "test_auc": report["new"][axis]["auc"],
            "threshold": thresholds[axis],
        }
        for axis in AXES
    }
    final["combined_16type_exact_match_accuracy"] = report["new"]["exact_type"]
    final["test_set_size"] = int(len(test_df))
    json.dump(final, open(OUT_DIR / "final_results.json", "w"), indent=2)
    json.dump(report, open(OUT_DIR / "training_report.json", "w"), indent=2)
    print("\nREPORT\n" + json.dumps(report, indent=2), flush=True)


if __name__ == "__main__":
    main()
