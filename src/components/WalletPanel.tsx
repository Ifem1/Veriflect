"use client";

import { usePrivy, useWallets } from "@privy-io/react-auth";
import { useState } from "react";

export function WalletPanel() {
  const { authenticated, user, exportWallet } = usePrivy();
  const { wallets } = useWallets();
  const [copied, setCopied] = useState(false);

  const embeddedWallet = wallets.find((w) => w.walletClientType === "privy");
  const addr = embeddedWallet?.address;

  if (!authenticated || !addr) return null;

  const copy = async () => {
    await navigator.clipboard.writeText(addr);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="tile-card p-4 space-y-3">
      <div className="text-xs font-mono uppercase text-pattern-indigo">Embedded wallet</div>

      <div className="flex items-center gap-2 flex-wrap">
        <code className="font-mono text-xs bg-context-sand px-2 py-1 break-all">
          {addr.slice(0, 10)}…{addr.slice(-8)}
        </code>
        <button
          onClick={copy}
          className="text-xs font-mono border border-ink-cocoa px-2 py-1 hover:bg-tile-blush"
        >
          {copied ? "Copied!" : "Copy"}
        </button>
        <button
          onClick={() => exportWallet()}
          className="text-xs font-mono border border-pattern-indigo text-pattern-indigo px-2 py-1 hover:bg-pattern-indigo/10"
        >
          Export
        </button>
      </div>

      {user?.email?.address && (
        <div className="text-xs font-mono opacity-70">{user.email.address}</div>
      )}
    </div>
  );
}
