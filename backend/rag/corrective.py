from __future__ import annotations
from models import Trace
from core import embeddings, vectorstore, llm
from .base import Result, answer_with_context, to_sources


_GRADE_SYS = (
    "You are grading retrieved passages for relevance to a user question. "
    "For each passage, output a score: "
    "`relevant` (directly answers the question), "
    "`related` (on-topic but indirect), or "
    "`off` (not useful). "
    "Return a JSON array of the same length as the input, each item "
    "`{\"id\": <id>, \"grade\": <string>, \"reason\": <short>}`."
)


_REWRITE_SYS = (
    "Rewrite the user's question to make it easier to retrieve. Expand "
    "abbreviations, add likely synonyms and canonical terminology, and "
    "remove conversational filler. Return just the rewritten question."
)


def _grade(question: str, hits: list[dict]) -> list[dict]:
    payload = [{"id": h["id"], "text": h["text"][:700]} for h in hits]
    try:
        data = llm.complete_json(
            system=_GRADE_SYS,
            messages=[{
                "role": "user",
                "content": f"QUESTION: {question}\n\nPASSAGES:\n{payload}",
            }],
            max_tokens=800,
            temperature=0.0,
        )
        if isinstance(data, list):
            return data
    except Exception:
        pass
    return [{"id": h["id"], "grade": "related", "reason": "grader failed"} for h in hits]


def _rewrite(question: str) -> str:
    try:
        return llm.complete(
            system=_REWRITE_SYS,
            messages=[{"role": "user", "content": question}],
            max_tokens=200,
            temperature=0.1,
        )
    except Exception:
        return question


def run(
    question: str,
    history: list[dict],
    top_k: int,
    docs: list[str] | None = None,
) -> Result:
    trace: list[Trace] = []

    qemb = embeddings.embed_query(question)
    hits = vectorstore.query(qemb, top_k=top_k * 2, allowed_docs=docs)
    trace.append(Trace(step="retrieve", detail=f"initial dense: {len(hits)} hits"))

    grades = _grade(question, hits)
    by_id = {g.get("id"): g for g in grades if isinstance(g, dict)}
    relevant = [h for h in hits if by_id.get(h["id"], {}).get("grade") == "relevant"]
    related = [h for h in hits if by_id.get(h["id"], {}).get("grade") == "related"]
    trace.append(Trace(
        step="grade",
        detail=f"{len(relevant)} relevant, {len(related)} related",
        data={"grades": [by_id.get(h["id"], {}) for h in hits]},
    ))

    # Corrective step: if too few relevant passages, rewrite and retrieve again
    if len(relevant) < max(2, top_k // 2):
        rewritten = _rewrite(question)
        trace.append(Trace(
            step="correct",
            detail="weak evidence — rewriting query",
            data={"rewritten": rewritten},
        ))
        qemb2 = embeddings.embed_query(rewritten)
        extra = vectorstore.query(qemb2, top_k=top_k * 2, allowed_docs=docs)
        grades2 = _grade(question, extra)
        by_id2 = {g.get("id"): g for g in grades2 if isinstance(g, dict)}
        new_rel = [h for h in extra if by_id2.get(h["id"], {}).get("grade") == "relevant"]
        new_related = [h for h in extra if by_id2.get(h["id"], {}).get("grade") == "related"]
        # dedupe by id
        seen = {h["id"] for h in relevant}
        for h in new_rel:
            if h["id"] not in seen:
                relevant.append(h)
                seen.add(h["id"])
        for h in new_related:
            if h["id"] not in {r["id"] for r in related}:
                related.append(h)
        trace.append(Trace(
            step="correct-retrieve",
            detail=f"second pass added {len(new_rel)} relevant, {len(new_related)} related",
        ))

    final = (relevant + related)[:top_k]

    if not final:
        answer = (
            "I couldn't find evidence in the indexed documents that answers "
            "this question. You could try rephrasing or ingesting more docs."
        )
        trace.append(Trace(step="generate", detail="no-evidence short-circuit"))
        return Result(answer=answer, sources=[], trace=trace)

    answer = answer_with_context(question, final, history)
    trace.append(Trace(step="generate", detail=f"{len(answer)} chars"))
    return Result(answer=answer, sources=to_sources(final), trace=trace)
