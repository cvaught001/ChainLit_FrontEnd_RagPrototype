import chainlit as cl


@cl.on_chat_start
async def on_chat_start() -> None:
    await cl.Message(
        content=(
            "Hi! I'm your Chainlit starter. "
            "Ask me anything and I'll echo it back with a tiny twist."
        )
    ).send()


@cl.on_message
async def on_message(message: cl.Message) -> None:
    user_text = message.content.strip()
    if not user_text:
        await cl.Message(content="Say something and I'll respond.").send()
        return

    await cl.Message(content=f"You said: {user_text}").send()
