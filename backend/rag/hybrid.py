from __future__ import annotations
from models import Trace
from core import embeddings, vectorstore
from core.bm25 import BM25Index
from .base import Result, answer_with_context, to_sources, rrf_merge


def run(
    question: str,
    history: list[dict],
    top_k: int,
    docs: list[str] | None = None,
) -> Result:
    trace: list[Trace] = []
    qemb = embeddings.embed_query(question)
    dense = vectorstore.query(qemb, top_k=top_k * 2, allowed_docs=docs)
    trace.append(Trace(step="dense", detail=f"{len(dense)} hits"))

    bm25 = BM25Index(vectorstore.get_all(allowed_docs=docs))
    sparse = bm25.search(question, top_k=top_k * 2)
    trace.append(Trace(step="bm25", detail=f"{len(sparse)} hits"))

    fused = rrf_merge([dense, sparse])[:top_k]
    trace.append(Trace(
        step="rrf",
        detail=f"merged to {len(fused)} with Reciprocal Rank Fusion",
        data={"ids": [f["id"] for f in fused]},
    ))
    answer = answer_with_context(question, fused, history)
    trace.append(Trace(step="generate", detail=f"{len(answer)} chars"))
    return Result(answer=answer, sources=to_sources(fused), trace=trace)
