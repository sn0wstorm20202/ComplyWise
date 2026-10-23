"""One authorized read for the selected workspace, without the directory waterfall."""
from uuid import UUID

from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.businesses.models import Business, UserWorkspaceState
from common.envelope import envelope, error_response
from common.read_scope import read_scope, read_assessment
from .services import get_dashboard_summary


class WorkspaceBootstrapView(APIView):
    permission_classes = [IsAuthenticated]

    @read_scope
    def get(self, request):
        business_id = request.query_params.get("business_id")
        explicit_assessment = request.query_params.get("assessment_id")
        cached_assessment = request.query_params.get("cached_assessment_id")
        for value in (business_id, explicit_assessment):
            if value:
                try:
                    UUID(value)
                except ValueError:
                    return error_response("NOT_FOUND", "Workspace selection not found.", http_status=404)
        if business_id:
            business = Business.resolve_safely(business_id, request.user)
            if business is None:
                return error_response("NOT_FOUND", "Business not found.", http_status=404)
            workspace = UserWorkspaceState.objects.filter(user=request.user).values(
                "active_business_id", "active_assessment_id").first() or {}
        else:
            ws, _ = UserWorkspaceState.resolve_for_user(request.user)
            business = ws.active_business
            workspace = {"active_business_id": ws.active_business_id, "active_assessment_id": ws.active_assessment_id}

        assessment = None
        if business:
            preferred = explicit_assessment or (
                workspace.get("active_assessment_id") if str(workspace.get("active_business_id")) == str(business.id) else None)
            if preferred:
                assessment = read_assessment(business, str(preferred))
                if explicit_assessment and assessment is None:
                    return error_response("NOT_FOUND", "Assessment not found for this business.", http_status=404)
            if assessment is None and cached_assessment:
                try:
                    UUID(cached_assessment)
                    assessment = read_assessment(business, cached_assessment)
                except ValueError:
                    pass  # Browser cache is advisory, never an authorization boundary.
            if assessment is None:
                assessment = read_assessment(business)
        elif explicit_assessment:
            return error_response("NOT_FOUND", "Assessment not found for this business.", http_status=404)

        profile = assessment.profile_version if assessment and assessment.profile_version_id else (business.current_profile if business else None)
        summary = get_dashboard_summary(business, str(assessment.id) if assessment else None) if business else None
        response = Response(envelope({
            "business": {"id": str(business.id), "name": business.name,
                "created_at": business.created_at, "updated_at": business.updated_at,
                "assessment_count": business.assessments.count()} if business else None,
            "assessment_id": str(assessment.id) if assessment else None,
            "profile_variables": profile.variables if profile else {},
            "dashboard": summary,
        }))
        response["Cache-Control"] = "private, no-store"
        return response
