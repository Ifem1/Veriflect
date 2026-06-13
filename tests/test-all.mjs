#!/usr/bin/env node
/**
 * Veriflect end-to-end test runner
 *
 * Usage:
 *   node tests/test-all.mjs                      # run all suites
 *   node tests/test-all.mjs 1a 1b                # run only suites whose name contains "1a" or "1b"
 *   node tests/test-all.mjs suite-2              # run only suite-2 sub-suites
 */
import { sanityCheck, setFilter, getResults } from "./helpers.mjs";
import { suite1 } from "./suite-1-happy-path.mjs";
import { suite2 } from "./suite-2-revert-paths.mjs";
import { suite3 } from "./suite-3-nondet.mjs";

const filter = process.argv.slice(2);
setFilter(filter);

async function main() {
  const wallStart = Date.now();

  console.log("╔══════════════════════════════════════════════════════════════╗");
  console.log("║  VERIFLECT — GenLayer Contract End-to-End Test Suite         ║");
  console.log("║  contract: 0x2823dE35e377EBa2d027ac97E40932532E985Ddd        ║");
  console.log("║  network:  GenLayer Studionet  chainId=61999                 ║");
  console.log("╚══════════════════════════════════════════════════════════════╝");

  if (filter.length > 0) {
    console.log(`\nFilter: ${filter.join(", ")}`);
  }

  await sanityCheck();

  console.log("\n▶  Suite 1 — Deterministic happy path");
  await suite1();

  console.log("\n▶  Suite 2 — Deterministic revert paths");
  await suite2();

  console.log("\n▶  Suite 3 — Non-deterministic (GenLayer AI consensus)");
  await suite3();

  const wallMs = Date.now() - wallStart;
  const results = getResults();
  printSummary(results, wallMs);

  const failed = results.filter((r) => !r.skipped && !r.passed);
  process.exit(failed.length > 0 ? 1 : 0);
}

function printSummary(results, wallMs) {
  const run = results.filter((r) => !r.skipped);
  const passed = run.filter((r) => r.passed);
  const failed = run.filter((r) => !r.passed);

  console.log("\n");
  console.log("┌──────────────────────────────────────────────────────────────┐");
  console.log("│  TEST SUMMARY                                                │");
  console.log("├──────────────────────────────────────────────────────────────┤");
  for (const r of results) {
    const icon = r.skipped ? "⊘ " : r.passed ? "✅" : "❌";
    const t = r.skipped ? "skipped" : `${(r.ms / 1000).toFixed(1)}s`;
    const line = `│  ${icon}  ${r.name}`;
    console.log(line.padEnd(60) + t.padStart(8) + "  │");
  }
  console.log("├──────────────────────────────────────────────────────────────┤");
  const wallStr = wallMs ? `${(wallMs / 1000).toFixed(1)}s` : "—";
  console.log(`│  Passed: ${passed.length}/${run.length}   Failed: ${failed.length}   Wall: ${wallStr}`.padEnd(65) + "│");
  console.log("└──────────────────────────────────────────────────────────────┘");

  if (failed.length > 0) {
    console.error("\nFailed suites:");
    for (const r of failed) {
      console.error(`  ❌ ${r.name}`);
      if (r.error) console.error(`     ${r.error}`);
      if (r.hash) console.error(`     tx=${r.hash}`);
    }
  }
}

main().catch((err) => {
  console.error("\n💥 Unexpected top-level error:", err);
  process.exit(1);
});
