export type RagMode =
  | "naive"
  | "hybrid"
  | "rerank"
  | "multiquery"
  | "hyde"
  | "graph"
  | "agentic"
  | "corrective";

export type ModeInfo = {
  id: RagMode;
  name: string;
  tagline: string;
  description: string;
  icon: string;
};

export type Source = {
  id: string;
  doc: string;
  title: string;
  snippet: string;
  score: number;
  meta: Record<string, unknown>;
};

export type Trace = {
  step: string;
  detail: string;
  data?: Record<string, unknown> | null;
};

export type ChatResponse = {
  answer: string;
  mode: RagMode;
  sources: Source[];
  trace: Trace[];
  elapsed_ms: number;
};

export type Health = {
  ok: boolean;
  has_llm_key: boolean;
  has_voyage_key: boolean;
  llm_provider?: string;
  llm_model?: string;
  chunks: number;
  graph: { nodes: number; edges: number };
};

export type IngestStats = {
  ingested_docs: number;
  chunks: number;
  chunks_added: number;
  graph_nodes: number;
  graph_edges: number;
};

export type UploadedFile = {
  filename: string;
  saved_as: string;
  bytes: number;
};

export type UploadResponse = {
  uploaded: UploadedFile[];
  skipped: string[];
  ingest: IngestStats;
};

export type Suggestions = {
  suggestions: string[];
  based_on: string[];
};

export type ChatTurn = {
  role: "user" | "assistant";
  content: string;
  mode?: RagMode;
  sources?: Source[];
  trace?: Trace[];
  elapsed_ms?: number;
  pending?: boolean;
  error?: string;
};
