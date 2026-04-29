"use client";

import { motion } from "framer-motion";
import { SignInButton, SignUpButton } from "@clerk/nextjs";
import { BrainCircuit, Lock, Sparkles, ShieldCheck } from "lucide-react";

export function AuthGate() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="flex flex-1 flex-col items-center justify-center px-4 py-16 text-center"
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
        <BrainCircuit className="h-7 w-7 text-white" strokeWidth={2} />
      </motion.div>

      <h2 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">
        Welcome to <span className="grad-text">BrainDoc</span>
      </h2>
      <p className="mt-3 max-w-xl text-[14.5px] text-ink-300">
        Chat with your documents using eight different RAG pipelines —
        Naive, Hybrid, Rerank, Multi-Query, HyDE, Graph, Agentic, and
        Corrective. Sign in to get started.
      </p>

      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <SignInButton mode="modal">
          <button
            type="button"
            className="inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-[13.5px] font-semibold text-white transition-transform hover:scale-[1.02]"
            style={{
              background:
                "linear-gradient(135deg,rgba(169,157,255,1),rgba(53,208,186,0.95))",
              boxShadow: "0 12px 36px -12px rgba(139,124,255,0.55)",
            }}
          >
            <Lock className="h-4 w-4" />
            Sign in
          </button>
        </SignInButton>
        <SignUpButton mode="modal">
          <button
            type="button"
            className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-5 py-2.5 text-[13.5px] font-medium text-ink-100 hover:bg-white/[0.08]"
          >
            Create account
          </button>
        </SignUpButton>
      </div>

      <div className="mt-12 grid w-full max-w-2xl grid-cols-1 gap-3 sm:grid-cols-3">
        <FeatureCard
          icon={<Sparkles className="h-4 w-4" />}
          title="8 RAG modes"
          body="Switch between strategies mid-conversation."
        />
        <FeatureCard
          icon={<BrainCircuit className="h-4 w-4" />}
          title="Knowledge graph"
          body="Multi-hop questions via entity traversal."
        />
        <FeatureCard
          icon={<ShieldCheck className="h-4 w-4" />}
          title="Private"
          body="Your account is required to chat or upload."
        />
      </div>
    </motion.div>
  );
}

function FeatureCard({
  icon,
  title,
  body,
}: {
  icon: React.ReactNode;
  title: string;
  body: string;
}) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4 text-left">
      <div className="mb-1.5 flex items-center gap-2 text-ink-200">
        {icon}
        <span className="text-[12.5px] font-semibold text-white">{title}</span>
      </div>
      <p className="text-[12px] leading-snug text-ink-300">{body}</p>
    </div>
  );
}
