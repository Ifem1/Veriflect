// Shared helpers for Veriflect test suite
import { createClient, createAccount } from "genlayer-js";
import { chains } from "genlayer-js";
import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dir = dirname(fileURLToPath(import.meta.url));

// ── env loading ───────────────────────────────────────────────
function loadEnv() {
  const envPath = resolve(__dir, ".env.test");
  let raw;
  try {
    raw = readFileSync(envPath, "utf8");
  } catch {
    console.error("ERROR: tests/.env.test not found. Copy .env.test.example and fill in keys.");
    process.exit(1);
  }
  const env = {};
  for (const line of raw.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    const val = trimmed.slice(eq + 1).trim();
    env[key] = val;
  }
  return env;
}

export const ENV = loadEnv();

// ── required env guard ────────────────────────────────────────
function requireEnv(name) {
  const v = ENV[name];
  if (!v || v === "0x..." || v.length < 10) {
    console.error(`ABORT: env var ${name} is missing or not set. Add it to tests/.env.test.`);
    process.exit(1);
  }
  return v;
}

export const CONTRACT = requireEnv("CONTRACT_ADDRESS");
const RPC = requireEnv("RPC_URL");

// ── wallet setup ──────────────────────────────────────────────
function makeClient(pkEnvName) {
  const pk = requireEnv(pkEnvName);
  const account = createAccount(pk);
  const chain = { ...chains.studionet };
  chain.rpcUrls = { default: { http: [RPC] } };
  return { client: createClient({ chain, endpoint: RPC, account }), account };
}

export const walletA = makeClient("WALLET_A"); // owner
export const walletB = makeClient("WALLET_B"); // second / moderator
export const walletC = makeClient("WALLET_C"); // third
export const walletD = makeClient("WALLET_D"); // fourth / non-mod revert

// ── write with retry ─────────────────────────────────────────
export async function write(client, functionName, args, value = 0n, retries = 3) {
  let lastErr;
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const t0 = Date.now();
      console.log(`  → ${functionName}(${summarise(args)})${value > 0n ? ` value=${value}` : ""}`);
      const hash = await client.writeContract({
        address: CONTRACT,
        functionName,
        args,
        value,
      });
      const receipt = await client.waitForTransactionReceipt({ hash, retries: 200, interval: 3000 });
      const tx = await client.getTransaction({ hash });
      const lr = tx?.consensus_data?.leader_receipt?.[0];
      const execResult = lr?.execution_result;
      const ms = Date.now() - t0;

      // GenLayer Studionet reports execution_result as "ERROR" for failed calls
      if (execResult === "ERROR" || execResult === "FINISHED_WITH_ERROR" || execResult === 2) {
        const stderr = lr?.genvm_result?.stderr ?? lr?.stderr ?? "";
        const lines = String(stderr).trim().split("\n");
        const tail = lines.slice(-2).join(" | ");
        throw new OnChainError(`${functionName} failed on-chain: ${tail}`, hash, tail);
      }
      console.log(`  ✓ ${functionName} (${ms}ms) tx=${hash}`);
      return { hash, receipt, tx };
    } catch (err) {
      if (err instanceof OnChainError) throw err; // don't retry on-chain logic errors
      lastErr = err;
      if (attempt < retries) {
        console.log(`  ⚠ attempt ${attempt} failed (${err.message}), retrying in 5s…`);
        await sleep(5000);
      }
    }
  }
  throw lastErr;
}

// ── expect a write to revert ──────────────────────────────────
export async function expectRevert(client, functionName, args, value = 0n) {
  try {
    const hash = await client.writeContract({ address: CONTRACT, functionName, args, value });
    await client.waitForTransactionReceipt({ hash, retries: 60, interval: 3000 });
    const tx = await client.getTransaction({ hash });
    const lr = tx?.consensus_data?.leader_receipt?.[0];
    const execResult = lr?.execution_result;
    if (execResult === "ERROR" || execResult === "FINISHED_WITH_ERROR" || execResult === 2) {
      const stderr = lr?.genvm_result?.stderr ?? lr?.stderr ?? "";
      const lines = String(stderr).trim().split("\n");
      return lines.slice(-2).join(" | "); // expected revert — return error text
    }
    throw new AssertionError(
      `Expected ${functionName} to revert on-chain but it succeeded (exec=${execResult})`
    );
  } catch (err) {
    if (err instanceof AssertionError) throw err;
    // RPC-level throw also counts as revert for some error paths
    return err.message;
  }
}

// ── read helper ───────────────────────────────────────────────
export async function read(client, functionName, args = []) {
  return client.readContract({ address: CONTRACT, functionName, args });
}

// ── assertions ────────────────────────────────────────────────
export function assert(cond, msg) {
  if (!cond) throw new AssertionError(`ASSERT FAILED: ${msg}`);
}

export function assertEqual(actual, expected, label) {
  if (actual !== expected)
    throw new AssertionError(`ASSERT FAILED [${label}]: expected ${JSON.stringify(expected)} got ${JSON.stringify(actual)}`);
}

export function assertInSet(value, set, label) {
  if (!set.has(value))
    throw new AssertionError(`ASSERT FAILED [${label}]: ${JSON.stringify(value)} not in allowed set`);
}

// ── suite runner ──────────────────────────────────────────────
let _filter = [];
let _results = [];

export function setFilter(f) { _filter = f; }
export function getResults() { return _results; }
export function clearResults() { _results = []; }

export async function runSuite(name, fn) {
  if (_filter.length > 0 && !_filter.some((f) => name.toLowerCase().includes(f.toLowerCase()))) {
    console.log(`  ⊘ skip  ${name}`);
    const r = { name, passed: true, ms: 0, skipped: true };
    _results.push(r);
    return r;
  }
  const t0 = Date.now();
  console.log(`\n${"═".repeat(60)}`);
  console.log(`SUITE: ${name}`);
  console.log("═".repeat(60));
  try {
    await fn();
    const ms = Date.now() - t0;
    console.log(`\n✅ PASSED  ${name}  (${(ms / 1000).toFixed(1)}s)`);
    const r = { name, passed: true, ms };
    _results.push(r);
    return r;
  } catch (err) {
    const ms = Date.now() - t0;
    console.error(`\n❌ FAILED  ${name}  (${(ms / 1000).toFixed(1)}s)`);
    console.error(`   ${err.message}`);
    if (err.hash) console.error(`   tx=${err.hash}`);
    const r = { name, passed: false, ms, error: err.message, hash: err.hash };
    _results.push(r);
    return r;
  }
}

// ── unique id generator ───────────────────────────────────────
export function uid(prefix = "case") {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

// ── misc ──────────────────────────────────────────────────────
export function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function summarise(args) {
  if (!args?.length) return "";
  return args
    .map((a) => {
      if (typeof a === "string" && a.length > 40) return a.slice(0, 37) + "…";
      if (typeof a === "bigint") return a.toString();
      return JSON.stringify(a);
    })
    .join(", ");
}

export class OnChainError extends Error {
  constructor(msg, hash, stderr) {
    super(msg);
    this.hash = hash;
    this.stderr = stderr;
  }
}

export class AssertionError extends Error {}

// ── Step 0 sanity check ───────────────────────────────────────
export async function sanityCheck() {
  console.log("\n── STEP 0: Sanity check ──");
  const wallets = [
    ["WALLET_A (owner)", walletA],
    ["WALLET_B", walletB],
    ["WALLET_C", walletC],
    ["WALLET_D", walletD],
  ];
  for (const [label, { client, account }] of wallets) {
    const bal = await client.getBalance({ address: account.address });
    console.log(`  ${label}  ${account.address}  balance=${bal}`);
    if (bal === 0n) {
      console.error(`ABORT: ${label} has zero balance on Studionet. Fund it first.`);
      process.exit(1);
    }
  }
  // One contract read to confirm RPC works
  const statsRaw = await read(walletA.client, "get_stats");
  const stats = JSON.parse(statsRaw);
  console.log(`  contract stats: ${JSON.stringify(stats)}`);
  console.log("  ✓ Sanity check passed\n");
  return stats;
}
