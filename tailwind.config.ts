import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        "market-night": "#111827",
        "bazaar-cream": "#FFF6E5",
        "trust-turquoise": "#18C7B8",
        "review-orchid": "#C084FC",
        "seller-saffron": "#FACC15",
        "signal-tomato": "#F97316",
        "authentic-jade": "#10B981",
        "suspicion-berry": "#BE185D",
        "pattern-indigo": "#4338CA",
        "receipt-blue": "#0EA5E9",
        "ink-cocoa": "#2A1E17",
        "tile-blush": "#FFE4E6",
        "context-sand": "#F5E6C8",
        "ledger-grey": "#94A3B8",
      },
      fontFamily: {
        heading: ["var(--font-bricolage)", "sans-serif"],
        body: ["var(--font-outfit)", "sans-serif"],
        mono: ["var(--font-space-mono)", "monospace"],
      },
      boxShadow: {
        stamp: "3px 3px 0 0 #2A1E17",
        tile: "2px 2px 0 0 #2A1E17",
      },
    },
  },
  plugins: [],
};
export default config;
