"use client";

import { motion } from "framer-motion";
import { Sparkles, RefreshCw } from "lucide-react";
import type { ModeInfo } from "@/lib/types";

const DEFAULT_STARTERS = [
  "What is the Claude model family?",
  "Explain the 8 flavors of RAG",
  "Who invented the transformer and what problem did it solve?",
  "Compare HNSW, IVF, and ScaNN for vector search",
  "How does agentic RAG differ from plain RAG?",
];

export function EmptyState({
  activeMode,
  suggestions,
  basedOn,
  onPick,
  onRefresh,
  refreshing,
}: {
  activeMode: ModeInfo | null;
  suggestions: string[] | null;
  basedOn: string[];
  onPick: (q: string) => void;
  onRefresh?: () => void;
  refreshing?: boolean;
}) {
  const starters = suggestions && suggestions.length > 0 ? suggestions : DEFAULT_STARTERS;
  void basedOn;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="flex flex-1 flex-col items-center justify-center px-4 py-10 text-center"
    >
      <motion.div
        initial={{ scale: 0.9 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 120, damping: 14 }}
        className="mb-6 grid h-16 w-16 place-items-center rounded-2xl"
        style={{
          background:
            "linear-gradient(135deg,rgba(169,157,255,0.35),rgba(53,208,186,0.25),rgba(255,122,182,0.25))",
          boxShadow: "0 20px 60px -20px rgba(139,124,255,0.55)",
        }}
      >
        <Sparkles className="h-7 w-7 text-white" strokeWidth={2} />
      </motion.div>
      <h2 className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">
        Ask anything. <span className="grad-text">Eight ways to answer.</span>
      </h2>
      <p className="mt-2 max-w-xl text-sm text-ink-300">
        Pick a retrieval strategy from the left rail, or start with the default
        and switch mid-conversation to see how the sources change.
      </p>
      {activeMode && (
        <div className="mt-6 max-w-lg rounded-xl border border-white/10 bg-white/[0.03] p-4 text-left">
          <div className="mb-1 text-[11px] uppercase tracking-wider text-ink-400">
            {activeMode.name} RAG
          </div>
          <div className="text-[13.5px] text-ink-100">{activeMode.description}</div>
        </div>
      )}

      {onRefresh && (
        <div className="mt-8 flex w-full max-w-2xl justify-end">
          <button
            type="button"
            disabled={refreshing}
            onClick={onRefresh}
            className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/[0.03] px-2 py-1 text-[11px] text-ink-300 hover:bg-white/[0.06] disabled:opacity-50"
            title="Regenerate suggestions"
          >
            <RefreshCw
              className={`h-3 w-3 ${refreshing ? "animate-spin" : ""}`}
            />
            refresh
          </button>
        </div>
      )}
      <div className="mt-2 grid w-full max-w-2xl grid-cols-1 gap-2 sm:grid-cols-2">
        {starters.map((q, i) => (
          <motion.button
            key={q + i}
            type="button"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 + i * 0.05 }}
            whileHover={{ y: -2 }}
            onClick={() => onPick(q)}
            className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-left text-[13px] text-ink-200 hover:bg-white/[0.06]"
          >
            {q}
          </motion.button>
        ))}
      </div>
    </motion.div>
  );
}
