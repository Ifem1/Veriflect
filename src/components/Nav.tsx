"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { usePrivy, useWallets } from "@privy-io/react-auth";
import { useEffect } from "react";
import { useVeriflect } from "@/lib/store";
import { isModerator } from "@/lib/genlayer/contract";
import { isContractConfigured } from "@/lib/genlayer/config";

const publicLinks = [
  { href: "/", label: "Bazaar" },
  { href: "/docs", label: "Docs" },
];

const authLinks = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/cases", label: "Cases" },
  { href: "/create-case", label: "Open Case" },
];

const modLinks = [{ href: "/moderator", label: "Moderation" }];
const adminLinks = [{ href: "/admin", label: "Admin" }];

export function Nav() {
  const path = usePathname();
  const { ready, authenticated, user, login, logout } = usePrivy();
  const { wallets } = useWallets();
  const { setAddress, setModeratorRole, isModeratorRole } = useVeriflect();

  // Sync embedded wallet address into store
  useEffect(() => {
    if (!authenticated || !user) {
      setAddress(null);
      setModeratorRole(false);
      return;
    }
    // Use external wallet if connected, otherwise use embedded wallet
    const active =
      wallets.find((w) => w.walletClientType !== "privy") ??
      wallets.find((w) => w.walletClientType === "privy");
    const addr = active?.address ?? null;
    setAddress(addr);

    if (addr && isContractConfigured()) {
      isModerator(addr)
        .then(setModeratorRole)
        .catch(() => setModeratorRole(false));
    }
  }, [authenticated, user, wallets, setAddress, setModeratorRole]);

  const isActive = (href: string) =>
    href === "/" ? path === "/" : path?.startsWith(href);

  const links = [
    ...publicLinks,
    ...(authenticated ? authLinks : []),
    ...(isModeratorRole ? modLinks : []),
    ...(isModeratorRole ? adminLinks : []),
  ];

  return (
    <header className="border-b border-ink-cocoa/20 bg-bazaar-cream">
      <div className="mx-auto max-w-7xl px-6 py-4 flex items-center justify-between gap-4">
        <Link href="/" className="flex items-center gap-2 shrink-0">
          <img src="/favicon.svg" alt="" className="w-8 h-8" aria-hidden="true" />
          <span className="font-heading text-2xl tracking-tight">
            Veriflect<span className="text-trust-turquoise">.</span>
          </span>
        </Link>

        <nav className="flex flex-wrap gap-2 text-sm flex-1">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={`px-3 py-1.5 border border-ink-cocoa font-mono uppercase text-xs ${
                isActive(l.href)
                  ? "bg-market-night text-bazaar-cream"
                  : "bg-bazaar-cream hover:bg-tile-blush"
              }`}
            >
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="shrink-0">
          {!ready ? null : authenticated ? (
            <button
              onClick={() => logout()}
              className="font-mono text-xs px-3 py-1.5 border border-ink-cocoa hover:bg-tile-blush"
            >
              Sign out
            </button>
          ) : (
            <button
              onClick={() => login()}
              className="font-heading uppercase text-sm px-4 py-2 bg-trust-turquoise text-market-night border-2 border-ink-cocoa shadow-stamp"
            >
              Sign in
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
