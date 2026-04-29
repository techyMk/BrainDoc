from __future__ import annotations
from models import RagMode
from .naive import run as run_naive
from .hybrid import run as run_hybrid
from .rerank import run as run_rerank
from .multiquery import run as run_multiquery
from .hyde import run as run_hyde
from .graph import run as run_graph
from .agentic import run as run_agentic
from .corrective import run as run_corrective


RUNNERS = {
    "naive": run_naive,
    "hybrid": run_hybrid,
    "rerank": run_rerank,
    "multiquery": run_multiquery,
    "hyde": run_hyde,
    "graph": run_graph,
    "agentic": run_agentic,
    "corrective": run_corrective,
}


def run(
    mode: RagMode,
    question: str,
    history: list[dict],
    top_k: int,
    docs: list[str] | None = None,
):
    fn = RUNNERS[mode]
    return fn(question=question, history=history, top_k=top_k, docs=docs)
