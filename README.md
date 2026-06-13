# Veriflect

Product review authenticity judged by context, patterns, and consensus.

Veriflect is a GenLayer-powered review authenticity layer for e-commerce trust and reputation
systems. It separates deterministic pattern signals from non-deterministic authenticity judgement.

## Stack

- Next.js 15
- TypeScript strict
- Tailwind CSS
- GenLayer JS SDK 1.2
- Viem
- Zustand
- React Hook Form
- Zod
- IndexedDB

## Setup

```bash
npm install
npm run dev
```

Configure `.env.local` and add the deployed contract address:

```bash
NEXT_PUBLIC_GENLAYER_CONTRACT_ADDRESS=0x...
```

## Contract

`contract/veriflect.py` deploys on GenLayer Studionet. Deterministic writes manage cases,
signals, context, evidence, and appeals. GenLayer functions `review_authenticity`,
`review_appeal`, `assess_review_cluster`, and `assess_seller_context` are the consensus layer.

## Flow

```text
REPORT REVIEW (public)
  -> signal scan saved
  -> REQUEST REVIEW (seller / reviewer adds context + evidence)
  -> mark ready for review
  -> RUN AUTHENTICITY REVIEW (moderator)
  -> Authenticity Stamp stored on-chain
  -> marketplace acts on recommended action
```

Pattern signals are not verdicts. GenLayer interprets the context.
