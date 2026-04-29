from __future__ import annotations
import pickle
from dataclasses import dataclass
from pathlib import Path
import numpy as np
from config import settings


@dataclass
class Chunk:
    id: str
    text: str
    doc: str
    title: str
    chunk_index: int


_states: dict[str, dict] = {}


def _empty() -> dict:
    return {
        "ids": [],
        "texts": [],
        "metas": [],
        "vectors": np.zeros((0, 0), dtype=np.float32),
    }


def _path(user_id: str) -> Path:
    return settings.user_index_path(user_id)


def _load(user_id: str) -> dict:
    p = _path(user_id)
    if not p.exists():
        return _empty()
    try:
        with p.open("rb") as f:
            data = pickle.load(f)
        if not isinstance(data, dict) or "vectors" not in data:
            return _empty()
        return data
    except Exception:
        return _empty()


def _get(user_id: str) -> dict:
    if user_id not in _states:
        _states[user_id] = _load(user_id)
    return _states[user_id]


def _save(user_id: str):
    p = _path(user_id)
    p.parent.mkdir(parents=True, exist_ok=True)
    with p.open("wb") as f:
        pickle.dump(_get(user_id), f)


def reset(user_id: str):
    _states[user_id] = _empty()
    _save(user_id)


def _normalize(v: np.ndarray) -> np.ndarray:
    norms = np.linalg.norm(v, axis=1, keepdims=True)
    norms = np.where(norms == 0.0, 1.0, norms)
    return v / norms


def add(user_id: str, chunks: list[Chunk], embeddings: list[list[float]]):
    if not chunks:
        return
    st = _get(user_id)
    new_vecs = _normalize(np.asarray(embeddings, dtype=np.float32))
    if st["vectors"].size == 0:
        st["vectors"] = new_vecs
    else:
        st["vectors"] = np.vstack([st["vectors"], new_vecs])
    st["ids"].extend(c.id for c in chunks)
    st["texts"].extend(c.text for c in chunks)
    st["metas"].extend(
        {"doc": c.doc, "title": c.title, "chunk_index": c.chunk_index}
        for c in chunks
    )
    _save(user_id)


def query(
    user_id: str,
    embedding: list[float],
    top_k: int = 10,
    allowed_docs: list[str] | None = None,
) -> list[dict]:
    st = _get(user_id)
    n = len(st["ids"])
    if n == 0:
        return []
    q = _normalize(np.asarray(embedding, dtype=np.float32).reshape(1, -1))
    sims = (st["vectors"] @ q.T).ravel()

    if allowed_docs is not None:
        allowed = set(allowed_docs)
        mask = np.array(
            [(st["metas"][i].get("doc") in allowed) for i in range(n)],
            dtype=bool,
        )
        if not mask.any():
            return []
        sims = np.where(mask, sims, -np.inf)

    k = min(top_k, n)
    part = np.argpartition(-sims, min(k - 1, n - 1))[:k]
    idx = part[np.argsort(-sims[part])]
    out = []
    for i in idx[:k]:
        if not np.isfinite(sims[i]):
            continue
        out.append({
            "id": st["ids"][i],
            "text": st["texts"][i],
            "meta": st["metas"][i],
            "score": float(sims[i]),
        })
    return out


def get_all(user_id: str, allowed_docs: list[str] | None = None) -> list[dict]:
    st = _get(user_id)
    rows = [
        {"id": i, "text": t, "meta": m}
        for i, t, m in zip(st["ids"], st["texts"], st["metas"])
    ]
    if allowed_docs is None:
        return rows
    allowed = set(allowed_docs)
    return [r for r in rows if (r.get("meta") or {}).get("doc") in allowed]


def count(user_id: str) -> int:
    return len(_get(user_id)["ids"])


def list_docs(user_id: str) -> list[dict]:
    by_doc: dict[str, dict] = {}
    for m in _get(user_id)["metas"]:
        d = (m or {}).get("doc")
        if not d:
            continue
        if d not in by_doc:
            by_doc[d] = {"doc": d, "title": m.get("title", d), "chunks": 0}
        by_doc[d]["chunks"] += 1
    return sorted(by_doc.values(), key=lambda x: x["doc"])
