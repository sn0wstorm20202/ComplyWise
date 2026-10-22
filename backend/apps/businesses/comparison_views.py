from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.applicability.models import DecisionRun
from apps.applicability.comparison import compare_runs
from apps.businesses.models import Business
from common.envelope import envelope, error_response

WALKTHROUGH_ID = "aba825d2-081b-47fa-9875-8c549b5189d8"


def private_response(data):
    response = Response(envelope(data))
    response["Cache-Control"] = "no-store, private"
    return response


class DecisionHistoryView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, business_id):
        business = Business.resolve_safely(business_id, request.user)
        if business is None:
            return error_response("NOT_FOUND", "Business not found.", http_status=404)
        # Fetch only selector metadata. Loading forty full manifests here would
        # transfer every archived catalogue before a comparison was selected.
        runs = list(DecisionRun.objects.filter(business=business, status="COMPLETED").exclude(cir_snapshot={})
                    .order_by("-created_at").values("id", "assessment_id", "assessment__title",
                        "profile_version__version", "created_at", "evaluation_date", "evaluation_manifest__mode",
                        "cir_snapshot__content_hash", "cir_snapshot__knowledge_fingerprint")[:41])
        cards = [{"run_id": str(r["id"]), "assessment_id": str(r["assessment_id"]) if r["assessment_id"] else None,
                  "title": r["assessment__title"] or f"Profile v{r['profile_version__version']}",
                  "profile_version": r["profile_version__version"], "evaluated_at": r["created_at"].isoformat(),
                  "evaluation_date": r["evaluation_date"].isoformat(), "mode": r["evaluation_manifest__mode"] or "LEGACY_UNPINNED",
                  "content_hash": r["cir_snapshot__content_hash"],
                  "knowledge_fingerprint": r["cir_snapshot__knowledge_fingerprint"]} for r in runs[:40]]
        return private_response({"business_id": str(business.id), "business_name": business.name,
                                 "runs": cards, "has_older_runs": len(runs) > 40})


class AssessmentComparisonView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, business_id, before_id, after_id):
        business = Business.resolve_safely(business_id, request.user)
        if business is None:
            return error_response("NOT_FOUND", "Business not found.", http_status=404)
        runs = {str(r.id): r for r in DecisionRun.objects.filter(business=business, status="COMPLETED",
                 pk__in=[before_id, after_id]).select_related("business", "assessment", "profile_version").prefetch_related("results")}
        if str(before_id) not in runs or str(after_id) not in runs:
            return error_response("NOT_FOUND", "Saved decision not found in this business.", http_status=404)
        try:
            data = compare_runs(runs[str(before_id)], runs[str(after_id)])
        except ValueError as exc:
            return error_response("COMPARISON_UNAVAILABLE", str(exc), http_status=409)
        return private_response(data)


class PreparedWalkthroughView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        business = Business.resolve_safely(WALKTHROUGH_ID, request.user)
        return private_response({"available": business is not None,
                                 "business_id": str(business.id) if business else None})
