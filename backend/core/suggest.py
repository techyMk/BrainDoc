from __future__ import annotations
import random
from core import vectorstore, llm


DEFAULTS = [
    "What is the Claude model family?",
    "Explain the 8 flavors of RAG",
    "Who invented the transformer and what problem did it solve?",
    "Compare HNSW, IVF, and ScaNN for vector search",
    "How does agentic RAG differ from plain RAG?",
]


_SYS = (
    "You are helping design starter prompts for a chatbot that answers "
    "questions grounded in a specific set of documents. Given excerpts "
    "from that corpus, produce 5 concrete questions a user would "
    "realistically ask — the kind that have clear, findable answers in "
    "these documents. Rules:\n"
    "- Write real questions, 4–12 words each, ending with a question mark.\n"
    "- Do not mention 'the document', 'the text', or 'according to'. "
    "Ask directly about the subject matter.\n"
    "- Mix the types: at least one fact lookup, one comparison or how-to, "
    "one list/enumeration.\n"
    "- Prefer specific terms (names, numbers, concepts) from the excerpts "
    "so retrieval actually has something to match.\n"
    "Return a JSON array of exactly 5 strings and nothing else."
)


_cache: dict = {"key": None, "value": DEFAULTS, "docs": []}


def _signature() -> tuple[int, tuple[str, ...]]:
    docs: list[str] = []
    seen: set[str] = set()
    for row in vectorstore.get_all():
        meta = row.get("meta") or {}
        d = meta.get("doc") or meta.get("title") or ""
        if d and d not in seen:
            seen.add(d)
            docs.append(d)
    return (vectorstore.count(), tuple(sorted(docs)))


def _sample_chunks(max_chunks: int = 8, per_chunk_chars: int = 400) -> tuple[list[str], list[str]]:
    rows = vectorstore.get_all()
    if not rows:
        return [], []
    # One chunk per distinct doc first (for coverage), then fill randomly
    by_doc: dict[str, list[dict]] = {}
    for r in rows:
        d = (r.get("meta") or {}).get("doc", "")
        by_doc.setdefault(d, []).append(r)

    picked: list[dict] = []
    for d, chunks in by_doc.items():
        picked.append(random.choice(chunks))
    if len(picked) < max_chunks:
        remaining = [r for r in rows if r not in picked]
        random.shuffle(remaining)
        picked.extend(remaining[: max_chunks - len(picked)])
    picked = picked[:max_chunks]

    excerpts = []
    for p in picked:
        title = (p.get("meta") or {}).get("title") or (p.get("meta") or {}).get("doc") or ""
        body = p["text"][:per_chunk_chars].strip()
        excerpts.append(f"[{title}]\n{body}")
    docs = sorted({(r.get("meta") or {}).get("doc", "") for r in picked if r.get("meta")})
    return excerpts, [d for d in docs if d]


def get(force: bool = False) -> dict:
    key = _signature()
    if not force and _cache["key"] == key:
        return {"suggestions": _cache["value"], "based_on": _cache["docs"]}

    count, _docs = key
    if count == 0:
        result = {"suggestions": DEFAULTS, "based_on": []}
        _cache.update(key=key, value=DEFAULTS, docs=[])
        return result

    excerpts, docs = _sample_chunks()
    if not excerpts:
        result = {"suggestions": DEFAULTS, "based_on": []}
        _cache.update(key=key, value=DEFAULTS, docs=[])
        return result

    payload = "\n\n---\n\n".join(excerpts)
    try:
        data = llm.complete_json(
            system=_SYS,
            messages=[{"role": "user", "content": payload}],
            max_tokens=500,
            temperature=0.5,
        )
        items = [s for s in data if isinstance(s, str)] if isinstance(data, list) else []
        items = [s.strip() for s in items if s.strip()][:5]
        if len(items) < 3:
            items = DEFAULTS
    except Exception:
        items = DEFAULTS

    _cache.update(key=key, value=items, docs=docs)
    return {"suggestions": items, "based_on": docs}
