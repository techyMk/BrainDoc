from __future__ import annotations
import json
from pathlib import Path
import networkx as nx
from config import settings


_graphs: dict[str, nx.MultiDiGraph] = {}


def _path(user_id: str) -> Path:
    return settings.user_graph_path(user_id)


def graph(user_id: str) -> nx.MultiDiGraph:
    if user_id not in _graphs:
        _graphs[user_id] = _load(user_id)
    return _graphs[user_id]


def _load(user_id: str) -> nx.MultiDiGraph:
    p = _path(user_id)
    g = nx.MultiDiGraph()
    if not p.exists():
        return g
    data = json.loads(p.read_text(encoding="utf-8"))
    for n in data.get("nodes", []):
        g.add_node(n["id"], **{k: v for k, v in n.items() if k != "id"})
    for e in data.get("edges", []):
        g.add_edge(e["source"], e["target"], **{
            k: v for k, v in e.items() if k not in ("source", "target")
        })
    return g


def save(user_id: str):
    g = graph(user_id)
    data = {
        "nodes": [{"id": n, **g.nodes[n]} for n in g.nodes],
        "edges": [
            {"source": u, "target": v, **d}
            for u, v, d in g.edges(data=True)
        ],
    }
    p = _path(user_id)
    p.parent.mkdir(parents=True, exist_ok=True)
    p.write_text(json.dumps(data, indent=2), encoding="utf-8")


def reset(user_id: str):
    _graphs[user_id] = nx.MultiDiGraph()
    save(user_id)


def add_triples(user_id: str, triples: list[dict], source_doc: str, source_chunk: str):
    g = graph(user_id)
    for t in triples:
        s = str(t.get("subject", "")).strip()
        r = str(t.get("relation", "")).strip()
        o = str(t.get("object", "")).strip()
        if not (s and r and o):
            continue
        for n in (s, o):
            if n not in g.nodes:
                g.add_node(n, mentions=[])
            m = g.nodes[n].setdefault("mentions", [])
            if source_chunk not in m:
                m.append(source_chunk)
        g.add_edge(s, o, relation=r, doc=source_doc, chunk=source_chunk)


def node_names(user_id: str) -> list[str]:
    return list(graph(user_id).nodes)


def subgraph_chunks(user_id: str, entities: list[str], hops: int = 1) -> list[str]:
    g = graph(user_id)
    seen_nodes: set[str] = set()
    frontier = [n for n in entities if n in g.nodes]
    seen_nodes.update(frontier)
    for _ in range(hops):
        nxt = []
        for n in frontier:
            nxt.extend(g.successors(n))
            nxt.extend(g.predecessors(n))
        new = [n for n in nxt if n not in seen_nodes]
        seen_nodes.update(new)
        frontier = new
    chunks: set[str] = set()
    for n in seen_nodes:
        for c in g.nodes[n].get("mentions", []):
            chunks.add(c)
    for u, v, d in g.edges(data=True):
        if u in seen_nodes or v in seen_nodes:
            c = d.get("chunk")
            if c:
                chunks.add(c)
    return list(chunks)


def describe_subgraph(user_id: str, entities: list[str], hops: int = 1) -> list[str]:
    g = graph(user_id)
    lines: list[str] = []
    visited_edges = set()
    frontier = [n for n in entities if n in g.nodes]
    for _ in range(hops):
        nxt = []
        for n in frontier:
            for _, v, key, d in g.out_edges(n, keys=True, data=True):
                k = (n, v, d.get("relation"))
                if k in visited_edges:
                    continue
                visited_edges.add(k)
                lines.append(f"{n} --[{d.get('relation')}]--> {v}")
                nxt.append(v)
            for u, _, key, d in g.in_edges(n, keys=True, data=True):
                k = (u, n, d.get("relation"))
                if k in visited_edges:
                    continue
                visited_edges.add(k)
                lines.append(f"{u} --[{d.get('relation')}]--> {n}")
                nxt.append(u)
        frontier = nxt
    return lines


def stats(user_id: str) -> dict:
    g = graph(user_id)
    return {"nodes": g.number_of_nodes(), "edges": g.number_of_edges()}
