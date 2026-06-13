"use client";

import type { ButtonHTMLAttributes, ReactNode } from "react";

type Variant = "primary" | "secondary" | "review" | "evidence" | "appeal";

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  children: ReactNode;
}

const styles: Record<Variant, string> = {
  primary: "bg-trust-turquoise text-market-night border-ink-cocoa shadow-stamp",
  secondary: "bg-bazaar-cream text-pattern-indigo border-pattern-indigo",
  review: "bg-market-night text-bazaar-cream border-trust-turquoise shadow-stamp",
  evidence: "bg-receipt-blue text-bazaar-cream border-ink-cocoa shadow-tile",
  appeal: "bg-transparent text-suspicion-berry border-suspicion-berry",
};

export function StampButton({ variant = "primary", className = "", children, ...rest }: Props) {
  return (
    <button
      {...rest}
      className={[
        "stamp-btn inline-flex items-center justify-center border-2 px-5 py-2.5 text-sm font-heading uppercase tracking-wide transition disabled:cursor-not-allowed disabled:opacity-50",
        styles[variant],
        className,
      ].join(" ")}
    >
      {children}
    </button>
  );
}
