"use client";

import { CONTRACT_MISSING_MESSAGE, ENV, isContractConfigured } from "@/lib/genlayer/config";

export function ConfigBanner() {
  if (isContractConfigured()) {
    return (
      <div className="border-b border-authentic-jade bg-authentic-jade/10 px-6 py-2 text-center font-mono text-xs text-ink-cocoa">
        Connected · {ENV.networkName} · contract {ENV.contractAddress.slice(0, 10)}...{ENV.contractAddress.slice(-6)}
      </div>
    );
  }

  return (
    <div className="border-b border-seller-saffron bg-seller-saffron/25 px-6 py-2 text-center text-xs text-ink-cocoa">
      {CONTRACT_MISSING_MESSAGE}
    </div>
  );
}
