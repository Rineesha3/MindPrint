from .auth_store import EmailAlreadyRegistered, register_user

DEMO_EMAIL = "member@gmail.com"
DEMO_PASSWORD = "member123"
DEMO_NAME = "Member"


def seed_demo_user() -> None:
    """Idempotent — safe to call on every startup. Lets anyone try the
    assessment without registering first."""
    try:
        register_user(DEMO_EMAIL, DEMO_PASSWORD, DEMO_NAME)
    except EmailAlreadyRegistered:
        pass
