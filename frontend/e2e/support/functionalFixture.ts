import { expect, type Page } from '@playwright/test';

// Explicit browser fixtures, never runtime seeds or claims about Indian law.
export const fixtureBusinessId='11111111-1111-4111-8111-111111111111';
export const fixtureAssessmentId='22222222-2222-4222-8222-222222222222';
export const fixtureRequirement={requirement_id:'synthetic-planning-record',name:'Illustrative business records checklist',title:'Illustrative business records checklist',authority:'Synthetic test authority',status:'NEEDS_INFORMATION',category:'PLANNING',jurisdiction:'CENTRAL',description:'Synthetic browser fixture; not legal advice.',citations:[],evidence_count:0,result_origin:'LLM_FALLBACK_RESULT'};

export async function functionalFixture(page:Page,options:{resumed?:boolean;standard?:boolean}={}){
 const business={id:fixtureBusinessId,name:'Synthetic browser business',is_active:true,state:'KARNATAKA',district:'Bengaluru',assessment_count:1};
 const assessment:any={id:fixtureAssessmentId,business_id:fixtureBusinessId,assessment_number:1,status:'IN_PROGRESS',current_step:options.resumed?3:1,step_state:{},profile_variables:{state:{value:'KARNATAKA'},product_description:{value:'Synthetic business'}}};
 const answers:Record<string,any>={}; const requests:{path:string;method:string;body:any}[]=[];
 const questions=[{question_id:'Q_DATA',question:'Do you store personal client information?',answer_type:'BOOLEAN',category:'Business information',required:true,options:[],suggested_answer:false,suggested_answer_origin:'STARTER_PROFILE'},
 {question_id:'Q_SCALE',question:'What is the estimated storage space used?',answer_type:'NUMBER',category:'Premises',required:true,unit:'square metres',options:[]}];
 await page.route('**/api/v1/**',async route=>{
   const request=route.request(),path=new URL(request.url()).pathname.replace('/api/v1','').replace(/\/$/,'');
   const method=request.method(); let body:any={};try{body=request.postDataJSON()||{}}catch{}
   requests.push({path,method,body});let data:any={};
   if(path==='/auth/login') data={token:'explicit-browser-fixture-token',user:{id:'synthetic-user',email:'browser-fixture@example.test',full_name:'Fixture Owner',is_staff:false,is_superuser:false},redirect_target:'ONBOARDING'};
   else if(path==='/auth/me') data={id:'synthetic-user',email:'browser-fixture@example.test',full_name:'Fixture Owner',is_staff:false,is_superuser:false};
   else if(path==='/user/profile') data={businesses:[business],recent_assessments:[assessment]};
   else if(path==='/user/workspace') data={active_business_id:business.id,active_assessment_id:assessment.id};
   else if(path==='/businesses') {if(method==='POST') Object.assign(business,body);data=method==='POST'?business:[business]}
   else if(path===`/businesses/${business.id}`) {if(method==='PATCH')Object.assign(business,body);data=business}
   else if(path.endsWith('/profile')) {if(method==='POST')assessment.profile_variables=body.variables;data={current_version:{id:'synthetic-profile',version:1,variables:assessment.profile_variables},history:[]}}
   else if(path==='/profile/variables')data=[];
   else if(path==='/assessments')data={run_id:assessment.id,assessment_id:assessment.id};
   else if(path===`/businesses/${business.id}/assessments`)data=method==='POST'?assessment:[assessment];
   else if(path===`/businesses/${business.id}/assessments/${assessment.id}`){if(method==='PATCH')Object.assign(assessment,body);data=assessment}
   else if(path.endsWith('/onboarding/products-activities'))data={detected_activities:[],profile_version:1};
   else if(path.endsWith('/understand')) data={primary_activity:'Synthetic business description',business_type:'Services',products:['Synthetic service'],operational_characteristics:['Domestic operations'],important_unknowns:['Client information']};
   else if(path.endsWith('/questions')||path.endsWith('/questions/generate'))data={questions:questions.map(q=>({...q,current_value:answers[q.question_id],is_answered:q.question_id in answers})),total_questions:questions.length,answered_count:Object.keys(answers).length};
   else if(path.endsWith('/answers')){Object.assign(answers,body.answers||{[body.question_id]:body.value});data={saved:true};}
   else if(path.endsWith('/regulatory-discovery'))data={sources:[],queries:[],status:'PARTIAL',source_count:0};
   else if(path.endsWith('/compliance-synthesis')||path.endsWith('/compliance'))data={business_id:business.id,requirements:[fixtureRequirement],count:1,summary:{total_applicable:0,total_needs_info:1,total_not_applicable:0,high_priority_count:0}};
   else if(path.endsWith('/analysis/orchestrate')){assessment.status='COMPLETED';assessment.current_step=5;data={stages:[{name:'Workspace preparation',status:'COMPLETED',detail:'Synthetic fixture response'}],decision_run:{id:'synthetic-decision',results:[]},executive_summary:{},discovery:{}};}
   else if(path.endsWith('/dashboard'))data={business_id:business.id,business_name:business.name,has_evaluation:true,metrics:{},priority_actions:[],upcoming_deadlines:[],schemes_preview:[],compliance_readiness:null};
   else if(path.endsWith('/workflows'))data={available:true,workflows:[{id:'synthetic-workflow',requirement_id:fixtureRequirement.requirement_id,title:fixtureRequirement.name,authority:'Synthetic test authority',status:'NOT_STARTED',current_step:1,total_steps:2,progress_percent:0,steps:[{step:1,step_number:1,title:'Collect records',status:'NOT_STARTED',documents_required:[]},{step:2,step_number:2,title:'Review records',status:'NOT_STARTED',documents_required:[]}]}]};
   else if(path.includes('/workflows/')&&method==='POST')data={saved:true};
   else if(path.endsWith('/documents'))data={available:true,upload_available:true,documents:[],total_count:0,requirements_without_checklist:[]};
   else if(path==='/standards/search')data={standards:options.standard?[{requirement_id:'synthetic-standard',title:'Illustrative quality review',authority:'Synthetic test authority',category:'QUALITY_PLANNING',domain:'QUALITY',jurisdiction:'',description:'Synthetic fixture, not an official standard.',why_it_matters:'Supports the supplied workshop context.',source_reference:'Synthetic contextual authority',result_origin:'LLM_FALLBACK_RESULT',citations:[],citation_count:0}]:[],scope_status:'PARTIAL_SCOPE',scope_note:'No reviewed standards matched this assessment within the currently supported knowledge scope. Additional review may be required.',catalogue_available:false};
   else if(path.endsWith('/standards')||path.endsWith('/schemes'))data={standards:[],schemes:[],count:0,available:true};
   else if(path.endsWith('/calendar'))data={events:[],count:0,covers:[],not_covered:[]};
   else if(path.endsWith('/notifications/summary'))data={total:0,unread_count:0,urgent_count:0,overdue_count:0,upcoming_count:0};
   else if(path.endsWith('/notifications'))data={notifications:[],count:0};
   else if(path.endsWith('/preferences'))data={email_enabled:true,in_app_enabled:true,calendar_enabled:false,language:'en'};
   else if(path.includes('/assessments/'+assessment.id))data=assessment;
   await route.fulfill({json:{data,meta:{}}});
 });
 return {requests,answers,assessment,business};
}

export async function fixtureLogin(page:Page){
 await page.goto('/login');
 await page.getByLabel('Email address',{exact:true}).fill('browser-fixture@example.test');
 await page.getByLabel('Password',{exact:true}).fill('Manual fixture entry 2026!');
 await page.locator('form').getByRole('button',{name:'Sign in',exact:true}).click();
 await expect(page).toHaveURL(/onboarding|dashboard/);
}

export async function completeFixtureJourney(page:Page,own=false){
 await page.goto('/onboarding?new=true');
 if(own){await page.getByRole('button',{name:/Start from my own business/}).click();await page.getByRole('textbox',{name:'Business name',exact:true}).fill('Arbitrary synthetic business');await page.getByRole('combobox',{name:'Legal constitution'}).selectOption('PROPRIETORSHIP');await page.getByRole('combobox',{name:'Operating state'}).selectOption('KARNATAKA');await page.getByRole('textbox',{name:'District',exact:true}).fill('Bengaluru');await page.getByRole('combobox',{name:'Lifecycle stage'}).selectOption('OPERATIONAL');}
 else await page.getByRole('button',{name:/Manufacturing Unit Precision Workshop/}).click();
 await page.getByRole('button',{name:/Continue to Products/}).click();
 await expect(page.getByRole('heading',{name:'Products & Activities',exact:true})).toBeVisible();
 if(own) await page.locator('textarea').first().fill('A synthetic repair and upcycling workshop providing domestic services.');
 await page.getByRole('button',{name:/Generate Smart Questions/}).click();
 await page.getByRole('button',{name:'Continue to focused questions'}).click();
 await expect(page.getByText('Do you store personal client information?',{exact:true})).toBeVisible();
 await page.getByRole('button',{name:'Yes',exact:true}).click();
 await page.getByRole('button',{name:'Save & Next Question'}).click();
 await page.locator('input[type="number"]').fill('25');
 await page.getByRole('button',{name:/Analyze Regulatory Compliance/}).click();
 await expect(page.getByRole('heading',{name:/Compliance Profile for/})).toBeVisible();
}
