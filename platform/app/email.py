"""Outbound email abstraction.

Mirrors the payments-provider pattern: a small protocol, a dev-safe default
backend, and a production backend that is inert unless configured.

- ConsoleEmailBackend (default, EMAIL_BACKEND=console): DEV ONLY. Writes the
  full email — including any secret token in the body — to the application
  log. Never enable in production.
- SmtpEmailBackend (EMAIL_BACKEND=smtp): sends via smtplib/STARTTLS. Raises
  ConfigurationError before touching the network when SMTP_* settings are
  missing, so an unconfigured deploy fails loudly instead of dropping mail.

Routes obtain the backend via get_email_backend(); tests monkeypatch that
function to capture outbound messages (no network calls in tests, ever).
"""

import logging
import smtplib
from email.message import EmailMessage
from typing import Protocol, runtime_checkable

from .config import get_settings
from .payments.base import ConfigurationError

logger = logging.getLogger("pyportfolios.email")


@runtime_checkable
class EmailBackend(Protocol):
    name: str

    def send(self, to: str, subject: str, body: str) -> None:
        """Deliver a plain-text email. Raises ConfigurationError if the
        backend is selected but not configured."""
        ...


class ConsoleEmailBackend:
    """DEV ONLY — logs the email (body and any token it contains) instead of
    sending it. Useful for local flows: copy the reset token from the log."""

    name = "console"

    def send(self, to: str, subject: str, body: str) -> None:
        # logger.warning (not .info): uvicorn's default logging config leaves
        # app loggers at WARNING, so an INFO line silently vanishes — and with
        # it the reset token this dev backend exists to surface. Belt-and-
        # braces: also print(), so the token shows even under exotic configs.
        text = (
            "DEV ONLY console email backend — NOT delivered.\n"
            f"To: {to}\nSubject: {subject}\n---\n{body}\n---"
        )
        logger.warning(text)
        print(text, flush=True)


class SmtpEmailBackend:
    """Minimal SMTP (STARTTLS) sender. Inert without configuration: raises
    ConfigurationError before any network I/O when SMTP_HOST is unset."""

    name = "smtp"

    def send(self, to: str, subject: str, body: str) -> None:
        settings = get_settings()
        if not settings.smtp_host:
            raise ConfigurationError(
                "EMAIL_BACKEND=smtp but SMTP_HOST is not set — configure "
                "SMTP_HOST/SMTP_PORT/SMTP_USERNAME/SMTP_PASSWORD/SMTP_FROM in .env"
            )
        msg = EmailMessage()
        msg["From"] = settings.smtp_from
        msg["To"] = to
        msg["Subject"] = subject
        msg.set_content(body)
        with smtplib.SMTP(settings.smtp_host, settings.smtp_port) as smtp:
            smtp.starttls()
            if settings.smtp_username:
                smtp.login(settings.smtp_username, settings.smtp_password)
            smtp.send_message(msg)


def get_email_backend() -> EmailBackend:
    """Select the backend from settings. Monkeypatched by tests."""
    if get_settings().email_backend == "smtp":
        return SmtpEmailBackend()
    return ConsoleEmailBackend()
