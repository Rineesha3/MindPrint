"""
Adaptive testing: the writing model picks the questions, then the answers and
the model's reading are combined into the final type.

Flow (all three test kinds):
  1. The person writes something; the model reads it (analyze_text).
  2. The model says how sure it is about each letter pair. Quizzes spend more of
     their questions on the pairs it's unsure about (allocate_questions); free
     writing asks a couple of follow-ups only on unsure pairs (follow_ups).
  3. score_answers blends answers with the model's lean:
       * quizzes — answers lead, the model gets 10–30% depending on how
         accurate that axis's model measured on held-out data;
       * free writing — the model leads; follow-up answers get half the say on
         the pairs they cover.

The model's lean is re-centered on each axis's tuned threshold so its class
bias (the training data is mostly I and N) cancels out.
"""
from .config import AXIS_NAMES, LETTER_MAP

DIMENSION_AXIS = {
    "Energy": "IE",
    "Perception": "NS",
    "Judgment": "TF",
    "Orientation": "JP",
}
AXIS_DIMENSION = {axis: dim for dim, axis in DIMENSION_AXIS.items()}

MIN_MODEL_WEIGHT = 0.10
MAX_MODEL_WEIGHT = 0.30
FREEFORM_ANSWER_WEIGHT = 0.5
# Below this certainty (0 = coin flip, 1 = fully sure) free writing asks follow-ups.
FOLLOW_UP_CERTAINTY = 0.35
FOLLOW_UPS_PER_AXIS = 2
MAX_FOLLOW_UP_AXES = 2
# Uncertainty floor so even a "sure" axis still gets a share of a quiz.
MIN_UNCERTAINTY = 0.15


def model_weight(balanced_accuracy: float) -> float:
    """0.55 → 0.10, 0.60 → 0.20, ≥0.65 → 0.30 (chance is 0.50)."""
    return max(MIN_MODEL_WEIGHT, min(MAX_MODEL_WEIGHT, 2 * (balanced_accuracy - 0.5)))


def centered_lean(prob: float, threshold: float) -> float:
    """Map the model's class-1 probability to 0..1 with the threshold at 0.5."""
    if prob >= threshold:
        return 0.5 + 0.5 * (prob - threshold) / max(1 - threshold, 1e-9)
    return 0.5 - 0.5 * (threshold - prob) / max(threshold, 1e-9)


def analyze_text(model_result: dict, thresholds: dict, reliability: dict) -> dict:
    """Per axis: the letter the model leans to and how sure it is (0..1).
    Certainty is discounted by the axis model's own measured accuracy, so a
    weak axis model never claims to be very sure."""
    out = {}
    for axis in AXIS_NAMES:
        first, second = LETTER_MAP[axis]
        lean = centered_lean(model_result["axes"][axis]["probabilities"][second], thresholds[axis])
        skill = max(0.0, min(1.0, (reliability[axis] - 0.5) / 0.3))  # 0.5 → 0, 0.8 → 1
        out[axis] = {
            "letter": second if lean >= 0.5 else first,
            "certainty": round(abs(lean - 0.5) * 2 * skill, 4),
        }
    return out


def allocate_questions(analysis: dict, count: int, caps: dict) -> dict:
    """Split `count` questions across dimensions, more where the model is unsure.
    Every dimension gets at least one; no dimension exceeds its pool size."""
    dims = [AXIS_DIMENSION[a] for a in AXIS_NAMES]
    caps = {d: max(0, int(caps.get(d, 0))) for d in dims}
    count = min(count, sum(caps.values()))
    alloc = {d: min(1, caps[d]) for d in dims}
    weights = {
        AXIS_DIMENSION[a]: max(MIN_UNCERTAINTY, 1 - analysis[a]["certainty"]) for a in AXIS_NAMES
    }
    remaining = count - sum(alloc.values())
    while remaining > 0:
        open_dims = [d for d in dims if alloc[d] < caps[d]]
        if not open_dims:
            break
        # Hand the next question to the dimension furthest below its fair share.
        total_w = sum(weights[d] for d in open_dims)
        target = {d: weights[d] / total_w * (sum(alloc[x] for x in open_dims) + 1) for d in open_dims}
        pick = max(open_dims, key=lambda d: target[d] - alloc[d])
        alloc[pick] += 1
        remaining -= 1
    return alloc


def follow_ups(analysis: dict) -> dict:
    """For free writing: which dimensions need follow-up questions, and how many."""
    unsure = sorted(
        (a for a in AXIS_NAMES if analysis[a]["certainty"] < FOLLOW_UP_CERTAINTY),
        key=lambda a: analysis[a]["certainty"],
    )[:MAX_FOLLOW_UP_AXES]
    return {AXIS_DIMENSION[a]: FOLLOW_UPS_PER_AXIS for a in unsure}


def _confidence(share: float) -> str:
    """How decisive the result is on this axis (share = winning side, 0.5–1)."""
    margin = share - 0.5
    if margin >= 0.3:
        return "high"
    if margin >= 0.15:
        return "medium"
    return "low"


def score_answers(
    answers: list[dict],
    model_result: dict,
    thresholds: dict,
    reliability: dict,
    model_leads: bool = False,
) -> dict:
    """answers: [{"dimension": "Energy", "pole": "E" | "I" | None}, ...]
    model_result: predictor.predict() on the person's own writing.
    model_leads: free writing (model decides, follow-ups adjust) vs. quiz."""
    tallies = {axis: {LETTER_MAP[axis][0]: 0.0, LETTER_MAP[axis][1]: 0.0} for axis in AXIS_NAMES}
    for a in answers:
        axis = DIMENSION_AXIS.get(a.get("dimension", ""))
        if not axis:
            continue
        pole = a.get("pole")
        if pole in tallies[axis]:
            tallies[axis][pole] += 1.0
        else:
            for letter in tallies[axis]:
                tallies[axis][letter] += 0.5

    letters = []
    axes = {}
    for axis in AXIS_NAMES:
        first, second = LETTER_MAP[axis]
        total = tallies[axis][first] + tallies[axis][second]
        model_axis = model_result["axes"][axis]

        if total == 0:
            # No answers on this pair (free writing without a follow-up): pure model.
            letters.append(model_axis["predicted"])
            axes[axis] = model_axis
            continue

        answer_share = tallies[axis][second] / total
        lean = centered_lean(model_axis["probabilities"][second], thresholds[axis])
        w = (1 - FREEFORM_ANSWER_WEIGHT) if model_leads else model_weight(reliability[axis])
        p_second = (1 - w) * answer_share + w * lean

        if p_second > 0.5:
            letter = second
        elif p_second < 0.5:
            letter = first
        else:
            letter = model_axis["predicted"]

        letters.append(letter)
        axes[axis] = {
            "predicted": letter,
            "probabilities": {first: round(1 - p_second, 4), second: round(p_second, 4)},
            "confidence": _confidence(max(p_second, 1 - p_second)),
            "axis_reliability": reliability[axis],
        }

    return {
        "predicted_type": "".join(letters),
        "axes": axes,
        "signals": model_result["signals"],  # writing-style notes from their own words
    }
