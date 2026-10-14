"""
Per-user prediction history, backed by MySQL. Only used for logged-in
users; guests keep using browser localStorage on the frontend.
"""
import time

from sqlalchemy import delete, select

from .db import get_session
from .models import HistoryEntry

MAX_ENTRIES_PER_USER = 50


def _to_dict(entry: HistoryEntry) -> dict:
    return {
        "predicted_type": entry.predicted_type,
        "axes": entry.axes,
        "word_count": entry.word_count,
        "warning": entry.warning,
        "signals": entry.signals,
        "test_mode": entry.test_mode,
        "taken_at": entry.taken_at,
    }


def add_entry(user_id: str, entry: dict) -> list:
    with get_session() as db:
        db.add(
            HistoryEntry(
                user_id=user_id,
                predicted_type=entry["predicted_type"],
                axes=entry["axes"],
                word_count=entry["word_count"],
                warning=entry.get("warning"),
                signals=entry.get("signals", []),
                test_mode=entry.get("test_mode"),
                taken_at=time.time(),
            )
        )
        db.flush()

        rows = db.scalars(
            select(HistoryEntry)
            .where(HistoryEntry.user_id == user_id)
            .order_by(HistoryEntry.taken_at.desc())
        ).all()

        stale_ids = [row.id for row in rows[MAX_ENTRIES_PER_USER:]]
        if stale_ids:
            db.execute(delete(HistoryEntry).where(HistoryEntry.id.in_(stale_ids)))

        return [_to_dict(row) for row in rows[:MAX_ENTRIES_PER_USER]]


def get_entries(user_id: str) -> list:
    with get_session() as db:
        rows = db.scalars(
            select(HistoryEntry)
            .where(HistoryEntry.user_id == user_id)
            .order_by(HistoryEntry.taken_at.desc())
        ).all()
        return [_to_dict(row) for row in rows]


def clear_entries(user_id: str) -> None:
    with get_session() as db:
        db.execute(delete(HistoryEntry).where(HistoryEntry.user_id == user_id))
