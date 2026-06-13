#!/usr/bin/env node
/**
 * Deploys veriflect.py from walletA so that walletA becomes the contract owner.
 * Usage: node tests/deploy.mjs
 * After running, copy the printed contract address into tests/.env.test
 */
import { createClient, createAccount, chains } from "genlayer-js";
import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dir = dirname(fileURLToPath(import.meta.url));

function loadEnv() {
  const raw = readFileSync(resolve(__dir, ".env.test"), "utf8");
  const env = {};
  for (const line of raw.split("\n")) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const eq = t.indexOf("=");
    if (eq === -1) continue;
    env[t.slice(0, eq).trim()] = t.slice(eq + 1).trim();
  }
  return env;
}

const ENV = loadEnv();
const RPC = ENV.RPC_URL;
const pk = ENV.WALLET_A;
if (!pk || pk.length < 10) { console.error("WALLET_A missing in .env.test"); process.exit(1); }

const account = createAccount(pk);
const chain = { ...chains.studionet };
chain.rpcUrls = { default: { http: [RPC] } };
const client = createClient({ chain, endpoint: RPC, account });

const code = readFileSync(resolve(__dir, "../contract/veriflect.py"), "utf8");

console.log(`Deploying from ${account.address} …`);

const hash = await client.deployContract({ code, args: [], leaderOnly: false });
console.log(`Deploy tx: ${hash}`);

const receipt = await client.waitForTransactionReceipt({ hash, retries: 120, interval: 3000 });
console.log(`Receipt:`, JSON.stringify(receipt, null, 2));

// The contract address is typically derivable from the tx receipt
const contractAddress = receipt?.data?.contract_address ?? receipt?.contractAddress ?? receipt?.data;
console.log(`\n✅ Contract address: ${contractAddress}`);
console.log(`\nUpdate CONTRACT_ADDRESS in tests/.env.test to: ${contractAddress}`);
