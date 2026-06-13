"use client";

import Link from "next/link";
import type { CaseRecord } from "@/lib/types";

const statusColors: Record<string, string> = {
  OPENED: "bg-context-sand",
  CONTEXT_SUBMITTED: "bg-receipt-blue/20",
  READY_FOR_REVIEW: "bg-seller-saffron/40",
  UNDER_REVIEW: "bg-trust-turquoise/20",
  REVIEWED: "bg-authentic-jade/30",
  APPEALED: "bg-suspicion-berry/20",
  FINALIZED: "bg-pattern-indigo/20",
};

export function SignalTile({ c }: { c: CaseRecord }) {
  return (
    <Link
      href={`/cases/${c.case_id}`}
      className={`block tile-card p-4 hover:-translate-y-px transition ${statusColors[c.status] ?? ""}`}
    >
      <div className="flex items-start justify-between">
        <div className="font-mono text-xs opacity-70 break-all">{c.case_id}</div>
        <span className="text-[10px] font-mono uppercase border border-ink-cocoa px-2 py-0.5 ml-2 shrink-0">
          {c.status.replace(/_/g, " ")}
        </span>
      </div>
      <div className="font-heading text-base mt-2 line-clamp-2">{c.reason_for_suspicion}</div>
      <div className="text-xs font-mono mt-2 opacity-80 space-y-0.5">
        <div>product · {c.product_title}</div>
        <div>seller · {c.seller_identifier}</div>
        <div>★ {c.rating} · {c.review_date}</div>
      </div>
      <div className="mt-3 text-xs uppercase font-mono text-pattern-indigo">Inspect signals →</div>
    </Link>
  );
}
