# Chainlit Python Front-End Starter

A minimal Chainlit app you can extend with your own LLM logic.

## Quick start

```bash
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
chainlit run app.py -w
```

Then open the local URL printed by Chainlit in your browser.

## What to edit

- `app.py` is the chat UI behavior.
- Add your model calls inside `on_message`.
