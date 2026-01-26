# About Project

Chainlit UI that connects to the Northstar RAG API. It sends user prompts to `/llm/test` and renders the model output in a clean, branded chat experience.

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

The app calls the Northstar API `POST /llm/test`.

Set these environment variables (optional):

```bash
export API_BASE_URL="http://127.0.0.1:8000"
export LLM_TEST_PATH="/llm/test"
export LLM_SYSTEM_PROMPT="You are a helpful assistant."
```

You can also place them in a `.env` file at the project root.

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
