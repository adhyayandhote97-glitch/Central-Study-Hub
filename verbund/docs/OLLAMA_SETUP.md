# Setting up the local AI (Ollama + Qwen 2.5 Coder 7B)

Verbund works without any AI. The weighted algorithm makes every suggestion, and every
pairing gets a plain-language summary built straight from the score. Ollama adds one thing: a
more natural explanation paragraph, written by a language model that runs **on your own
computer**. No student data is sent anywhere.

This takes about 15 minutes, most of it waiting for a 4.7 GB download.

---

## What you need

| | Minimum | Comfortable |
|---|---|---|
| Memory (RAM) | 8 GB | 16 GB |
| Free disk space | 6 GB | 10 GB |
| Computer | Windows 10/11, macOS 12+, or Linux | Any with a recent GPU or Apple Silicon (M1 or later) |

On a laptop with 8 GB of RAM the 7B model works but is slow (20–60 seconds per explanation).
If that is too slow, use the smaller model in step 6.

---

## Step 1: Install Ollama

- **Windows:** go to <https://ollama.com/download>, download the Windows installer, run it.
- **macOS:** go to <https://ollama.com/download>, download the app, drag it into Applications, open it once.
- **Linux:** in a terminal run `curl -fsSL https://ollama.com/install.sh | sh`

After installing, Ollama runs in the background. You'll see a llama icon in the Windows system
tray or the macOS menu bar. It listens on `http://localhost:11434`.

## Step 2: Check it is running

Open a terminal (Windows: **PowerShell**; macOS: **Terminal**) and run:

```bash
ollama --version
```

If you see a version number, it is installed. If you get "command not found", restart the
terminal (or the computer) so it picks up the new program.

## Step 3: Download the model used in the report

```bash
ollama pull qwen2.5-coder:7b
```

This downloads about 4.7 GB once. When it finishes, check it is there:

```bash
ollama list
```

You should see `qwen2.5-coder:7b` in the list.

## Step 4: Try the model by itself

```bash
ollama run qwen2.5-coder:7b "In one sentence, why do new students benefit from a buddy?"
```

The first answer can take up to a minute because the model is being loaded into memory. Later
answers are faster. Type `/bye` to leave if it opens a chat.

## Step 5: Start Verbund and check the connection

1. Start Verbund as usual (`run.bat` on Windows, `./run.sh` on macOS/Linux).
2. Open <http://localhost:8000/settings> and look at the **Local AI** panel:
   - **"Ollama is running and qwen2.5-coder:7b is ready"**: everything works.
   - **"Ollama is running, but … is not downloaded"**: do step 3 again, and check the spelling matches exactly.
   - **"Ollama is not running"**: open the Ollama app (or run `ollama serve` in a terminal and leave it open).
3. Go to **Matching** and click **Run matching again**. The message says "The local AI is writing
   explanations now".
4. Open any pairing in **Review**. Under "Why this pair" you'll first see *"The local AI is writing a
   fuller explanation"*. The page refreshes itself when it is ready, and the label changes to
   *"Written by local AI (qwen2.5-coder:7b)"*.

You can also click **Ask the local AI to explain** on any single pairing.

## Step 6 (optional): Change the model

Copy `verbund/.env.example` to `verbund/.env` and set `OLLAMA_MODEL`, for example:

```ini
OLLAMA_MODEL=qwen2.5:7b      # general-purpose version of Qwen 2.5, usually better at plain English
# OLLAMA_MODEL=qwen2.5:3b    # smaller and much faster on 8 GB laptops
```

Then `ollama pull` that model and restart Verbund. The model name shows on every explanation, so
your evaluation records which model wrote it.

> **For your report:** Qwen 2.5 *Coder* is tuned for writing code. The general version
> (`qwen2.5:7b`) is the same size and usually writes smoother plain English. Either keep Coder and
> justify it in one line, or switch and note the change in Criteria C/D.

---

## How Verbund uses the model (for Criteria C/D)

1. The weighted algorithm calculates the score and the per-factor breakdown. The AI never
   changes a score or a pairing.
2. Verbund sends Ollama only the two **first names**, the score, and the breakdown (points per
   factor and the shared items). It never sends surnames, grades, homerooms or comments. The
   prompt is in `app/explain/ollama.py` (`build_prompt`).
3. The model is told to write 2–3 plain sentences, use only the facts given, and never guess
   about culture, nationality or personality. The temperature is low (0.2), so the wording
   stays consistent.
4. The reply is checked. Empty, very long, or markdown-formatted answers are rejected, and the
   summary template is kept instead.
5. Requests go one at a time in the background, so pages never wait for the AI.

## Settings reference (`verbund/.env`)

| Setting | Default | Meaning |
|---|---|---|
| `OLLAMA_ENABLED` | `1` | `0` turns the AI off completely |
| `OLLAMA_URL` | `http://localhost:11434` | where Ollama is listening |
| `OLLAMA_MODEL` | `qwen2.5-coder:7b` | which downloaded model to use |
| `OLLAMA_TIMEOUT` | `90` | seconds to wait for one explanation before keeping the template |

## Troubleshooting

| Problem | Fix |
|---|---|
| Settings says "not running" but the Ollama app is open | Open <http://localhost:11434> in a browser. It should say "Ollama is running". If not, quit Ollama and open it again. |
| Explanations stay on "writing…" for minutes | The model is too big for your RAM. Use `qwen2.5:3b` (step 6), or raise `OLLAMA_TIMEOUT`. |
| `ollama pull` fails part-way | Run the same command again. It resumes where it stopped. |
| The explanation mentions something odd | Click **Ask the local AI again**. If it keeps happening, note it for your Criteria D evaluation (Specification 7). |
| You want to turn the AI off for a test | Set `OLLAMA_ENABLED=0` in `.env` and restart. Everything else keeps working. |
