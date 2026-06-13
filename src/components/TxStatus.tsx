"use client";

import type { TxState } from "@/lib/types";
import { ENV } from "@/lib/genlayer/config";

const colors: Record<TxState, string> = {
  idle: "",
  preparing: "bg-seller-saffron/20 border-seller-saffron",
  submitting: "bg-receipt-blue/20 border-receipt-blue",
  submitted: "bg-receipt-blue/20 border-receipt-blue",
  polling: "bg-trust-turquoise/20 border-trust-turquoise",
  finalized: "bg-authentic-jade/20 border-authentic-jade",
  failed: "bg-suspicion-berry/20 border-suspicion-berry",
};

interface Props {
  state: TxState;
  label: string;
  hash: string | null;
  error: string | null;
}

export function TxStatus({ state, label, hash, error }: Props) {
  if (state === "idle") return null;
  return (
    <div className={`border-2 p-3 text-sm ${colors[state]}`}>
      <div className="font-mono uppercase text-xs mb-1">{label}</div>
      {hash && (
        <div className="font-mono text-xs break-all opacity-80">
          tx {hash.slice(0, 18)}…{hash.slice(-8)}{" "}
          <a
            href={`${ENV.explorerUrl}/tx/${hash}`}
            target="_blank"
            rel="noopener noreferrer"
            className="underline"
          >
            view
          </a>
        </div>
      )}
      {error && <div className="text-suspicion-berry text-xs mt-1">{error}</div>}
      {state === "polling" && (
        <div className="mt-1 text-xs opacity-70">
          Polling every 10s · up to 15 min for GenLayer consensus
        </div>
      )}
    </div>
  );
}
