import os

import pytest

# Tests never talk to a real Ollama server.
os.environ["OLLAMA_ENABLED"] = "0"
os.environ["VERBUND_SEED_DEMO"] = "0"

from app import config, db  # noqa: E402

config.OLLAMA_ENABLED = False


@pytest.fixture
def fresh_db(tmp_path):
    db.configure(tmp_path / "test.db")
    db.init_db()
    yield tmp_path / "test.db"


@pytest.fixture
def demo_db(fresh_db):
    from app.demo import seed
    seed(reset=True)
    yield fresh_db


@pytest.fixture
def client(demo_db):
    from fastapi.testclient import TestClient

    from app.main import app
    with TestClient(app) as c:
        yield c
