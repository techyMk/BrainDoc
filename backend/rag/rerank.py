from __future__ import annotations
from models import Trace
from core import embeddings, vectorstore
from .base import Result, answer_with_context, to_sources


def run(
    user_id: str,
    question: str,
    history: list[dict],
    top_k: int,
    docs: list[str] | None = None,
) -> Result:
    trace: list[Trace] = []
    qemb = embeddings.embed_query(question)

    candidates = vectorstore.query(
        user_id, qemb, top_k=max(top_k * 4, 20), allowed_docs=docs,
    )
    trace.append(Trace(step="retrieve", detail=f"first stage: {len(candidates)} candidates"))

    docs_text = [c["text"] for c in candidates]
    reranked = embeddings.rerank(question, docs_text, top_k=top_k)
    trace.append(Trace(
        step="rerank",
        detail=f"Voyage rerank → top {len(reranked)}",
        data={"order": [i for i, _ in reranked]},
    ))

    out = []
    for idx, score in reranked:
        c = dict(candidates[idx])
        c["score"] = float(score)
        out.append(c)

    answer = answer_with_context(question, out, history)
    trace.append(Trace(step="generate", detail=f"{len(answer)} chars"))
    return Result(answer=answer, sources=to_sources(out), trace=trace)
