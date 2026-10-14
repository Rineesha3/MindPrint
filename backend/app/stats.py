from sqlalchemy import select

from .db import get_session
from .models import AxisStats, StatsTotal, TypeCount

_TOTALS_ROW_ID = 1


def record_prediction(predicted_type: str, axis_probabilities: dict[str, float] | None = None) -> None:
    """axis_probabilities: e.g. {"IE": 0.71, "NS": 0.44, ...} — each value is
    the model's probability for that axis's *second* letter (I, N, F, J),
    matching AXIS_NAMES/LETTER_MAP order in config.py."""
    with get_session() as db:
        total = db.get(StatsTotal, _TOTALS_ROW_ID)
        if not total:
            total = StatsTotal(id=_TOTALS_ROW_ID, total_predictions=0)
            db.add(total)
        total.total_predictions += 1

        count_row = db.get(TypeCount, predicted_type)
        if not count_row:
            count_row = TypeCount(predicted_type=predicted_type, count=0)
            db.add(count_row)
        count_row.count += 1

        for axis, prob in (axis_probabilities or {}).items():
            axis_row = db.get(AxisStats, (predicted_type, axis))
            if not axis_row:
                axis_row = AxisStats(predicted_type=predicted_type, axis=axis, prob_sum=0.0, count=0)
                db.add(axis_row)
            axis_row.prob_sum += prob
            axis_row.count += 1


def get_stats() -> dict:
    with get_session() as db:
        total = db.get(StatsTotal, _TOTALS_ROW_ID)
        rows = db.scalars(select(TypeCount)).all()
        axis_rows = db.scalars(select(AxisStats)).all()

        axis_averages: dict[str, dict[str, float]] = {}
        for row in axis_rows:
            axis_averages.setdefault(row.predicted_type, {})[row.axis] = (
                round(row.prob_sum / row.count, 4) if row.count else 0.0
            )

        return {
            "total_predictions": total.total_predictions if total else 0,
            "type_counts": {row.predicted_type: row.count for row in rows},
            "axis_averages": axis_averages,
        }
