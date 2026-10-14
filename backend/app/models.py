from sqlalchemy import JSON, Double, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from .db import Base


class User(Base):
    __tablename__ = "users"

    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    email: Mapped[str] = mapped_column(String(254), unique=True, index=True, nullable=False)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    password_hash: Mapped[str | None] = mapped_column(String(64))
    salt: Mapped[str | None] = mapped_column(String(32))
    oauth_provider: Mapped[str | None] = mapped_column(String(20))
    created_at: Mapped[float] = mapped_column(Double, nullable=False)


class UserSession(Base):
    __tablename__ = "sessions"

    token: Mapped[str] = mapped_column(String(64), primary_key=True)
    user_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id"), index=True, nullable=False)
    created_at: Mapped[float] = mapped_column(Double, nullable=False)


class PasswordResetToken(Base):
    __tablename__ = "password_reset_tokens"

    token: Mapped[str] = mapped_column(String(64), primary_key=True)
    user_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id"), index=True, nullable=False)
    created_at: Mapped[float] = mapped_column(Double, nullable=False)
    used: Mapped[bool] = mapped_column(nullable=False, default=False)


class HistoryEntry(Base):
    __tablename__ = "history_entries"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id"), index=True, nullable=False)
    predicted_type: Mapped[str] = mapped_column(String(4), nullable=False)
    axes: Mapped[dict] = mapped_column(JSON, nullable=False)
    word_count: Mapped[int] = mapped_column(Integer, nullable=False)
    warning: Mapped[str | None] = mapped_column(Text)
    signals: Mapped[list] = mapped_column(JSON, nullable=False)
    # "quiz" | "deepQuiz" | "freeform"; NULL for entries saved before this was tracked.
    test_mode: Mapped[str | None] = mapped_column(String(20))
    taken_at: Mapped[float] = mapped_column(Double, nullable=False, index=True)


class TypeCount(Base):
    __tablename__ = "type_counts"

    predicted_type: Mapped[str] = mapped_column(String(4), primary_key=True)
    count: Mapped[int] = mapped_column(Integer, nullable=False, default=0)


class StatsTotal(Base):
    __tablename__ = "stats_total"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    total_predictions: Mapped[int] = mapped_column(Integer, nullable=False, default=0)


class AxisStats(Base):
    """Running sum of the model's "second letter" probability for each axis,
    grouped by predicted type — lets /stats report the average axis lean
    within a type (e.g. avg Introversion% among INTJs) for a real "you vs.
    typical type" comparison instead of an assumed baseline."""

    __tablename__ = "axis_stats"

    predicted_type: Mapped[str] = mapped_column(String(4), primary_key=True)
    axis: Mapped[str] = mapped_column(String(2), primary_key=True)
    prob_sum: Mapped[float] = mapped_column(Double, nullable=False, default=0.0)
    count: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
