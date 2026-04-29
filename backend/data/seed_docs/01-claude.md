# Claude and the Anthropic Model Family

Claude is a family of large language models built by Anthropic, an AI safety
company founded in 2021 by Dario Amodei and Daniela Amodei. Anthropic is
headquartered in San Francisco and focuses on research into AI alignment,
interpretability, and the responsible deployment of frontier models.

## Model tiers

The Claude family is organized into three tiers:

- **Haiku** — the fastest and most cost-efficient tier, designed for
  high-throughput workloads such as classification, lightweight extraction,
  and realtime chat.
- **Sonnet** — the balanced tier, designed for most production workloads
  including coding, retrieval-augmented generation, and complex tool use.
- **Opus** — the most capable tier, designed for the hardest reasoning,
  research, and agentic tasks.

As of the Claude 4 generation, the lineup includes Haiku 4.5, Sonnet 4.6, and
Opus 4.7. Opus 4.7 supports a 1M-token context window, making it well suited
for long-document analysis and multi-file codebases.

## Capabilities

Claude models support structured tool use, vision, long-context reading,
prompt caching, and extended thinking. Extended thinking lets the model
allocate additional internal reasoning tokens before producing a final
answer, which can meaningfully improve accuracy on math, coding, and
planning tasks.

Claude is also the model that powers Claude Code, Anthropic's official
agentic coding CLI, as well as the Claude Agent SDK for building custom
long-running agents.

## Safety and constitutional AI

Anthropic's alignment research includes Constitutional AI, a technique where
the model is trained to critique and revise its own outputs against a set of
written principles. This is complemented by interpretability research
aiming to reverse-engineer the internal circuits learned by transformer
models.
