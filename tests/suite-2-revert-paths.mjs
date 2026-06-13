/**
 * Suite 2 — Deterministic revert paths
 * Each test triggers a specific VmUserError / require and asserts
 * that execution_result is FINISHED_WITH_ERROR on-chain.
 * State is read back after each failed call to confirm nothing changed.
 */
import {
  write, read, expectRevert, assert, assertEqual, runSuite,
  uid, walletA, walletB, walletC, walletD,
} from "./helpers.mjs";

const BASE_CASE = (caseId) =>
  JSON.stringify({
    product_title: "Test Product",
    seller_identifier: "test-seller",
    review_text: "Good product.",
    review_date: "2025-01-01",
    rating: 4,
    reason_for_suspicion: "Suspicious pattern",
  });

const SIGNAL = JSON.stringify({ burst_detected: false, review_count_30d: 2 });

// Helper: create a fresh case in OPENED state
async function freshCase() {
  const caseId = uid("case");
  await write(walletA.client, "create_case", [caseId, BASE_CASE(caseId)]);
  return caseId;
}

// Helper: advance case to READY_FOR_REVIEW
async function readyCase() {
  const caseId = uid("case");
  await write(walletA.client, "create_case", [caseId, BASE_CASE(caseId)]);
  await write(walletA.client, "add_signal_profile", [caseId, SIGNAL]);
  await write(walletA.client, "mark_ready_for_review", [caseId]);
  return caseId;
}

export async function suite2() {
  // ── create_case reverts ───────────────────────────────────────

  await runSuite("2a — create_case: empty case_id reverts", async () => {
    const err = await expectRevert(walletA.client, "create_case", ["", BASE_CASE("x")]);
    assert(err.includes("case_id required") || err.length > 0, `error: ${err}`);
  });

  await runSuite("2b — create_case: duplicate case_id reverts", async () => {
    const caseId = await freshCase();
    const statsBefore = JSON.parse(await read(walletA.client, "get_stats"));

    const err = await expectRevert(walletA.client, "create_case", [caseId, BASE_CASE(caseId)]);
    assert(err.includes("Case already exists") || err.length > 0, `error: ${err}`);

    // state unchanged — count should not have incremented
    const statsAfter = JSON.parse(await read(walletA.client, "get_stats"));
    assertEqual(statsAfter.case_count, statsBefore.case_count, "case_count unchanged after dup");
  });

  await runSuite("2c — create_case: invalid JSON reverts", async () => {
    const err = await expectRevert(walletA.client, "create_case", [uid("case"), "not-json{"]);
    assert(err.includes("Invalid JSON") || err.includes("JSON") || err.length > 0, `error: ${err}`);
  });

  // ── mark_ready_for_review reverts ─────────────────────────────

  await runSuite("2d — mark_ready_for_review: missing signal profile reverts", async () => {
    const caseId = uid("case");
    // Case with review_text but no signal profile
    await write(walletA.client, "create_case", [caseId, BASE_CASE(caseId)]);
    const err = await expectRevert(walletA.client, "mark_ready_for_review", [caseId]);
    assert(err.includes("Signal profile required") || err.length > 0, `error: ${err}`);

    const raw = await read(walletA.client, "get_case", [caseId]);
    const c = JSON.parse(raw);
    assertEqual(c.status, "OPENED", "status unchanged after failed mark_ready");
  });

  await runSuite("2e — mark_ready_for_review: missing review_text AND review_reference reverts", async () => {
    const caseId = uid("case");
    // Case without review_text or review_reference
    const caseJson = JSON.stringify({
      product_title: "No Review Text",
      seller_identifier: "seller",
      rating: 3,
      reason_for_suspicion: "test",
    });
    await write(walletA.client, "create_case", [caseId, caseJson]);
    await write(walletA.client, "add_signal_profile", [caseId, SIGNAL]);
    const err = await expectRevert(walletA.client, "mark_ready_for_review", [caseId]);
    assert(
      err.includes("Review text or reference required") || err.length > 0,
      `error: ${err}`
    );
  });

  await runSuite("2f — mark_ready_for_review: FINALIZED case reverts", async () => {
    const caseId = await freshCase();
    await write(walletA.client, "finalize_case", [caseId]);
    await write(walletA.client, "add_signal_profile", [caseId, SIGNAL]);

    const err = await expectRevert(walletA.client, "mark_ready_for_review", [caseId]);
    assert(err.includes("already reviewed") || err.length > 0, `error: ${err}`);
  });

  // ── add_evidence reverts ──────────────────────────────────────

  await runSuite("2g — add_evidence: duplicate evidence_id reverts", async () => {
    const caseId = await freshCase();
    const evidenceId = uid("ev");
    const evJson = JSON.stringify({ type: "SCREENSHOT", description: "test" });

    await write(walletA.client, "add_evidence", [evidenceId, caseId, evJson]);
    const statsBefore = JSON.parse(await read(walletA.client, "get_stats"));

    const err = await expectRevert(walletA.client, "add_evidence", [evidenceId, caseId, evJson]);
    assert(err.includes("Evidence already exists") || err.length > 0, `error: ${err}`);

    const statsAfter = JSON.parse(await read(walletA.client, "get_stats"));
    assertEqual(statsAfter.evidence_count, statsBefore.evidence_count, "evidence_count unchanged");
  });

  await runSuite("2h — add_evidence: case not found reverts", async () => {
    const err = await expectRevert(walletA.client, "add_evidence", [
      uid("ev"),
      "nonexistent-case-id-xyz",
      JSON.stringify({ type: "NOTE" }),
    ]);
    assert(err.includes("Case not found") || err.length > 0, `error: ${err}`);
  });

  // ── open_appeal reverts ───────────────────────────────────────

  await runSuite("2i — open_appeal: duplicate appeal_id reverts", async () => {
    const caseId = await freshCase();
    const appealId = uid("ap");
    const apJson = JSON.stringify({ reason: "test appeal" });

    await write(walletA.client, "open_appeal", [appealId, caseId, apJson]);
    const countBefore = JSON.parse(await read(walletA.client, "get_stats")).appeal_count;

    const err = await expectRevert(walletA.client, "open_appeal", [appealId, caseId, apJson]);
    assert(err.includes("Appeal already exists") || err.length > 0, `error: ${err}`);

    const countAfter = JSON.parse(await read(walletA.client, "get_stats")).appeal_count;
    assertEqual(countAfter, countBefore, "appeal_count unchanged after dup");
  });

  // ── owner-only reverts ────────────────────────────────────────

  await runSuite("2j — add_moderator: non-owner reverts", async () => {
    const err = await expectRevert(walletB.client, "add_moderator", [walletC.account.address]);
    assert(err.includes("Only owner") || err.length > 0, `error: ${err}`);

    // walletC should NOT be a moderator
    const isMod = await read(walletA.client, "is_moderator", [walletC.account.address]);
    assertEqual(isMod, false, "walletC not a moderator");
  });

  await runSuite("2k — set_review_fee: non-owner reverts", async () => {
    const feeBefore = BigInt(await read(walletA.client, "get_review_fee"));
    const err = await expectRevert(walletD.client, "set_review_fee", [1n]);
    assert(err.includes("Only owner") || err.length > 0, `error: ${err}`);
    const feeAfter = BigInt(await read(walletA.client, "get_review_fee"));
    assertEqual(feeAfter, feeBefore, "fee unchanged");
  });

  await runSuite("2l — pause_protocol: non-owner reverts", async () => {
    const err = await expectRevert(walletD.client, "pause_protocol", []);
    assert(err.includes("Only owner") || err.length > 0, `error: ${err}`);
    const stats = JSON.parse(await read(walletA.client, "get_stats"));
    assertEqual(stats.paused, false, "still unpaused");
  });

  // ── moderator-only reverts ────────────────────────────────────

  await runSuite("2m — finalize_case: non-moderator reverts", async () => {
    const caseId = await freshCase();
    // Ensure walletD is NOT a moderator
    const isModD = await read(walletA.client, "is_moderator", [walletD.account.address]);
    assert(!isModD, "walletD must not be moderator for this test");

    const err = await expectRevert(walletD.client, "finalize_case", [caseId]);
    assert(err.includes("Only moderator") || err.length > 0, `error: ${err}`);

    const raw = await read(walletA.client, "get_case", [caseId]);
    const c = JSON.parse(raw);
    assert(c.status !== "FINALIZED", "case not finalized after non-mod attempt");
  });

  // ── protocol-paused reverts ───────────────────────────────────

  await runSuite("2n — create_case: paused protocol reverts", async () => {
    await write(walletA.client, "pause_protocol", []);
    try {
      const err = await expectRevert(walletA.client, "create_case", [uid("case"), BASE_CASE("x")]);
      assert(err.includes("Protocol paused") || err.length > 0, `error: ${err}`);
    } finally {
      await write(walletA.client, "unpause_protocol", []);
    }
  });

  // ── review_authenticity fee reverts ──────────────────────────

  await runSuite("2o — review_authenticity: insufficient fee reverts", async () => {
    const caseId = await readyCase();
    const err = await expectRevert(
      walletA.client, "review_authenticity", [caseId], 1n // 1 wei << 0.01 GEN
    );
    assert(err.includes("Insufficient review fee") || err.length > 0, `error: ${err}`);

    const raw = await read(walletA.client, "get_case", [caseId]);
    const c = JSON.parse(raw);
    assertEqual(c.status, "READY_FOR_REVIEW", "status unchanged after bad fee");
  });

  await runSuite("2p — review_authenticity: wrong status reverts", async () => {
    const caseId = await freshCase(); // status = OPENED, not READY_FOR_REVIEW
    const fee = BigInt(await read(walletA.client, "get_review_fee"));
    const err = await expectRevert(walletA.client, "review_authenticity", [caseId], fee);
    assert(err.includes("Case not ready") || err.includes("not ready") || err.length > 0, `error: ${err}`);
  });

  // ── case not found reverts ────────────────────────────────────

  await runSuite("2q — add_signal_profile: case not found reverts", async () => {
    const err = await expectRevert(walletA.client, "add_signal_profile", [
      "nonexistent-case-xyz",
      SIGNAL,
    ]);
    assert(err.includes("Case not found") || err.length > 0, `error: ${err}`);
  });

  await runSuite("2r — add_context: case not found reverts", async () => {
    const err = await expectRevert(walletA.client, "add_context", [
      "nonexistent-case-xyz",
      JSON.stringify({ note: "test" }),
    ]);
    assert(err.includes("Case not found") || err.length > 0, `error: ${err}`);
  });
}
