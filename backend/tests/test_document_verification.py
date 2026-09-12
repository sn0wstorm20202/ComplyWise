"""Tests for software-level statutory document verification engine.

Verifies:
1. Proper file type required for that compliance (e.g. PDF requirement).
2. Mandatory statutory fields completeness.
3. Statutory format compliance and date of expiry compliance.
4. AI pre-validation & OCR analysis (flagging irrelevant/random documents).
"""

from __future__ import annotations

import datetime
from apps.documents.verification import (
    STATUTORY_COMPLIANCE_STANDARDS,
    ai_prevalidate_and_relevance_check,
    check_file_type_for_compliance,
    check_format_and_expiry_compliance,
    check_mandatory_fields_filled,
    perform_ocr_inspection,
    verify_document,
)


def test_file_type_compliant_pdf():
    std = STATUTORY_COMPLIANCE_STANDARDS["LABOR"]
    result = check_file_type_for_compliance({
        "file_name": "factory_license_approved.pdf",
        "file_size_bytes": 2400000,
        "category": "FACTORY AUDIT",
        "requirement_name": "Factories Act 1948 §6",
    }, std)
    assert result["passed"] is True
    assert result["status"] == "PASSED"
    assert result["detected_extension"] == ".pdf"


def test_file_type_non_compliant_image_for_blueprint():
    std = STATUTORY_COMPLIANCE_STANDARDS["LABOR"]
    result = check_file_type_for_compliance({
        "file_name": "blueprint_drawing.png",
        "file_size_bytes": 1024000,
        "category": "BLUEPRINT LAYOUT",
        "requirement_name": "Factories Act 1948 §6",
    }, std)
    assert result["passed"] is False
    assert result["status"] == "FAILED"
    assert any("strictly requires vector pdf" in issue.lower() for issue in result["issues"])


def test_mandatory_fields_all_filled():
    result = check_mandatory_fields_filled({
        "name": "Food Safety Management System (FSMS) Plan",
        "category": "Statutory Proof",
        "authority": "FSSAI",
        "requirement_id": "REQ-FSSAI-001",
        "reference_number": "FSSAI-LIC-8812",
        "valid_until": "2028-12-31",
        "file_name": "fsms_plan_2026.pdf",
    })
    assert result["passed"] is True
    assert len(result["missing_fields"]) == 0
    assert len(result["filled_fields"]) == 7


def test_mandatory_fields_missing_items():
    result = check_mandatory_fields_filled({
        "name": "Doc",
        # Missing category, authority, requirement_id, reference_number, valid_until, file_name
    })
    assert result["passed"] is False
    assert "Document Category" in result["missing_fields"]
    assert "Certificate / License Reference Number" in result["missing_fields"]
    assert "Valid Until / Date of Expiry" in result["missing_fields"]


def test_format_and_expiry_expired_document():
    std = STATUTORY_COMPLIANCE_STANDARDS["ENVIRONMENT"]
    result = check_format_and_expiry_compliance({
        "name": "Consent to Operate CTO Schedule",
        "category": "Environmental",
        "valid_until": "2020-01-01",  # Expired
    }, std)
    assert result["passed"] is False
    assert result["is_expiry_compliant"] is False
    assert any("expired" in issue.lower() for issue in result["issues"])


def test_ai_prevalidation_flags_irrelevant_random_document():
    std = STATUTORY_COMPLIANCE_STANDARDS["LABOR"]
    data = {
        "name": "Personal Restaurant Electricity Bill",
        "category": "Statutory Proof",
        "requirement_name": "Factories Act 1948 §6 (Factory Structural Stability)",
        "authority": "Directorate of Industrial Safety & Health (DISH)",
        "file_name": "electricity_bill.pdf",
        "reference_number": "EB-9921",
    }
    ocr = perform_ocr_inspection(data)
    result = ai_prevalidate_and_relevance_check(data, ocr, std)

    assert result["passed"] is False
    assert result["irrelevant_document_flag"] is True
    assert "The document is not the kind of document we are looking for" in result["flag_message"]
    assert "You need to actually do the OCR, check the extensions, and check whether all the fields have been filled up" in result["flag_message"]


def test_verify_document_end_to_end_pass():
    future_date = (datetime.date.today() + datetime.timedelta(days=365)).isoformat()
    data = {
        "name": "Approved Factory Building Plan & Structural Stability Certificate",
        "category": "FACTORY AUDIT",
        "authority": "Directorate of Industrial Safety & Health (DISH)",
        "requirement_id": "Factories Act 1948 §6",
        "requirement_name": "Factories Act 1948 §6 (Factory License)",
        "reference_number": "DISH-SSC-2026-991",
        "valid_until": future_date,
        "file_name": "structural_stability_dish.pdf",
        "file_size_bytes": 2100000,
    }
    res = verify_document(data)
    assert res["verified"] is True
    assert res["overall_status"] == "PASSED"
    assert res["status"] == "VERIFIED"
    assert res["irrelevant_document_flag"] is False
    assert res["checks"]["file_type"]["passed"] is True
    assert res["checks"]["field_completeness"]["passed"] is True
    assert res["checks"]["format_and_expiry"]["passed"] is True
    assert res["checks"]["ai_relevance"]["passed"] is True


def test_blank_image_fails_ai_prevalidation_with_user_flag():
    """Verify that uploading a real image with NO text whatsoever is rejected by genuine OCR."""
    from PIL import Image
    import io

    # Create a blank image without any text
    img = Image.new("RGB", (300, 150), color=(245, 245, 245))
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    buf.seek(0)
    buf.name = "random_blank_picture.png"

    future_date = (datetime.date.today() + datetime.timedelta(days=365)).isoformat()
    data = {
        "name": "Food Safety Management System (FSMS) Plan",
        "category": "Statutory Proof",
        "authority": "FSSAI",
        "requirement_id": "REQ-FSSAI-001",
        "reference_number": "FSSAI-LIC-9912",
        "valid_until": future_date,
        "file_name": "random_blank_picture.png",
        "file_size_bytes": len(buf.getvalue()),
    }

    res = verify_document(data, file=buf)

    assert res["verified"] is False
    assert res["overall_status"] == "FAILED"
    assert res["irrelevant_document_flag"] is True
    assert "The document is not the kind of document we are looking for" in res["flag_message"]
    assert "You need to actually do the OCR, check the extensions, and check whether all the fields have been filled up" in res["flag_message"]
    assert res["checks"]["ai_relevance"]["passed"] is False


def test_image_with_statutory_text_passes_ocr_and_ai_prevalidation():
    """Verify that uploading an image with genuine statutory text is recognized by OCR."""
    from PIL import Image, ImageDraw
    import io

    img = Image.new("RGB", (700, 300), color=(255, 255, 255))
    draw = ImageDraw.Draw(img)
    draw.text((20, 20), "FOOD SAFETY AND STANDARDS AUTHORITY OF INDIA", fill=(0, 0, 0))
    draw.text((20, 60), "FSSAI Form B Statutory Schedule 4 License", fill=(0, 0, 0))
    draw.text((20, 100), "Certificate Reference No: FSSAI-2026-881", fill=(0, 0, 0))
    draw.text((20, 140), "Water Potability IS 10500 Compliance Valid Until 2028", fill=(0, 0, 0))

    buf = io.BytesIO()
    img.save(buf, format="PNG")
    buf.seek(0)
    buf.name = "fssai_certificate.png"

    future_date = (datetime.date.today() + datetime.timedelta(days=365)).isoformat()
    data = {
        "name": "Food Safety Management System (FSMS) Plan",
        "category": "Statutory Proof",
        "authority": "FSSAI",
        "requirement_id": "REQ-FSSAI-001",
        "requirement_name": "FSSAI Central / State License",
        "reference_number": "FSSAI-2026-881",
        "valid_until": future_date,
        "file_name": "fssai_certificate.png",
        "file_size_bytes": len(buf.getvalue()),
    }

    res = verify_document(data, file=buf)

    assert res["verified"] is True
    assert res["overall_status"] == "PASSED"
    assert res["irrelevant_document_flag"] is False
    assert res["checks"]["ai_relevance"]["passed"] is True

