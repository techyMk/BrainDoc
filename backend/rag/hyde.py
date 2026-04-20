from __future__ import annotations
from models import Trace
from core import embeddings, vectorstore, llm
from .base import Result, answer_with_context, to_sources


_HYDE_SYS = (
    "Write a concise, plausible paragraph that would answer the user's "
    "question as if you had perfect knowledge. Do not hedge or say you "
    "are unsure. The paragraph will be used as a search query, so be "
    "rich in relevant terminology. 3-5 sentences, no preamble."
)


def _hypothesize(question: str) -> str:
    try:
        return llm.complete(
            system=_HYDE_SYS,
            messages=[{"role": "user", "content": question}],
            max_tokens=350,
            temperature=0.4,
        )
    except Exception:
        return question


def run(question: str, history: list[dict], top_k: int) -> Result:
    trace: list[Trace] = []
    hypothetical = _hypothesize(question)
    trace.append(Trace(
        step="hypothesize",
        detail="generated hypothetical answer for embedding",
        data={"hypothetical": hypothetical},
    ))

    hemb = embeddings.embed_query(hypothetical)
    hits = vectorstore.query(hemb, top_k=top_k)
    trace.append(Trace(
        step="retrieve",
        detail=f"searched with hypothetical → {len(hits)} hits",
        data={"ids": [h["id"] for h in hits]},
    ))

    answer = answer_with_context(question, hits, history)
    trace.append(Trace(step="generate", detail=f"{len(answer)} chars"))
    return Result(answer=answer, sources=to_sources(hits), trace=trace)
