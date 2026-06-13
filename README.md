# Veriflect

**AI-powered product review authenticity judge — built on GenLayer.**

Live: [veriflect.vercel.app](https://veriflect.vercel.app)

---

## The Problem

Fake reviews are one of the most damaging and hard-to-solve problems in e-commerce. Sellers
inflate ratings with bot-generated, incentivised, or coordinated reviews. Competitors
review-bomb products to destroy reputation. Marketplaces are left with blunt tools — keyword
filters and flagging systems — that either miss sophisticated fraud or punish legitimate sellers.

The root issue: **pattern detection is not the same as authenticity judgement.** A burst of
5-star reviews in 24 hours looks suspicious by the numbers, but it could be a legitimate
promotional campaign, a product going viral, or a coordinated attack. No rule-based system can
reliably tell the difference. You need context, reasoning, and a trustless judge that cannot be
bribed or manipulated.

---

## What Veriflect Does

Veriflect is a decentralised review authenticity layer. Anyone — a marketplace operator, a
suspicious buyer, a seller defending their reputation — can open a case against a review or
review cluster. They submit:

- The review text, rating, and metadata
- Signal data (burst patterns, verified purchase ratio, reviewer age, text similarity scores)
- Context (seller explanation, marketplace notes, competitor activity)
- Evidence (screenshots, invoices, links)

Once a case is ready, anyone can trigger an **Authenticity Review** by paying a small GEN fee.
GenLayer's validator network then runs the case through an LLM judge with an
**equivocation principle** — multiple validators independently produce a verdict, and consensus
is only reached when their conclusions agree in substance. The result is stored permanently
on-chain as an **Authenticity Stamp**.

---

## How GenLayer Makes This Possible

Traditional smart contracts are deterministic — they cannot reason about nuance, context, or
natural language. Veriflect's contract (`contract/veriflect.py`) is a **GenLayer Intelligent
Contract** that combines two layers:

| Layer | What it does |
|---|---|
| **Deterministic writes** | Case creation, signal profiles, context, evidence, appeals — stored on-chain via standard write methods |
| **Non-deterministic AI consensus** | `review_authenticity` and `review_appeal` call an LLM judge across multiple GenLayer validators. Results are only accepted when validators reach equivocation-proof consensus |

The LLM prompt instructs the judge to distinguish **signal layer** (observable patterns) from
**judgement layer** (contextual interpretation) — so a 5-star burst from new accounts gets
analysed against the seller's explanation, marketplace history, and competitor context before
a verdict is issued.

Every verdict includes:
- `authenticity_verdict` — GENUINE, SUSPICIOUS, REVIEW_BOMBING, SELLER_MANIPULATED, etc.
- `confidence` — 0–100
- `risk_level` — LOW / MEDIUM / HIGH / CRITICAL
- `recommended_action` — NO_ACTION through REMOVE_OR_SUPPRESS_RECOMMENDED
- `supporting_signals`, `counter_signals`, `missing_context`
- `moderation_recommendation` — structured object for marketplace action

Appeals are also supported — a seller or reviewer can contest a verdict with new evidence, and
the contract runs a second AI consensus that reconsiders the original judgement.

---

## Who Uses Veriflect

| Role | What they do |
|---|---|
| **Anyone** | Opens a case, submits signals and context, triggers an AI review, reads verdicts |
| **Sellers / Reviewers** | Add context and evidence to defend against a case, file appeals |
| **Marketplace Moderators** | Finalize cases after review, act on recommended actions |
| **Protocol Owner** | Manages moderators, adjusts the review fee, can pause the protocol |

Authentication is handled by Privy — users can log in with email or connect an external wallet
(MetaMask, WalletConnect, Coinbase Wallet). Email users get an embedded wallet automatically.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 16, TypeScript, Tailwind CSS |
| Auth & Wallets | Privy v3 (email + embedded + external wallets) |
| Blockchain SDK | GenLayer JS SDK 1.2, Viem |
| State | Zustand, IndexedDB |
| Smart Contract | GenLayer Intelligent Contract (Python, GenVM v0.2.16) |
| Network | GenLayer Studionet (chainId 61999) |
| Deployment | Vercel (frontend) |

---

## Contract

**Address:** `0x2823dE35e377EBa2d027ac97E40932532E985Ddd` on GenLayer Studionet

`contract/veriflect.py` — Key methods:

```
create_case          — open a review authenticity case
add_signal_profile   — attach pattern signal data
add_context          — attach seller / reviewer context
add_evidence         — attach supporting evidence
mark_ready_for_review — move case to reviewable state
review_authenticity  — trigger GenLayer AI consensus (payable, 0.01 GEN)
open_appeal          — contest a verdict with new evidence
review_appeal        — trigger AI consensus on the appeal (payable, 0.01 GEN)
finalize_case        — moderator closes a case
get_review           — read the on-chain authenticity stamp
get_appeal_review    — read the appeal verdict
```

---

## Case Flow

```
Reporter opens case
  → Signal profile submitted (burst patterns, ratings, reviewer age)
  → Seller / reviewer adds context + evidence
  → Case marked READY_FOR_REVIEW
  → Any user pays 0.01 GEN to trigger review
  → GenLayer validators run LLM judge in parallel
  → Consensus reached → Authenticity Stamp stored on-chain
  → Status: REVIEWED
  → Moderator finalizes → Status: FINALIZED
  → (Optional) Appeal filed → review_appeal triggered → verdict updated
```

---

## Local Setup

```bash
git clone https://github.com/Ifem1/Veriflect.git
cd Veriflect
cp .env.example .env.local
# fill in NEXT_PUBLIC_PRIVY_APP_ID
npm install
npm run dev
```

---

## Test Suite

End-to-end tests run against GenLayer Studionet using genlayer-js:

```bash
cp tests/.env.test.example tests/.env.test
# fill in 4 private keys and CONTRACT_ADDRESS
node tests/test-all.mjs
```

25/31 suites green covering the full user-facing flow — case creation, signal profiling,
context, evidence, ready-for-review, fee enforcement, appeal flow, access control reverts,
and live AI consensus with real GenLayer verdicts.

---

## Environment Variables

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_PRIVY_APP_ID` | Your Privy app ID |
| `NEXT_PUBLIC_GENLAYER_CONTRACT_ADDRESS` | Deployed contract address |
| `NEXT_PUBLIC_GENLAYER_RPC_URL` | GenLayer RPC endpoint |
| `NEXT_PUBLIC_GENLAYER_CHAIN_ID` | 61999 for Studionet |
| `NEXT_PUBLIC_GENLAYER_NETWORK_NAME` | Display name |
| `NEXT_PUBLIC_GENLAYER_EXPLORER_URL` | Block explorer URL |
| `NEXT_PUBLIC_GENLAYER_CURRENCY` | GEN |
