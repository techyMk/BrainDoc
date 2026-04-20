from __future__ import annotations
import json
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


def _store_path() -> Path:
    p = Path(settings.chroma_path).resolve()
    p.mkdir(parents=True, exist_ok=True)
    return p / "index.pkl"


_state: dict | None = None


def _empty() -> dict:
    return {"ids": [], "texts": [], "metas": [], "vectors": np.zeros((0, 0), dtype=np.float32)}


def _load() -> dict:
    p = _store_path()
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


def _get() -> dict:
    global _state
    if _state is None:
        _state = _load()
    return _state


def _save():
    p = _store_path()
    with p.open("wb") as f:
        pickle.dump(_get(), f)


def reset():
    global _state
    _state = _empty()
    _save()


def _normalize(v: np.ndarray) -> np.ndarray:
    norms = np.linalg.norm(v, axis=1, keepdims=True)
    norms = np.where(norms == 0.0, 1.0, norms)
    return v / norms


def add(chunks: list[Chunk], embeddings: list[list[float]]):
    if not chunks:
        return
    st = _get()
    new_vecs = np.asarray(embeddings, dtype=np.float32)
    new_vecs = _normalize(new_vecs)
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
    _save()


def query(embedding: list[float], top_k: int = 10) -> list[dict]:
    st = _get()
    n = len(st["ids"])
    if n == 0:
        return []
    q = np.asarray(embedding, dtype=np.float32).reshape(1, -1)
    q = _normalize(q)
    sims = (st["vectors"] @ q.T).ravel()
    k = min(top_k, n)
    if k >= n:
        idx = np.argsort(-sims)
    else:
        part = np.argpartition(-sims, k - 1)[:k]
        idx = part[np.argsort(-sims[part])]
    out = []
    for i in idx[:k]:
        out.append({
            "id": st["ids"][i],
            "text": st["texts"][i],
            "meta": st["metas"][i],
            "score": float(sims[i]),
        })
    return out


def get_all() -> list[dict]:
    st = _get()
    return [
        {"id": i, "text": t, "meta": m}
        for i, t, m in zip(st["ids"], st["texts"], st["metas"])
    ]


def count() -> int:
    return len(_get()["ids"])
