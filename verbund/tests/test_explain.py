import httpx

from app import config, db
from app.explain import ollama, worker
from app.explain.template import template_explanation
from app.matching.scoring import DEFAULT_WEIGHTS, Profile, score_pair


def pair_factors():
    new = Profile(1, "Mina", "Park", 8, "8B", {"Korean": "home", "English": "learning"}, {"Drawing", "Music"},
                  {"Art Studio"}, {"Mon · Lunch"})
    buddy = Profile(2, "Joon-ho", "Kim", 8, "8B", {"Korean": "home", "English": "fluent"}, {"Music"},
                    set(), {"Mon · Lunch", "Wed · Lunch"}, been_new_before=True)
    score, factors = score_pair(new, buddy, DEFAULT_WEIGHTS)
    return score, [f.to_dict() for f in factors]


def test_template_only_mentions_real_shared_data():
    score, factors = pair_factors()
    text = template_explanation("Mina", "Joon-ho", score, factors)
    assert f"scores {score} out of 100" in text
    assert "Korean" in text and "Monday lunch" in text and "music" in text
    assert "drawing" not in text.lower()          # Mina likes drawing, Joon-ho does not
    assert "not in any of the same clubs" in text


def test_prompt_uses_first_names_and_breakdown_only():
    score, factors = pair_factors()
    prompt = ollama.build_prompt("Mina", "Joon-ho", score, factors)
    assert "Mina" in prompt and "Joon-ho" in prompt
    assert "Park" not in prompt and "Kim" not in prompt
    assert "Shared language: 20/20" in prompt


def test_clean_rejects_bad_output_and_strips_markdown():
    assert ollama.clean("") is None
    assert ollama.clean("Too short.") is None
    assert ollama.clean("word " * 150) is None
    text = ollama.clean('"**Joon-ho** is a good buddy for Mina because they both speak Korean at home."')
    assert text == "Joon-ho is a good buddy for Mina because they both speak Korean at home."


def test_generate_handles_success_and_failure(monkeypatch):
    class Reply:
        def raise_for_status(self):
            pass

        def json(self):
            return {"response": "Joon-ho and Mina both speak Korean at home and are free on Monday lunch."}

    monkeypatch.setattr(ollama.httpx, "post", lambda *a, **k: Reply())
    assert ollama.generate("prompt").startswith("Joon-ho and Mina")

    def boom(*a, **k):
        raise httpx.ConnectError("refused")

    monkeypatch.setattr(ollama.httpx, "post", boom)
    assert ollama.generate("prompt") is None


def test_status_when_ollama_is_off(monkeypatch):
    monkeypatch.setattr(config, "OLLAMA_ENABLED", True)

    def refused(*a, **k):
        raise httpx.ConnectError("refused")

    monkeypatch.setattr(ollama.httpx, "get", refused)
    info = ollama.status()
    assert info["reachable"] is False and info["model_installed"] is False


def test_worker_saves_ai_explanation(demo_db, monkeypatch):
    from app import matches as mt
    with db.session() as conn:
        mid = mt.run_matching(conn)["match_ids"][0]
    monkeypatch.setattr(ollama, "generate", lambda prompt: "A tidy explanation written by the local model for staff.")
    worker.process(mid)
    with db.session() as conn:
        row = conn.execute("SELECT explanation, explanation_status FROM matches WHERE id = ?", (mid,)).fetchone()
    assert row["explanation_status"] == "ollama"
    assert row["explanation"].startswith("A tidy explanation")


def test_worker_keeps_template_when_model_fails(demo_db, monkeypatch):
    from app import matches as mt
    with db.session() as conn:
        mid = mt.run_matching(conn)["match_ids"][0]
        conn.execute("UPDATE matches SET explanation_status = 'queued' WHERE id = ?", (mid,))
        before = conn.execute("SELECT explanation FROM matches WHERE id = ?", (mid,)).fetchone()[0]
    monkeypatch.setattr(ollama, "generate", lambda prompt: None)
    worker.process(mid)
    with db.session() as conn:
        row = conn.execute("SELECT explanation, explanation_status FROM matches WHERE id = ?", (mid,)).fetchone()
    assert row["explanation_status"] == "template" and row["explanation"] == before


def test_enqueue_refuses_when_ollama_not_ready(monkeypatch):
    monkeypatch.setattr(ollama, "status", lambda: {"reachable": False, "model_installed": False})
    assert worker.enqueue([1, 2]) is False
