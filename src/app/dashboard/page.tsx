"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePrivy } from "@privy-io/react-auth";
import { useWallets } from "@privy-io/react-auth";
import { AuthGuard } from "@/components/AuthGuard";
import { WalletPanel } from "@/components/WalletPanel";
import { SignalTile } from "@/components/SignalTile";
import { getCase, getStats, getUserCases, isModerator } from "@/lib/genlayer/contract";
import { isContractConfigured } from "@/lib/genlayer/config";
import type { CaseRecord, ProtocolStats } from "@/lib/types";
import { useVeriflect } from "@/lib/store";

export default function DashboardPage() {
  return (
    <AuthGuard>
      <DashboardInner />
    </AuthGuard>
  );
}

function DashboardInner() {
  const { user } = usePrivy();
  const { wallets } = useWallets();
  const { addKnownCase } = useVeriflect();
  const [cases, setCases] = useState<CaseRecord[]>([]);
  const [stats, setStats] = useState<ProtocolStats | null>(null);
  const [isMod, setIsMod] = useState(false);
  const [loading, setLoading] = useState(true);

  const embeddedWallet = wallets.find((w) => w.walletClientType === "privy");
  const addr = embeddedWallet?.address;
  const email = (user?.linkedAccounts?.find((a: any) => a.type === "email") as any)?.address;

  useEffect(() => {
    if (!isContractConfigured() || !addr) { setLoading(false); return; }
    (async () => {
      try {
        const [caseIds, st, mod] = await Promise.all([
          getUserCases(addr),
          getStats(),
          isModerator(addr),
        ]);
        setStats(st);
        setIsMod(mod);
        const loaded: CaseRecord[] = [];
        for (const id of caseIds) {
          const c = await getCase(id);
          if (c) { loaded.push(c); addKnownCase(id); }
        }
        setCases(loaded);
      } catch { /* ignore */ }
      finally { setLoading(false); }
    })();
  }, [addr, addKnownCase]);

  return (
    <div className="space-y-8">
      <h1 className="font-heading text-4xl">Dashboard</h1>

      <div className="grid md:grid-cols-3 gap-4">
        <WalletPanel />

        {stats && (
          <div className="tile-card p-4 col-span-2">
            <div className="text-xs font-mono uppercase text-pattern-indigo mb-3">Protocol stats</div>
            <div className="grid grid-cols-4 gap-3 text-center">
              {[
                ["Cases", stats.case_count],
                ["Reviews", stats.review_count],
                ["Appeals", stats.appeal_count],
                ["Evidence", stats.evidence_count],
              ].map(([label, val]) => (
                <div key={String(label)}>
                  <div className="font-heading text-2xl">{String(val)}</div>
                  <div className="text-xs font-mono opacity-70 uppercase">{String(label)}</div>
                </div>
              ))}
            </div>
            {isMod && (
              <div className="mt-3 text-xs font-mono uppercase text-trust-turquoise">
                You are a moderator on this network
              </div>
            )}
          </div>
        )}
      </div>

      <div className="flex items-center justify-between">
        <h2 className="font-heading text-2xl">Your cases</h2>
        <Link href="/create-case" className="font-mono text-xs px-4 py-2 border-2 border-ink-cocoa bg-trust-turquoise text-market-night">
          Open new case
        </Link>
      </div>

      {!isContractConfigured() && (
        <div className="border-2 border-seller-saffron bg-seller-saffron/20 p-4 text-sm">
          Contract not configured — cases load from chain once Veriflect is deployed.
        </div>
      )}

      {loading && <p className="font-mono text-sm">Loading…</p>}

      {!loading && cases.length === 0 && (
        <div className="border-2 border-dashed border-ink-cocoa/40 p-8 text-center">
          <p className="font-heading text-xl">No cases yet</p>
          <p className="text-sm mt-2 opacity-80">Open a case to start judging review authenticity.</p>
        </div>
      )}

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {cases.map((c) => <SignalTile key={c.case_id} c={c} />)}
      </div>
    </div>
  );
}
