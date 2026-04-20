from __future__ import annotations
from dataclasses import dataclass, field
from models import Source, Trace
from core import llm


@dataclass
class Result:
    answer: str
    sources: list[Source]
    trace: list[Trace] = field(default_factory=list)


ANSWER_SYS = (
    "You are a helpful assistant answering questions grounded in the provided "
    "CONTEXT passages. Rules:\n"
    "1. Use only the context and conversation history to answer.\n"
    "2. Cite sources inline as [S1], [S2], ... matching the numbering of the "
    "context blocks.\n"
    "3. If the context does not contain the answer, say so plainly.\n"
    "4. Be concise and direct. Do not invent facts."
)


def format_context(docs: list[dict]) -> str:
    blocks = []
    for i, d in enumerate(docs, start=1):
        title = (d.get("meta") or {}).get("title") or d.get("meta", {}).get("doc", "doc")
        blocks.append(f"[S{i}] ({title})\n{d['text']}")
    return "\n\n".join(blocks)


def answer_with_context(
    question: str,
    docs: list[dict],
    history: list[dict],
    extra_system: str = "",
) -> str:
    ctx = format_context(docs) if docs else "(no context retrieved)"
    system = ANSWER_SYS + ("\n\n" + extra_system if extra_system else "")
    messages = [*history, {
        "role": "user",
        "content": f"CONTEXT:\n{ctx}\n\nQUESTION: {question}",
    }]
    return llm.complete(
        system=system,
        messages=messages,
        max_tokens=900,
        temperature=0.2,
    )


def to_sources(docs: list[dict]) -> list[Source]:
    out = []
    for d in docs:
        meta = d.get("meta") or {}
        snippet = d["text"]
        if len(snippet) > 280:
            snippet = snippet[:277] + "..."
        out.append(Source(
            id=d["id"],
            doc=meta.get("doc", ""),
            title=meta.get("title", ""),
            snippet=snippet,
            score=float(d.get("score", 0.0)),
            meta={k: v for k, v in meta.items() if k not in ("doc", "title")},
        ))
    return out


def rrf_merge(rankings: list[list[dict]], k: int = 60) -> list[dict]:
    """Reciprocal Rank Fusion of multiple ranked lists keyed by doc id."""
    scores: dict[str, float] = {}
    by_id: dict[str, dict] = {}
    for ranking in rankings:
        for rank, d in enumerate(ranking):
            scores[d["id"]] = scores.get(d["id"], 0.0) + 1.0 / (k + rank + 1)
            by_id[d["id"]] = d
    merged = [{"id": i, "text": by_id[i]["text"], "meta": by_id[i]["meta"], "score": s}
              for i, s in scores.items()]
    merged.sort(key=lambda x: x["score"], reverse=True)
    return merged
