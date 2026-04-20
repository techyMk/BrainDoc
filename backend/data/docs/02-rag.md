# Retrieval-Augmented Generation (RAG)

Retrieval-Augmented Generation is a pattern for grounding large language
models in external knowledge. Rather than relying purely on the model's
parametric memory, a RAG system retrieves relevant passages from a corpus
at query time and passes them to the model as context.

## The eight flavors of RAG

Modern RAG architectures have diverged into several distinct styles:

1. **Naive RAG** — the baseline: embed chunks, do nearest-neighbor search,
   stuff the top results into the prompt.
2. **Hybrid RAG** — combine dense vector search with sparse keyword search
   (typically BM25) and fuse the rankings, often with Reciprocal Rank
   Fusion. This recovers exact-match terms that dense models miss.
3. **Rerank RAG** — over-retrieve with a cheap first-stage retriever, then
   rescore the candidates with a heavier cross-encoder or reranking model.
4. **Multi-query RAG** — use an LLM to rewrite the user query into several
   diverse sub-queries, retrieve for each, and deduplicate the union.
5. **HyDE** — Hypothetical Document Embeddings. Instead of embedding the
   query, ask the LLM to hallucinate a plausible answer document, embed
   that, and search with it. Works well when queries are short or abstract.
6. **Graph RAG** — build a knowledge graph of entities and relationships at
   ingestion time, then retrieve by traversing the graph from entities
   mentioned in the query. Good for multi-hop questions.
7. **Agentic RAG** — an LLM acts as a router or planner that dynamically
   chooses retrieval tools, reformulates queries, and decides when to stop.
8. **Corrective / Self-RAG** — retrieve, then have the LLM grade each
   passage for relevance. If the evidence is weak, the system refines the
   query and retrieves again before answering.

## Chunking

Most RAG systems split documents into overlapping chunks of 200–800 tokens.
Smaller chunks improve retrieval precision but lose context; larger chunks
preserve context but dilute the signal. Semantic or structural chunking
(by heading, paragraph, or sentence boundaries) usually outperforms naive
fixed-length chunking.

## Evaluation

Common RAG metrics include retrieval recall@k, answer faithfulness (does
the response stay grounded in the sources?), and answer relevance. The
Ragas framework is widely used for automated evaluation.
