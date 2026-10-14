"""
MySQL connection setup. Replaces the old JSON-file stores — set the
MYSQL_* env vars (or a full MYSQL_URL / DATABASE_URL) to point this at your
database. Defaults assume a local MySQL with a `mbti` database and no
root password, for quick local dev.
"""
import os
from contextlib import contextmanager
from pathlib import Path

from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, Session, sessionmaker

load_dotenv(Path(__file__).resolve().parent.parent / ".env")


def _build_url() -> str:
    url = os.environ.get("MYSQL_URL") or os.environ.get("DATABASE_URL")
    if url:
        return url
    user = os.environ.get("MYSQL_USER", "root")
    password = os.environ.get("MYSQL_PASSWORD", "")
    host = os.environ.get("MYSQL_HOST", "localhost")
    port = os.environ.get("MYSQL_PORT", "3306")
    database = os.environ.get("MYSQL_DATABASE", "mbti")
    return f"mysql+pymysql://{user}:{password}@{host}:{port}/{database}?charset=utf8mb4"


DATABASE_URL = _build_url()
engine = create_engine(DATABASE_URL, pool_pre_ping=True, pool_recycle=280)
SessionLocal = sessionmaker(bind=engine, autoflush=False, expire_on_commit=False)


class Base(DeclarativeBase):
    pass


def init_db() -> None:
    from . import models  # noqa: F401  (registers tables on Base.metadata)

    Base.metadata.create_all(engine)
    _add_missing_columns()


def _add_missing_columns() -> None:
    """create_all() never alters existing tables, so columns added to a model
    after its table was first created are added here."""
    from sqlalchemy import inspect, text

    inspector = inspect(engine)
    existing = {c["name"] for c in inspector.get_columns("history_entries")}
    if "test_mode" not in existing:
        with engine.begin() as conn:
            conn.execute(text("ALTER TABLE history_entries ADD COLUMN test_mode VARCHAR(20) NULL"))

    # Timestamps were first created as single-precision FLOAT, which rounds
    # Unix times to ~1–2 minutes. Widen them (and the stats sums) to DOUBLE.
    for table, column in (
        ("users", "created_at"),
        ("sessions", "created_at"),
        ("password_reset_tokens", "created_at"),
        ("history_entries", "taken_at"),
        ("axis_stats", "prob_sum"),
    ):
        col = next((c for c in inspector.get_columns(table) if c["name"] == column), None)
        if col is not None and "DOUBLE" not in str(col["type"]).upper():
            with engine.begin() as conn:
                conn.execute(text(f"ALTER TABLE {table} MODIFY COLUMN {column} DOUBLE NOT NULL"))


@contextmanager
def get_session():
    session: Session = SessionLocal()
    try:
        yield session
        session.commit()
    except Exception:
        session.rollback()
        raise
    finally:
        session.close()
