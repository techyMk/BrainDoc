from typing import Literal, Optional
from pydantic import BaseModel, Field


RagMode = Literal[
    "naive",
    "hybrid",
    "rerank",
    "multiquery",
    "hyde",
    "graph",
    "agentic",
    "corrective",
]


class ChatRequest(BaseModel):
    message: str
    mode: RagMode = "naive"
    history: list[dict] = Field(default_factory=list)
    top_k: int = 5
    docs: list[str] | None = None  # None or empty = use all


class Source(BaseModel):
    id: str
    doc: str
    title: str
    snippet: str
    score: float
    meta: dict = Field(default_factory=dict)


class Trace(BaseModel):
    step: str
    detail: str
    data: Optional[dict] = None


class ChatResponse(BaseModel):
    answer: str
    mode: RagMode
    sources: list[Source]
    trace: list[Trace]
    elapsed_ms: int


class IngestRequest(BaseModel):
    reset: bool = False


class IngestResponse(BaseModel):
    ingested_docs: int
    chunks: int
    chunks_added: int = 0
    graph_nodes: int
    graph_edges: int


class UploadedFile(BaseModel):
    filename: str
    saved_as: str
    bytes: int


class UploadResponse(BaseModel):
    uploaded: list[UploadedFile]
    skipped: list[str]
    ingest: IngestResponse


class SuggestionsResponse(BaseModel):
    suggestions: list[str]
    based_on: list[str] = Field(default_factory=list)


class ModeInfo(BaseModel):
    id: RagMode
    name: str
    tagline: str
    description: str
    icon: str


class DocInfo(BaseModel):
    doc: str
    title: str
    chunks: int
