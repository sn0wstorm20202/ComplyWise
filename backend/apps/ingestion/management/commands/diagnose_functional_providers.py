"""Bounded live application-task diagnostics; secrets and response bodies excluded."""
import hashlib
import json
import time
from pathlib import Path
from unittest.mock import patch
from django.core.management.base import BaseCommand, CommandError
from django.test import override_settings
from domain.intelligence.business_understanding import BusinessUnderstandingEngine
from domain.intelligence.orchestration import OrchestrationContext
from domain.providers.gemini_provider import GeminiProvider, _api_keys, _cooldowns
from domain.providers.openai_provider import OpenAIProvider
from domain.providers.telemetry import telemetry_tracker

class Command(BaseCommand):
    def add_arguments(self, parser):
        parser.add_argument('--live',action='store_true')
        parser.add_argument('--output',required=True)

    def handle(self,*args,**options):
        if not options['live']: raise CommandError('Explicit --live required.')
        context=OrchestrationContext(business_id='synthetic-provider-health',business_name='Software consultancy QA',raw_business_description='Software consultancy developing web applications for domestic clients with 12 office-based employees.',geography={'state':'KARNATAKA','district':'Bengaluru'},normalized_facts={'legal_constitution':'PROPRIETORSHIP'},operational_facts={'total_worker_count':12})
        report={'task':'actual BusinessUnderstandingEngine with its prompt and response validator','probes':[],'limitations':['Independent slot selection and Gemini-unavailable scenario are diagnostic controls, not real outages. Quota-project independence cannot be established from credentials alone.']}
        def probe(provider,name,slot=None):
            start=time.perf_counter(); first_record=len(telemetry_tracker._records)
            row={'name':name,'slot':slot,'requested_model':provider.model}
            try:
                result=BusinessUnderstandingEngine(provider).analyze_business(context)
                row.update(validated=not result.raw_response.get('fallback',False),seconds=round(time.perf_counter()-start,3),normalized_fact_count=len(result.normalized_facts),unknown_count=len(result.important_unknowns))
                row['status']='SUCCESS' if row['validated'] else 'LOCAL_EMERGENCY_UNDERSTANDING'
            except Exception as exc:
                row.update(status='FAILED',failure_class=getattr(exc,'failure_type',type(exc).__name__),seconds=round(time.perf_counter()-start,3))
            attempts=telemetry_tracker._records[first_record:]
            row['attempts']=[{k:getattr(item,k) for k in ('provider','provider_slot','model','status','failure_type','latency_ms','fallback')} for item in attempts]
            successes=[item for item in attempts if item.status=='SUCCESS']
            if successes:
                row['final_provider']=successes[-1].provider
                row['model']=successes[-1].model
            report['probes'].append(row)
            Path(options['output']).write_text(json.dumps(report,indent=2),encoding='utf-8')
            self.stdout.write(f"{name}: {row['status']}; {row['seconds']}s")
        for slot,key in enumerate(_api_keys(),1):
            digest=hashlib.sha256(key.encode()).hexdigest()
            with override_settings(OPENAI_API_KEY=''),patch('domain.providers.gemini_provider._ordered_slots',return_value=[(slot,key,digest)]):
                probe(GeminiProvider(),'gemini_independent',slot)
            report['probes'][-1]['cooldown_remaining_seconds']=round(max(0,_cooldowns.get(digest,0)-time.monotonic()),2)
        probe(OpenAIProvider(),'openai_independent')
        with patch('domain.providers.gemini_provider._ordered_slots',return_value=[]):
            probe(GeminiProvider(),'controlled_gemini_unavailable_real_openai')
        Path(options['output']).write_text(json.dumps(report,indent=2),encoding='utf-8')
