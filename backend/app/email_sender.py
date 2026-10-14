"""Minimal email sending — stdlib smtplib only, no extra dependency.

Falls back to logging the message when SMTP_HOST isn't configured, so the
password-reset flow works end to end in local dev without real mail
credentials. Set SMTP_HOST/SMTP_PORT/SMTP_USER/SMTP_PASSWORD/EMAIL_FROM to
send through a real provider (Gmail app password, SendGrid, Mailgun, etc.).
"""
import smtplib
from email.message import EmailMessage

from .config import EMAIL_FROM, SMTP_HOST, SMTP_PASSWORD, SMTP_PORT, SMTP_USER


def send_email(to: str, subject: str, body: str) -> None:
    if not SMTP_HOST:
        # No SMTP configured (local dev) — print instead of sending, so the
        # link is still usable without needing real mail credentials.
        print(f"\n--- Email (SMTP not configured) ---\nTo: {to}\nSubject: {subject}\n\n{body}\n------------------------------------\n")
        return

    message = EmailMessage()
    message["From"] = EMAIL_FROM
    message["To"] = to
    message["Subject"] = subject
    message.set_content(body)

    with smtplib.SMTP(SMTP_HOST, SMTP_PORT) as server:
        server.starttls()
        if SMTP_USER and SMTP_PASSWORD:
            server.login(SMTP_USER, SMTP_PASSWORD)
        server.send_message(message)
