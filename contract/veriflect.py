# v0.2.18
# { "Depends": "py-genlayer:1jb45aa8ynh2a9c9xn3b7qqh8sm5q93hwfp7jqmwsfhh8jpz09h6" }

from genlayer import *
import json


class VmUserError(Exception):
    """User-facing contract revert. Signals an expected failure, not a bug."""
    pass

REVIEW_FEE_WEI = 10_000_000_000_000_000  # 0.01 GEN

ALLOWED_VERDICTS = {
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
}

ALLOWED_RISK = {"LOW", "MEDIUM", "HIGH", "CRITICAL"}

ALLOWED_ACTIONS = {
    "NO_ACTION",
    "LABEL_AS_UNVERIFIED",
    "HOLD_FOR_REVIEW",
    "ESCALATE_TO_MARKETPLACE_MODERATOR",
    "REQUEST_MORE_CONTEXT",
    "REMOVE_OR_SUPPRESS_RECOMMENDED",
}

ALLOWED_APPEAL_DECISIONS = {
    "ORIGINAL_UPHELD",
    "ORIGINAL_ADJUSTED",
    "VERDICT_REVERSED",
    "MORE_CONTEXT_REQUIRED",
    "APPEAL_REJECTED",
}

ALLOWED_STATUSES = {
    "OPENED",
    "CONTEXT_SUBMITTED",
    "READY_FOR_REVIEW",
    "UNDER_REVIEW",
    "REVIEWED",
    "APPEALED",
    "FINALIZED",
}


class Veriflect(gl.Contract):
    owner: Address
    paused: bool
    review_fee: u256
    case_count: u256
    evidence_count: u256
    review_count: u256
    appeal_count: u256

    cases: TreeMap[str, str]
    signal_profiles: TreeMap[str, str]
    contexts: TreeMap[str, str]
    case_evidence: TreeMap[str, str]
    reviews: TreeMap[str, str]
    appeals: TreeMap[str, str]
    appeal_reviews: TreeMap[str, str]
    moderators: TreeMap[str, str]
    user_cases: TreeMap[str, str]
    protocol_stats: TreeMap[str, str]

    def __init__(self, owner: str = "") -> None:
        if owner:
            self.owner = Address(owner)
        else:
            self.owner = gl.message.sender_address
        self.paused = False
        self.review_fee = u256(REVIEW_FEE_WEI)
        self.case_count = u256(0)
        self.evidence_count = u256(0)
        self.review_count = u256(0)
        self.appeal_count = u256(0)
        self.moderators[str(self.owner)] = "ADMIN"

    # â”€â”€ helpers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

    def _require_owner(self) -> None:
        if gl.message.sender_address != self.owner:
            raise VmUserError("Only owner")

    def _require_moderator(self) -> None:
        if str(gl.message.sender_address) not in self.moderators:
            raise VmUserError("Only moderator or keeper")

    def _require_not_paused(self) -> None:
        if self.paused:
            raise VmUserError("Protocol paused")

    def _parse(self, raw: str) -> dict:
        try:
            data = json.loads(raw)
        except Exception:
            raise VmUserError("Invalid JSON")
        if not isinstance(data, dict):
            raise VmUserError("JSON must be object")
        return data

    def _get_case(self, case_id: str) -> dict:
        if case_id not in self.cases:
            raise VmUserError("Case not found")
        return self._parse(self.cases[case_id])

    def _set_status(self, case_id: str, status: str) -> None:
        if status not in ALLOWED_STATUSES:
            raise VmUserError("Invalid status")
        c = self._get_case(case_id)
        c["status"] = status
        self.cases[case_id] = json.dumps(c)

    # â”€â”€ deterministic writes â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

    @gl.public.write
    def create_case(self, case_id: str, case_json: str) -> None:
        self._require_not_paused()
        if not case_id:
            raise VmUserError("case_id required")
        if case_id in self.cases:
            raise VmUserError("Case already exists")
        data = self._parse(case_json)
        data["case_id"] = case_id
        data["status"] = "OPENED"
        data["reporter"] = str(gl.message.sender_address)
        self.cases[case_id] = json.dumps(data)
        self.case_count = u256(int(self.case_count) + 1)
        key = str(gl.message.sender_address)
        existing = self.user_cases[key] if key in self.user_cases else "[]"
        try:
            lst = json.loads(existing)
            if not isinstance(lst, list):
                lst = []
        except Exception:
            lst = []
        lst.append(case_id)
        self.user_cases[key] = json.dumps(lst)

    @gl.public.write
    def add_signal_profile(self, case_id: str, signal_json: str) -> None:
        self._require_not_paused()
        self._get_case(case_id)
        self._parse(signal_json)
        self.signal_profiles[case_id] = signal_json

    @gl.public.write
    def add_context(self, case_id: str, context_json: str) -> None:
        self._require_not_paused()
        self._get_case(case_id)
        self._parse(context_json)
        self.contexts[case_id] = context_json
        self._set_status(case_id, "CONTEXT_SUBMITTED")

    @gl.public.write
    def add_evidence(self, evidence_id: str, case_id: str, evidence_json: str) -> None:
        self._require_not_paused()
        self._get_case(case_id)
        if evidence_id in self.case_evidence:
            raise VmUserError("Evidence already exists")
        data = self._parse(evidence_json)
        data["evidence_id"] = evidence_id
        data["case_id"] = case_id
        data["submitter"] = str(gl.message.sender_address)
        self.case_evidence[evidence_id] = json.dumps(data)
        self.evidence_count = u256(int(self.evidence_count) + 1)

    @gl.public.write
    def mark_ready_for_review(self, case_id: str) -> None:
        self._require_not_paused()
        c = self._get_case(case_id)
        if not c.get("review_text") and not c.get("review_reference"):
            raise VmUserError("Review text or reference required")
        if case_id not in self.signal_profiles:
            raise VmUserError("Signal profile required")
        status = c.get("status", "")
        if status in ("REVIEWED", "FINALIZED"):
            raise VmUserError("Case already reviewed")
        self._set_status(case_id, "READY_FOR_REVIEW")

    @gl.public.write
    def open_appeal(self, appeal_id: str, case_id: str, appeal_json: str) -> None:
        self._require_not_paused()
        self._get_case(case_id)
        if appeal_id in self.appeals:
            raise VmUserError("Appeal already exists")
        data = self._parse(appeal_json)
        data["appeal_id"] = appeal_id
        data["case_id"] = case_id
        data["appellant"] = str(gl.message.sender_address)
        self.appeals[appeal_id] = json.dumps(data)
        self.appeal_count = u256(int(self.appeal_count) + 1)
        self._set_status(case_id, "APPEALED")

    @gl.public.write
    def finalize_case(self, case_id: str) -> None:
        self._require_not_paused()
        self._require_moderator()
        self._set_status(case_id, "FINALIZED")

    @gl.public.write
    def add_moderator(self, moderator: Address) -> None:
        self._require_owner()
        self.moderators[str(moderator)] = "MODERATOR"

    @gl.public.write
    def remove_moderator(self, moderator: Address) -> None:
        self._require_owner()
        key = str(moderator)
        if key in self.moderators:
            del self.moderators[key]

    @gl.public.write
    def set_review_fee(self, fee_wei: int) -> None:
        self._require_owner()
        self.review_fee = u256(fee_wei)

    @gl.public.write
    def pause_protocol(self) -> None:
        self._require_owner()
        self.paused = True

    @gl.public.write
    def unpause_protocol(self) -> None:
        self._require_owner()
        self.paused = False

    # â”€â”€ GenLayer functions â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

    def _build_review_prompt(self, case_id: str) -> str:
        case = self.cases[case_id] if case_id in self.cases else "{}"
        signals = self.signal_profiles[case_id] if case_id in self.signal_profiles else "{}"
        context = self.contexts[case_id] if case_id in self.contexts else "{}"
        return (
            "You are a product review authenticity judge for an e-commerce trust system.\n\n"
            "Do not label a review as suspicious based on timing or repeated text alone.\n"
            "Assess review text, rating pattern, timing, product context, seller context, "
            "reviewer history summary, purchase evidence summary, and marketplace signals.\n"
            "Judge whether the review appears genuine, suspicious, incentivised, bot-like, "
            "coordinated, review-bombed, seller-manipulated, or has insufficient evidence.\n\n"
            "Distinguish the signal layer (observable patterns) from the judgement layer "
            "(contextual interpretation).\n\n"
            "Do not invent missing facts. If seller or reviewer context could explain the pattern, "
            "include that. If evidence is insufficient, say so.\n"
            "Do not recommend removal unless evidence strongly supports coordinated fraud.\n\n"
            "Return strict JSON only with these exact fields:\n"
            "  authenticity_verdict: one of GENUINE, LIKELY_GENUINE, SUSPICIOUS, "
            "SUSPICIOUS_COORDINATED, LIKELY_INCENTIVISED, LIKELY_BOT_GENERATED, REVIEW_BOMBING, "
            "SELLER_MANIPULATED, INSUFFICIENT_EVIDENCE, FALSE_REPORT\n"
            "  confidence: integer 0-100\n"
            "  risk_level: one of LOW, MEDIUM, HIGH, CRITICAL\n"
            "  review_type: brief descriptive label\n"
            "  recommended_action: one of NO_ACTION, LABEL_AS_UNVERIFIED, HOLD_FOR_REVIEW, "
            "ESCALATE_TO_MARKETPLACE_MODERATOR, REQUEST_MORE_CONTEXT, REMOVE_OR_SUPPRESS_RECOMMENDED\n"
            "  summary: string\n"
            "  supporting_signals: array of strings\n"
            "  counter_signals: array of strings\n"
            "  missing_context: array of strings\n"
            "  moderation_recommendation: object with action (string), severity (string), "
            "needs_human_review (boolean)\n\n"
            f"CASE:\n{case}\n\nSIGNAL PROFILE:\n{signals}\n\nSELLER/REVIEWER CONTEXT:\n{context}\n"
        )

    def _validate_review(self, raw: str) -> dict:
        try:
            data = json.loads(raw)
        except Exception:
            raise VmUserError("GenLayer returned non-JSON")
        if not isinstance(data, dict):
            raise VmUserError("Output must be object")
        required = [
            "authenticity_verdict", "confidence", "risk_level", "review_type",
            "recommended_action", "summary", "supporting_signals", "counter_signals",
            "missing_context", "moderation_recommendation",
        ]
        for k in required:
            if k not in data:
                raise VmUserError(f"Missing field: {k}")
        if data["authenticity_verdict"] not in ALLOWED_VERDICTS:
            raise VmUserError("Invalid authenticity_verdict")
        if data["risk_level"] not in ALLOWED_RISK:
            raise VmUserError("Invalid risk_level")
        if data["recommended_action"] not in ALLOWED_ACTIONS:
            raise VmUserError("Invalid recommended_action")
        if not isinstance(data["confidence"], int) or not (0 <= data["confidence"] <= 100):
            raise VmUserError("confidence must be int 0-100")
        for k in ["supporting_signals", "counter_signals", "missing_context"]:
            if not isinstance(data[k], list):
                raise VmUserError(f"{k} must be array")
        if not isinstance(data.get("moderation_recommendation"), dict):
            raise VmUserError("moderation_recommendation must be object")
        if not isinstance(data.get("summary"), str) or not data["summary"].strip():
            raise VmUserError("summary required")
        return data

    @gl.public.write.payable
    def review_authenticity(self, case_id: str) -> None:
        self._require_not_paused()
        if int(gl.message.value) < int(self.review_fee):
            raise VmUserError("Insufficient review fee")
        c = self._get_case(case_id)
        if c.get("status") != "READY_FOR_REVIEW":
            raise VmUserError("Case not ready for review")
        self._set_status(case_id, "UNDER_REVIEW")
        prompt = self._build_review_prompt(case_id)

        def llm_call() -> str:
            return gl.nondet.exec_prompt(prompt)

        result = gl.eq_principle.prompt_comparative(
            llm_call,
            "Authenticity verdict, risk level, and recommended action must agree in substance."
        )
        validated = self._validate_review(result)
        validated["case_id"] = case_id
        self.reviews[case_id] = json.dumps(validated)
        self.review_count = u256(int(self.review_count) + 1)
        self._set_status(case_id, "REVIEWED")

    @gl.public.write.payable
    def review_appeal(self, appeal_id: str) -> None:
        self._require_not_paused()
        if int(gl.message.value) < int(self.review_fee):
            raise VmUserError("Insufficient review fee")
        if appeal_id not in self.appeals:
            raise VmUserError("Appeal not found")
        appeal = self._parse(self.appeals[appeal_id])
        case_id = appeal["case_id"]
        prior = self.reviews[case_id] if case_id in self.reviews else "{}"
        prompt = (
            self._build_review_prompt(case_id)
            + f"\n\nAPPEAL:\n{json.dumps(appeal)}\n\nPRIOR REVIEW:\n{prior}\n\n"
            "Reconsider the authenticity verdict in light of the appeal evidence and context. "
            "Return strict JSON with same shape. Also add field: "
            "appeal_decision â€” one of ORIGINAL_UPHELD, ORIGINAL_ADJUSTED, VERDICT_REVERSED, "
            "MORE_CONTEXT_REQUIRED, APPEAL_REJECTED."
        )

        def llm_call() -> str:
            return gl.nondet.exec_prompt(prompt)

        result = gl.eq_principle.prompt_comparative(
            llm_call, "Appeal decision and authenticity verdict must agree."
        )
        try:
            data = json.loads(result)
        except Exception:
            raise VmUserError("Invalid appeal review JSON")
        if data.get("appeal_decision") not in ALLOWED_APPEAL_DECISIONS:
            raise VmUserError("Invalid appeal_decision")
        data["appeal_id"] = appeal_id
        data["case_id"] = case_id
        self.appeal_reviews[appeal_id] = json.dumps(data)

    # â”€â”€ reads â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

    @gl.public.view
    def get_case(self, case_id: str) -> str:
        return self.cases[case_id] if case_id in self.cases else ""

    @gl.public.view
    def get_signal_profile(self, case_id: str) -> str:
        return self.signal_profiles[case_id] if case_id in self.signal_profiles else ""

    @gl.public.view
    def get_context(self, case_id: str) -> str:
        return self.contexts[case_id] if case_id in self.contexts else ""

    @gl.public.view
    def get_evidence(self, evidence_id: str) -> str:
        return self.case_evidence[evidence_id] if evidence_id in self.case_evidence else ""

    @gl.public.view
    def get_review(self, case_id: str) -> str:
        return self.reviews[case_id] if case_id in self.reviews else ""

    @gl.public.view
    def get_appeal(self, appeal_id: str) -> str:
        return self.appeals[appeal_id] if appeal_id in self.appeals else ""

    @gl.public.view
    def get_appeal_review(self, appeal_id: str) -> str:
        return self.appeal_reviews[appeal_id] if appeal_id in self.appeal_reviews else ""

    @gl.public.view
    def is_moderator(self, addr: Address) -> bool:
        return str(addr) in self.moderators

    @gl.public.view
    def get_user_cases(self, addr: Address) -> str:
        return self.user_cases[str(addr)] if str(addr) in self.user_cases else "[]"

    @gl.public.view
    def get_review_fee(self) -> int:
        return int(self.review_fee)

    @gl.public.view
    def get_stats(self) -> str:
        return json.dumps({
            "case_count": int(self.case_count),
            "evidence_count": int(self.evidence_count),
            "review_count": int(self.review_count),
            "appeal_count": int(self.appeal_count),
            "review_fee_wei": int(self.review_fee),
            "paused": self.paused,
        })


