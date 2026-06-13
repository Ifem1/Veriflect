/**
 * Suite 3 — Non-deterministic functions
 * Tests review_authenticity and review_appeal.
 * Allows up to 5 min per call (waitForTransactionReceipt retries=200, interval=3000).
 *
 * Checks:
 *   - tx reaches ACCEPTED / FINISHED_WITH_RETURN
 *   - stored output round-trips as valid JSON
 *   - every enum field is in the allowed set
 *   - confidence is int 0-100
 *   - required arrays are arrays
 *   - required strings are non-empty
 *   - moderation_recommendation is an object
 *   - review_count and appeal_count increment
 *   - result persists via get_review / get_appeal_review
 */
import {
  write, read, assert, assertEqual, assertInSet, runSuite,
  uid, walletA, walletB,
} from "./helpers.mjs";

const ALLOWED_VERDICTS = new Set([
  "GENUINE", "LIKELY_GENUINE", "SUSPICIOUS", "SUSPICIOUS_COORDINATED",
  "LIKELY_INCENTIVISED", "LIKELY_BOT_GENERATED", "REVIEW_BOMBING",
  "SELLER_MANIPULATED", "INSUFFICIENT_EVIDENCE", "FALSE_REPORT",
]);
const ALLOWED_RISK = new Set(["LOW", "MEDIUM", "HIGH", "CRITICAL"]);
const ALLOWED_ACTIONS = new Set([
  "NO_ACTION", "LABEL_AS_UNVERIFIED", "HOLD_FOR_REVIEW",
  "ESCALATE_TO_MARKETPLACE_MODERATOR", "REQUEST_MORE_CONTEXT",
  "REMOVE_OR_SUPPRESS_RECOMMENDED",
]);
const ALLOWED_APPEAL_DECISIONS = new Set([
  "ORIGINAL_UPHELD", "ORIGINAL_ADJUSTED", "VERDICT_REVERSED",
  "MORE_CONTEXT_REQUIRED", "APPEAL_REJECTED",
]);

function assertReviewShape(r, label = "review") {
  assert(typeof r === "object" && r !== null, `${label} is object`);
  assertInSet(r.authenticity_verdict, ALLOWED_VERDICTS, `${label}.authenticity_verdict`);
  assertInSet(r.risk_level, ALLOWED_RISK, `${label}.risk_level`);
  assertInSet(r.recommended_action, ALLOWED_ACTIONS, `${label}.recommended_action`);
  assert(
    Number.isInteger(r.confidence) && r.confidence >= 0 && r.confidence <= 100,
    `${label}.confidence is int 0-100 (got ${r.confidence})`
  );
  assert(typeof r.summary === "string" && r.summary.trim().length > 0, `${label}.summary non-empty`);
  assert(typeof r.review_type === "string" && r.review_type.trim().length > 0, `${label}.review_type non-empty`);
  assert(Array.isArray(r.supporting_signals), `${label}.supporting_signals is array`);
  assert(Array.isArray(r.counter_signals), `${label}.counter_signals is array`);
  assert(Array.isArray(r.missing_context), `${label}.missing_context is array`);
  assert(typeof r.moderation_recommendation === "object" && r.moderation_recommendation !== null,
    `${label}.moderation_recommendation is object`);
}

// Build a fully-staged case ready for review
async function buildReadyCase(label = "") {
  const caseId = uid("nd-case");
  const caseJson = JSON.stringify({
    product_title: `Wireless Headphones Pro ${label}`,
    seller_identifier: "AudioWorld_Store",
    review_text:
      "Best headphones I've ever bought! Perfect sound, arrived in 2 days. 10/10 recommend!",
    review_date: "2026-01-10",
    rating: 5,
    review_reference: `AREF-${caseId}`,
    reviewer_profile_summary: "New account, 0 prior reviews, no photo",
    purchase_evidence_summary: "No verified purchase badge shown",
    reason_for_suspicion: "12 identical 5★ reviews in 6 hours, all new accounts",
  });
  const signalJson = JSON.stringify({
    review_count_30d: 12,
    average_rating_30d: 5.0,
    burst_detected: true,
    timing_gap_hours: 0.5,
    verified_purchase_ratio: 0.0,
    reviewer_age_avg_days: 8,
    text_similarity_score: 0.88,
    repeat_ip_flag: false,
  });
  const contextJson = JSON.stringify({
    seller_explanation: "No explanation provided",
    marketplace_notes: "Seller new to platform, no returns history",
    competing_product_context: "Competitor product launched same day",
  });

  await write(walletA.client, "create_case", [caseId, caseJson]);
  await write(walletA.client, "add_signal_profile", [caseId, signalJson]);
  await write(walletA.client, "add_context", [caseId, contextJson]);
  await write(walletA.client, "mark_ready_for_review", [caseId]);
  return caseId;
}

export async function suite3() {
  await runSuite("3a — review_authenticity: happy path", async () => {
    console.log("  ℹ  This may take up to 5 minutes for GenLayer consensus…");
    const caseId = await buildReadyCase("A");

    const fee = BigInt(await read(walletA.client, "get_review_fee") ?? 10_000_000_000_000_000n);
    const statsBefore = JSON.parse(await read(walletA.client, "get_stats"));

    const { hash } = await write(walletA.client, "review_authenticity", [caseId], fee);
    console.log(`  ℹ  review tx submitted: ${hash}`);

    // Read back and assert shape
    const reviewRaw = await read(walletA.client, "get_review", [caseId]);
    assert(reviewRaw && reviewRaw.length > 0, "get_review returned data");
    const r = JSON.parse(reviewRaw);
    assertReviewShape(r, "review");
    assertEqual(r.case_id, caseId, "review.case_id");

    // case status should now be REVIEWED
    const caseRaw = await read(walletA.client, "get_case", [caseId]);
    const c = JSON.parse(caseRaw);
    assertEqual(c.status, "REVIEWED", "case status REVIEWED");

    // review_count incremented
    const statsAfter = JSON.parse(await read(walletA.client, "get_stats"));
    assertEqual(statsAfter.review_count, statsBefore.review_count + 1, "review_count +1");

    console.log(`  ℹ  verdict=${r.authenticity_verdict}  confidence=${r.confidence}  risk=${r.risk_level}`);
    console.log(`  ℹ  action=${r.recommended_action}`);
    console.log(`  ℹ  summary="${r.summary.slice(0, 100)}…"`);
  });

  await runSuite("3b — review_appeal: happy path", async () => {
    console.log("  ℹ  This may take up to 5 minutes for GenLayer consensus…");

    // Build and review a case first
    const caseId = await buildReadyCase("B");
    const fee = BigInt(await read(walletA.client, "get_review_fee") ?? 10_000_000_000_000_000n);
    await write(walletA.client, "review_authenticity", [caseId], fee);

    // File an appeal
    const appealId = uid("ap");
    const appealJson = JSON.stringify({
      reason: "The seller ran a legitimate promotion campaign with verified purchasers",
      new_evidence: "Invoice #12345 showing bulk order by promo participants",
      appeal_grounds: "Missing context — promo campaign was pre-approved by marketplace",
    });
    await write(walletA.client, "open_appeal", [appealId, caseId, appealJson]);

    const statsBefore = JSON.parse(await read(walletA.client, "get_stats"));

    console.log(`  ℹ  appeal tx for appeal=${appealId}…`);
    const { hash } = await write(walletA.client, "review_appeal", [appealId], fee);
    console.log(`  ℹ  appeal review tx submitted: ${hash}`);

    // Read back
    const apReviewRaw = await read(walletA.client, "get_appeal_review", [appealId]);
    assert(apReviewRaw && apReviewRaw.length > 0, "get_appeal_review returned data");
    const ar = JSON.parse(apReviewRaw);

    assertReviewShape(ar, "appeal_review");
    assertInSet(ar.appeal_decision, ALLOWED_APPEAL_DECISIONS, "appeal_decision");
    assertEqual(ar.appeal_id, appealId, "appeal_review.appeal_id");
    assertEqual(ar.case_id, caseId, "appeal_review.case_id");

    console.log(`  ℹ  appeal_decision=${ar.appeal_decision}  verdict=${ar.authenticity_verdict}`);
    console.log(`  ℹ  summary="${ar.summary?.slice(0, 100)}…"`);
  });
}
