"use client";

import { motion } from "framer-motion";
import type { Trace } from "@/lib/types";

export function TracePanel({ trace }: { trace: Trace[] }) {
  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      exit={{ opacity: 0, height: 0 }}
      className="w-full overflow-hidden rounded-xl border border-white/10 bg-black/30"
    >
      <div className="border-b border-white/5 px-3 py-2 text-[11px] uppercase tracking-wider text-ink-400">
        Retrieval trace
      </div>
      <ol className="divide-y divide-white/5">
        {trace.map((t, i) => (
          <li key={i} className="px-3 py-2">
            <div className="flex items-start gap-3">
              <span className="mt-0.5 inline-flex h-5 min-w-5 items-center justify-center rounded-md bg-white/5 px-1 font-mono text-[10px] text-ink-300">
                {i + 1}
              </span>
              <div className="min-w-0 flex-1">
                <div className="text-[12px] font-medium text-ink-100">
                  {t.step}
                </div>
                <div className="text-[11.5px] text-ink-300">{t.detail}</div>
                {t.data && (
                  <details className="mt-1">
                    <summary className="cursor-pointer select-none text-[11px] text-ink-400 hover:text-ink-200">
                      details
                    </summary>
                    <pre className="mt-1 max-h-60 overflow-auto rounded-md bg-black/40 p-2 font-mono text-[10.5px] text-ink-200">
{JSON.stringify(t.data, null, 2)}
                    </pre>
                  </details>
                )}
              </div>
            </div>
          </li>
        ))}
      </ol>
    </motion.div>
  );
}
