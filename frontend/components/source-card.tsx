"use client";

import { motion } from "framer-motion";
import { FileText } from "lucide-react";
import type { Source } from "@/lib/types";

export function SourceCard({ source, index }: { source: Source; index: number }) {
  const scorePct = Math.max(0, Math.min(1, source.score));
  return (
    <motion.div
      whileHover={{ y: -2 }}
      className="group relative overflow-hidden rounded-xl border border-white/10 bg-white/[0.03] p-3 transition-colors hover:bg-white/[0.05]"
    >
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-px opacity-60"
        style={{
          background:
            "linear-gradient(90deg,transparent,rgba(169,157,255,0.55),rgba(53,208,186,0.45),transparent)",
        }}
      />
      <div className="mb-1.5 flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 text-[11px] text-ink-300">
          <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-md bg-white/5 px-1 font-mono text-[10px] text-ink-200">
            S{index}
          </span>
          <FileText className="h-3 w-3" />
          <span className="truncate max-w-[160px]">{source.title || source.doc}</span>
        </div>
        <span className="font-mono text-[10px] text-ink-400">
          {scorePct.toFixed(2)}
        </span>
      </div>
      <p className="line-clamp-4 text-[12.5px] leading-snug text-ink-200">
        {source.snippet}
      </p>
      <div className="mt-2 h-1 overflow-hidden rounded-full bg-white/5">
        <div
          className="h-full rounded-full"
          style={{
            width: `${scorePct * 100}%`,
            background: "linear-gradient(90deg,#a99dff,#35d0ba)",
          }}
        />
      </div>
    </motion.div>
  );
}
