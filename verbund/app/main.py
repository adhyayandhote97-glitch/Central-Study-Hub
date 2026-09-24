"""Verbund: explainable buddy matching for new students.

Run with:  uvicorn app.main:app --reload   (from the verbund/ folder)
"""

import os
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.staticfiles import StaticFiles
from starlette.exceptions import HTTPException as StarletteHTTPException

from . import config, db
from .demo import seed
from .explain import worker
from .routes import router
from .web import render

# Everything (fonts, icons, scripts) is served from this app, so the browser
# can be told to load nothing from anywhere else.
CSP = ("default-src 'self'; img-src 'self' data:; style-src 'self'; script-src 'self'; "
       "font-src 'self'; connect-src 'self'; form-action 'self'; frame-ancestors 'none'; base-uri 'self'")


@asynccontextmanager
async def lifespan(app: FastAPI):
    db.init_db()
    if os.environ.get("VERBUND_SEED_DEMO", "1") != "0":
        seed(reset=False)  # only fills an empty database
    if config.OLLAMA_ENABLED:
        worker.start()
    yield


app = FastAPI(title="Verbund", lifespan=lifespan, docs_url=None, redoc_url=None, openapi_url=None)
app.mount("/static", StaticFiles(directory=config.APP_DIR / "static"), name="static")
app.include_router(router)


@app.middleware("http")
async def security_headers(request: Request, call_next):
    response = await call_next(request)
    response.headers.setdefault("Content-Security-Policy", CSP)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["Referrer-Policy"] = "same-origin"
    response.headers["X-Frame-Options"] = "DENY"
    return response


@app.exception_handler(StarletteHTTPException)
async def not_found(request: Request, exc: StarletteHTTPException):
    message = "That page does not exist." if exc.status_code == 404 else "Something went wrong."
    return render(request, "error.html", {"code": exc.status_code, "message": message}, exc.status_code)
