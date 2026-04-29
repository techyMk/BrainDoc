from __future__ import annotations
from models import Trace
from core import embeddings, vectorstore, llm
from .base import Result, answer_with_context, to_sources, rrf_merge


_REWRITE_SYS = (
    "Given a user question, produce 3 alternative phrasings that could "
    "retrieve relevant documents. Cover different angles: one specific, "
    "one broad, one keyword-heavy. Return a JSON array of 3 strings."
)


def _rewrite(question: str) -> list[str]:
    try:
        data = llm.complete_json(
            system=_REWRITE_SYS,
            messages=[{"role": "user", "content": question}],
            max_tokens=400,
            temperature=0.3,
        )
        if isinstance(data, list):
            return [str(x) for x in data if isinstance(x, str)][:3]
    except Exception:
        pass
    return []


def run(
    question: str,
    history: list[dict],
    top_k: int,
    docs: list[str] | None = None,
) -> Result:
    trace: list[Trace] = []
    queries = [question] + _rewrite(question)
    trace.append(Trace(
        step="rewrite",
        detail=f"expanded into {len(queries)} queries",
        data={"queries": queries},
    ))

    rankings = []
    for q in queries:
        qemb = embeddings.embed_query(q)
        hits = vectorstore.query(qemb, top_k=top_k * 2, allowed_docs=docs)
        rankings.append(hits)

    fused = rrf_merge(rankings)[:top_k]
    trace.append(Trace(
        step="fuse",
        detail=f"merged {len(queries)} rankings → {len(fused)}",
        data={"ids": [f["id"] for f in fused]},
    ))

    answer = answer_with_context(question, fused, history)
    trace.append(Trace(step="generate", detail=f"{len(answer)} chars"))
    return Result(answer=answer, sources=to_sources(fused), trace=trace)
