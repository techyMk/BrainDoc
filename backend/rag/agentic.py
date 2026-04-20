from __future__ import annotations
import json
from models import Trace
from core import embeddings, vectorstore, graph_store
from core.bm25 import BM25Index
from core.llm import client as llm_client
from config import settings
from .base import Result, answer_with_context, to_sources


TOOLS = [
    {
        "type": "function",
        "function": {
            "name": "vector_search",
            "description": (
                "Dense semantic search over the document corpus. Best for "
                "conceptual questions and paraphrase."
            ),
            "parameters": {
                "type": "object",
                "properties": {
                    "query": {"type": "string"},
                    "k": {"type": "integer", "default": 5},
                },
                "required": ["query"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "keyword_search",
            "description": (
                "BM25 keyword search. Best for exact terms, acronyms, product "
                "names, and rare tokens."
            ),
            "parameters": {
                "type": "object",
                "properties": {
                    "query": {"type": "string"},
                    "k": {"type": "integer", "default": 5},
                },
                "required": ["query"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "graph_lookup",
            "description": (
                "Look up entities in the knowledge graph and return facts "
                "(triples) about them plus the chunks that mention them. "
                "Best for relational or multi-hop questions."
            ),
            "parameters": {
                "type": "object",
                "properties": {
                    "entities": {"type": "array", "items": {"type": "string"}},
                    "hops": {"type": "integer", "default": 1},
                },
                "required": ["entities"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "answer",
            "description": (
                "Produce the final answer once you have gathered enough "
                "evidence. Pass the ids of the sources you used."
            ),
            "parameters": {
                "type": "object",
                "properties": {
                    "source_ids": {
                        "type": "array",
                        "items": {"type": "string"},
                    },
                    "rationale": {"type": "string"},
                },
                "required": ["source_ids"],
            },
        },
    },
]


AGENT_SYS = (
    "You are a retrieval planner. Decide which of the available tools to "
    "call — possibly multiple, possibly in sequence — to gather evidence "
    "for the user's question. When you have enough, call `answer` with "
    "the ids of the sources you will cite. Be efficient: 1–3 tool calls "
    "is plenty for most questions."
)


def _run_tool(name: str, args: dict, collected: dict[str, dict]):
    if name == "vector_search":
        q = args.get("query", "")
        k = int(args.get("k", 5))
        emb = embeddings.embed_query(q)
        hits = vectorstore.query(emb, top_k=k)
        for h in hits:
            collected[h["id"]] = h
        return [{"id": h["id"], "title": (h.get("meta") or {}).get("title"),
                 "snippet": h["text"][:200]} for h in hits]
    if name == "keyword_search":
        q = args.get("query", "")
        k = int(args.get("k", 5))
        idx = BM25Index(vectorstore.get_all())
        hits = idx.search(q, top_k=k)
        for h in hits:
            collected[h["id"]] = h
        return [{"id": h["id"], "title": (h.get("meta") or {}).get("title"),
                 "snippet": h["text"][:200]} for h in hits]
    if name == "graph_lookup":
        ents = args.get("entities", []) or []
        hops = int(args.get("hops", 1))
        known = graph_store.node_names()
        canon = {n.lower(): n for n in known}
        matched = [canon[e.lower()] for e in ents if e.lower() in canon]
        rels = graph_store.describe_subgraph(matched, hops=hops)
        chunk_ids = graph_store.subgraph_chunks(matched, hops=hops)
        all_chunks = {c["id"]: c for c in vectorstore.get_all()}
        hit_chunks = [all_chunks[i] for i in chunk_ids if i in all_chunks][:8]
        for h in hit_chunks:
            collected[h["id"]] = h
        return {
            "matched_entities": matched,
            "relationships": rels[:20],
            "chunk_ids": [h["id"] for h in hit_chunks],
        }
    return {"error": f"unknown tool {name}"}


def _parse_args(raw: str) -> dict:
    if not raw:
        return {}
    try:
        data = json.loads(raw)
        return data if isinstance(data, dict) else {}
    except Exception:
        return {}


def run(question: str, history: list[dict], top_k: int) -> Result:
    trace: list[Trace] = []
    collected: dict[str, dict] = {}
    cited_ids: list[str] = []
    rationale = ""

    messages: list[dict] = [{"role": "system", "content": AGENT_SYS}]
    # Include only the tail of history to stay compact
    for m in history[-6:]:
        if isinstance(m, dict) and m.get("role") in ("user", "assistant"):
            messages.append({"role": m["role"], "content": str(m.get("content", ""))})
    messages.append({"role": "user", "content": question})

    did_answer = False
    for step in range(5):
        res = llm_client().chat.completions.create(
            model=settings.groq_model,
            messages=messages,
            tools=TOOLS,
            tool_choice="auto",
            max_tokens=900,
            temperature=0.1,
        )
        msg = res.choices[0].message
        tool_calls = list(msg.tool_calls or [])

        if not tool_calls:
            trace.append(Trace(step=f"agent-step-{step}", detail="finished without tool"))
            text = (msg.content or "").strip()
            if text:
                docs = list(collected.values())
                return Result(answer=text, sources=to_sources(docs), trace=trace)
            break

        # Record the assistant's tool-call message so the follow-up can reference it
        messages.append({
            "role": "assistant",
            "content": msg.content or "",
            "tool_calls": [
                {
                    "id": tc.id,
                    "type": "function",
                    "function": {
                        "name": tc.function.name,
                        "arguments": tc.function.arguments or "{}",
                    },
                }
                for tc in tool_calls
            ],
        })

        for tc in tool_calls:
            name = tc.function.name
            args = _parse_args(tc.function.arguments or "{}")
            trace.append(Trace(
                step=f"agent-step-{step}",
                detail=f"call {name}",
                data={"args": args},
            ))
            if name == "answer":
                cited_ids = list(args.get("source_ids", []) or [])
                rationale = str(args.get("rationale", ""))
                did_answer = True
                result = {"status": "ok"}
            else:
                result = _run_tool(name, args, collected)
            messages.append({
                "role": "tool",
                "tool_call_id": tc.id,
                "content": json.dumps(result)[:6000],
            })

        if did_answer:
            break

    if cited_ids:
        final_docs = [collected[i] for i in cited_ids if i in collected]
        if not final_docs:
            final_docs = list(collected.values())[:top_k]
    else:
        final_docs = list(collected.values())[:top_k]

    extra = f"The planner's rationale: {rationale}" if rationale else ""
    answer = answer_with_context(question, final_docs, history, extra_system=extra)
    trace.append(Trace(step="generate", detail=f"final answer with {len(final_docs)} sources"))
    return Result(answer=answer, sources=to_sources(final_docs), trace=trace)
