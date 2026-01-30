# About Project

Chainlit UI that connects to the Northstar RAG API. It sends user prompts to `/ai/query` and renders the model output in a clean, branded chat experience.

## Version

Current release: `1.0.0_stable`

## What this does

- Provides a lightweight chat UI for the Northstar LLM endpoint
- Reads API settings from environment variables
- Uses a custom avatar and light theme for branding

## Quick start

```bash
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python -m chainlit run app.py -w --port 8001
```

Open the URL printed by Chainlit (for example `http://localhost:8001`).

## API configuration

The app calls the Northstar API `POST /ai/query`.

Set these environment variables (optional):

```bash
export API_BASE_URL="http://127.0.0.1:8000"
export LLM_TEST_PATH="/ai/query"
export LLM_SYSTEM_PROMPT="You are a helpful assistant."
```

You can also place them in a `.env` file at the project root.

## Run with Docker (local)

This repo includes a Dockerfile and `docker-compose.yml` that connects to the API container on the shared network `hotel_rag_net`.

### 1) Create the shared network (one time)

```bash
docker network create hotel_rag_net
```

### 2) Start the API (from the API repo)

```bash
docker compose up -d
```

### 3) Build and run Chainlit (from this repo)

```bash
docker compose up --build
```

Then open `http://localhost:8001`.

If your API is running on the host instead of Docker, set:

```bash
API_BASE_URL="http://host.docker.internal:8000"
```

## Branding and theme

- Avatar: `public/images/northstar-icon_chat.png`
- Welcome image: `public/images/Northstar-Travel-Group.svg`
- Theme: `public/theme.json`

## Files to know

- `app.py` Chainlit app logic and API call
- `.chainlit/config.toml` UI settings
- `public/theme.json` color palette
- `public/images/` static assets

## Troubleshooting

- If port 8000 is already in use, start Chainlit on another port (e.g., `--port 8001`).
- If you see blank UI assets, verify the app is running inside the project venv.
