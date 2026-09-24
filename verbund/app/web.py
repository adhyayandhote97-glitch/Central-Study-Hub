"""Template rendering, flash messages and small display helpers."""

from datetime import datetime, timezone
from urllib.parse import quote, unquote

from fastapi import Request
from fastapi.responses import HTMLResponse, RedirectResponse
from fastapi.templating import Jinja2Templates

from . import config, db
from .explain.template import slot_words
from .matching.scoring import DAYS, FACTORS, PERIODS



def _nav_counts(request: Request) -> dict:
    """Number shown next to "Review" in the sidebar on every staff page."""
    try:
        with db.session() as conn:
            waiting = conn.execute("SELECT COUNT(*) FROM matches WHERE status = 'suggested'").fetchone()[0]
    except Exception:
        waiting = 0
    return {"nav_counts": {"review": waiting}}


templates = Jinja2Templates(directory=str(config.APP_DIR / "templates"), context_processors=[_nav_counts])
FLASH_COOKIE = "vb_flash"

NAV = [
    ("dashboard", "Dashboard", "/dashboard", "squares-four"),
    ("students", "Students", "/students", "users"),
    ("matching", "Matching", "/matching", "handshake"),
    ("review", "Review", "/review", "seal-check"),
]


def _parse(iso: str | None) -> datetime | None:
    if not iso:
        return None
    try:
        value = datetime.fromisoformat(iso)
    except ValueError:
        return None
    return value if value.tzinfo else value.replace(tzinfo=timezone.utc)


def ago(iso: str | None) -> str:
    when = _parse(iso)
    if when is None:
        return "never"
    seconds = (datetime.now(timezone.utc) - when).total_seconds()
    if seconds < 60:
        return "just now"
    if seconds < 3600:
        return f"{int(seconds // 60)} min ago"
    if seconds < 86400:
        hours = int(seconds // 3600)
        return f"{hours} hour{'s' if hours != 1 else ''} ago"
    days = int(seconds // 86400)
    if days < 30:
        return f"{days} day{'s' if days != 1 else ''} ago"
    local = when.astimezone()
    return f"{local.day} {local.strftime('%b %Y')}"


def stamp(iso: str | None) -> str:
    when = _parse(iso)
    if when is None:
        return "—"
    local = when.astimezone()  # %-d is not portable to Windows, so build the day by hand
    return f"{local.day} {local.strftime('%b %Y, %H:%M')}"


def pts(value) -> str:
    """Points without a pointless '.0': 25.0 -> '25', 13.33 -> '13.3'."""
    return f"{round(float(value), 1):g}"


def plural(n: int, word: str, many: str | None = None) -> str:
    return f"{n} {word if n == 1 else (many or word + 's')}"


templates.env.filters.update(ago=ago, stamp=stamp, slot_words=slot_words, pts=pts)
templates.env.globals.update(NAV=NAV, FACTORS=FACTORS, DAYS=DAYS, PERIODS=PERIODS, plural=plural,
                             OLLAMA_MODEL=config.OLLAMA_MODEL)


def render(request: Request, name: str, context: dict | None = None, status_code: int = 200) -> HTMLResponse:
    context = dict(context or {})
    flash = request.cookies.get(FLASH_COOKIE)
    context.setdefault("flash", unquote(flash) if flash else None)
    response = templates.TemplateResponse(request, name, context, status_code=status_code)
    if flash:
        response.delete_cookie(FLASH_COOKIE)
    return response


def redirect(url: str, message: str | None = None) -> RedirectResponse:
    response = RedirectResponse(url, status_code=303)
    if message:
        response.set_cookie(FLASH_COOKIE, quote(message), max_age=60, httponly=True, samesite="lax")
    return response
