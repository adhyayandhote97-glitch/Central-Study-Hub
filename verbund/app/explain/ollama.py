"""Explanations written by a local language model through Ollama.

The model only *explains* a score that the weighted algorithm has already
calculated; it never makes or changes a matching decision. Ollama runs on the
same computer, so no student data leaves the school machine. Only first names
and the score breakdown are sent to the model.
"""

import re

import httpx

from .. import config
from ..matching.scoring import band

SYSTEM_PROMPT = (
    "You write short explanations for school staff about why two students were "
    "suggested as buddies. Use only the facts you are given. Write 2 or 3 plain "
    "sentences, under 70 words in total. No lists, headings or markdown. Do not "
    "guess about culture, nationality, personality or feelings. Use first names."
)


def build_prompt(new_first: str, buddy_first: str, score: int, factors: list[dict]) -> str:
    lines = [
        f"New student: {new_first}",
        f"Suggested buddy: {buddy_first}",
        f"Compatibility score: {score}/100 ({band(score)} match)",
        "Factors (points earned out of points possible):",
    ]
    for f in factors:
        line = f"- {f['label']}: {f['points']:g}/{f['weight']:g}. {f['note']}."
        if f["shared"]:
            line += f" Shared: {', '.join(f['shared'])}."
        lines.append(line)
    lines.append(
        "Explain to a teacher why this pair was suggested. Start with the factors "
        "that earned the most points. If an important factor earned nothing, say so."
    )
    return "\n".join(lines)


def clean(text: str) -> str | None:
    """Tidy the model's reply, or reject it (None) so the template is kept."""
    text = re.sub(r"[*_#`>]+", "", text or "")
    text = re.sub(r"\s+", " ", text).strip().strip('"').strip()
    words = len(text.split())
    if words < 8 or words > 120:
        return None
    return text


def generate(prompt: str) -> str | None:
    try:
        response = httpx.post(
            f"{config.OLLAMA_URL}/api/generate",
            json={
                "model": config.OLLAMA_MODEL,
                "system": SYSTEM_PROMPT,
                "prompt": prompt,
                "stream": False,
                "options": {"temperature": 0.2, "num_predict": 200},
            },
            timeout=config.OLLAMA_TIMEOUT,
        )
        response.raise_for_status()
        return clean(response.json().get("response", ""))
    except (httpx.HTTPError, ValueError):
        return None


def status() -> dict:
    """Is Ollama running, and is the configured model downloaded?"""
    info = {
        "enabled": config.OLLAMA_ENABLED,
        "url": config.OLLAMA_URL,
        "model": config.OLLAMA_MODEL,
        "reachable": False,
        "model_installed": False,
        "models": [],
    }
    if not config.OLLAMA_ENABLED:
        return info
    try:
        response = httpx.get(f"{config.OLLAMA_URL}/api/tags", timeout=2)
        response.raise_for_status()
        names = [m.get("name", "") for m in response.json().get("models", [])]
    except (httpx.HTTPError, ValueError):
        return info
    wanted = config.OLLAMA_MODEL if ":" in config.OLLAMA_MODEL else f"{config.OLLAMA_MODEL}:latest"
    info.update(reachable=True, models=names, model_installed=wanted in names)
    return info
