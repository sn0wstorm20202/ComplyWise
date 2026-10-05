"""Real runtime five-business gate. Test identities are temporary, outputs are not mocked."""
import json
import secrets
import time
from pathlib import Path
from django.conf import settings
from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand, CommandError
from rest_framework.test import APIClient
from apps.businesses.models import Assessment, Business, WorkspaceGuidance
from apps.ingestion.models import DiscoveryRun
from apps.onboarding.question_policy import fact_identity
from domain.providers.telemetry import telemetry_tracker

class Command(BaseCommand):
    def add_arguments(self, parser):
        parser.add_argument("--live",action="store_true")
        parser.add_argument("--output",required=True)
        parser.add_argument("--business-type")
        parser.add_argument("--profiles", help="Path to explicit synthetic QA business profiles.")

    def handle(self,*args,**options):
        if not options["live"]: raise CommandError("Explicit --live required.")
        profile_path = Path(options["profiles"]) if options.get("profiles") else Path(settings.BASE_DIR).parent/'docs/hardening-business-profiles.json'
        cases=json.loads(profile_path.read_text(encoding="utf-8"))
        if options["business_type"]: cases=[c for c in cases if c['type']==options['business_type']]
        report={"kind":"REAL_PROVIDER_RUNTIME_POSTGRESQL_API", "cases":[], "limitations":["Temporary synthetic business facts/answers; actual runtime published knowledge and real external providers. Not an expert legal benchmark."]}
        password=secrets.token_urlsafe(28); email='hardening-'+secrets.token_hex(7)+'@example.test'
        user=get_user_model().objects.create_user(email=email,password=password,full_name='Functional QA')
        client=APIClient(); businesses=[]
        try:
            login=client.post('/api/v1/auth/login',{'email':email,'password':password},format='json')
            if login.status_code!=200: raise CommandError("QA login failed.")
            client.credentials(HTTP_AUTHORIZATION='Token '+login.data.get('data',login.data)['token'])
            for case in cases:
                start=time.perf_counter(); initial_records=len(telemetry_tracker._records)
                row={"business":case['name'],"type":case['type'],"stages":[],"failures":[]}
                report['cases'].append(row)
                def call(method,path,data=None,required=True):
                    mark=time.perf_counter(); response=getattr(client,method)(path,data or {},format='json')
                    row['stages'].append({'stage':path.split('?')[0].split('/')[-1], 'status':response.status_code,'seconds':round(time.perf_counter()-mark,3)})
                    measured = response.data.get('meta', {}).get('timings_ms')
                    if measured:
                        row['stages'][-1]['timings_ms'] = measured
                    phase_timings = response.data.get('data', {}).get('metadata', {}).get('timings_ms')
                    if phase_timings:
                        row['stages'][-1]['phase_timings_ms'] = phase_timings
                    if response.status_code>=400:
                        row['failures'].append({'stage':path.split('?')[0].split('/')[-1],'status':response.status_code,'code':response.data.get('error',{}).get('code')})
                        if required: raise CommandError("QA stage failed.")
                    return response.data.get('data',response.data)
                try:
                    created=call('post','/api/v1/businesses',{'name':case['name']})
                    b=Business.objects.get(pk=created['id']); businesses.append(b)
                    facts={'state':'KARNATAKA','district':'Bengaluru','legal_constitution':'PROPRIETORSHIP','lifecycle_stage':'OPERATIONAL','import_export_intent':'NONE',**case['facts']}
                    call('post',f'/api/v1/businesses/{b.id}/profile',{'variables':{k:{'value':v,'origin':'USER_PROVIDED'} for k,v in facts.items()}})
                    aid=call('post','/api/v1/assessments/',{'business_id':str(b.id)})['assessment_id']; row['assessment_id']=aid
                    a=Assessment.objects.get(pk=aid)
                    a.step_state={**a.step_state,'starting_profile':{'key':case['starter'],'suggestions':case['suggestions']}}; a.save(update_fields=['step_state'])
                    call('post',f'/api/v1/assessments/{aid}/understand')
                    qs=call('post',f'/api/v1/assessments/{aid}/questions/generate')['questions']; row['questions']=qs
                    row['repeated_known_facts']=[q['question_id'] for q in qs if fact_identity(q.get('variable_key',''),q.get('question','')) in facts]
                    row['suggested_answers']=[{'question_id':q['question_id'],'value':q.get('suggested_answer')} for q in qs if q.get('suggested_answer_origin')=='STARTER_PROFILE']
                    answers={}; changes=[]
                    for q in qs:
                        opts=q.get('options') or []; suggested=q.get('suggested_answer')
                        if q['answer_type']=='BOOLEAN': value=not suggested if isinstance(suggested,bool) else False
                        elif q['answer_type']=='MULTI_SELECT': value=[opts[-1]['value']] if opts else []
                        elif opts: value=opts[-1]['value'] if opts[-1]['value']!=suggested else opts[0]['value']
                        elif q['answer_type'] in ('NUMBER','CURRENCY','PERCENTAGE'): value=3
                        else: value='Small domestic operation; '+case['facts']['product_description']
                        answers[q['question_id']]=value
                        if suggested is not None: changes.append({'question_id':q['question_id'],'from':suggested,'to':value})
                    row['answers']=answers; row['suggestion_edits']=changes
                    if answers: call('post',f'/api/v1/assessments/{aid}/answers',{'answers':answers})
                    discovery=call('post',f'/api/v1/assessments/{aid}/regulatory-discovery')
                    call('post',f'/api/v1/assessments/{aid}/compliance-synthesis')
                    before=len(telemetry_tracker._records)
                    completion=call('post',f'/api/v1/businesses/{b.id}/analysis/orchestrate',{'assessment_id':aid,'force_live_discovery':False})
                    row['analysis_timings_ms']=completion.get('timings_ms',{})
                    row['analysis_phase_timings_ms']=completion.get('phase_timings_ms',{})
                    row['completion_extra_provider_calls']=len(telemetry_tracker._records)-before
                    a.refresh_from_db(); row['status']=a.status
                    row['decisions']={s:a.decision_run.results.filter(status=s).count() for s in ['APPLICABLE','NOT_APPLICABLE','NEEDS_INFORMATION','UNVERIFIED']} if a.decision_run else {}
                    guidance=WorkspaceGuidance.objects.filter(assessment=a).first()
                    row['guidance']={k:len(guidance.payload.get(k,[])) if guidance else 0 for k in ['compliance_items','documents','workflows','schemes','standards']}
                    row['discovery']=[{'provider':r.provider,'status':r.status,'queries':r.queries,'candidate_count':len(r.candidate_urls),'official_count':r.official_source_count,'captures':r.scraped_count,'modes':[c.get('acquisition_mode') for c in r.scraped_urls],'error':r.error} for r in DiscoveryRun.objects.filter(assessment=a)]
                    row['retrieval']={key:value for key,value in discovery.get('metadata',{}).get('external_retrieval',{}).items() if key != 'passages'}
                    row['retrieval']['accepted_passages']=len(discovery.get('metadata',{}).get('external_retrieval',{}).get('passages',[]))
                    row['workspace']={}
                    before=len(telemetry_tracker._records)
                    for section in ('compliance','documents','workflows','schemes','calendar','dashboard'):
                        payload=call('get',f'/api/v1/businesses/{b.id}/{section}?assessment_id={aid}')
                        row['workspace'][section]={'counts':{k:len(v) for k,v in payload.items() if isinstance(v,list)},'available':payload.get('available'),'has_evaluation':payload.get('has_evaluation')}
                        if section == 'schemes':
                            row['schemes'] = payload
                    std=call('get',f'/api/v1/standards/search?business_id={b.id}&assessment_id={aid}')
                    row['standards']=std
                    row['workspace_get_provider_calls']=len(telemetry_tracker._records)-before
                    # Other businesses owned by the same user cannot be queried with this assessment.
                    for other in businesses[:-1]:
                        response=client.get(f'/api/v1/standards/search?business_id={other.id}&assessment_id={aid}')
                        if response.status_code!=404: row['failures'].append({'stage':'cross_business_assessment','status':response.status_code})
                    row['isolation_checks']=len(businesses)-1
                except Exception as exc:
                    row['failure_class']=type(exc).__name__
                finally:
                    row['seconds']=round(time.perf_counter()-start,3)
                    row['providers']=[{k:getattr(r,k) for k in ('provider','provider_slot','model','workflow','status','failure_type','fallback','latency_ms')} for r in telemetry_tracker._records[initial_records:]]
                    Path(options['output']).write_text(json.dumps(report,indent=2,default=str))
                    self.stdout.write(f"{case['type']}: {row.get('status','FAILED')}; {row['seconds']}s; safe report checkpointed.")
        finally:
            for b in businesses:
                WorkspaceGuidance.objects.filter(business=b).delete(); b.delete()
            user.delete(); report['temporary_identities_removed']=True
            Path(options['output']).write_text(json.dumps(report,indent=2,default=str))
