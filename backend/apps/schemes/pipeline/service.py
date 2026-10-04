"""Scheme Ingestion, Versioning and Pipeline Orchestrator.

Authority: User Specification —
"Ingestion & Extraction Pipeline:
- Page Fetching, Parsing, Field Extraction, Normalization, Candidate Metadata.
- Metadata Storage & Versioning: Immutable Records, Version Control (content hash),
  Evidence Linking, Coverage Metadata.
- Continuous Update & QA: Scheduled Checks, Diff & Validate, Publish New Version, Rollback Safety."
"""

from __future__ import annotations

import logging
from typing import Any

from django.db import transaction
from django.utils import timezone

from apps.schemes.models import Scheme, SchemeRollbackLog, SchemeSourceSnapshot, SchemeVersion
from .diff import compute_scheme_content_hash, compute_scheme_diff
from .fetcher import SNAPSHOT_FALLBACK_MAP, SchemePortalFetcher
from .parser import SchemeDOMParser
from .registry import OFFICIAL_SCHEME_SOURCES, SchemeSourceConfig

logger = logging.getLogger(__name__)


class SchemePipelineService:
    """Orchestrates continuous ingestion, cryptographic hashing, diff validation, and versioning."""

    def __init__(self, fetcher: SchemePortalFetcher | None = None, parser: SchemeDOMParser | None = None):
        self.fetcher = fetcher or SchemePortalFetcher()
        self.parser = parser or SchemeDOMParser()

    @transaction.atomic
    def run_pipeline(
        self,
        source_keys: list[str] | None = None,
        force: bool = False,
        simulate_payloads: dict[str, str] | None = None,
    ) -> dict[str, Any]:
        """Executes ingestion pass across official Central & Maharashtra sources."""
        sources_to_run: list[SchemeSourceConfig] = []
        if source_keys:
            for k in source_keys:
                if k in OFFICIAL_SCHEME_SOURCES:
                    sources_to_run.append(OFFICIAL_SCHEME_SOURCES[k])
        else:
            sources_to_run = list(OFFICIAL_SCHEME_SOURCES.values())

        run_summary = {
            "timestamp": timezone.now().isoformat(),
            "sources_processed": len(sources_to_run),
            "sources_details": {},
            "total_new_schemes": 0,
            "total_updated_versions": 0,
            "total_unchanged_schemes": 0,
            "snapshots": [],
        }

        for config in sources_to_run:
            simulated_content = (simulate_payloads or {}).get(config.key)
            fetch_res = self.fetcher.fetch(config, simulate_changed_content=simulated_content)

            latest_snapshot = (
                SchemeSourceSnapshot.objects.filter(source_key=config.key, status="SUCCESS")
                .order_by("-fetched_at")
                .first()
            )

            # Check if source content is identical to last snapshot
            if not force and latest_snapshot and latest_snapshot.content_hash == fetch_res.content_hash:
                SchemeSourceSnapshot.objects.create(
                    source_key=config.key,
                    source_url=fetch_res.source_url,
                    source_domain=fetch_res.domain,
                    content_hash=fetch_res.content_hash,
                    status="UNCHANGED",
                    scheme_count=latest_snapshot.scheme_count,
                    raw_content=fetch_res.content[:2000],
                )
                run_summary["sources_details"][config.key] = {
                    "status": "UNCHANGED",
                    "content_hash": fetch_res.content_hash,
                    "scheme_count": latest_snapshot.scheme_count,
                    "message": "Source content hash unchanged since last crawl; no diff triggered.",
                }
                continue

            candidates = self.parser.parse(fetch_res.content, config)

            new_count = 0
            updated_count = 0
            unchanged_count = 0
            diffs_detected = []

            for cand in candidates:
                scheme = Scheme.objects.filter(scheme_code=cand.scheme_code).first()
                cand_hash = compute_scheme_content_hash(cand)

                if scheme is None:
                    # Initial creation: Version 1
                    scheme = Scheme.objects.create(
                        scheme_code=cand.scheme_code,
                        title=cand.title,
                        authority=cand.authority,
                        jurisdiction=cand.jurisdiction,
                        source_url=cand.source_url,
                        source_domain=cand.source_domain,
                        current_version_number=1,
                        is_active=True,
                    )
                    SchemeVersion.objects.create(
                        scheme=scheme,
                        version_number=1,
                        content_hash=cand_hash,
                        title=cand.title,
                        authority=cand.authority,
                        jurisdiction=cand.jurisdiction,
                        summary=cand.summary,
                        benefit_type=cand.benefit_type,
                        benefit_summary=cand.benefit_summary,
                        benefit_details=cand.benefit_details,
                        eligibility_statement=cand.eligibility_statement,
                        eligibility_criteria=cand.eligibility_criteria,
                        sectors=cand.sectors,
                        scale_match=cand.scale_match,
                        application_route=cand.application_route,
                        application_url=cand.application_url,
                        source_url=cand.source_url,
                        source_domain=cand.source_domain,
                        evidence_snippet=cand.evidence_snippet,
                        effective_from=cand.effective_from,
                        effective_to=cand.effective_to,
                        published_date=cand.published_date,
                        verification_status="VERIFIED",
                        is_active=True,
                        diff_summary={"status": "INITIAL_VERSION", "published_date": timezone.now().isoformat()},
                    )
                    new_count += 1
                else:
                    latest_ver = scheme.current_version
                    if latest_ver and latest_ver.content_hash != cand_hash:
                        # Diff & validate
                        diff = compute_scheme_diff(latest_ver, cand)
                        if diff["has_changes"]:
                            new_vnum = latest_ver.version_number + 1
                            # Archive older version
                            latest_ver.is_active = False
                            latest_ver.save(update_fields=["is_active"])

                            SchemeVersion.objects.create(
                                scheme=scheme,
                                version_number=new_vnum,
                                content_hash=cand_hash,
                                title=cand.title,
                                authority=cand.authority,
                                jurisdiction=cand.jurisdiction,
                                summary=cand.summary,
                                benefit_type=cand.benefit_type,
                                benefit_summary=cand.benefit_summary,
                                benefit_details=cand.benefit_details,
                                eligibility_statement=cand.eligibility_statement,
                                eligibility_criteria=cand.eligibility_criteria,
                                sectors=cand.sectors,
                                scale_match=cand.scale_match,
                                application_route=cand.application_route,
                                application_url=cand.application_url,
                                source_url=cand.source_url,
                                source_domain=cand.source_domain,
                                evidence_snippet=cand.evidence_snippet,
                                effective_from=cand.effective_from,
                                effective_to=cand.effective_to,
                                published_date=cand.published_date,
                                verification_status="VERIFIED",
                                is_active=True,
                                diff_summary=diff,
                            )
                            scheme.current_version_number = new_vnum
                            scheme.title = cand.title
                            scheme.authority = cand.authority
                            scheme.save(update_fields=["current_version_number", "title", "authority", "updated_at"])
                            updated_count += 1
                            diffs_detected.append({
                                "scheme_code": cand.scheme_code,
                                "version": new_vnum,
                                "changed_fields": diff["changed_fields"],
                            })
                        else:
                            unchanged_count += 1
                    else:
                        unchanged_count += 1

            snapshot = SchemeSourceSnapshot.objects.create(
                source_key=config.key,
                source_url=fetch_res.source_url,
                source_domain=fetch_res.domain,
                content_hash=fetch_res.content_hash,
                status="SUCCESS",
                scheme_count=len(candidates),
                raw_content=fetch_res.content[:4000],
            )

            run_summary["sources_details"][config.key] = {
                "status": "SUCCESS",
                "content_hash": fetch_res.content_hash,
                "scheme_count": len(candidates),
                "new_schemes": new_count,
                "updated_versions": updated_count,
                "unchanged": unchanged_count,
                "diffs_detected": diffs_detected,
                "snapshot_id": str(snapshot.id),
            }
            run_summary["total_new_schemes"] += new_count
            run_summary["total_updated_versions"] += updated_count
            run_summary["total_unchanged_schemes"] += unchanged_count
            run_summary["snapshots"].append(str(snapshot.id))

        return run_summary

    @transaction.atomic
    def rollback_scheme(self, scheme_code: str, target_version: int, reason: str = "Rollback requested") -> dict[str, Any]:
        """Rolls back a scheme to an earlier immutable version record."""
        scheme = Scheme.objects.filter(scheme_code=scheme_code).first()
        if not scheme:
            raise ValueError(f"Scheme with code '{scheme_code}' not found.")

        target_ver = SchemeVersion.objects.filter(scheme=scheme, version_number=target_version).first()
        if not target_ver:
            raise ValueError(f"Target version {target_version} does not exist for scheme '{scheme_code}'.")

        current_ver = scheme.current_version_number
        if current_ver == target_version:
            return {"scheme_code": scheme_code, "status": "ALREADY_AT_TARGET_VERSION", "current_version": current_ver}

        # Deactivate all newer versions
        SchemeVersion.objects.filter(scheme=scheme, version_number__gt=target_version).update(is_active=False)

        # Reactivate target version
        target_ver.is_active = True
        target_ver.save(update_fields=["is_active"])

        # Update scheme header pointer
        scheme.current_version_number = target_version
        scheme.title = target_ver.title
        scheme.authority = target_ver.authority
        scheme.save(update_fields=["current_version_number", "title", "authority", "updated_at"])

        # Log rollback audit
        SchemeRollbackLog.objects.create(
            scheme=scheme,
            from_version=current_ver,
            to_version=target_version,
            reason=reason,
        )

        return {
            "scheme_code": scheme_code,
            "status": "ROLLBACK_SUCCESSFUL",
            "from_version": current_ver,
            "to_version": target_version,
            "active_title": target_ver.title,
            "reverted_at": timezone.now().isoformat(),
        }

    def get_pipeline_status(self) -> dict[str, Any]:
        """Returns comprehensive status of the schemes pipeline, database records, and sources."""
        total_schemes = Scheme.objects.count()
        active_schemes = Scheme.objects.filter(is_active=True).count()
        mh_schemes = Scheme.objects.filter(jurisdiction="MH", is_active=True).count()
        central_schemes = Scheme.objects.filter(jurisdiction="CENTRAL", is_active=True).count()
        total_versions = SchemeVersion.objects.count()

        snapshots = list(
            SchemeSourceSnapshot.objects.order_by("-fetched_at")[:10].values(
                "id", "source_key", "source_url", "content_hash", "status", "scheme_count", "fetched_at"
            )
        )
        for s in snapshots:
            s["id"] = str(s["id"])
            s["fetched_at"] = s["fetched_at"].isoformat()

        rollbacks = list(
            SchemeRollbackLog.objects.order_by("-reverted_at")[:5].values(
                "scheme__scheme_code", "from_version", "to_version", "reason", "reverted_at"
            )
        )
        for r in rollbacks:
            r["reverted_at"] = r["reverted_at"].isoformat()

        return {
            "total_schemes": total_schemes,
            "active_schemes": active_schemes,
            "maharashtra_schemes_count": mh_schemes,
            "central_schemes_count": central_schemes,
            "total_version_snapshots": total_versions,
            "registered_sources": [
                {
                    "key": src.key,
                    "name": src.name,
                    "jurisdiction": src.jurisdiction,
                    "domain": src.domain,
                    "primary_url": src.primary_url,
                }
                for src in OFFICIAL_SCHEME_SOURCES.values()
            ],
            "recent_snapshots": snapshots,
            "recent_rollbacks": rollbacks,
        }
