"use client";

import type { AuthenticityReview, AuthenticityVerdict, RiskLevel } from "@/lib/types";

const verdictColor: Record<AuthenticityVerdict, string> = {
  GENUINE: "bg-authentic-jade text-bazaar-cream",
  LIKELY_GENUINE: "bg-authentic-jade/80 text-bazaar-cream",
  SUSPICIOUS: "bg-signal-tomato text-market-night",
  SUSPICIOUS_COORDINATED: "bg-suspicion-berry text-bazaar-cream",
  LIKELY_INCENTIVISED: "bg-seller-saffron text-market-night",
  LIKELY_BOT_GENERATED: "bg-pattern-indigo text-bazaar-cream",
  REVIEW_BOMBING: "bg-suspicion-berry/80 text-bazaar-cream",
  SELLER_MANIPULATED: "bg-signal-tomato/90 text-market-night",
  INSUFFICIENT_EVIDENCE: "bg-context-sand text-market-night",
  FALSE_REPORT: "bg-ledger-grey text-market-night",
};

const riskColor: Record<RiskLevel, string> = {
  LOW: "bg-authentic-jade",
  MEDIUM: "bg-seller-saffron",
  HIGH: "bg-signal-tomato",
  CRITICAL: "bg-suspicion-berry text-bazaar-cream",
};

export function AuthenticityStamp({ review }: { review: AuthenticityReview }) {
  return (
    <section className="tile-card p-6 relative stamp-seal-dropped">
      <div className="absolute -top-3 left-6 bg-market-night text-bazaar-cream px-3 py-1 text-xs font-mono uppercase">
        Authenticity Stamp · GenLayer consensus
      </div>

      <div className="grid md:grid-cols-3 gap-4 mt-3">
        <div className={`p-4 border border-ink-cocoa ${verdictColor[review.authenticity_verdict]}`}>
          <div className="text-xs font-mono uppercase opacity-80">Verdict</div>
          <div className="font-heading text-xl mt-1 leading-tight">
            {review.authenticity_verdict.replace(/_/g, " ")}
          </div>
          <div className="text-xs mt-2 opacity-80">{review.review_type}</div>
        </div>

        <div className="p-4 border border-ink-cocoa bg-bazaar-cream">
          <div className="text-xs font-mono uppercase opacity-70">Confidence</div>
          <div className="font-heading text-3xl mt-1">{review.confidence}<span className="text-base">/100</span></div>
        </div>

        <div className={`p-4 border border-ink-cocoa text-market-night ${riskColor[review.risk_level]}`}>
          <div className="text-xs font-mono uppercase opacity-80">Risk level</div>
          <div className="font-heading text-2xl mt-1">{review.risk_level}</div>
        </div>
      </div>

      <div className="mt-4 p-4 border border-pattern-indigo bg-pattern-indigo/5">
        <div className="text-xs font-mono uppercase text-pattern-indigo mb-1">Recommended action</div>
        <div className="font-heading text-lg">{review.recommended_action.replace(/_/g, " ")}</div>
      </div>

      {review.moderation_recommendation && (
        <div className="mt-4 p-4 border border-ink-cocoa/30 bg-white text-sm space-y-1">
          <div className="text-xs font-mono uppercase text-pattern-indigo mb-1">Moderation recommendation</div>
          <div>action · {review.moderation_recommendation.action}</div>
          <div>severity · {review.moderation_recommendation.severity}</div>
          <div>needs human review · {String(review.moderation_recommendation.needs_human_review)}</div>
        </div>
      )}

      <div className="mt-4 grid md:grid-cols-3 gap-4">
        <SignalList title="Supporting signals" items={review.supporting_signals} accent="text-suspicion-berry" />
        <SignalList title="Counter signals" items={review.counter_signals} accent="text-authentic-jade" />
        <SignalList title="Missing context" items={review.missing_context} accent="text-seller-saffron" />
      </div>

      <div className="mt-4 p-4 bg-tile-blush border border-ink-cocoa">
        <div className="text-xs font-mono uppercase mb-1">Summary</div>
        <p className="leading-relaxed">{review.summary}</p>
      </div>

      {review.appeal_decision && (
        <div className="mt-4 p-3 border border-review-orchid bg-review-orchid/10">
          <div className="text-xs font-mono uppercase text-pattern-indigo mb-1">Appeal decision</div>
          <div className="font-heading">{review.appeal_decision.replace(/_/g, " ")}</div>
        </div>
      )}
    </section>
  );
}

function SignalList({ title, items, accent }: { title: string; items: string[]; accent: string }) {
  return (
    <div className="p-3 border border-ink-cocoa/30 bg-white">
      <div className={`text-xs font-mono uppercase ${accent} mb-2`}>{title}</div>
      {items.length === 0 ? (
        <p className="text-xs opacity-60">None recorded.</p>
      ) : (
        <ul className="text-sm space-y-1 list-disc pl-4">
          {items.map((it, i) => <li key={i}>{it}</li>)}
        </ul>
      )}
    </div>
  );
}
