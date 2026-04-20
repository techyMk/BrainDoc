from __future__ import annotations
import json
from typing import Any
from groq import Groq
from config import settings


_client: Groq | None = None


def client() -> Groq:
    global _client
    if _client is None:
        if not settings.groq_api_key:
            raise RuntimeError("GROQ_API_KEY is not set")
        _client = Groq(api_key=settings.groq_api_key)
    return _client


def _to_groq_messages(system: str, messages: list[dict]) -> list[dict]:
    out: list[dict] = [{"role": "system", "content": system}]
    for m in messages:
        if not isinstance(m, dict):
            continue
        role = m.get("role")
        if role not in ("user", "assistant", "tool"):
            continue
        out.append({"role": role, "content": str(m.get("content", ""))})
    return out


def complete(
    system: str,
    messages: list[dict],
    max_tokens: int = 1024,
    temperature: float = 0.2,
) -> str:
    res = client().chat.completions.create(
        model=settings.groq_model,
        messages=_to_groq_messages(system, messages),
        max_tokens=max_tokens,
        temperature=temperature,
    )
    content = res.choices[0].message.content or ""
    return content.strip()


def complete_json(
    system: str,
    messages: list[dict],
    max_tokens: int = 1024,
    temperature: float = 0.0,
) -> Any:
    raw = complete(
        system=system + "\n\nReply with a single JSON value and nothing else.",
        messages=messages,
        max_tokens=max_tokens,
        temperature=temperature,
    )
    raw = raw.strip()
    if raw.startswith("```"):
        raw = raw.strip("`")
        if raw.lower().startswith("json"):
            raw = raw[4:]
    start = min(
        (i for i in (raw.find("{"), raw.find("[")) if i >= 0),
        default=-1,
    )
    if start > 0:
        raw = raw[start:]
    end = max(raw.rfind("}"), raw.rfind("]"))
    if end >= 0:
        raw = raw[: end + 1]
    return json.loads(raw)
