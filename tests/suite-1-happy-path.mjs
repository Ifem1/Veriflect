/**
 * Suite 1 — Deterministic happy path
 * Walks the full state machine end-to-end with valid inputs.
 * After each write, reads back on-chain state and asserts fields.
 */
import {
  write, read, assert, assertEqual, runSuite,
  uid, CONTRACT, walletA, walletB, walletC,
} from "./helpers.mjs";

const VALID_CASE = (caseId) =>
  JSON.stringify({
    product_title: "AquaFlow Bluetooth Speaker",
    seller_identifier: "TechGadgets_UK",
    review_text: "Amazing sound quality, arrived fast. Totally worth it.",
    review_date: "2025-11-15",
    rating: 5,
    review_reference: `REF-${caseId}`,
    reviewer_profile_summary: "Account 3 months old, 47 reviews all 5★",
    purchase_evidence_summary: "No verified purchase badge",
    reason_for_suspicion: "Sudden 5★ burst across 8 accounts in 24h",
  });

const SIGNAL_PROFILE = JSON.stringify({
  review_count_30d: 8,
  average_rating_30d: 5.0,
  burst_detected: true,
  timing_gap_hours: 2,
  verified_purchase_ratio: 0.0,
  reviewer_age_avg_days: 45,
});

const CONTEXT = JSON.stringify({
  seller_explanation: "Product launched in new category, ran promo campaign",
  marketplace_notes: "No prior complaints for this seller",
});

const EVIDENCE = (evidenceId, caseId) =>
  JSON.stringify({
    type: "SCREENSHOT",
    description: "Screenshot of 8 back-to-back 5★ reviews",
    url: `https://evidence.example.com/${evidenceId}`,
    timestamp: "2025-11-16T08:00:00Z",
    caseId,
  });

export async function suite1() {
  await runSuite("1a — create_case and verify stored state", async () => {
    const caseId = uid("case");
    await write(walletA.client, "create_case", [caseId, VALID_CASE(caseId)]);

    const raw = await read(walletA.client, "get_case", [caseId]);
    assert(raw && raw.length > 0, "get_case returned empty");
    const c = JSON.parse(raw);
    assertEqual(c.case_id, caseId, "case_id");
    assertEqual(c.status, "OPENED", "initial status");
    assertEqual(c.product_title, "AquaFlow Bluetooth Speaker", "product_title");
    assert(c.reporter?.length > 0, "reporter set");

    // user_cases list updated
    const userCasesRaw = await read(walletA.client, "get_user_cases", [walletA.account.address]);
    const userCases = JSON.parse(userCasesRaw);
    assert(userCases.includes(caseId), "caseId in user_cases");
  });

  await runSuite("1b — add_signal_profile", async () => {
    const caseId = uid("case");
    await write(walletA.client, "create_case", [caseId, VALID_CASE(caseId)]);
    await write(walletA.client, "add_signal_profile", [caseId, SIGNAL_PROFILE]);

    const raw = await read(walletA.client, "get_signal_profile", [caseId]);
    assert(raw && raw.length > 0, "signal profile stored");
    const p = JSON.parse(raw);
    assertEqual(p.burst_detected, true, "burst_detected");
  });

  await runSuite("1c — add_context sets CONTEXT_SUBMITTED", async () => {
    const caseId = uid("case");
    await write(walletA.client, "create_case", [caseId, VALID_CASE(caseId)]);
    await write(walletA.client, "add_signal_profile", [caseId, SIGNAL_PROFILE]);
    await write(walletA.client, "add_context", [caseId, CONTEXT]);

    const raw = await read(walletA.client, "get_case", [caseId]);
    const c = JSON.parse(raw);
    assertEqual(c.status, "CONTEXT_SUBMITTED", "status after add_context");

    const ctxRaw = await read(walletA.client, "get_context", [caseId]);
    assert(ctxRaw && ctxRaw.length > 0, "context stored");
  });

  await runSuite("1d — add_evidence", async () => {
    const caseId = uid("case");
    const evidenceId = uid("ev");
    await write(walletA.client, "create_case", [caseId, VALID_CASE(caseId)]);
    await write(walletA.client, "add_evidence", [evidenceId, caseId, EVIDENCE(evidenceId, caseId)]);

    const raw = await read(walletA.client, "get_evidence", [evidenceId]);
    assert(raw && raw.length > 0, "evidence stored");
    const e = JSON.parse(raw);
    assertEqual(e.evidence_id, evidenceId, "evidence_id");
    assertEqual(e.case_id, caseId, "evidence.case_id");
    assert(e.submitter?.length > 0, "submitter set");
  });

  await runSuite("1e — mark_ready_for_review transitions status", async () => {
    const caseId = uid("case");
    await write(walletA.client, "create_case", [caseId, VALID_CASE(caseId)]);
    await write(walletA.client, "add_signal_profile", [caseId, SIGNAL_PROFILE]);
    // No need to add_context — mark_ready only requires review_text/ref + signal profile
    await write(walletA.client, "mark_ready_for_review", [caseId]);

    const raw = await read(walletA.client, "get_case", [caseId]);
    const c = JSON.parse(raw);
    assertEqual(c.status, "READY_FOR_REVIEW", "status after mark_ready");
  });

  await runSuite("1f — open_appeal sets APPEALED", async () => {
    const caseId = uid("case");
    const appealId = uid("ap");
    const appealJson = JSON.stringify({
      reason: "Review was genuine — we ran a legitimate promo",
      new_evidence: "Seller invoice showing promotion details",
    });
    await write(walletA.client, "create_case", [caseId, VALID_CASE(caseId)]);
    await write(walletA.client, "open_appeal", [appealId, caseId, appealJson]);

    const raw = await read(walletA.client, "get_case", [caseId]);
    const c = JSON.parse(raw);
    assertEqual(c.status, "APPEALED", "status after appeal");

    const apRaw = await read(walletA.client, "get_appeal", [appealId]);
    assert(apRaw && apRaw.length > 0, "appeal stored");
    const ap = JSON.parse(apRaw);
    assertEqual(ap.appeal_id, appealId, "appeal.appeal_id");
    assertEqual(ap.case_id, caseId, "appeal.case_id");
  });

  await runSuite("1g — add_moderator / remove_moderator", async () => {
    // add wallet B as moderator
    await write(walletA.client, "add_moderator", [walletB.account.address]);
    const isMod = await read(walletA.client, "is_moderator", [walletB.account.address]);
    assertEqual(isMod, true, "walletB is_moderator after add");

    // remove wallet B
    await write(walletA.client, "remove_moderator", [walletB.account.address]);
    const isModAfter = await read(walletA.client, "is_moderator", [walletB.account.address]);
    assertEqual(isModAfter, false, "walletB is_moderator after remove");
  });

  await runSuite("1h — set_review_fee and read back", async () => {
    const newFee = 20_000_000_000_000_000n; // 0.02 GEN
    await write(walletA.client, "set_review_fee", [newFee]);
    const fee = await read(walletA.client, "get_review_fee");
    assertEqual(String(fee), String(newFee), "review_fee after set");

    // restore original fee
    await write(walletA.client, "set_review_fee", [10_000_000_000_000_000n]);
    const restored = await read(walletA.client, "get_review_fee");
    assertEqual(String(restored), "10000000000000000", "review_fee restored");
  });

  await runSuite("1i — pause_protocol / unpause_protocol", async () => {
    await write(walletA.client, "pause_protocol", []);
    const statsPaused = JSON.parse(await read(walletA.client, "get_stats"));
    assertEqual(statsPaused.paused, true, "paused=true");

    await write(walletA.client, "unpause_protocol", []);
    const statsUnpaused = JSON.parse(await read(walletA.client, "get_stats"));
    assertEqual(statsUnpaused.paused, false, "paused=false");
  });

  await runSuite("1j — finalize_case (mod only)", async () => {
    // walletA is owner = also in moderators["ADMIN"]
    const caseId = uid("case");
    await write(walletA.client, "create_case", [caseId, VALID_CASE(caseId)]);
    await write(walletA.client, "finalize_case", [caseId]);

    const raw = await read(walletA.client, "get_case", [caseId]);
    const c = JSON.parse(raw);
    assertEqual(c.status, "FINALIZED", "status FINALIZED");
  });

  await runSuite("1k — stats counters increment", async () => {
    const before = JSON.parse(await read(walletA.client, "get_stats"));
    const caseId = uid("case");
    const evidenceId = uid("ev");
    await write(walletA.client, "create_case", [caseId, VALID_CASE(caseId)]);
    await write(walletA.client, "add_evidence", [evidenceId, caseId, EVIDENCE(evidenceId, caseId)]);
    const after = JSON.parse(await read(walletA.client, "get_stats"));

    assertEqual(after.case_count, before.case_count + 1, "case_count +1");
    assertEqual(after.evidence_count, before.evidence_count + 1, "evidence_count +1");
  });
}
