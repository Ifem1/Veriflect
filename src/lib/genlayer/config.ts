export const GENLAYER_STUDIONET = {
  name: "GenLayer Studionet",
  chainId: 61999,
  rpcUrl: "https://studio.genlayer.com/api",
  currency: "GEN",
  explorerUrl: "https://explorer-studio.genlayer.com",
};

export const ENV = {
  networkName: process.env.NEXT_PUBLIC_GENLAYER_NETWORK_NAME ?? GENLAYER_STUDIONET.name,
  chainId: Number(process.env.NEXT_PUBLIC_GENLAYER_CHAIN_ID ?? GENLAYER_STUDIONET.chainId),
  rpcUrl: process.env.NEXT_PUBLIC_GENLAYER_RPC_URL ?? GENLAYER_STUDIONET.rpcUrl,
  explorerUrl: process.env.NEXT_PUBLIC_GENLAYER_EXPLORER_URL ?? GENLAYER_STUDIONET.explorerUrl,
  currency: process.env.NEXT_PUBLIC_GENLAYER_CURRENCY ?? GENLAYER_STUDIONET.currency,
  contractAddress: (process.env.NEXT_PUBLIC_GENLAYER_CONTRACT_ADDRESS ?? "").trim(),
};

export const isContractConfigured = (): boolean =>
  ENV.contractAddress.length > 0 && ENV.contractAddress.startsWith("0x");

export const CONTRACT_MISSING_MESSAGE =
  "GenLayer contract is not configured yet. Deploy Veriflect and add NEXT_PUBLIC_GENLAYER_CONTRACT_ADDRESS to enable live authenticity reviews.";
