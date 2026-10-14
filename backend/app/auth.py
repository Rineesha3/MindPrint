import logging
import re
import smtplib

from fastapi import APIRouter, Depends, Header, HTTPException
from starlette.requests import Request

from .auth_store import (
    EmailAlreadyRegistered,
    InvalidCredentials,
    authenticate_user,
    create_reset_token,
    create_session,
    delete_session,
    delete_user,
    get_user_by_token,
    register_user,
    reset_password as consume_reset_token,
    set_or_change_password,
    to_public,
    update_name,
)
from .config import FRONTEND_URL
from .email_sender import send_email
from .rate_limit import limiter
from .schemas import (
    AuthResponse,
    ChangePasswordRequest,
    ForgotPasswordRequest,
    LoginRequest,
    RegisterRequest,
    ResetPasswordRequest,
    UpdateNameRequest,
    UserPublic,
)

router = APIRouter(prefix="/auth", tags=["auth"])
logger = logging.getLogger(__name__)

EMAIL_RE = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")


def get_current_user(authorization: str = Header(default="")) -> dict:
    if not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing or invalid Authorization header.")
    token = authorization.removeprefix("Bearer ").strip()
    user = get_user_by_token(token)
    if not user:
        raise HTTPException(status_code=401, detail="Session expired or invalid — please log in again.")
    return user


def get_optional_user(authorization: str = Header(default="")) -> dict | None:
    """Same as get_current_user, but returns None instead of raising —
    for endpoints usable both signed in and as a guest (e.g. /predict)."""
    if not authorization.startswith("Bearer "):
        return None
    token = authorization.removeprefix("Bearer ").strip()
    return get_user_by_token(token)


@router.post("/register", response_model=AuthResponse)
@limiter.limit("10/minute")
def register(request: Request, payload: RegisterRequest):
    if not EMAIL_RE.match(payload.email):
        raise HTTPException(status_code=422, detail="Enter a valid email address.")

    try:
        user = register_user(payload.email, payload.password, payload.name)
    except EmailAlreadyRegistered:
        raise HTTPException(status_code=409, detail="An account with that email already exists.")

    token = create_session(user["id"])
    return AuthResponse(token=token, user=UserPublic(**to_public(user)))


@router.post("/login", response_model=AuthResponse)
@limiter.limit("10/minute")
def login(request: Request, payload: LoginRequest):
    try:
        user = authenticate_user(payload.email, payload.password)
    except InvalidCredentials:
        raise HTTPException(status_code=401, detail="Incorrect email or password.")

    token = create_session(user["id"])
    return AuthResponse(token=token, user=UserPublic(**to_public(user)))


@router.post("/logout")
def logout(authorization: str = Header(default="")):
    if authorization.startswith("Bearer "):
        delete_session(authorization.removeprefix("Bearer ").strip())
    return {"status": "ok"}


@router.get("/me", response_model=UserPublic)
def me(user: dict = Depends(get_current_user)):
    return UserPublic(**to_public(user))


@router.patch("/me", response_model=UserPublic)
def update_me(payload: UpdateNameRequest, user: dict = Depends(get_current_user)):
    updated = update_name(user["id"], payload.name)
    return UserPublic(**to_public(updated))


@router.delete("/me")
def delete_me(user: dict = Depends(get_current_user)):
    delete_user(user["id"])
    return {"status": "ok"}


@router.post("/change-password")
@limiter.limit("10/minute")
def change_password(request: Request, payload: ChangePasswordRequest, user: dict = Depends(get_current_user)):
    try:
        set_or_change_password(user["id"], payload.current_password, payload.new_password)
    except InvalidCredentials:
        raise HTTPException(status_code=401, detail="Current password is incorrect.")
    return {"status": "ok"}


@router.post("/forgot-password")
@limiter.limit("5/minute")
def forgot_password(request: Request, payload: ForgotPasswordRequest):
    token = create_reset_token(payload.email)
    if token:
        reset_link = f"{FRONTEND_URL}/reset-password?token={token}"
        try:
            send_email(
                payload.email,
                "Reset your MindPrint password",
                f"Reset your password here (expires in 1 hour):\n\n{reset_link}\n\n"
                "If you didn't request this, you can ignore this email.",
            )
        except (OSError, smtplib.SMTPException):
            # A mail failure must not turn into a 500 that only registered
            # emails can trigger — that would leak which addresses exist.
            logger.exception("Failed to send password-reset email")
    # Same response whether or not the email is registered, so this endpoint
    # can't be used to check which addresses have accounts.
    return {"status": "ok"}


@router.post("/reset-password")
@limiter.limit("10/minute")
def reset_password(request: Request, payload: ResetPasswordRequest):
    try:
        consume_reset_token(payload.token, payload.new_password)
    except InvalidCredentials:
        raise HTTPException(status_code=400, detail="This reset link is invalid or has expired.")
    return {"status": "ok"}
