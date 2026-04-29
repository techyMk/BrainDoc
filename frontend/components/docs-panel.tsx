"use client";

import { motion } from "framer-motion";
import { FileText, Layers } from "lucide-react";
import type { DocInfo } from "@/lib/types";

export function DocsPanel({
  docs,
  selected,
  onChange,
}: {
  docs: DocInfo[];
  selected: Set<string>;
  onChange: (next: Set<string>) => void;
}) {
  if (docs.length === 0) return null;

  const allOn = docs.every((d) => selected.has(d.doc));
  const noneOn = docs.every((d) => !selected.has(d.doc));

  function toggle(doc: string) {
    const next = new Set(selected);
    if (next.has(doc)) next.delete(doc);
    else next.add(doc);
    onChange(next);
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass rounded-2xl p-4"
    >
      <div className="mb-2 flex items-center justify-between">
        <div className="flex items-center gap-2 text-[12px] font-semibold text-ink-100">
          <Layers className="h-3.5 w-3.5" />
          Scope
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => onChange(new Set(docs.map((d) => d.doc)))}
            disabled={allOn}
            className="rounded-md px-2 py-0.5 text-[10.5px] uppercase tracking-wider text-ink-400 hover:text-ink-100 disabled:opacity-40"
          >
            All
          </button>
          <span className="text-ink-500">·</span>
          <button
            type="button"
            onClick={() => onChange(new Set())}
            disabled={noneOn}
            className="rounded-md px-2 py-0.5 text-[10.5px] uppercase tracking-wider text-ink-400 hover:text-ink-100 disabled:opacity-40"
          >
            None
          </button>
        </div>
      </div>
      <p className="text-[11.5px] leading-snug text-ink-400">
        Choose which documents the chatbot is allowed to retrieve from.
      </p>

      <ul className="mt-3 flex max-h-[260px] flex-col gap-1 overflow-y-auto pr-1">
        {docs.map((d) => {
          const on = selected.has(d.doc);
          return (
            <li key={d.doc}>
              <button
                type="button"
                onClick={() => toggle(d.doc)}
                className={`flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left transition-colors ${
                  on
                    ? "bg-white/[0.06] text-ink-100"
                    : "text-ink-300 hover:bg-white/[0.03]"
                }`}
              >
                <span
                  aria-hidden
                  className={`grid h-4 w-4 shrink-0 place-items-center rounded border transition-colors ${
                    on
                      ? "border-transparent text-white"
                      : "border-white/15 text-transparent"
                  }`}
                  style={
                    on
                      ? {
                          background:
                            "linear-gradient(135deg,#a99dff,#35d0ba)",
                        }
                      : undefined
                  }
                >
                  <svg
                    width="10"
                    height="10"
                    viewBox="0 0 16 16"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M3.5 8.5l2.8 2.8L12.5 5.1"
                      stroke="currentColor"
                      strokeWidth="2.4"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </span>
                <FileText className="h-3.5 w-3.5 shrink-0 text-ink-400" />
                <span
                  className="flex-1 truncate text-[12.5px]"
                  title={d.title}
                >
                  {d.title || d.doc}
                </span>
                <span className="font-mono text-[10.5px] text-ink-500">
                  {d.chunks}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </motion.div>
  );
}
