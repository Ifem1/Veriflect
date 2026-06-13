"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { useEffect } from "react";
import { AuthGuard } from "@/components/AuthGuard";
import { AuthenticityStamp } from "@/components/AuthenticityStamp";
import { StampButton } from "@/components/StampButton";
import { TxStatus } from "@/components/TxStatus";
import { usePollCase } from "@/hooks/usePollCase";
import { useVeriflectTx } from "@/hooks/useVeriflectTx";
import { FN, getReviewFee } from "@/lib/genlayer/contract";
import { isContractConfigured } from "@/lib/genlayer/config";
import { useVeriflect } from "@/lib/store";
import { useState } from "react";

export default function CaseDetailPage() {
  return (
    <AuthGuard>
      <CaseDetailInner />
    </AuthGuard>
  );
}

function CaseDetailInner() {
  const { caseId } = useParams<{ caseId: string }>();
  const { isModeratorRole } = useVeriflect();
  const { caseData: c, review, polling, startPolling, refresh } = usePollCase(caseId);
  const { send, txState, txHash, txError, label, reset } = useVeriflectTx();
  const [reviewFee, setReviewFee] = useState<bigint>(10_000_000_000_000_000n);

  useEffect(() => {
    if (isContractConfigured()) {
      getReviewFee().then(setReviewFee).catch(() => {});
    }
  }, []);

  const busy = txState === "preparing" || txState === "submitting";

  const doAction = async (fn: string, args: string[], value = 0n) => {
    const hash = await send(fn, args, value);
    if (hash) setTimeout(() => refresh(caseId), 3000);
  };

  const runReview = async () => {
    const hash = await send(FN.REVIEW_AUTHENTICITY, [caseId], reviewFee);
    if (hash) {
      startPolling(caseId);
    }
  };

  if (!isContractConfigured()) {
    return <p className="text-sm">Contract not configured — case data lives on-chain once Veriflect is deployed.</p>;
  }
  if (!c) {
    return <p className="font-mono text-sm">Loading case {caseId}…</p>;
  }

  return (
    <div className="space-y-8">
      {/* Case header */}
      <header className="border-2 border-ink-cocoa bg-white p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="font-mono text-xs opacity-70">{c.case_id}</div>
            <h1 className="font-heading text-3xl mt-1">{c.reason_for_suspicion}</h1>
            <div className="text-xs font-mono mt-2 opacity-80 space-x-4">
              <span>product · {c.product_title}</span>
              <span>seller · {c.seller_identifier}</span>
              <span>★ {c.rating}</span>
            </div>
          </div>
          <span className="text-xs font-mono uppercase border border-ink-cocoa px-3 py-1 bg-context-sand">
            {c.status.replace(/_/g, " ")}
          </span>
        </div>
      </header>

      {/* Review tile + signals */}
      <div className="grid md:grid-cols-2 gap-4">
        <div className="tile-card p-4">
          <div className="text-xs font-mono uppercase text-pattern-indigo mb-2">Review tile</div>
          <div className="font-mono">{"★".repeat(Math.min(5, Math.round(c.rating)))}{"☆".repeat(Math.max(0, 5 - Math.round(c.rating)))} ({c.rating})</div>
          {c.review_text && <p className="mt-2 text-sm whitespace-pre-wrap">{c.review_text}</p>}
          {c.review_reference && <div className="font-mono text-xs mt-2 opacity-70">ref · {c.review_reference}</div>}
          <div className="text-xs font-mono mt-3 opacity-70">date · {c.review_date}</div>
          {c.reviewer_profile_summary && <div className="text-xs mt-1 opacity-70">reviewer · {c.reviewer_profile_summary}</div>}
          {c.purchase_evidence_summary && <div className="text-xs mt-1 opacity-70">purchase · {c.purchase_evidence_summary}</div>}
        </div>

        <div className="tile-card p-4 pattern-tapestry">
          <div className="text-xs font-mono uppercase text-pattern-indigo mb-2">Case controls</div>
          <div className="flex flex-wrap gap-2">
            <Link href={`/cases/${caseId}/context`}>
              <StampButton variant="secondary">Submit signals + context</StampButton>
            </Link>
            <Link href={`/cases/${caseId}/evidence`}>
              <StampButton variant="evidence">Add evidence</StampButton>
            </Link>
            <Link href={`/cases/${caseId}/appeal`}>
              <StampButton variant="appeal">Open appeal</StampButton>
            </Link>
            {c.status === "CONTEXT_SUBMITTED" || c.status === "OPENED" ? (
              <StampButton
                variant="secondary"
                disabled={busy}
                onClick={() => doAction(FN.MARK_READY, [caseId])}
              >
                {busy ? "…" : "Mark ready"}
              </StampButton>
            ) : null}
            {c.status === "READY_FOR_REVIEW" && (
              <StampButton variant="review" disabled={busy} onClick={runReview}>
                {busy ? label : `Run authenticity review (0.01 GEN)`}
              </StampButton>
            )}
            {isModeratorRole && c.status === "REVIEWED" && (
              <StampButton
                variant="primary"
                disabled={busy}
                onClick={() => doAction(FN.FINALIZE_CASE, [caseId])}
              >
                Finalize case
              </StampButton>
            )}
          </div>

          {polling && (
            <div className="mt-3 text-xs font-mono text-trust-turquoise">
              Waiting for GenLayer validators… polling every 10s
            </div>
          )}

          <TxStatus state={txState} label={label} hash={txHash} error={txError} />
          {txState === "failed" && (
            <button onClick={reset} className="text-xs font-mono underline mt-2">Reset</button>
          )}
        </div>
      </div>

      {/* Authenticity stamp or awaiting */}
      {review ? (
        <AuthenticityStamp review={review} />
      ) : (
        <section className="tile-card p-6 text-center">
          <div className="font-heading text-xl">
            {c.status === "UNDER_REVIEW" ? "UNDER REVIEW — GenLayer validators are working" : "AWAITING AUTHENTICITY REVIEW"}
          </div>
          <p className="text-sm opacity-80 mt-2">
            {c.status === "UNDER_REVIEW"
              ? "This may take several minutes. The page polls automatically."
              : "Submit signals and context, mark the case ready, then run the GenLayer authenticity review (costs 0.01 GEN)."}
          </p>
          {c.status === "UNDER_REVIEW" && !polling && (
            <button
              onClick={() => startPolling(caseId)}
              className="mt-3 text-xs font-mono border border-trust-turquoise text-trust-turquoise px-3 py-1"
            >
              Start polling
            </button>
          )}
        </section>
      )}

      {/* Why GenLayer */}
      <section className="border-2 border-pattern-indigo p-5 bg-pattern-indigo/5">
        <h2 className="font-heading text-xl">Why this needed GenLayer</h2>
        <p className="mt-2 text-sm leading-relaxed">
          Pattern detection can flag repeated text and timing bursts, but only GenLayer validators can
          interpret whether the review text reads as a genuine customer experience, whether the seller
          context plausibly explains a cluster, whether verified purchase signals carry weight in this
          case, and what moderation action a marketplace should actually take.
        </p>
        <p className="mt-2 text-xs font-mono uppercase text-pattern-indigo">
          Signals are not verdicts. GenLayer interprets the context.
        </p>
      </section>
    </div>
  );
}
