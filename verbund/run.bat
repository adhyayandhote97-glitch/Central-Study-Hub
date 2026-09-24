@echo off
rem Start Verbund on http://localhost:8000 (Windows)
cd /d "%~dp0"
if not exist .venv (
  py -3 -m venv .venv
  .venv\Scripts\pip install -r requirements.txt
)
.venv\Scripts\uvicorn app.main:app --host 127.0.0.1 --port 8000 %*
