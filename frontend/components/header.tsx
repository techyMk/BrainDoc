"use client";

import { motion } from "framer-motion";
import { Database, BrainCircuit } from "lucide-react";
import type { Health } from "@/lib/types";

export function Header({ health }: { health: Health | null }) {
  return (
    <header className="sticky top-0 z-10 border-b border-white/5 bg-ink-950/50 backdrop-blur">
      <div className="mx-auto flex max-w-[1400px] items-center justify-between px-6 py-4">
        <motion.div
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex items-center gap-3"
        >
          <div
            className="relative grid h-9 w-9 place-items-center rounded-xl"
            style={{
              background:
                "linear-gradient(135deg,rgba(169,157,255,0.85),rgba(53,208,186,0.65),rgba(255,122,182,0.55))",
              boxShadow: "0 10px 30px -10px rgba(139,124,255,0.55)",
            }}
          >
            <BrainCircuit className="h-[18px] w-[18px] text-white" strokeWidth={2.2} />
          </div>
          <div className="leading-tight">
            <div className="flex items-baseline gap-2">
              <h1 className="text-[17px] font-semibold tracking-tight text-white">
                Brain<span className="grad-text">Doc</span>
              </h1>
              <span className="hidden text-[11px] text-ink-400 sm:inline">
                8 flavors of retrieval, one chatbot
              </span>
            </div>
          </div>
        </motion.div>
        <div className="flex items-center gap-3 text-[11.5px] text-ink-300">
          <StatusPill health={health} />
        </div>
      </div>
    </header>
  );
}

function StatusPill({ health }: { health: Health | null }) {
  const ok =
    !!health?.ok && !!health.has_llm_key && !!health.has_voyage_key;
  const chunks = health?.chunks ?? 0;
  return (
    <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5">
      <span
        className={`h-1.5 w-1.5 rounded-full ${
          ok && chunks > 0
            ? "bg-emerald-400"
            : ok
              ? "bg-amber-400"
              : "bg-rose-400"
        }`}
      />
      <Database className="h-3.5 w-3.5" />
      <span>
        {chunks > 0
          ? `${chunks} chunks indexed`
          : ok
            ? "index empty — run ingest"
            : "backend offline"}
      </span>
    </div>
  );
}
