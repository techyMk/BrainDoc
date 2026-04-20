"use client";

import { motion } from "framer-motion";
import { Send, Loader2 } from "lucide-react";
import { useEffect, useRef } from "react";

export function Composer({
  value,
  onChange,
  onSubmit,
  disabled,
  submitting,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  onSubmit: () => void;
  disabled?: boolean;
  submitting?: boolean;
  placeholder?: string;
}) {
  const taRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const ta = taRef.current;
    if (!ta) return;
    const id = requestAnimationFrame(() => {
      ta.style.height = "auto";
      ta.style.height = Math.min(ta.scrollHeight, 180) + "px";
    });
    return () => cancelAnimationFrame(id);
  }, [value]);

  useEffect(() => {
    // Press "/" anywhere to focus the composer (unless already typing)
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "/" || disabled) return;
      const t = e.target as HTMLElement | null;
      if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable)) return;
      e.preventDefault();
      taRef.current?.focus();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [disabled]);

  return (
    <motion.form
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      onSubmit={(e) => {
        e.preventDefault();
        if (!disabled && !submitting && value.trim()) onSubmit();
      }}
      className="glass-strong relative flex items-end gap-2 rounded-2xl p-2 pr-2"
    >
      <textarea
        ref={taRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            if (!disabled && !submitting && value.trim()) onSubmit();
          }
        }}
        rows={1}
        disabled={disabled}
        placeholder={placeholder ?? "Ask anything about your documents…  (press / to focus)"}
        className="flex-1 resize-none bg-transparent px-3 py-2.5 text-[14.5px] text-ink-100 placeholder:text-ink-400 focus:outline-none"
      />
      <motion.button
        whileHover={{ scale: 1.04 }}
        whileTap={{ scale: 0.96 }}
        type="submit"
        disabled={disabled || submitting || !value.trim()}
        className="group inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl disabled:opacity-50"
        style={{
          background:
            "linear-gradient(135deg,rgba(169,157,255,1),rgba(53,208,186,0.95))",
          boxShadow: "0 10px 30px -10px rgba(139,124,255,0.55)",
        }}
        aria-label="Send"
      >
        {submitting ? (
          <Loader2 className="h-4 w-4 animate-spin text-white" />
        ) : (
          <Send className="h-4 w-4 text-white" strokeWidth={2.5} />
        )}
      </motion.button>
    </motion.form>
  );
}
