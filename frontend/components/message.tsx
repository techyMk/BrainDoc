"use client";

import { motion } from "framer-motion";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { BookOpen, ChevronDown, Clock } from "lucide-react";
import { memo, useState } from "react";
import type { ChatTurn, ModeInfo } from "@/lib/types";
import { cn } from "@/lib/utils";
import { SourceCard } from "./source-card";
import { TracePanel } from "./trace-panel";

function MessageBubbleInner({
  turn,
  modes,
}: {
  turn: ChatTurn;
  modes: ModeInfo[];
}) {
  const [showSources, setShowSources] = useState(true);
  const [showTrace, setShowTrace] = useState(false);
  const modeInfo = turn.mode ? modes.find((m) => m.id === turn.mode) : null;
  const isUser = turn.role === "user";

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className={cn("flex w-full", isUser ? "justify-end" : "justify-start")}
    >
      <div
        className={cn(
          "flex max-w-[88%] flex-col gap-3",
          isUser ? "items-end" : "items-start w-full",
        )}
      >
        <div
          className={cn(
            "rounded-2xl px-4 py-3 shadow-sm",
            isUser
              ? "bg-[linear-gradient(135deg,rgba(169,157,255,0.9),rgba(139,124,255,0.85))] text-white"
              : "glass-strong text-ink-100",
          )}
          style={
            isUser
              ? { boxShadow: "0 10px 40px -15px rgba(139,124,255,0.45)" }
              : undefined
          }
        >
          {turn.pending ? (
            <TypingDots />
          ) : turn.error ? (
            <p className="text-sm text-rose-300">{turn.error}</p>
          ) : (
            <div className="prose-chat text-[14.5px]">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {turn.content}
              </ReactMarkdown>
            </div>
          )}
        </div>

        {!isUser && modeInfo && !turn.pending && !turn.error && (
          <div className="flex w-full flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] uppercase tracking-wider text-ink-200">
              <span
                className="h-1.5 w-1.5 rounded-full"
                style={{
                  background: "linear-gradient(135deg,#a99dff,#35d0ba)",
                }}
              />
              {modeInfo.name} RAG
            </span>
            {typeof turn.elapsed_ms === "number" && (
              <span className="inline-flex items-center gap-1 text-[11px] text-ink-400">
                <Clock className="h-3 w-3" /> {turn.elapsed_ms} ms
              </span>
            )}
            {turn.sources && turn.sources.length > 0 && (
              <button
                type="button"
                onClick={() => setShowSources((v) => !v)}
                className="inline-flex items-center gap-1 text-[11px] text-ink-300 hover:text-ink-100"
              >
                <BookOpen className="h-3 w-3" />
                {turn.sources.length} source
                {turn.sources.length === 1 ? "" : "s"}
                <ChevronDown
                  className={cn(
                    "h-3 w-3 transition-transform",
                    showSources ? "rotate-180" : "",
                  )}
                />
              </button>
            )}
            {turn.trace && turn.trace.length > 0 && (
              <button
                type="button"
                onClick={() => setShowTrace((v) => !v)}
                className="inline-flex items-center gap-1 text-[11px] text-ink-300 hover:text-ink-100"
              >
                thinking
                <ChevronDown
                  className={cn(
                    "h-3 w-3 transition-transform",
                    showTrace ? "rotate-180" : "",
                  )}
                />
              </button>
            )}
          </div>
        )}

        {!isUser && showSources && turn.sources && turn.sources.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="grid w-full gap-2 sm:grid-cols-2"
          >
            {turn.sources.map((s, i) => (
              <SourceCard key={s.id} source={s} index={i + 1} />
            ))}
          </motion.div>
        )}

        {!isUser && showTrace && turn.trace && (
          <TracePanel trace={turn.trace} />
        )}
      </div>
    </motion.div>
  );
}

export const MessageBubble = memo(
  MessageBubbleInner,
  (a, b) =>
    a.turn === b.turn &&
    a.modes === b.modes,
);
MessageBubble.displayName = "MessageBubble";

function TypingDots() {
  return (
    <div className="flex items-center gap-1.5 px-1 py-1 text-ink-300">
      <span className="dot h-1.5 w-1.5 rounded-full bg-current" />
      <span className="dot h-1.5 w-1.5 rounded-full bg-current" />
      <span className="dot h-1.5 w-1.5 rounded-full bg-current" />
    </div>
  );
}
