"""Actual workspace writes survive reload and remain tenant/assessment scoped."""
from unittest.mock import patch

import pytest
from django.test import override_settings
from django.core.files.uploadedfile import SimpleUploadedFile
from rest_framework.test import APIClient

from apps.businesses.models import WorkspaceGuidance
from apps.documents.models import DocumentSubmission, DocumentRequirement
from apps.workflows.models import ComplianceCase
from domain.intelligence.workspace_guidance import normalize_workspace
from tests.test_workspace_guidance import setup_assessment, interpretation

pytestmark = pytest.mark.django_db


def saved_workspace(make_business, user):
    business, profile, assessment = setup_assessment(make_business, user)
    data = normalize_workspace(interpretation(), [])
    WorkspaceGuidance.objects.create(business=business, profile_version=profile, assessment=assessment,
        generation_key="x"*64, payload=data)
    return business, assessment, data


def test_contextual_workflow_completion_reload_and_reopen(make_business, user, auth_client):
    business, assessment, data = saved_workspace(make_business, user)
    workflow = data["workflows"][0]
    url = f"/api/v1/businesses/{business.id}/workflows/step"
    body = {"workflow_id": workflow["id"], "assessment_id": str(assessment.id), "step_number": 1, "status": "COMPLETED", "total_steps": 999}
    result = auth_client.post(url, body, format="json")
    assert result.status_code == 200, result.data
    reloaded = auth_client.get(f"/api/v1/businesses/{business.id}/workflows?assessment_id={assessment.id}").data["data"]
    item = next(w for w in reloaded["workflows"] if w["id"] == workflow["id"])
    assert item["progress_percent"] == 50 and item["steps"][0]["status"] == "COMPLETED"
    body["step_number"] = 2
    assert auth_client.post(url, body, format="json").status_code == 200
    body.update(step_number=1, status="NOT_STARTED")
    assert auth_client.post(url, body, format="json").status_code == 200
    body["step_number"] = 2
    assert auth_client.post(url, body, format="json").status_code == 200
    case = ComplianceCase.objects.get(business=business)
    assert case.status_code == "OPEN" and case.completed_at is None
    body["step_number"] = 3
    assert auth_client.post(url, body, format="json").status_code == 400


def test_portal_tracking_persists_without_claiming_document_review(make_business, user, auth_client):
    business, assessment, data = saved_workspace(make_business, user)
    doc_id = data["documents"][0]["id"]
    url = f"/api/v1/businesses/{business.id}/documents/portal-status"
    result = auth_client.post(url, {"document_id": doc_id, "assessment_id": str(assessment.id), "portal_uploaded": True}, format="json")
    assert result.status_code == 200, result.data
    reload = auth_client.get(f"/api/v1/businesses/{business.id}/documents?assessment_id={assessment.id}").data["data"]["documents"]
    assert next(d for d in reload if d["id"] == doc_id)["portal_uploaded"] is True
    assert not DocumentSubmission.objects.exists()
    assert DocumentRequirement.objects.first().status_code == "NOT_UPLOADED"


def test_versioned_upload_and_human_review_propagate_to_business(make_business, user, auth_client, other_user, tmp_path):
    business, assessment, data = saved_workspace(make_business, user)
    doc_id = data["documents"][0]["id"]
    url = f"/api/v1/businesses/{business.id}/documents/upload"
    def upload(content):
        return auth_client.post(url, {"document_id": doc_id, "assessment_id": str(assessment.id),
            "file": SimpleUploadedFile("business.pdf", content, content_type="application/pdf")}, format="multipart")
    with override_settings(MEDIA_ROOT=tmp_path), \
         patch("apps.documents.services.storage_service.DocumentStorageService.get_supabase_config", return_value={"url": "", "key": "", "bucket": ""}), \
         patch("apps.documents.services.precheck.verify_document", return_value={"checks": {}, "message": "Synthetic precheck"}):
        first = upload(b"%PDF-1.4 synthetic file one")
        second = upload(b"%PDF-1.4 synthetic file two")
        assert first.status_code == second.status_code == 201, (first.data, second.data)
        records = list(DocumentSubmission.objects.order_by("version_number"))
        assert [s.version_number for s in records] == [1, 2]
        assert records[0].storage_path != records[1].storage_path
        assert (tmp_path / records[0].storage_path).read_bytes() == b"%PDF-1.4 synthetic file one"
        assert records[1].status_code == "PRECHECK_PASSED"
        assert DocumentRequirement.objects.first().status_code == "UPLOADED"
        intruder = APIClient(); intruder.force_authenticate(other_user)
        assert intruder.get(f"/api/v1/documents/{records[1].id}/metadata").status_code in {403, 404}
        assert auth_client.post(f"/api/v1/documents/submissions/{records[1].id}/review", {"action": "APPROVE"}, format="json").status_code == 403
        other_user.is_staff = True; other_user.save()
        assert intruder.post(f"/api/v1/documents/submissions/{records[0].id}/review", {"action": "APPROVE"}, format="json").status_code == 409
        reviewed = intruder.post(f"/api/v1/documents/submissions/{records[1].id}/review", {"action": "APPROVE", "comments": "Reviewed synthetic fixture"}, format="json")
        assert reviewed.status_code == 200, reviewed.data
        docs = auth_client.get(f"/api/v1/businesses/{business.id}/documents?assessment_id={assessment.id}").data["data"]["documents"]
        assert next(d for d in docs if d["id"] == doc_id)["status"] == "VERIFIED"


def test_unlinked_business_record_is_saved_in_real_vault(make_business, user, auth_client, tmp_path):
    business, assessment, data = saved_workspace(make_business, user)
    with override_settings(MEDIA_ROOT=tmp_path), \
         patch("apps.documents.services.storage_service.DocumentStorageService.get_supabase_config", return_value={"url": "", "key": "", "bucket": ""}), \
         patch("apps.documents.services.precheck.verify_document", return_value={"checks": {}}):
        result = auth_client.post(f"/api/v1/businesses/{business.id}/documents/upload", {
            "assessment_id": str(assessment.id), "name": "Our business notes", "file": SimpleUploadedFile("notes.pdf", b"%PDF fixture")}, format="multipart")
    assert result.status_code == 201, result.data
    reloaded = auth_client.get(f"/api/v1/businesses/{business.id}/documents?assessment_id={assessment.id}").data["data"]["documents"]
    assert any(d["name"] == "Our business notes" and d["category"] == "BUSINESS_RECORD" for d in reloaded)
    assert DocumentSubmission.objects.count() == 1


def test_missing_image_ocr_keeps_actual_upload_for_human_review(make_business,user,auth_client,tmp_path):
    from apps.documents.models import DocumentReview
    business, assessment, data = saved_workspace(make_business,user)
    with override_settings(MEDIA_ROOT=tmp_path), \
         patch("apps.documents.services.storage_service.DocumentStorageService.get_supabase_config", return_value={"url":"","key":"","bucket":""}), \
         patch("apps.documents.services.precheck.verify_document",return_value={"verified":False,"ocr_analysis":{"source_type":"OCR_UNAVAILABLE","has_readable_text":False}}):
        result = auth_client.post(f"/api/v1/businesses/{business.id}/documents/upload", {
            "document_id":data["documents"][0]["id"],"assessment_id":str(assessment.id),
            "file":SimpleUploadedFile("scan.png",b"synthetic image bytes",content_type="image/png")},format="multipart")
    assert result.status_code == 201, result.data
    assert DocumentSubmission.objects.exists()
    assert DocumentRequirement.objects.first().status_code == "NEEDS_REVIEW"
    assert DocumentReview.objects.first().status == "PRECHECK_ERROR"
