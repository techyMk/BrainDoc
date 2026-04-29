"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence } from "framer-motion";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { ModeSelector } from "@/components/mode-selector";
import { MessageBubble } from "@/components/message";
import { Composer } from "@/components/composer";
import { EmptyState } from "@/components/empty-state";
import { IngestPanel } from "@/components/ingest-panel";
import { DocsPanel } from "@/components/docs-panel";
import type {
  ChatResponse,
  ChatTurn,
  DocInfo,
  Health,
  ModeInfo,
  RagMode,
  Suggestions,
} from "@/lib/types";
import { readErrorMessage } from "@/lib/utils";

export default function Page() {
  const [modes, setModes] = useState<ModeInfo[]>([]);
  const [mode, setMode] = useState<RagMode>("naive");
  const [turns, setTurns] = useState<ChatTurn[]>([]);
  const [input, setInput] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [health, setHealth] = useState<Health | null>(null);
  const [suggestions, setSuggestions] = useState<Suggestions | null>(null);
  const [refreshingSuggestions, setRefreshingSuggestions] = useState(false);
  const [docs, setDocs] = useState<DocInfo[]>([]);
  const [selectedDocs, setSelectedDocs] = useState<Set<string>>(new Set());
  const scrollRef = useRef<HTMLDivElement>(null);

  const loadHealth = useCallback(async () => {
    try {
      const r = await fetch("/api/health", { cache: "no-store" });
      if (r.ok) setHealth(await r.json());
      else setHealth(null);
    } catch {
      setHealth(null);
    }
  }, []);

  const loadDocs = useCallback(async () => {
    try {
      const r = await fetch("/api/docs", { cache: "no-store" });
      if (!r.ok) return;
      const list = (await r.json()) as DocInfo[];
      setDocs(list);
      // Default: keep current selection but auto-include any newly indexed docs
      setSelectedDocs((prev) => {
        if (prev.size === 0 && list.length > 0) {
          return new Set(list.map((d) => d.doc));
        }
        const next = new Set(prev);
        for (const d of list) next.add(d.doc);
        // drop any selected docs that no longer exist
        const valid = new Set(list.map((d) => d.doc));
        for (const v of next) if (!valid.has(v)) next.delete(v);
        return next;
      });
    } catch {
      /* ignore */
    }
  }, []);

  const loadSuggestions = useCallback(async (refresh = false) => {
    if (refresh) setRefreshingSuggestions(true);
    try {
      const qs = refresh ? "?refresh=1" : "";
      const r = await fetch(`/api/suggestions${qs}`, { cache: "no-store" });
      if (r.ok) setSuggestions(await r.json());
    } catch {
      /* keep last */
    } finally {
      if (refresh) setRefreshingSuggestions(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const r = await fetch("/api/modes", { cache: "no-store" });
        if (!cancelled && r.ok) setModes(await r.json());
      } catch {
        /* ignore */
      }
    })();
    loadHealth();
    loadSuggestions();
    loadDocs();
    return () => {
      cancelled = true;
    };
  }, [loadHealth, loadSuggestions, loadDocs]);

  const lastTurn = turns[turns.length - 1];
  const scrollKey = `${turns.length}:${lastTurn?.pending ? "p" : "d"}:${
    lastTurn?.content?.length ?? 0
  }`;
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const near = el.scrollHeight - el.scrollTop - el.clientHeight < 160;
    if (!near && turns.length > 1) return;
    const id = requestAnimationFrame(() => {
      el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
    });
    return () => cancelAnimationFrame(id);
  }, [scrollKey, turns.length]);

  const activeMode = useMemo(
    () => modes.find((m) => m.id === mode) ?? null,
    [modes, mode],
  );

  const send = useCallback(
    async (text: string) => {
      if (!text.trim() || submitting) return;
      const history = turns
        .filter((t) => !t.pending && !t.error)
        .map((t) => ({ role: t.role, content: t.content }));

      const userTurn: ChatTurn = { role: "user", content: text };
      const pendingTurn: ChatTurn = {
        role: "assistant",
        content: "",
        mode,
        pending: true,
      };
      setTurns((prev) => [...prev, userTurn, pendingTurn]);
      setInput("");
      setSubmitting(true);

      try {
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            message: text,
            mode,
            history,
            top_k: 5,
            docs:
              selectedDocs.size === 0 || selectedDocs.size === docs.length
                ? null
                : Array.from(selectedDocs),
          }),
        });
        if (!res.ok) {
          throw new Error(await readErrorMessage(res));
        }
        const data = (await res.json()) as ChatResponse;
        setTurns((prev) => {
          const copy = [...prev];
          copy[copy.length - 1] = {
            role: "assistant",
            content: data.answer,
            mode: data.mode,
            sources: data.sources,
            trace: data.trace,
            elapsed_ms: data.elapsed_ms,
          };
          return copy;
        });
      } catch (e) {
        setTurns((prev) => {
          const copy = [...prev];
          copy[copy.length - 1] = {
            role: "assistant",
            content: "",
            mode,
            error: e instanceof Error ? e.message : String(e),
          };
          return copy;
        });
      } finally {
        setSubmitting(false);
        loadHealth();
      }
    },
    [mode, submitting, turns, loadHealth, selectedDocs, docs.length],
  );

  const indexEmpty = (health?.chunks ?? 0) === 0;

  return (
    <div className="flex min-h-screen flex-col">
      <Header health={health} />
      <main className="mx-auto flex w-full max-w-[1400px] flex-1 gap-6 px-4 pb-6 pt-4 sm:px-6">
        <aside className="hidden w-[300px] shrink-0 flex-col gap-4 lg:flex">
          <div className="glass rounded-2xl p-3">
            <div className="px-2 pb-2 pt-1 text-[11px] uppercase tracking-wider text-ink-400">
              Retrieval mode
            </div>
            <ModeSelector modes={modes} active={mode} onChange={setMode} />
          </div>
          <IngestPanel
            health={health}
            onDone={() => {
              loadHealth();
              loadSuggestions();
              loadDocs();
            }}
          />
          <DocsPanel
            docs={docs}
            selected={selectedDocs}
            onChange={setSelectedDocs}
          />
        </aside>

        <section className="flex min-w-0 flex-1 flex-col gap-4">
          <div className="lg:hidden">
            <div className="glass rounded-2xl p-2">
              <div className="flex flex-wrap gap-1">
                {modes.map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setMode(m.id)}
                    className={`rounded-full px-3 py-1 text-[11.5px] ${
                      m.id === mode
                        ? "bg-white/10 text-white"
                        : "text-ink-300 hover:bg-white/[0.04]"
                    }`}
                  >
                    {m.name}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div
            ref={scrollRef}
            className="glass-strong flex min-h-[60vh] flex-1 flex-col overflow-y-auto rounded-2xl p-4 sm:p-6"
          >
            {turns.length === 0 ? (
              <EmptyState
                activeMode={activeMode}
                suggestions={suggestions?.suggestions ?? null}
                basedOn={suggestions?.based_on ?? []}
                onPick={(q) => (indexEmpty ? null : send(q))}
                onRefresh={() => loadSuggestions(true)}
                refreshing={refreshingSuggestions}
              />
            ) : (
              <div className="flex flex-col gap-5">
                <AnimatePresence initial={false}>
                  {turns.map((t, i) => (
                    <MessageBubble key={i} turn={t} modes={modes} />
                  ))}
                </AnimatePresence>
              </div>
            )}
          </div>

          {indexEmpty && (
            <div className="rounded-xl border border-amber-300/30 bg-amber-500/10 px-4 py-3 text-[12.5px] text-amber-200">
              The index is empty — open the left panel and click{" "}
              <span className="font-semibold">Ingest seed docs</span> to enable
              chat.
            </div>
          )}

          <Composer
            value={input}
            onChange={setInput}
            onSubmit={() => send(input)}
            disabled={indexEmpty}
            submitting={submitting}
          />
        </section>
      </main>
      <Footer />
    </div>
  );
}
