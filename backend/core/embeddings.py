from __future__ import annotations
import voyageai
from config import settings


_client: voyageai.Client | None = None


def client() -> voyageai.Client:
    global _client
    if _client is None:
        if not settings.voyage_api_key:
            raise RuntimeError("VOYAGE_API_KEY is not set")
        _client = voyageai.Client(api_key=settings.voyage_api_key)
    return _client


def embed(texts: list[str], input_type: str = "document") -> list[list[float]]:
    if not texts:
        return []
    res = client().embed(
        texts=texts,
        model=settings.voyage_embed_model,
        input_type=input_type,
    )
    return res.embeddings


def embed_query(text: str) -> list[float]:
    return embed([text], input_type="query")[0]


def rerank(query: str, documents: list[str], top_k: int) -> list[tuple[int, float]]:
    """Return list of (original_index, relevance_score), sorted best-first."""
    if not documents:
        return []
    res = client().rerank(
        query=query,
        documents=documents,
        model=settings.voyage_rerank_model,
        top_k=min(top_k, len(documents)),
    )
    return [(r.index, r.relevance_score) for r in res.results]
