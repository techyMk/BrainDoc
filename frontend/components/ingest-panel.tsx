"use client";

import { motion } from "framer-motion";
import {
  Database,
  Loader2,
  RefreshCw,
  Upload,
  FileText,
  AlertTriangle,
} from "lucide-react";
import { useRef, useState } from "react";
import type { Health, IngestStats, UploadResponse } from "@/lib/types";
import { readErrorMessage } from "@/lib/utils";

export function IngestPanel({
  health,
  onDone,
}: {
  health: Health | null;
  onDone: () => void;
}) {
  const [busy, setBusy] = useState<false | "ingest" | "upload">(false);
  const [err, setErr] = useState<string | null>(null);
  const [last, setLast] = useState<IngestStats | null>(null);
  const [lastUpload, setLastUpload] = useState<UploadResponse | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  async function runIngest(reset: boolean) {
    setBusy("ingest");
    setErr(null);
    try {
      const res = await fetch("/api/ingest", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ reset }),
      });
      if (!res.ok) throw new Error(await readErrorMessage(res));
      setLast(await res.json());
      setLastUpload(null);
      onDone();
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  }

  async function runUpload(fileList: FileList | File[]) {
    const files = Array.from(fileList);
    if (!files.length) return;
    setBusy("upload");
    setErr(null);
    try {
      const form = new FormData();
      for (const f of files) form.append("files", f, f.name);
      const res = await fetch("/api/upload", { method: "POST", body: form });
      if (!res.ok) throw new Error(await readErrorMessage(res));
      const data = (await res.json()) as UploadResponse;
      setLastUpload(data);
      setLast(data.ingest);
      onDone();
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  }

  const empty = (health?.chunks ?? 0) === 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass rounded-2xl p-4"
    >
      <div className="mb-2 flex items-center gap-2 text-[12px] font-semibold text-ink-100">
        <Database className="h-3.5 w-3.5" />
        Knowledge base
      </div>
      <p className="text-[12px] leading-snug text-ink-300">
        {empty
          ? "The vector index is empty. Ingest the seed corpus or upload your own documents to get started."
          : `Indexed: ${health?.chunks} chunks · ${health?.graph.nodes ?? 0} graph nodes · ${health?.graph.edges ?? 0} edges.`}
      </p>

      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="button"
          disabled={!!busy}
          onClick={() => runIngest(false)}
          className="inline-flex items-center gap-1.5 rounded-lg bg-white/[0.06] px-3 py-1.5 text-[12px] font-medium text-ink-100 hover:bg-white/[0.1] disabled:opacity-60"
        >
          {busy === "ingest" ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Database className="h-3.5 w-3.5" />
          )}
          {busy === "ingest"
            ? "Working… (first run can take ~60s)"
            : empty
              ? "Ingest seed docs"
              : "Sync new docs"}
        </button>
        {!empty && (
          <button
            type="button"
            disabled={!!busy}
            onClick={() => runIngest(true)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 px-3 py-1.5 text-[12px] font-medium text-ink-300 hover:bg-white/[0.04] disabled:opacity-60"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Reset
          </button>
        )}
      </div>

      <div className="mt-3 text-[11px] uppercase tracking-wider text-ink-400">
        Upload your own
      </div>
      <div
        onDragEnter={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          if (e.dataTransfer.files) runUpload(e.dataTransfer.files);
        }}
        onClick={() => fileRef.current?.click()}
        role="button"
        tabIndex={0}
        className={`mt-2 cursor-pointer rounded-xl border border-dashed px-3 py-4 text-center transition-colors ${
          dragOver
            ? "border-accent bg-white/[0.06]"
            : "border-white/10 bg-white/[0.02] hover:bg-white/[0.04]"
        } ${busy === "upload" ? "pointer-events-none opacity-60" : ""}`}
      >
        <input
          ref={fileRef}
          type="file"
          multiple
          accept=".md,.txt,.pdf,text/markdown,text/plain,application/pdf"
          className="hidden"
          onChange={(e) => {
            if (e.target.files) runUpload(e.target.files);
            e.target.value = "";
          }}
        />
        <div className="flex flex-col items-center gap-1.5 text-[12px] text-ink-200">
          {busy === "upload" ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Uploading & ingesting…</span>
            </>
          ) : (
            <>
              <Upload className="h-4 w-4 text-ink-300" />
              <span>
                Drop <strong className="text-ink-100">.md</strong>,{" "}
                <strong className="text-ink-100">.txt</strong>, or{" "}
                <strong className="text-ink-100">.pdf</strong> files here
              </span>
              <span className="text-[11px] text-ink-400">or click to browse</span>
            </>
          )}
        </div>
      </div>

      {lastUpload && lastUpload.uploaded.length > 0 && (
        <div className="mt-3 flex flex-col gap-1 rounded-lg border border-white/5 bg-black/20 p-2">
          {lastUpload.uploaded.map((f) => (
            <div
              key={f.saved_as}
              className="flex items-center gap-2 text-[11px] text-ink-200"
            >
              <FileText className="h-3 w-3 text-ink-400" />
              <span className="truncate">{f.filename}</span>
              <span className="ml-auto shrink-0 font-mono text-[10px] text-ink-400">
                {prettyBytes(f.bytes)}
              </span>
            </div>
          ))}
        </div>
      )}
      {lastUpload && lastUpload.skipped.length > 0 && (
        <div className="mt-2 flex items-start gap-2 rounded-lg border border-amber-300/20 bg-amber-500/10 p-2 text-[11px] text-amber-200">
          <AlertTriangle className="mt-0.5 h-3 w-3 shrink-0" />
          <div className="flex flex-col gap-0.5">
            {lastUpload.skipped.map((s, i) => (
              <span key={i}>{s}</span>
            ))}
          </div>
        </div>
      )}
      {last && (
        <div className="mt-3 rounded-lg border border-white/5 bg-black/20 p-2 font-mono text-[11px] text-ink-300">
          +{last.chunks_added} chunks · {last.chunks} total · {last.graph_nodes}{" "}
          nodes · {last.graph_edges} edges
        </div>
      )}
      {err && (
        <div className="mt-3 rounded-lg border border-rose-400/30 bg-rose-500/10 p-2 text-[11.5px] text-rose-200">
          {err}
        </div>
      )}
    </motion.div>
  );
}

function prettyBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}
