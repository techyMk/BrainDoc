import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "BrainDoc — 8 flavors of retrieval, one chatbot",
  description:
    "Chat with your documents using eight different retrieval-augmented generation pipelines: Naive, Hybrid, Rerank, Multi-Query, HyDE, Graph, Agentic, and Corrective.",
  icons: {
    icon: [{ url: "/icon.webp", type: "image/webp" }],
    shortcut: "/icon.webp",
    apple: "/icon.webp",
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
