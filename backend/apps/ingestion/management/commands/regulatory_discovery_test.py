"""Management command to test dynamic regulatory discovery for a business.

Usage:
    python manage.py regulatory_discovery_test --business <uuid> [--force] [--max-scrape N]
"""

from __future__ import annotations

import json
from django.core.management.base import BaseCommand, CommandError
from apps.businesses.models import Business
from apps.applicability.models import DecisionRun
from domain.context.business_context import build_business_context
from apps.ingestion.services import assess_knowledge_coverage, run_discovery


class Command(BaseCommand):
    help = "Execute dynamic regulatory discovery and report source/claim audit for a business."

    def add_arguments(self, parser):
        parser.add_argument(
            "--business",
            type=str,
            required=True,
            help="UUID of the business to test regulatory discovery for.",
        )
        parser.add_argument(
            "--force",
            action="store_true",
            help="Bypass cache and force fresh web discovery.",
        )
        parser.add_argument(
            "--max-scrape",
            type=int,
            default=3,
            help="Maximum number of top official candidate URLs to scrape.",
        )

    def handle(self, *args, **options):
        biz_id = options["business"]
        force = options["force"]
        max_scrape = options["max_scrape"]

        try:
            business = Business.objects.get(pk=biz_id)
        except (Business.DoesNotExist, Exception):
            raise CommandError(f"Business with ID '{biz_id}' does not exist.")

        self.stdout.write("================================================================")
        self.stdout.write(f"COMPLYWISE REGULATORY DISCOVERY TEST: {business.name}")
        self.stdout.write("================================================================")

        # 1. Business Context
        context = build_business_context(business)
        self.stdout.write(self.style.SUCCESS("\n[1] Derived Business Context:"))
        self.stdout.write(f"  - Business ID:     {context.business_id}")
        self.stdout.write(f"  - Jurisdiction:    {context.state_name} ({context.state})")
        self.stdout.write(f"  - Constitution:    {context.legal_constitution}")
        self.stdout.write(f"  - Scale:           {context.msme_scale}")
        self.stdout.write(f"  - Trade Intent:    {context.trade_intent}")
        self.stdout.write(f"  - Manufacturing:   {context.is_manufacturing}")
        self.stdout.write(f"  - Product Text:    {context.product_description[:100]}...")
        self.stdout.write(f"  - Missing Vars:    {len(context.missing_variable_keys)} un-answered")

        # 2. Local Knowledge Coverage
        coverage = assess_knowledge_coverage(business)
        self.stdout.write(self.style.SUCCESS("\n[2] Local Knowledge Coverage Assessment:"))
        self.stdout.write(f"  - Status:          {coverage['status']}")
        self.stdout.write(f"  - Central Reqs:    {coverage['central_requirement_count']}")
        self.stdout.write(f"  - State Reqs:      {coverage['state_requirement_count']}")
        self.stdout.write(f"  - Matched Terms:   {', '.join(coverage['activity_terms_matched'] or ['None'])}")

        # 3. Dynamic Discovery Execution
        self.stdout.write(self.style.SUCCESS("\n[3] Executing Regulatory Discovery (Firecrawl):"))
        discovery_res = run_discovery(business, force_refresh=force, max_scrape=max_scrape)
        self.stdout.write(f"  - Status:          {discovery_res.get('status')}")
        self.stdout.write(f"  - Cached Run:      {discovery_res.get('cached', False)}")
        self.stdout.write(f"  - Queries ({len(discovery_res.get('queries', []))}):")
        for q in discovery_res.get("queries", []):
            self.stdout.write(f"      * {q}")
        self.stdout.write(f"  - Candidate URLs:  {discovery_res.get('candidate_urls_count', 0)} found")
        self.stdout.write(f"  - Official Sources:{discovery_res.get('official_sources_count', 0)} prioritized")
        self.stdout.write(f"  - Pages Scraped:   {discovery_res.get('sources_scraped', 0)} documents")

        # 4. Quarantined Candidate Requirements
        cand_reqs = discovery_res.get("candidate_requirements", [])
        self.stdout.write(self.style.SUCCESS(f"\n[4] Quarantined Candidate Regulatory Claims ({len(cand_reqs)}):"))
        for cr in cand_reqs:
            self.stdout.write(f"    * [{cr.get('status')}] {cr.get('name')} — {cr.get('authority')}")
            if cr.get("applicability_statement"):
                self.stdout.write(f"      Applicability: {cr.get('applicability_statement')[:100]}...")

        # 5. Existing Deterministic Applicability
        latest_run = DecisionRun.objects.filter(business=business).order_by("-created_at").first()
        self.stdout.write(self.style.SUCCESS("\n[5] Deterministic Applicability Engine Summary:"))
        if latest_run:
            results = latest_run.results.all()
            applicable = results.filter(status="APPLICABLE").count()
            needs_info = results.filter(status="NEEDS_INFORMATION").count()
            not_applicable = results.filter(status="NOT_APPLICABLE").count()
            unverified = results.filter(status="UNVERIFIED").count()
            self.stdout.write(f"  - Run ID:          {latest_run.id}")
            self.stdout.write(f"  - APPLICABLE:      {applicable} (Authoritative decisions backed by published rules)")
            self.stdout.write(f"  - NEEDS_INFO:      {needs_info}")
            self.stdout.write(f"  - UNVERIFIED:      {unverified}")
            self.stdout.write(f"  - NOT_APPLICABLE:  {not_applicable}")
        else:
            self.stdout.write("  - No DecisionRun executed yet for this business.")

        self.stdout.write("================================================================")
        self.stdout.write(self.style.SUCCESS("Regulatory discovery test completed successfully!"))
