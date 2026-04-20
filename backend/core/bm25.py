from __future__ import annotations
import re
from rank_bm25 import BM25Okapi


_TOKEN_RE = re.compile(r"[A-Za-z0-9]+")


def tokenize(text: str) -> list[str]:
    return [t.lower() for t in _TOKEN_RE.findall(text)]


class BM25Index:
    def __init__(self, docs: list[dict]):
        self.docs = docs
        self.tokens = [tokenize(d["text"]) for d in docs]
        self.bm25 = BM25Okapi(self.tokens) if self.tokens else None

    def search(self, query: str, top_k: int = 10) -> list[dict]:
        if not self.bm25:
            return []
        scores = self.bm25.get_scores(tokenize(query))
        idx = sorted(range(len(scores)), key=lambda i: scores[i], reverse=True)
        out = []
        max_score = max(scores) if len(scores) else 1.0
        for i in idx[:top_k]:
            if scores[i] <= 0:
                continue
            d = self.docs[i]
            out.append({
                "id": d["id"],
                "text": d["text"],
                "meta": d["meta"],
                "score": float(scores[i] / max_score) if max_score else 0.0,
            })
        return out
