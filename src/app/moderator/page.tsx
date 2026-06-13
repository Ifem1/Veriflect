"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useVeriflect } from "@/lib/store";
import { getCase, getReviewFee, FN } from "@/lib/genlayer/contract";
import { isContractConfigured } from "@/lib/genlayer/config";
import type { CaseRecord } from "@/lib/types";
import { StampButton } from "@/components/StampButton";
import { TxStatus } from "@/components/TxStatus";
import { useVeriflectTx } from "@/hooks/useVeriflectTx";
import { usePollCase } from "@/hooks/usePollCase";
import { AuthGuard } from "@/components/AuthGuard";

export default function ModeratorPage() {
  return <AuthGuard><ModeratorInner /></AuthGuard>;
}

function ModeratorInner() {
  const { knownCaseIds, isModeratorRole } = useVeriflect();
  const [cases, setCases] = useState<CaseRecord[]>([]);
  const [reviewFee, setReviewFee] = useState<bigint>(10_000_000_000_000_000n);
  const [tick, setTick] = useState(0);
  const { send, txState, txHash, txError, label, reset } = useVeriflectTx();
  const { startPolling } = usePollCase();

  useEffect(() => {
    if (!isContractConfigured()) return;
    getReviewFee().then(setReviewFee).catch(() => {});
  }, []);

  useEffect(() => {
    if (!isContractConfigured() || knownCaseIds.length === 0) return;
    (async () => {
      const loaded: CaseRecord[] = [];
      for (const id of knownCaseIds) {
        const c = await getCase(id);
        if (c) loaded.push(c);
      }
      setCases(loaded);
    })();
  }, [knownCaseIds, tick]);

  const queue = cases.filter(
    (c) => c.status === "READY_FOR_REVIEW" || c.status === "UNDER_REVIEW" || c.status === "CONTEXT_SUBMITTED"
  );

  const runAction = async (fn: string, args: string[], value = 0n, caseId?: string) => {
    const hash = await send(fn, args, value);
    if (hash && caseId && fn === FN.REVIEW_AUTHENTICITY) startPolling(caseId);
    if (hash) setTimeout(() => setTick((t) => t + 1), 3000);
  };

  if (!isModeratorRole) {
    return (
      <div className="py-20 text-center">
        <p className="font-heading text-2xl">Moderator access required</p>
        <p className="text-sm mt-2 opacity-80">Your wallet address must be added as a moderator by the admin.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="font-heading text-4xl">Moderation Queue</h1>
      <p className="text-sm opacity-80">
        Only moderators and keepers trigger GenLayer reviews. Pattern signals never decide authenticity.
      </p>
      <div className="font-mono text-xs opacity-70">
        Review fee: {(Number(reviewFee) / 1e18).toFixed(4)} GEN per review
      </div>

      {!isContractConfigured() && (
        <div className="border-2 border-seller-saffron bg-seller-saffron/20 p-4 text-sm">Contract not configured.</div>
      )}

      <TxStatus state={txState} label={label} hash={txHash} error={txError} />
      {txState === "failed" && <button onClick={reset} className="text-xs font-mono underline">Reset</button>}

      {queue.length === 0 ? (
        <div className="border-2 border-dashed border-ink-cocoa/40 p-8 text-center">
          <p className="font-heading text-xl">Queue is empty</p>
          <p className="text-sm mt-2 opacity-80">Cases marked READY_FOR_REVIEW will appear here.</p>
        </div>
      ) : (
        <ul className="space-y-3">
          {queue.map((c) => (
            <li key={c.case_id} className="tile-card p-4 flex flex-wrap items-center justify-between gap-3">
              <div>
                <Link href={`/cases/${c.case_id}`} className="font-heading text-lg hover:underline">
                  {c.reason_for_suspicion}
                </Link>
                <div className="text-xs font-mono opacity-70 mt-1">
                  {c.case_id} · {c.status.replace(/_/g, " ")}
                </div>
                <div className="text-xs font-mono opacity-60">{c.product_title} · seller {c.seller_identifier}</div>
              </div>
              <div className="flex flex-wrap gap-2">
                {c.status === "CONTEXT_SUBMITTED" && (
                  <StampButton
                    variant="secondary"
                    disabled={txState === "submitting" || txState === "preparing"}
                    onClick={() => runAction(FN.MARK_READY, [c.case_id])}
                  >
                    Mark ready
                  </StampButton>
                )}
                {c.status === "READY_FOR_REVIEW" && (
                  <StampButton
                    variant="review"
                    disabled={txState === "submitting" || txState === "preparing"}
                    onClick={() => runAction(FN.REVIEW_AUTHENTICITY, [c.case_id], reviewFee, c.case_id)}
                  >
                    {txState === "submitting" ? label : "Run authenticity review"}
                  </StampButton>
                )}
                {c.status === "UNDER_REVIEW" && (
                  <span className="text-xs font-mono text-trust-turquoise border border-trust-turquoise px-2 py-1">
                    Under review · polling
                  </span>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
