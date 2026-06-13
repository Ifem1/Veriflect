export type AuthenticityVerdict =
  | "GENUINE"
  | "LIKELY_GENUINE"
  | "SUSPICIOUS"
  | "SUSPICIOUS_COORDINATED"
  | "LIKELY_INCENTIVISED"
  | "LIKELY_BOT_GENERATED"
  | "REVIEW_BOMBING"
  | "SELLER_MANIPULATED"
  | "INSUFFICIENT_EVIDENCE"
  | "FALSE_REPORT";

export type RiskLevel = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export type RecommendedAction =
  | "NO_ACTION"
  | "LABEL_AS_UNVERIFIED"
  | "HOLD_FOR_REVIEW"
  | "ESCALATE_TO_MARKETPLACE_MODERATOR"
  | "REQUEST_MORE_CONTEXT"
  | "REMOVE_OR_SUPPRESS_RECOMMENDED";

export type AppealDecision =
  | "ORIGINAL_UPHELD"
  | "ORIGINAL_ADJUSTED"
  | "VERDICT_REVERSED"
  | "MORE_CONTEXT_REQUIRED"
  | "APPEAL_REJECTED";

export type CaseStatus =
  | "OPENED"
  | "CONTEXT_SUBMITTED"
  | "READY_FOR_REVIEW"
  | "UNDER_REVIEW"
  | "REVIEWED"
  | "APPEALED"
  | "FINALIZED";

export interface CaseRecord {
  case_id: string;
  product_title: string;
  product_url?: string;
  seller_identifier: string;
  review_text?: string;
  review_reference?: string;
  rating: number;
  review_date: string;
  reviewer_profile_summary?: string;
  purchase_evidence_summary?: string;
  reason_for_suspicion: string;
  evidence_refs?: string;
  redaction_note?: string;
  status: CaseStatus;
  reporter: string;
}

export interface SignalProfile {
  review_timing_pattern: string;
  rating_anomaly: string;
  repeated_wording_pattern: string;
  reviewer_account_age_summary?: string;
  purchase_verification_summary?: string;
  seller_history_summary?: string;
  cluster_similarity_summary?: string;
  external_signal_summary?: string;
  evidence_confidence: string;
}

export interface ContextRecord {
  seller_explanation?: string;
  reviewer_explanation?: string;
  purchase_proof_summary?: string;
  promotion_disclosure?: string;
  marketplace_policy_context?: string;
  related_dispute_history?: string;
  correction_request?: string;
}

export interface EvidenceRecord {
  evidence_id: string;
  case_id: string;
  evidence_type: string;
  description: string;
  hash_or_cid?: string;
  link?: string;
  submitter: string;
}

export interface AppealRecord {
  appeal_id: string;
  case_id: string;
  appeal_reason: string;
  new_evidence_summary: string;
  new_document_refs?: string;
  explanation: string;
  appellant: string;
}

export interface AuthenticityReview {
  authenticity_verdict: AuthenticityVerdict;
  confidence: number;
  risk_level: RiskLevel;
  review_type: string;
  recommended_action: RecommendedAction;
  summary: string;
  supporting_signals: string[];
  counter_signals: string[];
  missing_context: string[];
  moderation_recommendation: {
    action: string;
    severity: string;
    needs_human_review: boolean;
  };
  case_id?: string;
  appeal_id?: string;
  appeal_decision?: AppealDecision;
}

export interface ProtocolStats {
  case_count: number;
  evidence_count: number;
  review_count: number;
  appeal_count: number;
  review_fee_wei: number;
  paused: boolean;
}

export type TxState =
  | "idle"
  | "preparing"
  | "submitting"
  | "submitted"
  | "polling"
  | "finalized"
  | "failed";
