# LLM Agents

An LLM agent is a system where a language model decides what actions to
take in a loop, rather than simply producing a single response. The
canonical loop is:

1. Observe the current state (user request plus any prior tool output).
2. Think about what to do next.
3. Call a tool, or produce a final answer.
4. Repeat until done.

## Tool use

Modern LLMs including Claude, GPT-4, and Gemini expose a structured tool
use interface: the developer declares a set of tools with JSON schemas,
and the model emits tool calls that the runtime executes. Tool results
are appended to the conversation and the loop continues.

Tool use is the foundation for everything from simple function calling
(look up the weather, query a database) to full coding agents that can
read files, edit code, and run a shell.

## Planning patterns

- **ReAct** — interleave reasoning traces with tool calls in a single
  scratchpad. Simple and surprisingly strong.
- **Plan-and-execute** — generate an explicit multi-step plan up front,
  then execute it step by step. Better for long horizon tasks.
- **Reflection** — after each step, critique the result and decide
  whether to retry, revise, or continue.
- **Multi-agent** — multiple specialized agents communicate, often with a
  supervisor agent that routes work.

## Agentic RAG

Agentic RAG treats retrieval as a tool the agent can invoke — and often
expose multiple retrieval tools (dense search, keyword search, graph
traversal, web search) so the model chooses the right one for each step.
This is particularly valuable for ambiguous queries and multi-hop
questions.

## MCP

The Model Context Protocol (MCP) is an open standard from Anthropic for
connecting LLM applications to external tools and data sources. An MCP
server advertises tools, resources, and prompts; an MCP client (Claude
Desktop, Claude Code, Cursor, or any compatible host) consumes them.
MCP makes it possible to develop a tool integration once and reuse it
across every compatible AI client.
