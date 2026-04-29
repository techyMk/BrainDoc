"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  BrainCircuit,
  Sparkles,
  ShieldCheck,
  Network,
  CheckCircle2,
  Upload,
  MessageSquare,
} from "lucide-react";

export function AuthShell({
  title,
  subtitle,
  children,
  variant = "signin",
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
  variant?: "signin" | "signup";
}) {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b border-white/5 bg-ink-950/40 backdrop-blur">
        <div className="mx-auto flex max-w-[1400px] items-center px-6 py-4">
          <Link href="/" className="flex items-center gap-3">
            <div
              className="grid h-9 w-9 place-items-center rounded-xl"
              style={{
                background:
                  "linear-gradient(135deg,rgba(169,157,255,0.85),rgba(53,208,186,0.65),rgba(255,122,182,0.55))",
                boxShadow: "0 10px 30px -10px rgba(139,124,255,0.55)",
              }}
            >
              <BrainCircuit className="h-[18px] w-[18px] text-white" strokeWidth={2.2} />
            </div>
            <h1 className="text-[17px] font-semibold tracking-tight text-white">
              Brain<span className="grad-text">Doc</span>
            </h1>
          </Link>
        </div>
      </header>

      <main className="mx-auto grid w-full max-w-[1180px] flex-1 grid-cols-1 items-center gap-10 px-6 py-10 lg:grid-cols-2 lg:gap-16 lg:py-16">
        <motion.section
          initial={{ opacity: 0, x: -16 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.45 }}
          className="order-2 lg:order-1"
        >
          <h2 className="text-3xl font-semibold leading-tight tracking-tight text-white sm:text-4xl">
            {title}
            <br />
            <span className="grad-text">{subtitle}</span>
          </h2>

          {variant === "signup" ? (
            <>
              <p className="mt-4 max-w-md text-[14.5px] leading-relaxed text-ink-300">
                Create your account to chat with your documents using eight
                different retrieval-augmented generation strategies — all in
                one place.
              </p>

              <div className="mt-6 inline-flex items-center gap-1.5 rounded-full border border-emerald-300/20 bg-emerald-500/10 px-3 py-1.5 text-[11.5px] font-medium text-emerald-200">
                <CheckCircle2 className="h-3.5 w-3.5" />
                Free forever — no credit card required
              </div>

              <div className="mt-8">
                <div className="mb-3 text-[11px] uppercase tracking-wider text-ink-400">
                  Get started in 3 steps
                </div>
                <ol className="flex flex-col gap-3">
                  <Step
                    n={1}
                    icon={<ShieldCheck className="h-4 w-4" />}
                    title="Create your account"
                    body="Email + password, or one-click with Google."
                  />
                  <Step
                    n={2}
                    icon={<Upload className="h-4 w-4" />}
                    title="Upload your documents"
                    body="Drag-and-drop PDFs, Markdown, or text — up to a few MB each."
                  />
                  <Step
                    n={3}
                    icon={<MessageSquare className="h-4 w-4" />}
                    title="Ask anything"
                    body="Switch between 8 RAG modes mid-conversation to compare results."
                  />
                </ol>
              </div>
            </>
          ) : (
            <>
              <p className="mt-4 max-w-md text-[14.5px] leading-relaxed text-ink-300">
                BrainDoc lets you chat with your documents using eight different
                retrieval-augmented generation pipelines. Upload PDFs, ask
                questions, and watch each strategy gather evidence differently.
              </p>

              <ul className="mt-8 flex flex-col gap-3">
                <Feature
                  icon={<Sparkles className="h-4 w-4" />}
                  title="8 RAG strategies"
                  body="Naive, Hybrid, Rerank, Multi-Query, HyDE, Graph, Agentic, and Corrective."
                />
                <Feature
                  icon={<Network className="h-4 w-4" />}
                  title="Knowledge graph included"
                  body="Multi-hop questions traverse a graph built at ingest time."
                />
                <Feature
                  icon={<ShieldCheck className="h-4 w-4" />}
                  title="Private by account"
                  body="Sign in to access the chat, ingest, and upload endpoints."
                />
              </ul>
            </>
          )}
        </motion.section>

        <motion.section
          initial={{ opacity: 0, x: 16 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.45, delay: 0.05 }}
          className="order-1 flex justify-center lg:order-2"
        >
          {children}
        </motion.section>
      </main>

      <footer className="border-t border-white/5 px-6 py-4">
        <div className="mx-auto flex max-w-[1400px] items-center justify-center gap-1.5 text-[11.5px] text-ink-400">
          <span>Designed and developed by</span>
          <a
            href="https://techymk.vercel.app/"
            target="_blank"
            rel="noreferrer"
            className="font-medium grad-text"
          >
            techyMk
          </a>
        </div>
      </footer>
    </div>
  );
}

function Feature({
  icon,
  title,
  body,
}: {
  icon: React.ReactNode;
  title: string;
  body: string;
}) {
  return (
    <li className="flex items-start gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-3.5">
      <div
        className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-lg text-white"
        style={{
          background:
            "linear-gradient(135deg,rgba(169,157,255,0.35),rgba(53,208,186,0.25))",
        }}
      >
        {icon}
      </div>
      <div className="min-w-0">
        <div className="text-[13px] font-semibold text-white">{title}</div>
        <p className="text-[12.5px] leading-snug text-ink-300">{body}</p>
      </div>
    </li>
  );
}

function Step({
  n,
  icon,
  title,
  body,
}: {
  n: number;
  icon: React.ReactNode;
  title: string;
  body: string;
}) {
  return (
    <li className="flex items-start gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-3.5">
      <div className="relative mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-lg text-white"
        style={{
          background:
            "linear-gradient(135deg,rgba(169,157,255,0.35),rgba(53,208,186,0.25))",
        }}
      >
        {icon}
        <span className="absolute -right-1.5 -top-1.5 grid h-4 w-4 place-items-center rounded-full bg-ink-900 font-mono text-[9.5px] font-semibold text-ink-100 ring-1 ring-white/10">
          {n}
        </span>
      </div>
      <div className="min-w-0">
        <div className="text-[13px] font-semibold text-white">{title}</div>
        <p className="text-[12.5px] leading-snug text-ink-300">{body}</p>
      </div>
    </li>
  );
}
