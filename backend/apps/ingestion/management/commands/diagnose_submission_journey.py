"""Opt-in real assessment on the runtime database with a temporary QA account."""
import json
import secrets
import time
from pathlib import Path
from django.core.management.base import BaseCommand, CommandError
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from apps.businesses.models import Assessment, Business, WorkspaceGuidance
from apps.ingestion.models import DiscoveryRun
from domain.providers.telemetry import telemetry_tracker

class Command(BaseCommand):
    help = "--live runs one bounded manufacturing assessment; removes the temporary QA account/business afterwards."
    def add_arguments(self, parser):
        parser.add_argument("--live", action="store_true")
        parser.add_argument("--output", required=True)
    def handle(self, *args, **options):
        if not options["live"]: raise CommandError("Explicit --live is required.")
        started=time.perf_counter(); client=APIClient(); user=None; business=None
        report={"kind":"REAL_PROVIDER_API_RUNTIME_DATABASE", "business":"Synthetic Gujarat food manufacturing workshop", "stages":{}, "failures":[]}
        def call(method, url, data=None):
            mark=time.perf_counter()
            response=getattr(client,method)(url,data or {},format="json")
            report["stages"][url.split("/")[-1] or method]={"http_status":response.status_code,"seconds":round(time.perf_counter()-mark,3)}
            if response.status_code >= 400:
                report["failures"].append({"stage":url,"http_status":response.status_code,"code":response.data.get("error",{}).get("code"), "details":response.data.get("error",{}).get("details")})
                raise CommandError("Assessment API operation failed; safe report written.")
            return response.data.get("data",response.data)
        try:
            password=secrets.token_urlsafe(28)
            email="submission-qa-"+secrets.token_hex(6)+"@example.test"
            user=get_user_model().objects.create_user(email=email,password=password,full_name="Submission QA Owner")
            auth=call("post","/api/v1/auth/login",{"email":email,"password":password})
            client.credentials(HTTP_AUTHORIZATION="Token "+auth["token"])
            created=call("post","/api/v1/businesses",{"name":report["business"]})
            business=Business.objects.get(pk=created["id"])
            facts={"state":"GUJARAT","district":"Ahmedabad","legal_constitution":"PROPRIETORSHIP","product_description":"A small food workshop manufacturing packaged spice mixes for domestic retail. Powered grinding and mixing equipment, 24 workers, no exports or hazardous chemicals.","total_worker_count":24,"annual_turnover":18000000,"plant_machinery_investment":4500000,"import_export_intent":"NONE","lifecycle_stage":"OPERATIONAL"}
            call("post",f"/api/v1/businesses/{business.id}/profile",{"variables":{key:{"value":value,"origin":"USER_PROVIDED"} for key,value in facts.items()}})
            assessment_id=call("post","/api/v1/assessments/",{"business_id":str(business.id)})["assessment_id"]
            report["assessment_id"]=assessment_id
            call("post",f"/api/v1/assessments/{assessment_id}/understand")
            qs=call("post",f"/api/v1/assessments/{assessment_id}/questions/generate")["questions"]
            report["question_count"]=len(qs)
            answers={}
            for q in qs:
                choices=q.get("options") or []
                if q["answer_type"] in ("BOOLEAN","YES_NO"): value=False
                elif q["answer_type"] == "MULTI_SELECT": value=[choices[0].get("value") if isinstance(choices[0],dict) else choices[0]] if choices else []
                elif choices: value=choices[0].get("value") if isinstance(choices[0],dict) else choices[0]
                elif q["answer_type"] in ("BOOLEAN","YES_NO"): value=False
                elif q["answer_type"] in ("NUMBER","INTEGER","DECIMAL","CURRENCY_INR","PERCENTAGE"): value=24
                else: value="Domestic spice processing workshop with powered equipment and 24 workers."
                answers[q["question_id"]]=value
            report["answers_limitation"]="Synthetic QA business answers selected from actual generated options; not a legal expert coverage benchmark."
            if answers: call("post",f"/api/v1/assessments/{assessment_id}/answers",{"answers":answers})
            call("post",f"/api/v1/assessments/{assessment_id}/regulatory-discovery")
            call("post",f"/api/v1/assessments/{assessment_id}/compliance-synthesis")
            call("post",f"/api/v1/businesses/{business.id}/analysis/orchestrate",{"assessment_id":assessment_id,"force_live_discovery":False})
            assessment=Assessment.objects.get(pk=assessment_id)
            report["assessment_status"]=assessment.status
            report["deterministic_status_counts"]={status:assessment.decision_run.results.filter(status=status).count() for status in ("APPLICABLE","NOT_APPLICABLE","NEEDS_INFORMATION","UNVERIFIED")} if assessment.decision_run else {}
            guidance=WorkspaceGuidance.objects.filter(assessment=assessment).first()
            report["guidance_counts"]={key:len(guidance.payload.get(key,[])) if guidance else 0 for key in ("compliance_items","documents","workflows","schemes","standards")}
            report["discovery"]=[{"status":r.status,"query_count":len(r.queries),"candidate_count":len(r.candidate_urls),"official_candidates":r.official_source_count,"captures":r.scraped_count,"modes":[row.get("acquisition_mode") for row in r.scraped_urls],"error":r.error} for r in DiscoveryRun.objects.filter(assessment=assessment)]
            report["workspace"]={}
            for section in ("compliance","documents","workflows","schemes","calendar","dashboard"):
                payload=call("get",f"/api/v1/businesses/{business.id}/{section}?assessment_id={assessment_id}")
                report["workspace"][section]={"keys":list(payload),"counts":{key:len(value) for key,value in payload.items() if isinstance(value,list)}}
            call("get",f"/api/v1/assessments/{assessment_id}/standards")
        finally:
            report["providers"]=[{key:getattr(r,key) for key in ("provider","provider_slot","attempt","status","failure_type","fallback","latency_ms","model","workflow")} for r in telemetry_tracker._records]
            report["total_seconds"]=round(time.perf_counter()-started,3)
            if business:
                WorkspaceGuidance.objects.filter(business=business).delete()
                business.delete()
            if user: user.delete()
            report["temporary_account_business_removed"]=True
            Path(options["output"]).write_text(json.dumps(report,indent=2,default=str),encoding="utf-8")
            self.stdout.write("Safe journey report written; temporary QA account/business removed.")
