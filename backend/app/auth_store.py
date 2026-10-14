"""
User/session store backed by MySQL. Passwords hashed with salted PBKDF2
(stdlib only, no extra dependency).
"""
import hashlib
import secrets
import time
import uuid

from sqlalchemy import delete as sa_delete, select

from .config import RESET_TOKEN_TTL_SECONDS, SESSION_TTL_SECONDS
from .db import get_session
from .models import HistoryEntry, PasswordResetToken, User, UserSession

PBKDF2_ITERATIONS = 260_000


def _hash_password(password: str, salt: str | None = None) -> tuple[str, str]:
    salt = salt or secrets.token_hex(16)
    digest = hashlib.pbkdf2_hmac(
        "sha256", password.encode("utf-8"), bytes.fromhex(salt), PBKDF2_ITERATIONS
    )
    return digest.hex(), salt


def _to_dict(user: User) -> dict:
    return {
        "id": user.id,
        "email": user.email,
        "name": user.name,
        "password_hash": user.password_hash,
        "salt": user.salt,
        "oauth_provider": user.oauth_provider,
        "created_at": user.created_at,
    }


def to_public(user: dict) -> dict:
    return {
        "id": user["id"],
        "email": user["email"],
        "name": user["name"],
        "has_password": bool(user.get("password_hash")),
    }


class EmailAlreadyRegistered(Exception):
    pass


class InvalidCredentials(Exception):
    pass


def register_user(email: str, password: str, name: str) -> dict:
    email = email.strip().lower()
    password_hash, salt = _hash_password(password)
    with get_session() as db:
        if db.scalar(select(User).where(User.email == email)):
            raise EmailAlreadyRegistered()

        user = User(
            id=str(uuid.uuid4()),
            email=email,
            name=name.strip() or email.split("@")[0],
            password_hash=password_hash,
            salt=salt,
            created_at=time.time(),
        )
        db.add(user)
        db.flush()
        return _to_dict(user)


def get_or_create_oauth_user(email: str, name: str, provider: str) -> dict:
    """Logs in via an OAuth provider. Reuses an existing account with the
    same email (so someone who registered with a password can also sign
    in with Google), otherwise creates a new password-less one."""
    email = email.strip().lower()
    with get_session() as db:
        user = db.scalar(select(User).where(User.email == email))
        if user:
            return _to_dict(user)

        user = User(
            id=str(uuid.uuid4()),
            email=email,
            name=name.strip() or email.split("@")[0],
            password_hash=None,
            salt=None,
            oauth_provider=provider,
            created_at=time.time(),
        )
        db.add(user)
        db.flush()
        return _to_dict(user)


def authenticate_user(email: str, password: str) -> dict:
    email = email.strip().lower()
    with get_session() as db:
        user = db.scalar(select(User).where(User.email == email))
        if not user or not user.password_hash:
            raise InvalidCredentials()
        candidate_hash, _ = _hash_password(password, user.salt)
        if not secrets.compare_digest(candidate_hash, user.password_hash):
            raise InvalidCredentials()
        return _to_dict(user)


def update_name(user_id: str, name: str) -> dict:
    with get_session() as db:
        user = db.get(User, user_id)
        if not user:
            raise InvalidCredentials()
        user.name = name.strip() or user.name
        db.flush()
        return _to_dict(user)


def set_or_change_password(user_id: str, current_password: str | None, new_password: str) -> dict:
    """Sets a password for an OAuth-only account, or changes an existing
    one — requiring the current password whenever one is already set."""
    with get_session() as db:
        user = db.get(User, user_id)
        if not user:
            raise InvalidCredentials()
        if user.password_hash:
            if not current_password:
                raise InvalidCredentials()
            candidate_hash, _ = _hash_password(current_password, user.salt)
            if not secrets.compare_digest(candidate_hash, user.password_hash):
                raise InvalidCredentials()

        password_hash, salt = _hash_password(new_password)
        user.password_hash = password_hash
        user.salt = salt
        db.flush()
        return _to_dict(user)


def delete_user(user_id: str) -> None:
    with get_session() as db:
        db.execute(sa_delete(HistoryEntry).where(HistoryEntry.user_id == user_id))
        db.execute(sa_delete(UserSession).where(UserSession.user_id == user_id))
        db.execute(sa_delete(PasswordResetToken).where(PasswordResetToken.user_id == user_id))
        db.execute(sa_delete(User).where(User.id == user_id))


def create_session(user_id: str) -> str:
    token = secrets.token_urlsafe(32)
    with get_session() as db:
        db.add(UserSession(token=token, user_id=user_id, created_at=time.time()))
    return token


def get_user_by_token(token: str) -> dict | None:
    with get_session() as db:
        session = db.get(UserSession, token)
        if not session:
            return None
        if time.time() - session.created_at > SESSION_TTL_SECONDS:
            db.delete(session)
            return None

        user = db.get(User, session.user_id)
        return _to_dict(user) if user else None


def delete_session(token: str) -> None:
    with get_session() as db:
        session = db.get(UserSession, token)
        if session:
            db.delete(session)


def create_reset_token(email: str) -> str | None:
    """Returns a fresh reset token if the email belongs to a password-holding
    account, otherwise None — callers should respond identically either way
    so the endpoint doesn't leak which emails are registered."""
    email = email.strip().lower()
    with get_session() as db:
        user = db.scalar(select(User).where(User.email == email))
        if not user or not user.password_hash:
            return None

        token = secrets.token_urlsafe(32)
        db.add(PasswordResetToken(token=token, user_id=user.id, created_at=time.time(), used=False))
        return token


def reset_password(token: str, new_password: str) -> None:
    with get_session() as db:
        reset = db.get(PasswordResetToken, token)
        if not reset or reset.used or time.time() - reset.created_at > RESET_TOKEN_TTL_SECONDS:
            raise InvalidCredentials()

        user = db.get(User, reset.user_id)
        if not user:
            raise InvalidCredentials()

        password_hash, salt = _hash_password(new_password)
        user.password_hash = password_hash
        user.salt = salt
        reset.used = True
        # Password reset should kill any existing (possibly stolen) sessions.
        db.execute(sa_delete(UserSession).where(UserSession.user_id == user.id))
        db.flush()
