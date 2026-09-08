"""Generic applicability engine and decision pipeline.

Authority: TRD_v2.0 §10, §14, §15, §16, §17; PRD_v2.0 §P3, §P4, §P5, §P6; Task 2 Corrections C1-C6, C9.

Invariants:
1. ONLY `PUBLISHED` rules and `PUBLISHED` requirements enter evaluation (TRD_v2.0 §25).
2. Evaluator logic is completely generic: NO scenario-specific branching or hardcoded logic is allowed (TRD_v2.0 §10).
3. Precedence: OVERRIDE > EXEMPTION > EXCEPTION > NORMAL. Rule results are honoured.
4. All candidate rules are evaluated and traced; contradictory matches at the same precedence yield CONFLICT_REVIEW.
5. In-scope published requirements without usable rules yield UNVERIFIED with explicit trace reasons.
6. Evidence chain is mandatory: missing, inactive, expired, future, or conflicting evidence prevents APPLICABLE.
7. Uncertainty is preserved: missing inputs produce NEEDS_INFORMATION, never silent NOT_APPLICABLE.
"""

from __future__ import annotations

import datetime
from typing import Any

from django.db.models import Q
from django.utils import timezone

from common.enums import (
    ApplicabilityStatus,
    DecisionRunStatus,
    KnowledgeStatus,
    RuleType,
    SourceStatus,
    VerificationStatus,
)
from domain.evaluation.evaluator import evaluate_ast
from domain.evaluation.truth import FALSE, TRUE, UNKNOWN
from domain.jurisdictions.resolver import normalize_jurisdiction
from apps.businesses.models import Business, BusinessProfileVersion
from apps.evidence.models import Evidence
from apps.knowledge.models import RequirementDefinition, RuleVersion
from .models import DecisionResult, DecisionRun

PRECEDENCE_MAP = {
    RuleType.OVERRIDE: 4,
    RuleType.EXEMPTION: 3,
    RuleType.EXCEPTION: 2,
    RuleType.NORMAL: 1,
}


def models_effective_filter(eval_date: datetime.date):
    """Build Django Q filter ensuring effective_from <= eval_date and (until is null or >= eval_date)."""
    return (
        (Q(effective_from__isnull=True) | Q(effective_from__lte=eval_date))
        & (Q(effective_until__isnull=True) | Q(effective_until__gte=eval_date))
    )


class ApplicabilityEngine:
    """Deterministic, knowledge-driven compliance applicability evaluator."""

    def evaluate_business_profile(
        self,
        *,
        business: Business,
        profile_version: BusinessProfileVersion,
        evaluation_date: datetime.date | None = None,
        save_run: bool = True,
    ) -> DecisionRun:
        """Run complete applicability evaluation for a business profile version."""
        eval_date = evaluation_date or timezone.localdate()

        # Build context from profile variables
        context: dict[str, Any] = {}
        for key, entry in profile_version.variables.items():
            context[key] = entry.get("value") if isinstance(entry, dict) else entry

        # Jurisdiction resolution via data-driven knowledge registry (TRD_v2.0 §10, C4)
        raw_state = context.get("state")
        business_state: str | None = None
        state_is_unknown = False
        if raw_state is not None and str(raw_state).strip():
            resolved_state = normalize_jurisdiction(raw_state)
            if resolved_state:
                business_state = resolved_state
                context["state"] = resolved_state
            else:
                state_is_unknown = True

        # Initialise DecisionRun as RUNNING (C9)
        run = DecisionRun(
            business=business,
            profile_version=profile_version,
            evaluation_date=eval_date,
            status=DecisionRunStatus.RUNNING,
        )
        if save_run:
            run.save()

        try:
            # 1. Fetch ALL published requirements (TRD_v2.0 §25, C3, C5)
            all_published_reqs = list(
                RequirementDefinition.objects.filter(
                    status=KnowledgeStatus.PUBLISHED
                ).order_by("jurisdiction", "requirement_id")
            )

            # 2. Fetch ALL published rules linked to published requirements
            published_rules_qs = RuleVersion.objects.filter(
                status=KnowledgeStatus.PUBLISHED,
                requirement__status=KnowledgeStatus.PUBLISHED,
            ).select_related("requirement")

            published_rules = list(published_rules_qs.order_by("requirement_id", "-version"))

            # Group rules by requirement ID
            all_rules_by_req: dict[str, list[RuleVersion]] = {}
            for r in published_rules:
                all_rules_by_req.setdefault(r.requirement.requirement_id, []).append(r)

            # Pre-fetch evidence records for explanation traces and validation (C6)
            all_evidence_refs: set[str] = set()
            for r in published_rules:
                all_evidence_refs.update(r.evidence_refs or [])
            for req in all_published_reqs:
                all_evidence_refs.update(req.evidence_refs or [])

            evidence_map: dict[str, dict[str, Any]] = {}
            if all_evidence_refs:
                for ev in Evidence.objects.filter(evidence_id__in=all_evidence_refs).select_related("source"):
                    evidence_map[ev.evidence_id] = {
                        "evidence_id": ev.evidence_id,
                        "source_id": ev.source.source_id,
                        "source_title": ev.source.title,
                        "authority": ev.source.authority,
                        "source_status": ev.source.status,
                        "locator": ev.locator,
                        "excerpt": ev.excerpt,
                        "verification_status": ev.verification_status,
                        "effective_from": ev.effective_from.isoformat() if ev.effective_from else None,
                        "effective_until": ev.effective_until.isoformat() if ev.effective_until else None,
                        "_raw_effective_from": ev.effective_from,
                        "_raw_effective_until": ev.effective_until,
                    }

            results_to_create: list[DecisionResult] = []
            had_failures = False

            # Evaluate every published requirement in scope (C5)
            for req in all_published_reqs:
                req_jurisdiction = req.jurisdiction.strip().upper()
                is_central = req_jurisdiction == "CENTRAL"

                # Check jurisdiction match
                if not is_central:
                    if raw_state is None or not str(raw_state).strip() or state_is_unknown:
                        # State is missing or unresolvable -> NEEDS_INFORMATION (C4)
                        result = DecisionResult(
                            decision_run=run,
                            requirement_id=req.requirement_id,
                            requirement_name=req.name,
                            rule_version=None,
                            status=ApplicabilityStatus.NEEDS_INFORMATION,
                            explanation_trace={
                                "requirement_id": req.requirement_id,
                                "requirement_name": req.name,
                                "authority": req.authority,
                                "jurisdiction": req.jurisdiction,
                                "status": ApplicabilityStatus.NEEDS_INFORMATION,
                                "reason": "JURISDICTION_UNRESOLVED",
                                "note": "Business jurisdiction is missing or unrecognised; state requirement cannot be decided.",
                                "evaluations": [],
                            },
                            evidence_refs=[],
                        )
                        results_to_create.append(result)
                        continue

                    if business_state and req_jurisdiction != business_state:
                        # Business state is known and differs from the requirement's
                        # state. A Gujarat licence cannot bind a Tamil Nadu premises,
                        # so this is a decision, not an unverified gap.
                        result = DecisionResult(
                            decision_run=run,
                            requirement_id=req.requirement_id,
                            requirement_name=req.name,
                            rule_version=None,
                            status=ApplicabilityStatus.NOT_APPLICABLE,
                            explanation_trace={
                                "requirement_id": req.requirement_id,
                                "requirement_name": req.name,
                                "authority": req.authority,
                                "jurisdiction": req.jurisdiction,
                                "status": ApplicabilityStatus.NOT_APPLICABLE,
                                "reason": "JURISDICTION_NOT_MATCHED",
                                "note": (
                                    f"This requirement applies in {req.jurisdiction}; "
                                    f"the business operates in {business_state}."
                                ),
                                "evaluations": [],
                            },
                            evidence_refs=[],
                        )
                        results_to_create.append(result)
                        continue

                # Requirement is in jurisdiction scope (CENTRAL or matching state)
                candidate_rules = all_rules_by_req.get(req.requirement_id, [])

                # Filter candidate rules by effective date (TRD_v2.0 §25, C5)
                effective_rules = [
                    r for r in candidate_rules
                    if (r.effective_from is None or r.effective_from <= eval_date)
                    and (r.effective_until is None or r.effective_until >= eval_date)
                ]

                # If no published rules exist at all (C5)
                if not candidate_rules:
                    result = DecisionResult(
                        decision_run=run,
                        requirement_id=req.requirement_id,
                        requirement_name=req.name,
                        rule_version=None,
                        status=ApplicabilityStatus.UNVERIFIED,
                        explanation_trace={
                            "requirement_id": req.requirement_id,
                            "requirement_name": req.name,
                            "authority": req.authority,
                            "jurisdiction": req.jurisdiction,
                            "status": ApplicabilityStatus.UNVERIFIED,
                            "reason": "NO_PUBLISHED_RULE",
                            "evaluations": [],
                        },
                        evidence_refs=[],
                    )
                    results_to_create.append(result)
                    continue

                # If published rules exist but none in effective date window (C5)
                if not effective_rules:
                    result = DecisionResult(
                        decision_run=run,
                        requirement_id=req.requirement_id,
                        requirement_name=req.name,
                        rule_version=None,
                        status=ApplicabilityStatus.UNVERIFIED,
                        explanation_trace={
                            "requirement_id": req.requirement_id,
                            "requirement_name": req.name,
                            "authority": req.authority,
                            "jurisdiction": req.jurisdiction,
                            "status": ApplicabilityStatus.UNVERIFIED,
                            "reason": "OUTSIDE_EFFECTIVE_WINDOW",
                            "evaluations": [],
                        },
                        evidence_refs=[],
                    )
                    results_to_create.append(result)
                    continue

                # Evaluate all candidate effective rules (C1, C2, C6)
                res = self._evaluate_requirement_rules(
                    requirement=req,
                    rules=effective_rules,
                    context=context,
                    evidence_map=evidence_map,
                    eval_date=eval_date,
                    decision_run=run,
                )
                results_to_create.append(res)

            if save_run and results_to_create:
                DecisionResult.objects.bulk_create(results_to_create)

            # Update run status to COMPLETED (C9)
            run.status = DecisionRunStatus.COMPLETED
            if save_run:
                run.save(update_fields=["status"])

            return run

        except Exception:
            # On failure, mark run as FAILED and re-raise (C9)
            if save_run:
                run.status = DecisionRunStatus.FAILED
                run.save(update_fields=["status"])
            raise

    def _evaluate_requirement_rules(
        self,
        *,
        requirement: RequirementDefinition,
        rules: list[RuleVersion],
        context: dict[str, Any],
        evidence_map: dict[str, dict[str, Any]],
        eval_date: datetime.date,
        decision_run: DecisionRun,
    ) -> DecisionResult:
        """Evaluate all candidate rules for a requirement, honour rule.result & precedence, and detect conflicts."""
        rule_evaluations: list[dict[str, Any]] = []
        matched_rules: list[tuple[RuleVersion, Any, Any]] = []
        has_unknown = False
        all_false = True

        # Invariant C2: NO break. Every candidate rule must be evaluated and traced.
        for rule in rules:
            truth_res, trace = evaluate_ast(rule.condition_ast, context)
            rule_eval = {
                "rule_id": rule.rule_id,
                "version": rule.version,
                "rule_type": rule.rule_type,
                "truth_value": str(truth_res),
                "configured_result": rule.result,
                "trace": trace.to_dict(),
            }
            rule_evaluations.append(rule_eval)

            if truth_res == TRUE:
                all_false = False
                matched_rules.append((rule, truth_res, trace))
            elif truth_res == UNKNOWN:
                has_unknown = True
                all_false = False

        conflicts: list[str] = []
        matched_rule: RuleVersion | None = None
        final_status: str
        evidence_reason: str | None = None

        if matched_rules:
            # Precedence: OVERRIDE > EXEMPTION > EXCEPTION > NORMAL (C1)
            max_prec = max(PRECEDENCE_MAP.get(r.rule_type, 1) for r, _, _ in matched_rules)
            highest_matches = [
                (r, t_res, tr) for r, t_res, tr in matched_rules
                if PRECEDENCE_MAP.get(r.rule_type, 1) == max_prec
            ]

            # Conflict detection: distinct results at same precedence level (C2)
            distinct_results = {r.result for r, _, _ in highest_matches}
            if len(distinct_results) > 1:
                final_status = ApplicabilityStatus.CONFLICT_REVIEW
                conflicts = [r.rule_id for r, _, _ in highest_matches]
                matched_rule = highest_matches[0][0]
            else:
                matched_rule = highest_matches[0][0]
                final_status = matched_rule.result
        elif has_unknown:
            final_status = ApplicabilityStatus.NEEDS_INFORMATION
        elif all_false:
            final_status = ApplicabilityStatus.NOT_APPLICABLE
        else:
            final_status = ApplicabilityStatus.NEEDS_INFORMATION

        # Enforce Source -> Evidence -> Rule chain when result is APPLICABLE (C6)
        associated_evidence: list[dict[str, Any]] = []
        rule_evidence_refs = (matched_rule.evidence_refs if matched_rule else []) or []

        for ref in rule_evidence_refs:
            if ref in evidence_map:
                ev_clean = {k: v for k, v in evidence_map[ref].items() if not k.startswith("_")}
                associated_evidence.append(ev_clean)

        if final_status == ApplicabilityStatus.APPLICABLE and matched_rule is not None:
            if not rule_evidence_refs:
                # Rule has zero evidence -> UNVERIFIED (C6)
                final_status = ApplicabilityStatus.UNVERIFIED
                evidence_reason = "ZERO_EVIDENCE"
            else:
                for ref in rule_evidence_refs:
                    if ref not in evidence_map:
                        # Dangling evidence reference -> UNVERIFIED (C6)
                        final_status = ApplicabilityStatus.UNVERIFIED
                        evidence_reason = "DANGLING_EVIDENCE_REF"
                        break
                    ev_data = evidence_map[ref]
                    # Inactive source -> UNVERIFIED (C6)
                    if ev_data["source_status"] != SourceStatus.ACTIVE:
                        final_status = ApplicabilityStatus.UNVERIFIED
                        evidence_reason = f"INACTIVE_SOURCE_{ev_data['source_status']}"
                        break
                    # Future effective evidence -> UNVERIFIED (C6)
                    if ev_data.get("_raw_effective_from") and ev_data["_raw_effective_from"] > eval_date:
                        final_status = ApplicabilityStatus.UNVERIFIED
                        evidence_reason = "FUTURE_EFFECTIVE_EVIDENCE"
                        break
                    # Expired evidence -> UNVERIFIED (C6)
                    if ev_data.get("_raw_effective_until") and ev_data["_raw_effective_until"] < eval_date:
                        final_status = ApplicabilityStatus.UNVERIFIED
                        evidence_reason = "EXPIRED_EVIDENCE"
                        break
                    # Conflicting evidence -> CONFLICT_REVIEW (C6)
                    if ev_data["verification_status"] == VerificationStatus.CONFLICTING:
                        final_status = ApplicabilityStatus.CONFLICT_REVIEW
                        evidence_reason = "CONFLICTING_EVIDENCE"
                        break
                    # Unverified evidence -> UNVERIFIED (C6)
                    if ev_data["verification_status"] == VerificationStatus.UNVERIFIED:
                        final_status = ApplicabilityStatus.UNVERIFIED
                        evidence_reason = "UNVERIFIED_EVIDENCE"
                        break

        explanation: dict[str, Any] = {
            "requirement_id": requirement.requirement_id,
            "requirement_name": requirement.name,
            "authority": requirement.authority,
            "jurisdiction": requirement.jurisdiction,
            "status": final_status,
            "matched_rule_id": matched_rule.rule_id if matched_rule else None,
            "matched_rule_version": matched_rule.version if matched_rule else None,
            "matched_rule_type": matched_rule.rule_type if matched_rule else None,
            "evaluations": rule_evaluations,
            "evidence_count": len(associated_evidence),
        }
        if conflicts:
            explanation["conflicts"] = conflicts
        if evidence_reason:
            explanation["evidence_reason"] = evidence_reason

        return DecisionResult(
            decision_run=decision_run,
            requirement_id=requirement.requirement_id,
            requirement_name=requirement.name,
            rule_version=matched_rule,
            status=final_status,
            explanation_trace=explanation,
            evidence_refs=associated_evidence,
        )
