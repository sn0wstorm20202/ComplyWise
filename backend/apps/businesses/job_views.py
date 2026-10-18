from django.conf import settings
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from common.envelope import envelope, error_response
from .models import Assessment, AssessmentJob
from .jobs import enqueue, project, JobConflict


class AssessmentJobsView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, run_id):
        if not isinstance(request.data, dict):
            return error_response("VALIDATION_ERROR", "Expected an operation object.", http_status=400)
        assessment = Assessment.accessible_to(request.user).filter(pk=run_id).first()
        if not assessment:
            return error_response("NOT_FOUND", "Assessment not found.", http_status=404)
        if not getattr(settings, "ENABLE_ASSESSMENT_JOBS", False):
            return error_response("ASYNC_DISABLED", "Background processing is not enabled.", http_status=503)
        try:
            refresh = request.data.get("force_refresh", False)
            if not isinstance(refresh, bool):
                raise ValueError("force_refresh must be a boolean.")
            job = enqueue(assessment, request.user, request.data.get("stage"),
                idempotency_key=request.headers.get("Idempotency-Key", ""), force_refresh=refresh)
        except JobConflict as exc:
            return error_response("JOB_CONFLICT", str(exc), http_status=409)
        except ValueError as exc:
            return error_response("VALIDATION_ERROR", str(exc), http_status=400)
        response = Response(envelope(project(job)), status=200 if job.status == "SUCCEEDED" else 202)
        response["Location"] = f"/api/v1/assessments/{run_id}/jobs/{job.id}/"
        response["Retry-After"] = "2"
        return response


class AssessmentJobDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, run_id, job_id):
        job = AssessmentJob.objects.filter(pk=job_id, assessment_id=run_id,
            assessment__in=Assessment.accessible_to(request.user)).first()
        if not job:
            return error_response("NOT_FOUND", "Operation not found.", http_status=404)
        return Response(envelope(project(job)))
