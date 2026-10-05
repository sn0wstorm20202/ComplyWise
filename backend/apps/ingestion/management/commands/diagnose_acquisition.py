"""Bounded opt-in capability probes; no secrets or document bodies in output."""
import importlib.metadata
import json
import time
from pathlib import Path

from django.conf import settings
from django.core.management.base import BaseCommand

from apps.ingestion import search_provider
from domain.acquisition.crawlee_provider import CrawleeAcquisitionProvider
from domain.intelligence.regulatory_retrieval import retrieve_regulatory_context
from domain.providers import ChatMessage
from domain.providers.gemini_provider import GeminiProvider, _api_keys


class Command(BaseCommand):
    help = "Inspect configured adapters; --live runs bounded official acquisition and provider probes."

    def add_arguments(self, parser):
        parser.add_argument("--live", action="store_true")
        parser.add_argument("--browser", action="store_true")
        parser.add_argument("--output")

    def handle(self, *args, **options):
        report = {"configuration": {"llm_primary": settings.LLM_PROVIDER,
            "gemini_slots": len(_api_keys()), "openai_configured": bool(settings.OPENAI_API_KEY),
            "search_provider": search_provider.PROVIDER_NAME, "search_configured": search_provider.is_configured(),
            "rag_configured": bool(settings.COMPLIANCERAG_URL), "firecrawl_active": False}, "packages": {}, "probes": []}
        for package in ("crawlee", "playwright", "impit", "beautifulsoup4", "pypdf"):
            try: report["packages"][package] = importlib.metadata.version(package)
            except importlib.metadata.PackageNotFoundError: report["packages"][package] = "NOT_INSTALLED"
        if options["live"]:
            started = time.perf_counter()
            try:
                rows = search_provider.search("site.bis.gov.in compulsory certification", limit=3)
                report["probes"].append({"name":"search", "provider":"serpapi", "status":"SUCCESS", "result_count":len(rows),
                    "duration_seconds":round(time.perf_counter()-started,3), "candidate_urls":[r["url"] for r in rows]})
            except Exception as exc:
                report["probes"].append({"name":"search","status":"FAILED", "failure_class":getattr(exc,"failure_type",type(exc).__name__)})
            provider = CrawleeAcquisitionProvider(timeout=30)
            probe_file = Path(settings.BASE_DIR).parent / "docs" / "acquisition-probe-targets.json"
            configured_targets = json.loads(probe_file.read_text(encoding="utf-8"))
            targets = [(row["name"], row["url"], row["browser"]) for row in configured_targets if not row["browser"] or options["browser"]]
            for name, url, browser in targets:
                result = provider.fetch_page(url, {"use_browser":browser})
                report["probes"].append({"name":name,"url":url,"final_url":result.resolved_url,
                    "mode":result.acquisition_engine,"http_status":result.http_status,"text_chars":len(result.text_content),
                    "status":"FAILED" if result.errors else "SUCCESS", "errors":result.errors,"metadata":result.crawl_metadata})
            for slot,key in enumerate(_api_keys(),1):
                started = time.perf_counter()
                try:
                    result = GeminiProvider()._complete_once([ChatMessage("user", 'Return exactly {"probe":true}.')],
                        key=key, max_output_tokens=256, response_format={"type":"json_object"})
                    report["probes"].append({"name":"gemini_slot","slot":slot,"model":result.model,"status":"SUCCESS",
                        "duration_seconds":round(time.perf_counter()-started,3),"usage":result.usage})
                except Exception as exc:
                    report["probes"].append({"name":"gemini_slot","slot":slot,"status":"FAILED",
                        "failure_class":getattr(exc,"failure_type",type(exc).__name__),"duration_seconds":round(time.perf_counter()-started,3)})
            started = time.perf_counter()
            rag = retrieve_regulatory_context("food processing consent registration Gujarat", {"state":{"value":"GUJARAT"}})
            report["probes"].append({"name":"deployed_rag","status":rag["status"],"accepted_passages":len(rag["passages"]),
                "rejected_count":rag["rejected_count"],"duration_seconds":round(time.perf_counter()-started,3)})
        encoded = json.dumps(report, indent=2)
        if options["output"]: Path(options["output"]).write_text(encoded, encoding="utf-8")
        self.stdout.write(encoded)
