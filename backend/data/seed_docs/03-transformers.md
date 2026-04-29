# The Transformer Architecture

The Transformer is a neural network architecture introduced by Vaswani et
al. in the 2017 paper "Attention Is All You Need." It replaced the
recurrence of RNNs and the locality of convolutions with a mechanism
called self-attention, which lets every token attend directly to every
other token in the input.

## Self-attention

Self-attention computes three projections of the input — queries, keys,
and values — and uses the scaled dot product of queries and keys as
weights over the values. The scaling factor is the inverse square root of
the key dimension, which prevents the softmax from saturating.

Multi-head attention runs several self-attention operations in parallel
with different learned projections, then concatenates the results. This
lets the model attend to different kinds of relationships at the same
time — for example, syntactic dependencies in one head and coreference in
another.

## Variants

- **Encoder-only** models like BERT are good at understanding tasks:
  classification, extractive QA, and embeddings.
- **Decoder-only** models like GPT, Claude, and LLaMA are good at
  generation: they predict the next token given everything that came
  before.
- **Encoder-decoder** models like T5 and the original Transformer shine on
  sequence-to-sequence tasks like translation and summarization.

## Scaling

The scaling laws work of Kaplan et al. and the Chinchilla paper by
Hoffmann et al. showed that test loss falls predictably as a power law in
parameters, data, and compute. Chinchilla in particular argued that most
contemporary models were undertrained: for a fixed compute budget, a
smaller model trained on more tokens outperforms a larger model trained
on fewer tokens.

## Positional information

Since self-attention is permutation-equivariant, transformers need some
way to encode token order. The original paper used sinusoidal positional
encodings. Modern decoders typically use RoPE (Rotary Position
Embeddings) or ALiBi, which generalize better to sequences longer than
those seen during training.
