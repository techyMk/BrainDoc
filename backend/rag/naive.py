from __future__ import annotations
from models import Trace
from core import embeddings, vectorstore
from .base import Result, answer_with_context, to_sources


def run(question: str, history: list[dict], top_k: int) -> Result:
    trace: list[Trace] = []
    qemb = embeddings.embed_query(question)
    trace.append(Trace(step="embed", detail=f"embedded query ({len(qemb)} dims)"))
    hits = vectorstore.query(qemb, top_k=top_k)
    trace.append(Trace(
        step="retrieve",
        detail=f"top-{len(hits)} dense hits",
        data={"ids": [h["id"] for h in hits]},
    ))
    answer = answer_with_context(question, hits, history)
    trace.append(Trace(step="generate", detail=f"{len(answer)} chars"))
    return Result(answer=answer, sources=to_sources(hits), trace=trace)
