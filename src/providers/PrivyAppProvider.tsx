"use client";

import { PrivyProvider } from "@privy-io/react-auth";
import { ENV } from "@/lib/genlayer/config";

const studionetChain = {
  id: ENV.chainId,
  name: ENV.networkName,
  network: "genlayer-studionet",
  nativeCurrency: { name: ENV.currency, symbol: ENV.currency, decimals: 18 },
  rpcUrls: {
    default: { http: [ENV.rpcUrl] },
    public: { http: [ENV.rpcUrl] },
  },
  blockExplorers: {
    default: { name: "GenLayer Explorer", url: ENV.explorerUrl },
  },
  testnet: true,
} as const;

const PRIVY_APP_ID = process.env.NEXT_PUBLIC_PRIVY_APP_ID ?? "";

export function PrivyAppProvider({ children }: { children: React.ReactNode }) {
  if (!PRIVY_APP_ID) {
    return <>{children}</>;
  }

  return (
    <PrivyProvider
      appId={PRIVY_APP_ID}
      config={{
        loginMethods: ["email", "google", "wallet"],
        appearance: {
          theme: "light",
          accentColor: "#18C7B8",
          walletList: ["metamask", "coinbase_wallet", "rainbow", "wallet_connect"],
        },
        embeddedWallets: {
          ethereum: {
            // email/social users get an embedded wallet; external wallet users use their own
            createOnLogin: "users-without-wallets",
          },
        },
        externalWallets: {
          coinbaseWallet: { config: {} },
        },
        defaultChain: studionetChain as any,
        supportedChains: [studionetChain as any],
      }}
    >
      {children}
    </PrivyProvider>
  );
}
