"use client";

import { readContract } from "./client";
import type {
  AuthenticityReview,
  CaseRecord,
  ContextRecord,
  EvidenceRecord,
  SignalProfile,
  AppealRecord,
  ProtocolStats,
} from "../types";

const parseOr = <T,>(raw: unknown, fallback: T): T => {
  if (typeof raw !== "string" || !raw) return fallback;
  try { return JSON.parse(raw) as T; } catch { return fallback; }
};

// ── reads ─────────────────────────────────────────────────────────────────────

export const getCase = async (caseId: string): Promise<CaseRecord | null> =>
  parseOr(await readContract("get_case", [caseId]), null);

export const getSignalProfile = async (caseId: string): Promise<SignalProfile | null> =>
  parseOr(await readContract("get_signal_profile", [caseId]), null);

export const getContext = async (caseId: string): Promise<ContextRecord | null> =>
  parseOr(await readContract("get_context", [caseId]), null);

export const getReview = async (caseId: string): Promise<AuthenticityReview | null> =>
  parseOr(await readContract("get_review", [caseId]), null);

export const getEvidence = async (evidenceId: string): Promise<EvidenceRecord | null> =>
  parseOr(await readContract("get_evidence", [evidenceId]), null);

export const getAppeal = async (appealId: string): Promise<AppealRecord | null> =>
  parseOr(await readContract("get_appeal", [appealId]), null);

export const getAppealReview = async (appealId: string): Promise<AuthenticityReview | null> =>
  parseOr(await readContract("get_appeal_review", [appealId]), null);

export const isModerator = async (addr: string): Promise<boolean> =>
  Boolean(await readContract("is_moderator", [addr]));

export const getUserCases = async (addr: string): Promise<string[]> =>
  parseOr(await readContract("get_user_cases", [addr]), []);

export const getStats = async (): Promise<ProtocolStats> =>
  parseOr(await readContract("get_stats", []), {
    case_count: 0,
    evidence_count: 0,
    review_count: 0,
    appeal_count: 0,
    review_fee_wei: 10_000_000_000_000_000,
    paused: false,
  });

export const getReviewFee = async (): Promise<bigint> => {
  const fee = await readContract("get_review_fee", []);
  return BigInt(String(fee));
};

// ── write function names (used by useVeriflectTx) ─────────────────────────────

export const FN = {
  CREATE_CASE: "create_case",
  ADD_SIGNAL_PROFILE: "add_signal_profile",
  ADD_CONTEXT: "add_context",
  ADD_EVIDENCE: "add_evidence",
  MARK_READY: "mark_ready_for_review",
  OPEN_APPEAL: "open_appeal",
  FINALIZE_CASE: "finalize_case",
  ADD_MODERATOR: "add_moderator",
  REMOVE_MODERATOR: "remove_moderator",
  SET_FEE: "set_review_fee",
  PAUSE: "pause_protocol",
  UNPAUSE: "unpause_protocol",
  REVIEW_AUTHENTICITY: "review_authenticity",
  REVIEW_APPEAL: "review_appeal",
} as const;
