import type { Metadata } from "next";
import { Bricolage_Grotesque, Outfit, Space_Mono } from "next/font/google";
import "./globals.css";
import { PrivyAppProvider } from "@/providers/PrivyAppProvider";
import dynamic from "next/dynamic";
import { ConfigBanner } from "@/components/ConfigBanner";

const Nav = dynamic(() => import("@/components/Nav").then((m) => m.Nav), { ssr: false });

const bricolage = Bricolage_Grotesque({
  subsets: ["latin"],
  variable: "--font-bricolage",
  display: "swap",
});
const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
  display: "swap",
});
const spaceMono = Space_Mono({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-space-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Veriflect — Product Review Authenticity Judge",
  description: "Product reviews judged by context, patterns, and consensus.",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
  openGraph: {
    title: "Veriflect",
    description: "Product reviews judged by context, patterns, and consensus.",
    images: ["/logo.svg"],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${bricolage.variable} ${outfit.variable} ${spaceMono.variable}`}
    >
      <body className="min-h-screen bg-bazaar-cream text-ink-cocoa">
        <PrivyAppProvider>
          <Nav />
          <ConfigBanner />
          <main className="mx-auto max-w-7xl px-6 py-10">{children}</main>
          <footer className="mt-20 border-t border-ink-cocoa/20 bg-market-night text-bazaar-cream">
            <div className="mx-auto max-w-7xl grid gap-4 px-6 py-10 text-sm md:grid-cols-3">
              <div>
                <div className="font-heading text-2xl">Veriflect</div>
                <p className="mt-2 opacity-80">
                  Product reviews judged by context, patterns, and consensus.
                </p>
              </div>
              <div>
                <div className="font-heading text-lg mb-2">Signal Bazaar</div>
                <p className="opacity-80">
                  Pattern signals support judgement. GenLayer reviews context.
                </p>
              </div>
              <div>
                <div className="font-heading text-lg mb-2">Network</div>
                <p className="font-mono opacity-80">GenLayer Studionet · chain 61999</p>
              </div>
            </div>
          </footer>
        </PrivyAppProvider>
      </body>
    </html>
  );
}
