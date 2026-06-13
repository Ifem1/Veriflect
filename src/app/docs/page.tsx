export default function DocsPage() {
  return (
    <article className="space-y-6 max-w-3xl">
      <h1 className="font-heading text-4xl">Veriflect Docs</h1>

      <section className="border-2 border-ink-cocoa bg-white p-5">
        <h2 className="font-heading text-2xl">What Veriflect judges</h2>
        <p className="mt-2 leading-relaxed text-sm">
          Veriflect judges whether a product review appears genuine, suspicious, incentivised, bot-like,
          coordinated, review-bombed, or seller-manipulated — based on review text, rating pattern,
          timing, seller context, reviewer history summary, purchase evidence, and marketplace signals.
        </p>
        <p className="mt-2 text-xs font-mono uppercase text-pattern-indigo">
          Signals are not verdicts. GenLayer interprets the context.
        </p>
      </section>

      <section className="border-2 border-ink-cocoa bg-white p-5">
        <h2 className="font-heading text-2xl">Auth and wallet</h2>
        <p className="mt-2 text-sm leading-relaxed">
          Veriflect uses <strong>email login via Privy</strong>. After signing in, Privy automatically
          creates an embedded wallet. You do not need MetaMask or WalletConnect. The embedded wallet
          address is your Veriflect identity on GenLayer Studionet. You can copy or export it from
          the Dashboard.
        </p>
      </section>

      <section className="border-2 border-ink-cocoa bg-white p-5">
        <h2 className="font-heading text-2xl">Roles</h2>
        <ul className="mt-2 text-sm space-y-2 list-disc pl-5">
          <li><strong>Reporter</strong> — opens authenticity cases. Cannot trigger GenLayer review directly.</li>
          <li><strong>Seller / Reviewer</strong> — submits context or appeal evidence.</li>
          <li><strong>Moderator / Keeper</strong> — marks cases ready and triggers GenLayer reviews. Cannot decide verdict.</li>
          <li><strong>Admin</strong> — protocol admin only. Cannot override verdicts.</li>
          <li><strong>GenLayer Validators</strong> — the actual authenticity judges.</li>
        </ul>
      </section>

      <section className="border-2 border-ink-cocoa bg-white p-5">
        <h2 className="font-heading text-2xl">Flow</h2>
        <ol className="mt-2 text-sm list-decimal pl-5 space-y-1">
          <li>Sign in with email — Privy creates your embedded wallet.</li>
          <li>Open a case with product, review text, seller identifier, and reason for suspicion.</li>
          <li>Add signal profile — timing, rating anomaly, wording patterns, cluster similarity.</li>
          <li>Add seller or reviewer context.</li>
          <li>Mark case ready for review.</li>
          <li>Moderator runs GenLayer authenticity review (0.01 GEN fee).</li>
          <li>GenLayer validators return verdict, confidence, risk level, and recommended action.</li>
          <li>Marketplace acts on the recommendation.</li>
        </ol>
      </section>

      <section className="border-2 border-ink-cocoa bg-white p-5">
        <h2 className="font-heading text-2xl">Verdicts</h2>
        <p className="mt-2 font-mono text-xs leading-loose">
          GENUINE · LIKELY_GENUINE · SUSPICIOUS · SUSPICIOUS_COORDINATED · LIKELY_INCENTIVISED ·
          LIKELY_BOT_GENERATED · REVIEW_BOMBING · SELLER_MANIPULATED · INSUFFICIENT_EVIDENCE · FALSE_REPORT
        </p>
        <h3 className="font-heading text-lg mt-4">Risk levels</h3>
        <p className="font-mono text-xs">LOW · MEDIUM · HIGH · CRITICAL</p>
        <h3 className="font-heading text-lg mt-4">Recommended actions</h3>
        <p className="font-mono text-xs leading-loose">
          NO_ACTION · LABEL_AS_UNVERIFIED · HOLD_FOR_REVIEW · ESCALATE_TO_MARKETPLACE_MODERATOR ·
          REQUEST_MORE_CONTEXT · REMOVE_OR_SUPPRESS_RECOMMENDED
        </p>
      </section>

      <section className="border-2 border-ink-cocoa bg-white p-5">
        <h2 className="font-heading text-2xl">Transaction UX</h2>
        <p className="mt-2 text-sm leading-relaxed">
          Veriflect uses Privy embedded wallet for all transactions. The UX shows simple states:
          Preparing → Submitting → Submitted → Waiting for GenLayer validators → Finalized.
          For GenLayer reviews, the page polls every 10 seconds for up to 15 minutes while validators
          reach consensus.
        </p>
      </section>

      <section className="border-2 border-ink-cocoa bg-white p-5">
        <h2 className="font-heading text-2xl">Privacy</h2>
        <p className="mt-2 text-sm leading-relaxed">
          Veriflect does not store raw private user data on-chain. Cases use sanitised summaries,
          hashes, CIDs, and redacted metadata. Default visibility is moderation-private.
        </p>
      </section>

      <section className="border-2 border-pattern-indigo bg-pattern-indigo/5 p-5">
        <h2 className="font-heading text-2xl">Why GenLayer</h2>
        <p className="mt-2 leading-relaxed">
          Review authenticity needs contextual judgement over review text, timing, patterns, seller
          context, verified purchase signals, and coordination risk. A deterministic contract can store
          and compare signals. Only GenLayer validators can decide whether a cluster looks coordinated,
          whether a promotion plausibly explains a burst, and what a marketplace should actually do.
        </p>
      </section>
    </article>
  );
}
