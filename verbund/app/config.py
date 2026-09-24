"""Runtime settings, read from environment variables (or a local `.env` file)."""

import os
from pathlib import Path

APP_DIR = Path(__file__).resolve().parent
PROJECT_DIR = APP_DIR.parent


def _load_dotenv(path: Path) -> None:
    """Minimal .env reader so the app needs no extra dependency for it."""
    if not path.exists():
        return
    for line in path.read_text().splitlines():
        line = line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, value = line.split("=", 1)
        os.environ.setdefault(key.strip(), value.strip().strip('"').strip("'"))


_load_dotenv(PROJECT_DIR / ".env")

DATABASE_PATH = Path(os.environ.get("VERBUND_DB", PROJECT_DIR / "data" / "verbund.db"))

# Ollama runs on the same machine; nothing is sent to a cloud service.
OLLAMA_URL = os.environ.get("OLLAMA_URL", "http://localhost:11434").rstrip("/")
OLLAMA_MODEL = os.environ.get("OLLAMA_MODEL", "qwen2.5-coder:7b")
OLLAMA_TIMEOUT = float(os.environ.get("OLLAMA_TIMEOUT", "90"))
OLLAMA_ENABLED = os.environ.get("OLLAMA_ENABLED", "1") != "0"
