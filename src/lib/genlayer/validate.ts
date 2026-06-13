import { z } from "zod";

export const VERDICTS = [
  "GENUINE",
  "LIKELY_GENUINE",
  "SUSPICIOUS",
  "SUSPICIOUS_COORDINATED",
  "LIKELY_INCENTIVISED",
  "LIKELY_BOT_GENERATED",
  "REVIEW_BOMBING",
  "SELLER_MANIPULATED",
  "INSUFFICIENT_EVIDENCE",
  "FALSE_REPORT",
] as const;

export const RISK_LEVELS = ["LOW", "MEDIUM", "HIGH", "CRITICAL"] as const;

export const ACTIONS = [
  "NO_ACTION",
  "LABEL_AS_UNVERIFIED",
  "HOLD_FOR_REVIEW",
  "ESCALATE_TO_MARKETPLACE_MODERATOR",
  "REQUEST_MORE_CONTEXT",
  "REMOVE_OR_SUPPRESS_RECOMMENDED",
] as const;

export const APPEAL_DECISIONS = [
  "ORIGINAL_UPHELD",
  "ORIGINAL_ADJUSTED",
  "VERDICT_REVERSED",
  "MORE_CONTEXT_REQUIRED",
  "APPEAL_REJECTED",
] as const;

export const APPEAL_REASONS = [
  "GENUINE_PURCHASE",
  "LEGITIMATE_PROMOTION",
  "REVIEWER_PROOF_ADDED",
  "SELLER_CONTEXT_MISSING",
  "COMPETITOR_SABOTAGE_EVIDENCE",
  "MISIDENTIFIED_PATTERN",
  "OTHER",
] as const;

export const EVIDENCE_TYPES = [
  "REVIEW_TEXT",
  "ORDER_HASH",
  "VERIFIED_PURCHASE_PROOF",
  "SCREENSHOT",
  "SELLER_CAMPAIGN_RECORD",
  "CUSTOMER_SUPPORT_THREAD",
  "PRODUCT_LAUNCH_RECORD",
  "REFUND_RECORD",
  "COUPON_CAMPAIGN",
  "REVIEW_CLUSTER_EXPORT",
  "MODERATION_NOTE",
  "PUBLIC_PRODUCT_PAGE",
  "OTHER",
] as const;

export const createCaseSchema = z.object({
  product_title: z.string().min(2, "Product title required"),
  product_url: z.string().optional(),
  seller_identifier: z.string().min(1, "Seller identifier required"),
  review_text: z.string().optional(),
  review_reference: z.string().optional(),
  rating: z.coerce.number().min(0).max(5),
  review_date: z.string().min(1, "Review date required"),
  reviewer_profile_summary: z.string().optional(),
  purchase_evidence_summary: z.string().optional(),
  reason_for_suspicion: z.string().min(5, "Reason required"),
  evidence_refs: z.string().optional(),
  redaction_note: z.string().optional(),
}).refine(
  (d) => d.review_text || d.review_reference,
  { message: "Review text or reference required", path: ["review_text"] }
);

export const signalProfileSchema = z.object({
  review_timing_pattern: z.string().min(1, "Required"),
  rating_anomaly: z.string().min(1, "Required"),
  repeated_wording_pattern: z.string().min(1, "Required"),
  reviewer_account_age_summary: z.string().optional(),
  purchase_verification_summary: z.string().optional(),
  seller_history_summary: z.string().optional(),
  cluster_similarity_summary: z.string().optional(),
  external_signal_summary: z.string().optional(),
  evidence_confidence: z.string().min(1, "Required"),
});

export const contextSchema = z.object({
  seller_explanation: z.string().optional(),
  reviewer_explanation: z.string().optional(),
  purchase_proof_summary: z.string().optional(),
  promotion_disclosure: z.string().optional(),
  marketplace_policy_context: z.string().optional(),
  related_dispute_history: z.string().optional(),
  correction_request: z.string().optional(),
}).refine(
  (d) => Object.values(d).some((v) => v && v.trim().length > 0),
  { message: "At least one context field required" }
);

export const evidenceSchema = z.object({
  evidence_type: z.enum(EVIDENCE_TYPES),
  description: z.string().min(1, "Required"),
  hash_or_cid: z.string().optional(),
  link: z.string().optional(),
});

export const appealSchema = z.object({
  appeal_reason: z.enum(APPEAL_REASONS),
  new_evidence_summary: z.string().min(5, "Provide new evidence summary"),
  new_document_refs: z.string().optional(),
  explanation: z.string().min(10, "Explanation required"),
});
