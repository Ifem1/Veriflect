"use client";

import { useEffect, useState } from "react";
import { getStats, FN } from "@/lib/genlayer/contract";
import { isContractConfigured } from "@/lib/genlayer/config";
import { StampButton } from "@/components/StampButton";
import { TxStatus } from "@/components/TxStatus";
import { useVeriflectTx } from "@/hooks/useVeriflectTx";
import { AuthGuard } from "@/components/AuthGuard";
import { useVeriflect } from "@/lib/store";
import type { ProtocolStats } from "@/lib/types";

export default function AdminPage() {
  return <AuthGuard><AdminInner /></AuthGuard>;
}

function AdminInner() {
  const { isModeratorRole } = useVeriflect();
  const [stats, setStats] = useState<ProtocolStats | null>(null);
  const [addr, setAddr] = useState("");
  const [fee, setFee] = useState("10000000000000000");
  const [tick, setTick] = useState(0);
  const { send, txState, txHash, txError, label, reset } = useVeriflectTx();

  useEffect(() => {
    if (!isContractConfigured()) return;
    getStats().then(setStats).catch(() => {});
  }, [tick]);

  const run = async (fn: string, args: unknown[]) => {
    const hash = await send(fn, args);
    if (hash) setTimeout(() => setTick((t) => t + 1), 3000);
  };

  const busy = txState === "preparing" || txState === "submitting";

  if (!isModeratorRole) {
    return (
      <div className="py-20 text-center">
        <p className="font-heading text-2xl">Admin access required</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl space-y-8">
      <h1 className="font-heading text-4xl">Admin</h1>
      <p className="text-sm opacity-80">Admins cannot override GenLayer verdicts or approve/reject cases as final truth.</p>

      {!isContractConfigured() && <p className="text-sm">Contract not configured.</p>}

      <TxStatus state={txState} label={label} hash={txHash} error={txError} />
      {txState === "failed" && <button onClick={reset} className="text-xs font-mono underline">Reset</button>}

      <section className="tile-card p-5">
        <div className="text-xs font-mono uppercase text-pattern-indigo mb-3">Protocol stats</div>
        {stats ? (
          <ul className="font-mono text-sm space-y-1">
            <li>cases · {stats.case_count}</li>
            <li>evidence · {stats.evidence_count}</li>
            <li>reviews · {stats.review_count}</li>
            <li>appeals · {stats.appeal_count}</li>
            <li>review fee · {(stats.review_fee_wei / 1e18).toFixed(4)} GEN</li>
            <li>paused · {String(stats.paused)}</li>
          </ul>
        ) : <p className="text-sm opacity-70">No stats yet.</p>}
      </section>

      <section className="tile-card p-5 space-y-3">
        <div className="font-heading text-xl">Moderator management</div>
        <input
          className="w-full border border-ink-cocoa bg-bazaar-cream px-3 py-2 font-mono text-sm"
          placeholder="0x... address"
          value={addr}
          onChange={(e) => setAddr(e.target.value)}
        />
        <div className="flex flex-wrap gap-3">
          <StampButton variant="primary" disabled={busy || !addr} onClick={() => run(FN.ADD_MODERATOR, [addr])}>
            Add moderator
          </StampButton>
          <StampButton variant="appeal" disabled={busy || !addr} onClick={() => run(FN.REMOVE_MODERATOR, [addr])}>
            Remove moderator
          </StampButton>
        </div>
      </section>

      <section className="tile-card p-5 space-y-3">
        <div className="font-heading text-xl">Review fee</div>
        <input
          className="w-full border border-ink-cocoa bg-bazaar-cream px-3 py-2 font-mono text-sm"
          placeholder="fee in wei (e.g. 10000000000000000)"
          value={fee}
          onChange={(e) => setFee(e.target.value)}
        />
        <StampButton variant="secondary" disabled={busy || !fee} onClick={() => run(FN.SET_FEE, [BigInt(fee)])}>
          Set review fee
        </StampButton>
      </section>

      <section className="tile-card p-5 space-y-3">
        <div className="font-heading text-xl">Protocol controls</div>
        <div className="flex flex-wrap gap-3">
          <StampButton variant="appeal" disabled={busy} onClick={() => run(FN.PAUSE, [])}>Pause protocol</StampButton>
          <StampButton variant="primary" disabled={busy} onClick={() => run(FN.UNPAUSE, [])}>Unpause protocol</StampButton>
        </div>
      </section>
    </div>
  );
}
