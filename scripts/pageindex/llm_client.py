"""
Anthropic-only LLM client for PageIndex.

Ported from PageIndexAlt's multi-provider client, simplified to use
only the Anthropic API (consistent with project's cloud-only strategy).

Requires: ANTHROPIC_API_KEY env var (shared with Genkit pipeline).
"""

import os
import time
import asyncio
from dotenv import load_dotenv

load_dotenv()

MAX_RETRIES = 10
RETRY_DELAY = 1


def completion(messages: list[dict], model: str = None, temperature: float = 0) -> str:
    """Synchronous LLM completion via Anthropic. Returns the assistant's response text."""
    import anthropic
    model = model or os.getenv("ANTHROPIC_MODEL", "claude-haiku-4-5-20251001")
    client = anthropic.Anthropic()

    # Extract system message if present (Anthropic API uses separate system param)
    system = next((m["content"] for m in messages if m["role"] == "system"), None)
    user_msgs = [m for m in messages if m["role"] != "system"]

    for attempt in range(MAX_RETRIES):
        try:
            resp = client.messages.create(
                model=model,
                max_tokens=4096,
                temperature=temperature,
                system=system or "",
                messages=user_msgs,
            )
            return resp.content[0].text
        except Exception as e:
            if attempt < MAX_RETRIES - 1:
                time.sleep(RETRY_DELAY)
                continue
            raise RuntimeError(f"Anthropic call failed after {MAX_RETRIES} attempts: {e}")


async def acompletion(messages: list[dict], model: str = None, temperature: float = 0) -> str:
    """Async LLM completion. Runs sync version in a thread to avoid blocking."""
    loop = asyncio.get_event_loop()
    return await loop.run_in_executor(None, completion, messages, model, temperature)


def token_estimate(text: str) -> int:
    """Rough token count estimate. ~4 chars per token for English."""
    return len(text) // 4
