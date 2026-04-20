"use client";

import { motion } from "framer-motion";
import { ExternalLink } from "lucide-react";

export function Footer() {
  return (
    <motion.footer
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6, delay: 0.2 }}
      className="border-t border-white/5 px-6 py-4"
    >
      <div className="mx-auto flex max-w-[1400px] items-center justify-center gap-1.5 text-[11.5px] text-ink-400">
        <span>Designed and developed by</span>
        <a
          href="https://techymk.vercel.app/"
          target="_blank"
          rel="noreferrer"
          className="group inline-flex items-center gap-1 font-medium"
        >
          <span className="grad-text transition-opacity group-hover:opacity-80">
            techyMk
          </span>
          <ExternalLink className="h-3 w-3 text-ink-400 transition-colors group-hover:text-ink-200" />
        </a>
      </div>
    </motion.footer>
  );
}
