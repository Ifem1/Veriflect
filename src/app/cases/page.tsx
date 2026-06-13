"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AuthGuard } from "@/components/AuthGuard";
import { SignalTile } from "@/components/SignalTile";
import { useVeriflect } from "@/lib/store";
import { getCase } from "@/lib/genlayer/contract";
import { isContractConfigured } from "@/lib/genlayer/config";
import type { CaseRecord } from "@/lib/types";

export default function CasesPage() {
  return (
    <AuthGuard>
      <CasesInner />
    </AuthGuard>
  );
}

function CasesInner() {
  const { knownCaseIds } = useVeriflect();
  const [cases, setCases] = useState<CaseRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (!isContractConfigured() || knownCaseIds.length === 0) return;
    let cancel = false;
    setLoading(true);
    (async () => {
      try {
        const res: CaseRecord[] = [];
        for (const id of knownCaseIds) {
          const c = await getCase(id);
          if (c) res.push(c);
        }
        if (!cancel) setCases(res);
      } catch (e: unknown) {
        if (!cancel) setErr(e instanceof Error ? e.message : "Failed");
      } finally {
        if (!cancel) setLoading(false);
      }
    })();
    return () => { cancel = true; };
  }, [knownCaseIds]);

  return (
    <div className="space-y-8">
      <header className="flex items-end justify-between flex-wrap gap-4">
        <div>
          <h1 className="font-heading text-4xl">Signal Bazaar Board</h1>
          <p className="text-sm opacity-80 mt-1">All authenticity cases you have opened or inspected.</p>
        </div>
        <Link href="/create-case" className="font-mono uppercase text-xs px-4 py-2 border-2 border-ink-cocoa bg-trust-turquoise text-market-night">
          Open case
        </Link>
      </header>

      {!isContractConfigured() && (
        <div className="border-2 border-seller-saffron bg-seller-saffron/20 p-4 text-sm">
          Contract not configured — cases load from chain once Veriflect is deployed.
        </div>
      )}

      {loading && <p className="font-mono text-sm">Loading cases…</p>}
      {err && <p className="text-suspicion-berry text-sm">{err}</p>}

      {!loading && knownCaseIds.length === 0 && (
        <div className="border-2 border-dashed border-ink-cocoa/40 p-8 text-center">
          <p className="font-heading text-xl">No cases yet</p>
          <p className="text-sm mt-2 opacity-80">Open an authenticity case to populate the board.</p>
        </div>
      )}

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {cases.map((c) => <SignalTile key={c.case_id} c={c} />)}
      </div>
    </div>
  );
}
