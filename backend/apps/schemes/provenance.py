"""Quarantine known authored portal fixtures without rewriting stored history."""
from functools import lru_cache
from types import SimpleNamespace


@lru_cache(maxsize=1)
def authored_fixture_fingerprints():
    from apps.schemes.pipeline.diff import compute_scheme_content_hash
    from apps.schemes.pipeline.fetcher import SNAPSHOT_FALLBACK_MAP
    from apps.schemes.pipeline.parser import SchemeDOMParser
    from apps.schemes.pipeline.registry import OFFICIAL_SCHEME_SOURCES
    parser = SchemeDOMParser()
    return frozenset(compute_scheme_content_hash(candidate)
        for key, content in SNAPSHOT_FALLBACK_MAP.items()
        for candidate in parser.parse(content, OFFICIAL_SCHEME_SOURCES[key]))


def is_authored_fixture_version(version):
    """Match known fixture content, even if its old VERIFIED marker/hash changes."""
    from apps.schemes.pipeline.diff import compute_scheme_content_hash
    fingerprints = authored_fixture_fingerprints()
    if (version.diff_summary or {}).get("provenance_origin") == "AUTHORED_FIXTURE":
        return True
    if version.content_hash in fingerprints:
        return True
    recorded = SimpleNamespace(scheme_code=version.scheme.scheme_code, **{
        name: getattr(version, name) for name in (
            "title", "authority", "jurisdiction", "benefit_type", "benefit_summary",
            "eligibility_statement", "sectors", "scale_match", "effective_from", "effective_to", "application_url")})
    return compute_scheme_content_hash(recorded) in fingerprints
