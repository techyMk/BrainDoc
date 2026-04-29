from __future__ import annotations
from models import Trace
from core import embeddings, vectorstore, graph_store, llm
from .base import Result, answer_with_context, to_sources


_ENTITY_SYS = (
    "Extract the key entities (people, organizations, products, concepts) "
    "from the user's question. Return a JSON array of canonical names "
    "(strings) — at most 6. If none, return []."
)


def _extract_entities(question: str, known: list[str]) -> list[str]:
    hint = ""
    if known:
        sample = known[:40]
        hint = f"\n\nKnown graph nodes (pick from these when possible): {sample}"
    try:
        data = llm.complete_json(
            system=_ENTITY_SYS + hint,
            messages=[{"role": "user", "content": question}],
            max_tokens=300,
            temperature=0.0,
        )
        if isinstance(data, list):
            return [str(x) for x in data if isinstance(x, str)]
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
    known = graph_store.node_names()
    entities = _extract_entities(question, known)
    # Case-insensitive normalization against known nodes
    canon = {n.lower(): n for n in known}
    entities_matched = []
    for e in entities:
        m = canon.get(e.lower())
        if m:
            entities_matched.append(m)
    trace.append(Trace(
        step="entities",
        detail=f"extracted {len(entities)} → matched {len(entities_matched)} nodes",
        data={"extracted": entities, "matched": entities_matched},
    ))

    rel_lines = graph_store.describe_subgraph(entities_matched, hops=2)
    trace.append(Trace(
        step="graph-traverse",
        detail=f"collected {len(rel_lines)} relationships",
        data={"edges": rel_lines[:20]},
    ))

    chunk_ids = graph_store.subgraph_chunks(entities_matched, hops=2)
    # Pull the actual chunks from the vector store, scoped to allowed docs
    all_chunks = {c["id"]: c for c in vectorstore.get_all(allowed_docs=docs)}
    graph_docs = [all_chunks[i] for i in chunk_ids if i in all_chunks]
    graph_docs = graph_docs[: top_k * 2]
    trace.append(Trace(
        step="graph-chunks",
        detail=f"pulled {len(graph_docs)} chunks via graph mentions",
    ))

    # Fallback: if graph yielded nothing, backfill with dense
    if not graph_docs:
        qemb = embeddings.embed_query(question)
        graph_docs = vectorstore.query(qemb, top_k=top_k, allowed_docs=docs)
        trace.append(Trace(step="fallback", detail="no graph hits — using dense"))

    # Rerank by relevance to the question
    if graph_docs and len(graph_docs) > top_k:
        order = embeddings.rerank(question, [d["text"] for d in graph_docs], top_k=top_k)
        graph_docs = [dict(graph_docs[i], score=float(s)) for i, s in order]
    else:
        for d in graph_docs:
            d.setdefault("score", 0.5)

    graph_hint = ""
    if rel_lines:
        top_rels = "\n".join(rel_lines[:15])
        graph_hint = (
            "You also have a list of relevant graph relationships between "
            "entities. Use them to reason about multi-hop connections.\n\n"
            f"GRAPH:\n{top_rels}"
        )
    answer = answer_with_context(question, graph_docs, history, extra_system=graph_hint)
    trace.append(Trace(step="generate", detail=f"{len(answer)} chars"))
    return Result(answer=answer, sources=to_sources(graph_docs), trace=trace)
