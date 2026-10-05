"""Expose recorded source identity without manufacturing a document link."""
from urllib.parse import parse_qsl, urlsplit


def exact_source_url(value):
    """Reject portal home/search/login links as substitutes for source documents.

    This validates the recorded URL's shape only. Acquisition validation remains
    responsible for checking destinations and content; this never invents a URL.
    """
    if not isinstance(value, str) or not value.strip():
        return None
    value = value.strip()
    try:
        parsed = urlsplit(value)
        if parsed.scheme not in {"https", "http"} or not parsed.hostname or parsed.username or parsed.password:
            return None
        parameters = {key.casefold(): value.strip() for key, value in parse_qsl(parsed.query, keep_blank_values=True)}
        if parameters.keys() & {"q", "query", "search"}:
            return None
        path = parsed.path.strip("/").casefold()
        if not path or path in {"index", "index.html", "index.htm", "index.php", "home", "home.aspx", "default.aspx"}:
            # A documented resource query can identify a specific source even
            # when the portal serves it from its root endpoint.
            resource_keys = {"document", "document_id", "documentid", "file", "file_id", "id", "notification"}
            if not any(parameters.get(key) for key in resource_keys):
                return None
        segments = set(path.split("/"))
        if any(segment.split(".", 1)[0] in {"search", "login", "signin", "sign-in", "home"} for segment in segments):
            return None
        if segments.intersection({"search", "login", "signin", "sign-in", "home"}) or path in {"bis", "portal", "government", "home/index.aspx"}:
            return None
        if path.rsplit("/", 1)[-1] in {"index.html", "index.htm", "index.aspx", "home.html", "home.htm", "home.aspx", "default.aspx"}:
            return None
    except (TypeError, ValueError):
        return None
    return value


def source_projection(source, evidence=None):
    """Project only stored source fields and safely selected capture metadata."""
    metadata = source.metadata if isinstance(source.metadata, dict) else {}
    capture = {}
    captured = None
    if source.content_hash and hasattr(source, "retrieved_documents"):
        captured = source.retrieved_documents.filter(content_hash=source.content_hash).first()
        if captured:
            capture = (captured.metadata or {}).get("capture") or {}
            if not isinstance(capture, dict):
                capture = {}
    canonical = exact_source_url(source.canonical_url)
    recorded_final = metadata.get("final_url") or metadata.get("resolved_url")
    resolved = exact_source_url(recorded_final)
    # A capture known to end at an invalid destination must not be rehabilitated
    # by linking the original, pre-redirect document URL.
    url = resolved if recorded_final else canonical
    if resolved and source.canonical_url:
        from domain.intelligence.official_sources import SourceTier, classify_source_url
        original_tier, _ = classify_source_url(source.canonical_url)
        final_tier, _ = classify_source_url(resolved)
        if original_tier != SourceTier.UNVERIFIED and final_tier == SourceTier.UNVERIFIED:
            url = None
    reviewed = bool(url and evidence and evidence.verification_status == "VERIFIED" and source.status == "ACTIVE")
    return {
        "id": source.source_id, "title": source.title, "authority": source.authority,
        "url": url, "canonical_url": canonical, "resolved_url": resolved,
        "source_type": source.source_type,
        "source_domain": urlsplit(url).hostname if url else None,
        "content_type": metadata.get("content_type") or metadata.get("mime_type") or capture.get("mime_type"),
        "retrieved_at": metadata.get("retrieved_at") or metadata.get("captured_at") or metadata.get("fetched_at") or (captured.retrieved_at.isoformat() if captured else None),
        "publication_date": source.publication_date.isoformat() if source.publication_date else None,
        "effective_date": source.effective_date.isoformat() if source.effective_date else None,
        "content_hash": source.content_hash or None,
        "acquisition_method": metadata.get("acquisition_method") or metadata.get("acquisition_mode") or metadata.get("discovered_by"),
        "status": source.status, "evidence_status": evidence.verification_status if evidence else "UNVERIFIED",
        "reviewed": reviewed, "origin": "RECORDED_SOURCE",
    }


def evidence_projection(evidence):
    source = source_projection(evidence.source, evidence)
    return {
        "evidence_id": evidence.evidence_id, "source_id": evidence.source.source_id,
        "source_title": evidence.source.title, "authority": evidence.source.authority,
        "locator": evidence.locator, "location": evidence.locator or None,
        "excerpt": evidence.excerpt, "verification_status": evidence.verification_status,
        "canonical_url": source["url"], "source": source,
    }
