import os
import re
import uuid

import chainlit as cl
import httpx
from dotenv import load_dotenv

load_dotenv()

API_BASE_URL = os.getenv("API_BASE_URL", "http://127.0.0.1:5001").rstrip("/")
LLM_TEST_PATH = os.getenv("LLM_TEST_PATH", "/ai/query")
DEFAULT_SYSTEM_PROMPT = os.getenv("LLM_SYSTEM_PROMPT", "You are a helpful assistant.")
DEBUG_MODE = os.getenv("DEBUG_MODE", "false").strip().lower() in ("1", "true", "yes", "on")


async def call_llm_test(prompt: str, session_id: str) -> dict:
    url = f"{API_BASE_URL}{LLM_TEST_PATH}"
    payload = {"prompt": prompt, "system": DEFAULT_SYSTEM_PROMPT, "session_id": session_id}
    async with httpx.AsyncClient(timeout=60) as client:
        resp = await client.post(url, json=payload)
        if resp.status_code >= 400:
            detail = resp.text
            try:
                detail = resp.json()
            except Exception:
                pass
            raise RuntimeError(f"API error {resp.status_code}: {detail}")
        return resp.json()

def strip_memory_blocks(text: str) -> str:
    if not text:
        return text
    cleaned = re.sub(r"<memory>.*?</memory>", "", text, flags=re.DOTALL)
    if "<memory>" in cleaned and "</memory>" not in cleaned:
        before, after = cleaned.split("<memory>", 1)
        if "\n" in after:
            after = after.split("\n", 1)[1]
            cleaned = before + after
        else:
            cleaned = before
    return cleaned.strip()


def bold_ordered_list_names(text: str) -> str:
    if not text:
        return text

    lines = text.splitlines()
    in_code_block = False

    for idx, line in enumerate(lines):
        stripped = line.strip()
        if stripped.startswith("```"):
            in_code_block = not in_code_block
            continue
        if in_code_block:
            continue

        match = re.match(r"^(\s*\d+\.\s+)(.+)$", line)
        if not match:
            continue

        prefix, item = match.groups()
        separator_match = re.search(r"\s(?:-|—|:|\|)\s", item)
        if separator_match:
            name = item[: separator_match.start()].rstrip()
            rest = item[separator_match.start() :]
        else:
            name = item.rstrip()
            rest = ""

        if name.startswith("**") and name.endswith("**"):
            continue

        lines[idx] = f"{prefix}**{name}**{rest}"

    return "\n".join(lines)


@cl.on_chat_start
async def on_chat_start() -> None:
    session_id = f"session-{uuid.uuid4()}"
    cl.user_session.set("session_id", session_id)
    await cl.Message(
        content=(
            "**Hello — I’m your Northstar AI Travel Assistant. "
            "Ask me about destinations, hotels, amenities, and travel insights.**"
        )
    ).send()
    if DEBUG_MODE:
        await cl.Message(content=f"API base: {API_BASE_URL}").send()
        await cl.Message(content=f"Session: {session_id}").send()


@cl.on_message
async def on_message(message: cl.Message) -> None:
    user_text = message.content.strip()
    if not user_text:
        await cl.Message(content="Say something and I'll respond.").send()
        return

    session_id = cl.user_session.get("session_id")
    if not session_id:
        session_id = f"session-{uuid.uuid4()}"
        cl.user_session.set("session_id", session_id)

    status_msg = cl.Message(content="Thinking...")
    await status_msg.send()
    try:
        data = await call_llm_test(user_text, session_id)
    except Exception as exc:
        status_msg.content = f"Request failed: {exc}"
        await status_msg.update()
        return

    output = strip_memory_blocks((data.get("output") or "").strip())
    output = bold_ordered_list_names(output)
    model = data.get("model")
    usage = data.get("usage")

    if output:
        status_msg.content = output
    else:
        status_msg.content = "No output returned from /ai/query."
    await status_msg.update()

    if DEBUG_MODE and (model or usage):
        meta = {"model": model, "usage": usage}
        await cl.Message(content=f"Meta: {meta}").send()
