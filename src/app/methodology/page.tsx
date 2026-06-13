export default function MethodologyPage() {
  return (
    <article className="space-y-6 max-w-3xl">
      <h1 className="font-heading text-4xl">Methodology</h1>

      <section className="border-2 border-ink-cocoa bg-white p-5">
        <h2 className="font-heading text-2xl">Two layers</h2>
        <p className="mt-2 leading-relaxed">
          Veriflect separates a deterministic signal layer from a non-deterministic GenLayer
          judgement layer. Signals surface what is observable - repeated text, burst timing, rating
          concentration, verified purchase ratio, new-account clusters, launch proximity. Judgement
          interprets what those signals mean in context.
        </p>
        <p className="mt-2 font-mono text-xs uppercase text-pattern-indigo">
          Signals are not verdicts. GenLayer interprets the context.
        </p>
      </section>

      <section className="border-2 border-ink-cocoa bg-white p-5">
        <h2 className="font-heading text-2xl">Roles and flow</h2>
        <ol className="mt-2 list-decimal space-y-1 pl-6 text-sm">
          <li>Reporter opens an authenticity case.</li>
          <li>Signal scan is created and stored as a profile.</li>
          <li>Sellers and reviewers submit context where available.</li>
          <li>Moderator or keeper marks the case ready for review.</li>
          <li>Moderator or keeper triggers GenLayer authenticity review.</li>
          <li>Contract stores the authenticity verdict and recommended action.</li>
          <li>Marketplace can keep, label, downrank, hold, remove, or escalate the review.</li>
        </ol>
      </section>

      <section className="border-2 border-ink-cocoa bg-white p-5">
        <h2 className="font-heading text-2xl">Allowed verdicts</h2>
        <p className="mt-2 font-mono text-xs">
          GENUINE - LIKELY_GENUINE - SUSPICIOUS - LIKELY_COORDINATED - INCENTIVISED -
          COMPETITOR_SABOTAGE_POSSIBLE - NEEDS_MORE_CONTEXT - ESCALATE
        </p>
        <h3 className="mt-4 font-heading text-lg">Coordination risk</h3>
        <p className="font-mono text-xs">LOW - MEDIUM - HIGH - CRITICAL - UNCLEAR</p>
        <h3 className="mt-4 font-heading text-lg">Recommended actions</h3>
        <p className="font-mono text-xs">
          KEEP_VISIBLE - ADD_CONTEXT_LABEL - DOWNRANK_AND_REQUEST_CONTEXT - HOLD_FOR_MODERATION -
          REMOVE_REVIEW - ESCALATE_TO_TRUST_TEAM - REQUEST_MORE_EVIDENCE
        </p>
      </section>

      <section className="border-2 border-ink-cocoa bg-white p-5">
        <h2 className="font-heading text-2xl">Privacy</h2>
        <p className="mt-2 text-sm leading-relaxed">
          Default case visibility is MARKETPLACE_MODERATION_PRIVATE. Veriflect does not store raw
          private marketplace data on-chain. Reviews, evidence, and seller context are kept as
          hashes, CIDs, private links, redacted summaries, and metadata.
        </p>
      </section>

      <section className="border-2 border-pattern-indigo bg-pattern-indigo/5 p-5">
        <h2 className="font-heading text-2xl">Why GenLayer</h2>
        <p className="mt-2 leading-relaxed">
          Review authenticity needs contextual judgement over review text, timing, patterns, seller
          context, verified purchase signals, and coordination risk. A deterministic contract can
          store and compare signals; only GenLayer consensus can decide whether a cluster looks
          coordinated, whether a promotion plausibly explains a burst, and what a marketplace should
          do about it.
        </p>
      </section>
    </article>
  );
}
