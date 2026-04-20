# Vector Search and Embeddings

A vector embedding is a dense numerical representation of text, images, or
other data, such that semantically similar inputs produce vectors that are
close together in the embedding space. Embeddings are typically produced
by a neural network — for text, usually a transformer-based encoder.

## Similarity metrics

The three most common similarity functions are:

- **Cosine similarity** — the dot product of two unit-normalized vectors.
  Equivalent to the cosine of the angle between them. This is by far the
  most common choice for text retrieval.
- **Dot product** — cheaper to compute if vectors are not normalized, and
  some embedding models are explicitly trained for it.
- **Euclidean distance** — the L2 norm of the difference. Less common for
  semantic retrieval because magnitude can encode irrelevant information.

## Approximate nearest neighbor (ANN) search

For corpora beyond a few hundred thousand vectors, brute-force search
becomes expensive. ANN indexes trade a little recall for a large speedup.
Popular ANN algorithms include:

- **HNSW** (Hierarchical Navigable Small World) — graph-based, excellent
  recall-speed tradeoff, used by Pinecone, Weaviate, and Chroma.
- **IVF** (Inverted File Index) — clusters vectors into Voronoi cells and
  only searches the nearest cells. Often combined with product
  quantization (IVF-PQ) to compress vectors.
- **ScaNN** — Google's anisotropic quantization approach, strong at very
  large scale.

## Vector databases

Popular vector databases include Pinecone, Weaviate, Qdrant, Milvus,
Chroma, and pgvector for Postgres. LanceDB is an embedded option that
stores vectors as Arrow files. Voyage AI provides state-of-the-art
embedding and reranking models; the rerank-2 family is widely used as the
second stage of a two-stage retrieval pipeline.

## Hybrid retrieval

Dense search is great at paraphrase but weak at rare terms, acronyms, and
product identifiers. BM25 — a bag-of-words ranking function from
classical IR — complements dense search well. Reciprocal Rank Fusion
(RRF) is the standard way to combine two rankings without tuning weights.
