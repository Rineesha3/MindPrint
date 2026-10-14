"""
"Sign in with Google" via the OAuth2 authorization-code flow.

Flow: frontend links to /auth/oauth/{provider}/login -> we redirect to the
provider's consent screen -> provider redirects back to
/auth/oauth/{provider}/callback with a code -> we exchange it for an access
token, fetch the user's email/name, create-or-reuse a local account, and
redirect to the frontend with a session token in the query string.

Requires the provider's client id/secret as env vars (unset = disabled):
GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET
"""
import os
import secrets
import threading
import time
from urllib.parse import urlencode

import httpx
from fastapi import APIRouter, HTTPException, Query
from starlette.responses import RedirectResponse

from .auth_store import create_session, get_or_create_oauth_user
from .config import BACKEND_URL, FRONTEND_URL

router = APIRouter(prefix="/auth/oauth", tags=["oauth"])

_STATE_TTL_SECONDS = 600
_states: dict[str, dict] = {}
_states_lock = threading.Lock()

PROVIDERS = {
    "google": {
        "client_id": os.environ.get("GOOGLE_CLIENT_ID", ""),
        "client_secret": os.environ.get("GOOGLE_CLIENT_SECRET", ""),
        "authorize_url": "https://accounts.google.com/o/oauth2/v2/auth",
        "token_url": "https://oauth2.googleapis.com/token",
        "userinfo_url": "https://www.googleapis.com/oauth2/v3/userinfo",
        "scope": "openid email profile",
    },
}


def _redirect_uri(provider: str) -> str:
    return f"{BACKEND_URL}/auth/oauth/{provider}/callback"


def _issue_state(next_path: str) -> str:
    state = secrets.token_urlsafe(24)
    with _states_lock:
        now = time.time()
        for key, value in list(_states.items()):
            if now - value["created_at"] > _STATE_TTL_SECONDS:
                del _states[key]
        _states[state] = {"next": next_path, "created_at": now}
    return state


def _consume_state(state: str) -> str | None:
    with _states_lock:
        entry = _states.pop(state, None)
    if not entry or time.time() - entry["created_at"] > _STATE_TTL_SECONDS:
        return None
    return entry["next"]


def _error_redirect(message: str) -> RedirectResponse:
    query = urlencode({"error": message})
    return RedirectResponse(f"{FRONTEND_URL}/login?{query}")


@router.get("/{provider}/login")
def oauth_login(provider: str, next: str = "/"):
    cfg = PROVIDERS.get(provider)
    if not cfg or not cfg["client_id"]:
        raise HTTPException(status_code=404, detail=f"{provider.title()} login is not configured.")

    # Only same-site relative paths — blocks open redirects like next=https://evil.com
    if not next.startswith("/") or next.startswith("//") or "\\" in next:
        next = "/"
    state = _issue_state(next)
    params = {
        "client_id": cfg["client_id"],
        "redirect_uri": _redirect_uri(provider),
        "response_type": "code",
        "scope": cfg["scope"],
        "state": state,
    }
    if provider == "google":
        params["access_type"] = "online"
        params["prompt"] = "select_account"
    return RedirectResponse(f"{cfg['authorize_url']}?{urlencode(params)}")


@router.get("/{provider}/callback")
def oauth_callback(
    provider: str,
    code: str | None = None,
    state: str | None = None,
    error: str | None = None,
):
    cfg = PROVIDERS.get(provider)
    if not cfg or not cfg["client_id"]:
        raise HTTPException(status_code=404, detail=f"{provider.title()} login is not configured.")

    if error:
        return _error_redirect(f"{provider.title()} sign-in was cancelled.")
    if not code or not state:
        return _error_redirect("Missing code from provider.")

    next_path = _consume_state(state)
    if next_path is None:
        return _error_redirect("Sign-in session expired — please try again.")

    try:
        token_res = httpx.post(
            cfg["token_url"],
            data={
                "client_id": cfg["client_id"],
                "client_secret": cfg["client_secret"],
                "code": code,
                "redirect_uri": _redirect_uri(provider),
                "grant_type": "authorization_code",
            },
            headers={"Accept": "application/json"},
            timeout=10,
        )
        token_res.raise_for_status()
        access_token = token_res.json()["access_token"]

        userinfo_res = httpx.get(
            cfg["userinfo_url"],
            headers={"Authorization": f"Bearer {access_token}"},
            timeout=10,
        )
        userinfo_res.raise_for_status()
        info = userinfo_res.json()
    except httpx.HTTPError:
        return _error_redirect(f"Could not verify {provider.title()} account — please try again.")

    email = info.get("email")
    if not email:
        return _error_redirect(f"Your {provider.title()} account has no email to sign in with.")
    # Accounts are linked by email, so an unverified address could take over
    # an existing password account registered with that email.
    if info.get("email_verified") is not True:
        return _error_redirect(f"Your {provider.title()} email address isn't verified.")
    name = info.get("name", "")

    user = get_or_create_oauth_user(email, name, provider)
    session_token = create_session(user["id"])

    query = urlencode({"token": session_token, "next": next_path})
    return RedirectResponse(f"{FRONTEND_URL}/login/callback?{query}")
