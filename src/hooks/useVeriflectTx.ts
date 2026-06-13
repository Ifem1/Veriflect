"use client";

import { useCallback, useState } from "react";
import { useWallets } from "@privy-io/react-auth";
import { createWalletClient, custom, encodeFunctionData, parseAbi } from "viem";
import { ENV, isContractConfigured } from "@/lib/genlayer/config";
import type { TxState } from "@/lib/types";

const VERIFLECT_ABI = parseAbi([
  // deterministic writes
  "function create_case(string case_id, string case_json)",
  "function add_signal_profile(string case_id, string signal_json)",
  "function add_context(string case_id, string context_json)",
  "function add_evidence(string evidence_id, string case_id, string evidence_json)",
  "function mark_ready_for_review(string case_id)",
  "function open_appeal(string appeal_id, string case_id, string appeal_json)",
  "function finalize_case(string case_id)",
  "function add_moderator(address moderator)",
  "function remove_moderator(address moderator)",
  "function set_review_fee(uint256 fee_wei)",
  "function pause_protocol()",
  "function unpause_protocol()",
  // payable GenLayer functions
  "function review_authenticity(string case_id) payable",
  "function review_appeal(string appeal_id) payable",
]);

const studionetChain = {
  id: ENV.chainId,
  name: ENV.networkName,
  network: "genlayer-studionet",
  nativeCurrency: { name: ENV.currency, symbol: ENV.currency, decimals: 18 },
  rpcUrls: {
    default: { http: [ENV.rpcUrl] },
    public: { http: [ENV.rpcUrl] },
  },
  testnet: true,
} as const;

const TX_LABELS: Record<TxState, string> = {
  idle: "",
  preparing: "Preparing action…",
  submitting: "Submitting transaction…",
  submitted: "Transaction submitted",
  polling: "Waiting for GenLayer validators…",
  finalized: "Review finalized",
  failed: "Failed",
};

export function useVeriflectTx() {
  const { wallets } = useWallets();
  const [txState, setTxState] = useState<TxState>("idle");
  const [txHash, setTxHash] = useState<string | null>(null);
  const [txError, setTxError] = useState<string | null>(null);

  const label = TX_LABELS[txState];

  const send = useCallback(
    async (
      functionName: string,
      args: unknown[],
      value = 0n,
      onSuccess?: (hash: string) => void
    ) => {
      if (!isContractConfigured()) {
        setTxError("Contract not configured. Deploy Veriflect and set NEXT_PUBLIC_GENLAYER_CONTRACT_ADDRESS.");
        return null;
      }

      // Prefer external wallet (MetaMask etc); fall back to Privy embedded wallet
      const activeWallet =
        wallets.find((w) => w.walletClientType !== "privy") ??
        wallets.find((w) => w.walletClientType === "privy");
      if (!activeWallet) {
        setTxError("No wallet connected. Please sign in or connect a wallet.");
        return null;
      }

      setTxState("preparing");
      setTxError(null);
      setTxHash(null);

      try {
        // Switch chain to GenLayer Studionet
        await activeWallet.switchChain(ENV.chainId);

        setTxState("submitting");
        const provider = await activeWallet.getEthereumProvider();
        const walletClient = createWalletClient({
          chain: studionetChain as any,
          transport: custom(provider),
        });

        const data = encodeFunctionData({
          abi: VERIFLECT_ABI,
          functionName: functionName as any,
          args: args as any,
        });

        const hash = await walletClient.sendTransaction({
          account: activeWallet.address as `0x${string}`,
          chain: studionetChain as any,
          to: ENV.contractAddress as `0x${string}`,
          data,
          value,
        });

        setTxHash(hash);
        setTxState("submitted");
        onSuccess?.(hash);
        return hash;
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Transaction failed";
        setTxError(msg);
        setTxState("failed");
        return null;
      }
    },
    [wallets]
  );

  const reset = useCallback(() => {
    setTxState("idle");
    setTxHash(null);
    setTxError(null);
  }, []);

  return { send, txState, txHash, txError, label, reset };
}
