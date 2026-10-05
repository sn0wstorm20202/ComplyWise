"""Project existing scheme-version provenance without an invented source model."""
from urllib.parse import urlsplit

from apps.evidence.presentation import exact_source_url
from apps.schemes.provenance import is_authored_fixture_version


def scheme_source_projection(version):
    authored = is_authored_fixture_version(version)
    url = exact_source_url(version.source_url)
    return {"id": str(version.id), "title": "Source not established for this historical authored record" if authored else version.title,
        "recorded_title": version.title, "authority": None if authored else version.authority,
        "url": None if authored else url, "canonical_url": None if authored else url, "resolved_url": None,
        "source_domain": urlsplit(url).hostname if url and not authored else None,
        "source_type": "SCHEME_VERSION", "retrieved_at": None, "acquisition_method": None,
        "publication_date": version.published_date.isoformat() if version.published_date and not authored else None,
        "effective_date": version.effective_from.isoformat() if version.effective_from and not authored else None,
        "content_hash": version.content_hash, "version": version.version_number,
        "evidence_status": "UNVERIFIED" if authored else version.verification_status,
        "recorded_verification_status": version.verification_status,
        "reviewed": not authored and version.verification_status == "VERIFIED",
        "status": "ACTIVE" if version.is_active else "ARCHIVED", "origin": "AUTHORED_FIXTURE" if authored else "RECORDED_SCHEME_VERSION"}


def scheme_evidence_projection(version):
    if is_authored_fixture_version(version) or not (version.evidence_snippet or "").strip():
        return []
    return [{"source_id": str(version.id), "excerpt": version.evidence_snippet,
             "location": None, "verification_status": version.verification_status}]
