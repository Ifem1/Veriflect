import Link from "next/link";

const stampRail = [
  { label: "GENUINE", cls: "bg-authentic-jade text-bazaar-cream" },
  { label: "LIKELY GENUINE", cls: "bg-authentic-jade/80 text-bazaar-cream" },
  { label: "SUSPICIOUS", cls: "bg-signal-tomato text-market-night" },
  { label: "COORDINATED", cls: "bg-suspicion-berry text-bazaar-cream" },
  { label: "INCENTIVISED", cls: "bg-seller-saffron text-market-night" },
  { label: "BOT GENERATED", cls: "bg-pattern-indigo text-bazaar-cream" },
  { label: "NEEDS CONTEXT", cls: "bg-context-sand text-market-night" },
  { label: "ESCALATE", cls: "bg-market-night text-bazaar-cream" },
];

const tiles = [
  { stars: 5, text: "Amazing quality", cls: "bg-tile-blush" },
  { stars: 1, text: "Arrived broken", cls: "bg-signal-tomato/25" },
  { stars: 5, text: "Best seller ever", cls: "bg-review-orchid/25" },
  { stars: 3, text: "Okay product", cls: "bg-context-sand" },
  { stars: 5, text: "Highly recommend", cls: "bg-tile-blush" },
  { stars: 2, text: "Not as described", cls: "bg-seller-saffron/25" },
];

export default function Home() {
  return (
    <div className="space-y-16">

      {/* Hero */}
      <section className="grid lg:grid-cols-[1fr_1.4fr_0.65fr] gap-8 items-start">
        <div>
          <h1 className="font-heading text-5xl md:text-6xl leading-[1.05]">Veriflect</h1>
          <p className="mt-4 text-lg opacity-80">
            Product review authenticity judged by context and consensus.
          </p>
          <p className="mt-2 text-xs font-mono uppercase text-pattern-indigo">
            Signal Bazaar · GenLayer Studionet
          </p>
          <p className="mt-6 text-sm leading-relaxed">
            Pattern detection surfaces signals. GenLayer validators judge whether reviews appear
            genuine, coordinated, incentivised, or bot-generated — with reasoning and a marketplace
            recommendation.
          </p>
          <p className="mt-4 text-sm">
            Sign in with <strong>email</strong>. Privy creates your embedded wallet automatically.
            No MetaMask needed.
          </p>
        </div>

        <div className="border-2 border-ink-cocoa pattern-tapestry p-5">
          <div className="text-xs font-mono uppercase mb-3 opacity-70">Bazaar signal wall</div>
          <div className="grid grid-cols-3 gap-2">
            {tiles.map((t, i) => (
              <div key={i} className={`p-3 border border-ink-cocoa ${t.cls}`}>
                <div className="font-mono text-xs">{"★".repeat(t.stars)}{"☆".repeat(5 - t.stars)}</div>
                <div className="font-heading mt-1 text-sm">{t.text}</div>
              </div>
            ))}
          </div>
          <p className="mt-3 text-xs opacity-60 italic">Visual placeholders — no reviews are fabricated.</p>
        </div>

        <div className="border-2 border-ink-cocoa bg-market-night text-bazaar-cream p-4">
          <div className="text-xs font-mono uppercase opacity-60 mb-3">Authenticity rail</div>
          <ul className="space-y-2">
            {stampRail.map((s) => (
              <li key={s.label} className={`px-3 py-2 border border-bazaar-cream/20 font-heading text-xs ${s.cls}`}>
                {s.label}
              </li>
            ))}
          </ul>
          <Link
            href="/create-case"
            className="mt-5 block text-center bg-trust-turquoise text-market-night font-heading uppercase py-3 border-2 border-bazaar-cream shadow-stamp text-sm"
          >
            ◆ Open Authenticity Case
          </Link>
          <Link
            href="/moderator"
            className="mt-3 block text-center bg-bazaar-cream text-pattern-indigo font-mono uppercase text-xs py-2 border border-pattern-indigo"
          >
            Moderation Queue
          </Link>
        </div>
      </section>

      {/* Role cards */}
      <section className="grid md:grid-cols-3 gap-4">
        <RoleCard title="REPORT REVIEW" href="/create-case" cls="bg-tile-blush">
          Public users and buyers open authenticity cases. Reports do not trigger GenLayer directly.
        </RoleCard>
        <RoleCard title="REQUEST REVIEW" href="/create-case" cls="bg-context-sand">
          Sellers and reviewers add context, purchase evidence, and narrative before review is run.
        </RoleCard>
        <RoleCard title="RUN AUTHENTICITY REVIEW" href="/moderator" cls="bg-market-night text-bazaar-cream">
          Moderators trigger GenLayer consensus once signals and context are ready. Fee: 0.01 GEN.
        </RoleCard>
      </section>

      {/* Why GenLayer */}
      <section className="border-2 border-pattern-indigo p-6 bg-bazaar-cream">
        <h2 className="font-heading text-2xl">Why this needs GenLayer</h2>
        <p className="mt-3 leading-relaxed text-sm">
          Pattern detection can flag repeated text, timing bursts, rating spikes, and new-account clusters.
          But none of those signals decide authenticity alone. A promotional launch can look like a
          coordinated burst; a defect report can look like a sabotage campaign; identical phrasing can
          come from customers describing the same product. GenLayer validators interpret review text,
          seller context, verified purchase signals, and coordination risk — and return a consensus-backed
          authenticity verdict with a moderation recommendation.
        </p>
        <p className="mt-3 text-xs font-mono uppercase text-pattern-indigo">
          Signals are not verdicts. GenLayer interprets the context.
        </p>
      </section>

      {/* Transaction UX note */}
      <section className="grid md:grid-cols-4 gap-4 text-center text-sm">
        {[
          ["Sign in with email", "Privy creates embedded wallet"],
          ["Open authenticity case", "Product · seller · review · suspicion"],
          ["Submit signals + context", "Pattern evidence · seller narrative"],
          ["GenLayer consensus", "Verdict · confidence · recommended action"],
        ].map(([title, desc], i) => (
          <div key={i} className="border-2 border-ink-cocoa p-4 bg-white">
            <div className="font-heading text-base">{title}</div>
            <p className="text-xs opacity-70 mt-1">{desc}</p>
          </div>
        ))}
      </section>
    </div>
  );
}

function RoleCard({ title, href, cls, children }: { title: string; href: string; cls: string; children: React.ReactNode }) {
  return (
    <Link href={href} className={`block border-2 border-ink-cocoa p-5 hover:-translate-y-px transition ${cls}`}>
      <div className="font-heading text-base">{title}</div>
      <p className="mt-2 text-xs leading-relaxed opacity-80">{children}</p>
    </Link>
  );
}
