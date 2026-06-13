"use client";

import { ENV, isContractConfigured } from "./config";

// ── read client (no signer needed) ───────────────────────────────────────────

let _readClient: any = null;

export async function getReadClient() {
  if (_readClient) return _readClient;
  if (typeof window === "undefined") throw new Error("Browser only");
  const mod: any = await import("genlayer-js");
  const createClient = mod.createClient ?? mod.default?.createClient;
  if (!createClient) throw new Error("genlayer-js createClient not found");
  _readClient = createClient({
    chain: {
      id: ENV.chainId,
      name: ENV.networkName,
      rpcUrls: { default: { http: [ENV.rpcUrl] } },
      nativeCurrency: { name: ENV.currency, symbol: ENV.currency, decimals: 18 },
    },
    endpoint: ENV.rpcUrl,
  });
  return _readClient;
}

export async function readContract(functionName: string, args: unknown[] = []): Promise<unknown> {
  if (!isContractConfigured()) throw new Error("Contract not configured");
  const client = await getReadClient();
  return client.readContract({
    address: ENV.contractAddress,
    functionName,
    args,
  });
}

// ── write via Privy embedded wallet ──────────────────────────────────────────
// Called from hooks/useVeriflectTx which supplies the wallet client

export { ENV, isContractConfigured };
