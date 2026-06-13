"use client";

import { usePrivy } from "@privy-io/react-auth";

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { ready, authenticated, login } = usePrivy();

  if (!ready) {
    return (
      <div className="py-20 text-center font-mono text-sm opacity-70">Loading…</div>
    );
  }

  if (!authenticated) {
    return (
      <div className="py-20 text-center space-y-4">
        <div className="font-heading text-2xl">Sign in to continue</div>
        <p className="text-sm opacity-80">Veriflect uses email login and an embedded wallet — no MetaMask needed.</p>
        <button
          onClick={() => login()}
          className="font-heading uppercase px-6 py-3 bg-trust-turquoise text-market-night border-2 border-ink-cocoa shadow-stamp"
        >
          Sign in with email
        </button>
      </div>
    );
  }

  return <>{children}</>;
}
