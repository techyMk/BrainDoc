# BrainDoc

A brand-new chatbot web app that runs **eight distinct flavors of
Retrieval-Augmented Generation** side by side:

| # | Mode | What it does |
|---|------|--------------|
| 1 | **Naive** | Embed, nearest-neighbor, answer. The baseline. |
| 2 | **Hybrid** | Dense vectors + BM25, fused with Reciprocal Rank Fusion. |
| 3 | **Rerank** | Over-retrieve, then rescore with Voyage `rerank-2-lite`. |
| 4 | **Multi-Query** | LLM rewrites the question 3 ways; union the rankings. |
| 5 | **HyDE** | LLM hallucinates an answer, embeds *that*, searches with it. |
| 6 | **Graph** | Entity extraction → knowledge graph traversal → chunk lookup. |
| 7 | **Agentic** | Claude plans tool calls across dense / keyword / graph search. |
| 8 | **Corrective** | Retrieve → grade relevance → rewrite + retry if evidence is weak. |

Stack: **Next.js 15 (App Router, Tailwind v4, Framer Motion, TypeScript)**
for the frontend, **FastAPI + numpy vector store + Voyage embeddings +
Groq Llama 3.3 70B** for the backend, with a NetworkX knowledge graph
built at ingestion time. Both Groq and Voyage have generous free tiers —
no credit card required.

**Private by user.** Every account gets its own isolated vector index,
knowledge graph, and uploaded-docs folder. Authentication is handled by
Clerk; the FastAPI backend trusts the Next.js proxy to forward the
authenticated `user_id`, gated by a shared `APP_API_KEY` so external
callers can't spoof a user.

---

## Prerequisites

- **Python 3.10+**
- **Node.js 20+**
- A **Groq API key** (free, no card) — https://console.groq.com
- A **Voyage AI API key** (free tier) — https://www.voyageai.com
- A **Clerk app** (free up to 10K MAU) — https://dashboard.clerk.com

---

## 1. Backend

```bash
cd backend
python -m venv .venv
# Windows:
.venv\Scripts\activate
# macOS / Linux:
source .venv/bin/activate

pip install -r requirements.txt
cp .env.example .env
# edit .env and paste your GROQ_API_KEY + VOYAGE_API_KEY

python main.py
```

The API will start on `http://localhost:8001`. Key endpoints:

- `GET  /api/health` — status + index size
- `GET  /api/modes` — list the 8 RAG modes
- `POST /api/ingest` — embed the seed corpus and build the graph
- `POST /api/upload` — multipart upload of `.md`, `.txt`, or `.pdf` files
- `POST /api/chat` — `{ message, mode, history, top_k }`

## 2. Frontend

In a second terminal:

```bash
cd frontend
cp .env.example .env.local
# edit .env.local — paste your Clerk keys, BACKEND_URL, and APP_API_KEY
# (APP_API_KEY must match the value in backend/.env)
npm install
npm run dev
```

### Setting up Clerk

1. Go to https://dashboard.clerk.com → **Create application**.
2. Pick whichever sign-in methods you want (email, Google, GitHub, etc.).
3. From the **API Keys** page, copy:
   - `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
   - `CLERK_SECRET_KEY`
4. Paste both into `frontend/.env.local`.

### Locking down the backend

The Next.js routes are gated by Clerk middleware, so signed-out users
can't call `/api/*`. To stop someone from calling the FastAPI URL on
Render directly, set a shared secret:

```bash
python -c "import secrets; print(secrets.token_urlsafe(32))"
```

Paste the output as `APP_API_KEY` in **both** `backend/.env` and
`frontend/.env.local`. The Next.js proxy will inject it as the
`X-API-Key` header; FastAPI rejects requests without it.

Open `http://localhost:3000`.

On first load the index is empty — click **Ingest seed docs** in the left
panel. Ingestion embeds ~6 markdown files, builds the vector index, and
extracts a knowledge graph with Claude. Budget roughly 20–40 seconds and a
small amount of API credit the first time.

You can also **drag & drop your own `.md`, `.txt`, or `.pdf` files** into
the Upload zone in the left panel. They are saved under
[backend/data/docs/](backend/data/docs/), chunked, embedded, and added to
both the vector index and the knowledge graph. The chatbot will then
retrieve from your documents in every RAG mode.

Once ingestion finishes, pick any of the 8 modes from the left rail and
chat. Each assistant message shows:

- the mode badge + latency,
- expandable source cards with relevance bars,
- an expandable **retrieval trace** showing every step the pipeline took.

---

## Project layout

```
rag-test/
├── backend/
│   ├── main.py              # FastAPI app
│   ├── config.py
│   ├── models.py            # Pydantic request/response types
│   ├── core/
│   │   ├── embeddings.py    # Voyage embed + rerank
│   │   ├── llm.py           # Claude wrapper (text + JSON)
│   │   ├── vectorstore.py   # Chroma persistent collection
│   │   ├── bm25.py          # rank_bm25 keyword index
│   │   ├── graph_store.py   # NetworkX KG w/ JSON persistence
│   │   └── ingest.py        # Chunking + embedding + triple extraction
│   ├── rag/
│   │   ├── base.py          # Shared context formatting + RRF
│   │   ├── naive.py
│   │   ├── hybrid.py
│   │   ├── rerank.py
│   │   ├── multiquery.py
│   │   ├── hyde.py
│   │   ├── graph.py
│   │   ├── agentic.py       # Tool-use loop with Claude
│   │   └── corrective.py    # Grade-and-retry self-RAG
│   └── data/
│       ├── seed_docs/       # Read-only seed markdown corpus
│       └── users/           # Auto-created, one folder per Clerk user
│           └── <user_id>/
│               ├── docs/        # That user's uploaded files
│               ├── index.pkl    # That user's vector index
│               └── graph.json   # That user's knowledge graph
└── frontend/
    ├── app/
    │   ├── page.tsx         # Main chat page
    │   ├── layout.tsx
    │   ├── globals.css      # Tailwind v4 + custom tokens
    │   └── api/             # Route handlers proxying to FastAPI
    ├── components/          # Header, ModeSelector, MessageBubble, etc.
    └── lib/                 # Types + utilities
```

## How each mode differs in the UI

Every answer ships with a **Retrieval trace** you can expand — that's
usually the fastest way to see how each mode behaves. Try asking the
same question in Naive vs. Graph vs. Agentic to see the different
sources and thought-steps surface.

## Tuning knobs

- `GROQ_MODEL` — default `llama-3.3-70b-versatile`. Other free options:
  `llama-3.1-70b-versatile`, `llama-3.1-8b-instant` (faster), or
  `mixtral-8x7b-32768`.
- `VOYAGE_EMBED_MODEL` — default `voyage-3`; try `voyage-3-large` for
  higher-quality embeddings.
- `VOYAGE_RERANK_MODEL` — default `rerank-2-lite`; `rerank-2` is
  stronger but slower.
- `top_k` in the chat request — default 5.

---

Built with Groq + Voyage. Have fun.
