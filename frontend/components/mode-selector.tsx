"use client";

import { motion } from "framer-motion";
import {
  Zap, Shuffle, Target, GitBranch, Sparkles, Network, Bot, ShieldCheck,
  type LucideIcon,
} from "lucide-react";
import type { ModeInfo, RagMode } from "@/lib/types";
import { cn } from "@/lib/utils";

const ICONS: Record<string, LucideIcon> = {
  zap: Zap,
  shuffle: Shuffle,
  target: Target,
  "git-branch": GitBranch,
  sparkles: Sparkles,
  network: Network,
  bot: Bot,
  "shield-check": ShieldCheck,
};

export function ModeSelector({
  modes,
  active,
  onChange,
}: {
  modes: ModeInfo[];
  active: RagMode;
  onChange: (m: RagMode) => void;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      {modes.map((m, idx) => {
        const Icon = ICONS[m.icon] ?? Zap;
        const isActive = m.id === active;
        return (
          <motion.button
            key={m.id}
            type="button"
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2, delay: idx * 0.02 }}
            whileHover={{ x: 1 }}
            whileTap={{ scale: 0.985 }}
            onClick={() => onChange(m.id)}
            className={cn(
              "group relative flex items-start gap-3 rounded-xl px-3 py-2.5 text-left transition-colors",
              isActive
                ? "bg-white/[0.06] border border-white/10"
                : "border border-transparent hover:bg-white/[0.03]",
            )}
          >
            {isActive && (
              <motion.div
                layoutId="mode-active-dot"
                className="absolute inset-y-2 left-0 w-[3px] rounded-full"
                style={{
                  background: "linear-gradient(180deg, #a99dff, #35d0ba)",
                }}
              />
            )}
            <div
              className={cn(
                "mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-lg transition-colors",
                isActive
                  ? "bg-[linear-gradient(135deg,rgba(169,157,255,0.25),rgba(53,208,186,0.15))] text-white"
                  : "bg-white/[0.04] text-ink-300 group-hover:text-ink-100",
              )}
            >
              <Icon className="h-4 w-4" strokeWidth={2} />
            </div>
            <div className="min-w-0 flex-1">
              <div
                className={cn(
                  "text-[13px] font-semibold leading-tight",
                  isActive ? "text-white" : "text-ink-100",
                )}
              >
                {m.name}
              </div>
              <div className="truncate text-[11.5px] text-ink-400">
                {m.tagline}
              </div>
            </div>
          </motion.button>
        );
      })}
    </div>
  );
}
