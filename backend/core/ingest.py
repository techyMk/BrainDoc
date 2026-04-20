from __future__ import annotations
import re
from pathlib import Path
from config import settings
from core import embeddings, vectorstore, graph_store
from core.llm import complete_json
from core.vectorstore import Chunk


SUPPORTED_EXTS = {".md", ".txt", ".pdf"}


def _chunk_markdown(text: str, max_chars: int = 900, overlap: int = 150) -> list[str]:
    # Split on blank lines first to keep paragraphs/headings together, then
    # greedily pack into windows of `max_chars` characters.
    parts = re.split(r"\n\s*\n", text.strip())
    chunks: list[str] = []
    buf = ""
    for p in parts:
        p = p.strip()
        if not p:
            continue
        if len(buf) + len(p) + 2 <= max_chars:
            buf = (buf + "\n\n" + p) if buf else p
        else:
            if buf:
                chunks.append(buf)
            if len(p) <= max_chars:
                buf = p
            else:
                # oversized paragraph: hard-wrap
                for i in range(0, len(p), max_chars - overlap):
                    chunks.append(p[i : i + max_chars])
                buf = ""
    if buf:
        chunks.append(buf)
    # Add sliding overlap between adjacent chunks
    if overlap > 0 and len(chunks) > 1:
        with_overlap = [chunks[0]]
        for i in range(1, len(chunks)):
            prev_tail = chunks[i - 1][-overlap:]
            with_overlap.append(prev_tail + "\n" + chunks[i])
        chunks = with_overlap
    return chunks


def _title(text: str, fallback: str) -> str:
    for line in text.splitlines():
        s = line.strip()
        if s.startswith("# "):
            return s[2:].strip()
    return fallback


def _read_file(path: Path) -> str:
    ext = path.suffix.lower()
    if ext in (".md", ".txt"):
        return path.read_text(encoding="utf-8", errors="ignore")
    if ext == ".pdf":
        from pypdf import PdfReader
        reader = PdfReader(str(path))
        parts: list[str] = []
        for page in reader.pages:
            try:
                parts.append(page.extract_text() or "")
            except Exception:
                continue
        return "\n\n".join(p.strip() for p in parts if p.strip())
    raise ValueError(f"unsupported extension: {ext}")


def _already_ingested_stems() -> set[str]:
    stems: set[str] = set()
    for row in vectorstore.get_all():
        cid = row["id"]
        if "::" in cid:
            stems.add(cid.split("::", 1)[0])
    return stems


_TRIPLE_SYS = (
    "You extract a compact knowledge graph from a passage. "
    "Return a JSON array of objects with keys `subject`, `relation`, `object`. "
    "Use short canonical names (e.g., 'Claude', 'Anthropic', 'Transformer'). "
    "Prefer concrete, factual relations like 'developed_by', 'is_a', "
    "'introduced_in', 'used_for', 'part_of'. Return at most 8 triples. "
    "If nothing is extractable, return []."
)


def _extract_triples(text: str) -> list[dict]:
    try:
        data = complete_json(
            system=_TRIPLE_SYS,
            messages=[{"role": "user", "content": text}],
            max_tokens=700,
            temperature=0.0,
        )
        if isinstance(data, list):
            return [t for t in data if isinstance(t, dict)]
    except Exception:
        return []
    return []


def _list_files(docs_dir: Path) -> list[Path]:
    files: list[Path] = []
    for ext in SUPPORTED_EXTS:
        files.extend(docs_dir.glob(f"*{ext}"))
    return sorted(files)


def _ingest_files(files: list[Path]) -> int:
    """Embed + index a list of files. Returns number of chunks added."""
    all_chunks: list[Chunk] = []
    for f in files:
        try:
            text = _read_file(f)
        except Exception:
            continue
        if not text.strip():
            continue
        title = _title(text, f.stem)
        for i, piece in enumerate(_chunk_markdown(text)):
            cid = f"{f.stem}::chunk-{i:03d}"
            all_chunks.append(
                Chunk(id=cid, text=piece, doc=f.name, title=title, chunk_index=i)
            )

    BATCH = 64
    for i in range(0, len(all_chunks), BATCH):
        batch = all_chunks[i : i + BATCH]
        embs = embeddings.embed([c.text for c in batch], input_type="document")
        vectorstore.add(batch, embs)

    for c in all_chunks:
        triples = _extract_triples(c.text)
        if triples:
            graph_store.add_triples(triples, source_doc=c.doc, source_chunk=c.id)
    graph_store.save()
    return len(all_chunks)


def run(reset: bool = False, only: list[Path] | None = None) -> dict:
    """Ingest documents.

    - reset=True wipes the index and graph first and ingests everything in
      docs_dir.
    - only=[...] ingests exactly those paths (used for the upload endpoint).
    - otherwise: incremental — ingests files in docs_dir whose stem is not
      already present in the index.
    """
    if reset:
        vectorstore.reset()
        graph_store.reset()

    docs_dir = settings.docs_dir

    if only is not None:
        files = [Path(p) for p in only]
    else:
        all_files = _list_files(docs_dir)
        if reset:
            files = all_files
        else:
            known = _already_ingested_stems()
            files = [f for f in all_files if f.stem not in known]

    chunks_added = _ingest_files(files) if files else 0

    gs = graph_store.stats()
    return {
        "ingested_docs": len(files),
        "chunks": vectorstore.count(),
        "chunks_added": chunks_added,
        "graph_nodes": gs["nodes"],
        "graph_edges": gs["edges"],
    }
