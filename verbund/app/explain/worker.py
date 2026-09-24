"""Background queue that asks Ollama for explanations one pair at a time.

Pages never wait for the language model: every suggestion gets a template
explanation immediately, and this worker replaces it when the model replies.
One request at a time keeps a school laptop responsive.
"""

import json
import logging
import queue
import threading

from .. import db
from . import ollama

log = logging.getLogger("verbund.explain")
_queue: "queue.Queue[int]" = queue.Queue()
_thread: threading.Thread | None = None
_lock = threading.Lock()


def start() -> None:
    global _thread
    with _lock:
        if _thread is None or not _thread.is_alive():
            _thread = threading.Thread(target=_run, name="verbund-explainer", daemon=True)
            _thread.start()


def enqueue(match_ids: list[int]) -> bool:
    """Queue explanations. Returns False (and queues nothing) if Ollama is not ready."""
    if not match_ids:
        return True
    info = ollama.status()
    if not (info["reachable"] and info["model_installed"]):
        return False
    with db.session() as conn:
        conn.executemany(
            "UPDATE matches SET explanation_status = 'queued' WHERE id = ?",
            [(mid,) for mid in match_ids],
        )
    start()
    for mid in match_ids:
        _queue.put(mid)
    return True


def pending() -> int:
    return _queue.qsize()


def _run() -> None:
    while True:
        match_id = _queue.get()
        try:
            process(match_id)
        except Exception:  # keep the worker alive whatever happens
            log.exception("Explanation failed for match %s", match_id)
        finally:
            _queue.task_done()


def process(match_id: int) -> None:
    with db.session() as conn:
        row = conn.execute(
            """SELECT m.id, m.score, m.breakdown, n.first_name AS new_first, b.first_name AS buddy_first
               FROM matches m
               JOIN students n ON n.id = m.new_student_id
               JOIN students b ON b.id = m.buddy_id
               WHERE m.id = ?""",
            (match_id,),
        ).fetchone()
    if row is None:
        return
    prompt = ollama.build_prompt(row["new_first"], row["buddy_first"], row["score"], json.loads(row["breakdown"]))
    text = ollama.generate(prompt)
    with db.session() as conn:
        if text:
            conn.execute(
                "UPDATE matches SET explanation = ?, explanation_status = 'ollama' WHERE id = ?",
                (text, match_id),
            )
        else:
            conn.execute(
                "UPDATE matches SET explanation_status = 'template' "
                "WHERE id = ? AND explanation_status = 'queued'",
                (match_id,),
            )
