To start the server

First make sure .env is configured correctly

Then run this:

```bash
uv sync # for installing dependencies

uv run uvicorn main:app --reload --host 0.0.0.0 --port 8000

# or

source .venv/bin/activate
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

If you are on Windows ask ChatGPT how to activate virtual environment on Windows.
I think uv still works though
