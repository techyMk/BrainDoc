from __future__ import annotations
import re
import time
from pathlib import Path
from fastapi import FastAPI, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware

from config import settings
from models import (
    ChatRequest, ChatResponse, IngestRequest, IngestResponse, ModeInfo,
    SuggestionsResponse, UploadResponse, UploadedFile,
)
from core import ingest, vectorstore, graph_store, suggest
from core.ingest import SUPPORTED_EXTS
import rag as rag_pipelines


_SAFE_NAME = re.compile(r"[^A-Za-z0-9._-]+")


def _safe_filename(name: str) -> str:
    stem = Path(name).stem
    ext = Path(name).suffix.lower()
    stem = _SAFE_NAME.sub("-", stem).strip("-._") or "document"
    return f"{stem}{ext}"


app = FastAPI(title="BrainDoc", version="0.1.0")

_allowed_origins = list({
    settings.allowed_origin,
    "http://localhost:3000",
    *[o.strip() for o in settings.allowed_origin.split(",") if o.strip()],
})
app.add_middleware(
    CORSMiddleware,
    allow_origins=_allowed_origins,
    allow_origin_regex=r"https://.*\.vercel\.app",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


MODES: list[ModeInfo] = [
    ModeInfo(
        id="naive",
        name="Naive",
        tagline="Embed, search, answer.",
        description="Dense vector search over chunk embeddings, then stuff the top matches into the prompt. The baseline.",
        icon="zap",
    ),
    ModeInfo(
        id="hybrid",
        name="Hybrid",
        tagline="Dense + BM25 with RRF.",
        description="Combine semantic vectors with classical keyword scoring using Reciprocal Rank Fusion. Recovers exact-term hits dense search misses.",
        icon="shuffle",
    ),
    ModeInfo(
        id="rerank",
        name="Rerank",
        tagline="Over-retrieve, then rescore.",
        description="Fetch a wide candidate set with cheap vector search, then let the Voyage cross-encoder rerank for precision.",
        icon="target",
    ),
    ModeInfo(
        id="multiquery",
        name="Multi-Query",
        tagline="Ask the same thing three ways.",
        description="Rewrite the question into several diverse variants, retrieve for each, and fuse the rankings.",
        icon="git-branch",
    ),
    ModeInfo(
        id="hyde",
        name="HyDE",
        tagline="Hallucinate first, search with it.",
        description="Generate a hypothetical answer, embed *that*, and use it as the retrieval query. Often beats raw queries on short or abstract questions.",
        icon="sparkles",
    ),
    ModeInfo(
        id="graph",
        name="Graph",
        tagline="Walk the knowledge graph.",
        description="Extract entities from the question, traverse the KG built at ingest, and pull the chunks where they are mentioned. Best for multi-hop questions.",
        icon="network",
    ),
    ModeInfo(
        id="agentic",
        name="Agentic",
        tagline="Claude picks the tools.",
        description="Claude acts as a planner that calls vector, keyword, and graph tools adaptively and decides when it has enough evidence.",
        icon="bot",
    ),
    ModeInfo(
        id="corrective",
        name="Corrective",
        tagline="Grade, then retry if weak.",
        description="Retrieve, grade each passage for relevance with an LLM, and if the evidence is thin, rewrite the query and try again.",
        icon="shield-check",
    ),
]


@app.get("/api/health")
def health():
    return {
        "ok": True,
        "has_llm_key": bool(settings.groq_api_key),
        "has_voyage_key": bool(settings.voyage_api_key),
        "llm_provider": "groq",
        "llm_model": settings.groq_model,
        "chunks": vectorstore.count(),
        "graph": graph_store.stats(),
    }


@app.get("/api/modes", response_model=list[ModeInfo])
def modes():
    return MODES


@app.get("/api/suggestions", response_model=SuggestionsResponse)
def suggestions(refresh: bool = False):
    data = suggest.get(force=refresh)
    return SuggestionsResponse(**data)


@app.post("/api/ingest", response_model=IngestResponse)
def ingest_endpoint(req: IngestRequest):
    if not settings.voyage_api_key:
        raise HTTPException(500, "VOYAGE_API_KEY is not configured")
    try:
        res = ingest.run(reset=req.reset)
    except Exception as e:
        raise HTTPException(500, f"ingest failed: {e}") from e
    return IngestResponse(**res)


@app.post("/api/upload", response_model=UploadResponse)
async def upload(files: list[UploadFile] = File(...)):
    if not settings.voyage_api_key:
        raise HTTPException(500, "VOYAGE_API_KEY is not configured")

    docs_dir = settings.docs_dir
    saved_paths: list[Path] = []
    uploaded: list[UploadedFile] = []
    skipped: list[str] = []

    for up in files:
        name = up.filename or "document"
        ext = Path(name).suffix.lower()
        if ext not in SUPPORTED_EXTS:
            skipped.append(f"{name} (unsupported extension)")
            continue

        safe = _safe_filename(name)
        dest = docs_dir / safe
        # If a file with that name exists, append a numeric suffix
        if dest.exists():
            i = 2
            stem, ext2 = dest.stem, dest.suffix
            while (docs_dir / f"{stem}-{i}{ext2}").exists():
                i += 1
            dest = docs_dir / f"{stem}-{i}{ext2}"

        try:
            content = await up.read()
        except Exception as e:
            skipped.append(f"{name} (read error: {e})")
            continue
        if not content:
            skipped.append(f"{name} (empty)")
            continue

        dest.write_bytes(content)
        saved_paths.append(dest)
        uploaded.append(UploadedFile(
            filename=name, saved_as=dest.name, bytes=len(content),
        ))

    if not saved_paths:
        # Still return a response so the frontend can show which were skipped
        gs = graph_store.stats()
        return UploadResponse(
            uploaded=[],
            skipped=skipped,
            ingest=IngestResponse(
                ingested_docs=0,
                chunks=vectorstore.count(),
                chunks_added=0,
                graph_nodes=gs["nodes"],
                graph_edges=gs["edges"],
            ),
        )

    try:
        res = ingest.run(reset=False, only=saved_paths)
    except Exception as e:
        # Roll back the written files so the user can retry
        for p in saved_paths:
            try:
                p.unlink()
            except Exception:
                pass
        raise HTTPException(500, f"ingest failed: {e}") from e

    return UploadResponse(
        uploaded=uploaded,
        skipped=skipped,
        ingest=IngestResponse(**res),
    )


@app.post("/api/chat", response_model=ChatResponse)
def chat(req: ChatRequest):
    if not settings.groq_api_key or not settings.voyage_api_key:
        raise HTTPException(500, "API keys are not configured on the server")
    if vectorstore.count() == 0:
        raise HTTPException(409, "The index is empty — run POST /api/ingest first")

    start = time.perf_counter()
    try:
        result = rag_pipelines.run(
            mode=req.mode,
            question=req.message,
            history=req.history,
            top_k=req.top_k,
        )
    except Exception as e:
        raise HTTPException(500, f"pipeline failed: {e}") from e
    elapsed = int((time.perf_counter() - start) * 1000)
    return ChatResponse(
        answer=result.answer,
        mode=req.mode,
        sources=result.sources,
        trace=result.trace,
        elapsed_ms=elapsed,
    )


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host=settings.host, port=settings.port, reload=True)
