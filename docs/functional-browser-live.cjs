// Opt-in real browser journey. No routed API fixtures, credentials saved, or legal seeds.
const {chromium,expect}=require('../frontend/node_modules/@playwright/test');
const {randomBytes}=require('node:crypto');
const {writeFileSync,mkdirSync}=require('node:fs');
const {execFileSync}=require('node:child_process');
const path=require('node:path');
(async()=>{
 if(!process.argv.includes('--live'))throw Error('Explicit --live required');
 const root=path.resolve(__dirname,'..'),out=path.join(__dirname,'hardening-real-browser.json');
 const email='browser-hardening-'+randomBytes(8).toString('hex')+'@example.test',password=randomBytes(24).toString('base64url');
 const browser=await chromium.launch({headless:true});const context=await browser.newContext({viewport:{width:1440,height:1000}});const page=await context.newPage();
 const report={kind:'REAL_BROWSER_NATIVE_BACKEND_NO_API_MOCKS',stages:[],errors:[],external_browser_calls:[],requests:[],responses:[],questions:[],screenshots:[]};let registered=false,start=Date.now();
 page.on('pageerror',error=>report.errors.push(error.message));
 page.on('request',r=>{const u=new URL(r.url());if(u.pathname.startsWith('/api/v1/'))report.requests.push({method:r.method(),path:u.pathname});if(/serpapi|generativelanguage|api.openai/.test(u.hostname))report.external_browser_calls.push(u.hostname)});
 page.on('response',async r=>{const u=new URL(r.url());if(u.pathname.startsWith('/api/v1/'))report.responses.push({method:r.request().method(),path:u.pathname,status:r.status()});if(u.pathname.match(/assessments\/[^/]+\/questions\/?$/)&&r.ok()){try{const data=await r.json();report.questions=(data.data||data).questions||[]}catch{}}});
 const shots=path.join(__dirname,'hardening-screenshots');mkdirSync(shots,{recursive:true});
 async function shot(name){const file=path.join(shots,name+'.png');await page.screenshot({path:file,fullPage:true});report.screenshots.push(path.relative(root,file));}
 try{
  const registration=await context.request.post('http://127.0.0.1:8000/api/v1/auth/register',{data:{email,password,full_name:'Browser Functional QA'}});
  if(!registration.ok())throw Error('Actual API registration failed: '+registration.status());registered=true;report.stages.push('actual registration');
  await page.goto('http://localhost:3000/login');await shot('01-login');await page.getByLabel('Email address',{exact:true}).fill(email);await page.getByLabel('Password',{exact:true}).fill(password);await page.locator('form').getByRole('button',{name:'Sign in',exact:true}).click();await expect(page).toHaveURL(/dashboard|onboarding/,{timeout:30000});report.stages.push('manual browser login');
  await page.goto('http://localhost:3000/onboarding?new=true');await expect(page.getByRole('button',{name:/Manufacturing Unit Precision Workshop/})).toBeVisible();await shot('02-starters');await page.getByRole('button',{name:/Manufacturing Unit Precision Workshop/}).click();await page.getByRole('textbox',{name:'Business name',exact:true}).fill('Precision Workshop Browser QA');await shot('03-editable-autofill');
  await page.getByRole('button',{name:/Continue to Products/}).click();await expect(page.getByRole('heading',{name:'Products & Activities',exact:true})).toBeVisible({timeout:30000});await page.getByRole('textbox',{name:'Business activities'}).fill('A metal component workshop manufacturing powered cutting and turning parts for domestic customers, with 18 workers. No electroplating or chemical coating.');
  await page.getByRole('button',{name:/Generate Smart Questions/}).click();await expect(page.getByRole('button',{name:'Continue to focused questions'})).toBeVisible({timeout:90000});await page.getByRole('button',{name:'Continue to focused questions'}).click();await expect.poll(()=>report.questions.length,{timeout:90000}).toBeGreaterThan(0);await shot('04-dynamic-questions');
  for(let i=0;i<report.questions.length;i++){
   const q=report.questions[i];await expect(page.getByText(q.question,{exact:true})).toBeVisible({timeout:30000});
   if(q.answer_type==='BOOLEAN')await page.getByRole('button',{name:'No',exact:true}).click();
   else if(q.options?.length)await page.getByRole('button',{name:q.options[0].label,exact:true}).click();
   else if(['NUMBER','CURRENCY','PERCENTAGE'].includes(q.answer_type))await page.locator('input[type=number]').fill('10');
   else await page.locator('input[type=text],textarea').first().fill('Domestic powered metal cutting and turning operations.');
   if(i===report.questions.length-1){await page.getByRole('button',{name:/Analyze Regulatory Compliance/}).click();await shot('05-analysis');}
   else await page.getByRole('button',{name:'Save & Next Question'}).click();
  }
  await expect(page.getByRole('heading',{name:/Compliance Profile for/})).toBeVisible({timeout:180000});report.stages.push('editable starter through real assessment and results');await shot('06-results');
  report.business_id=await page.evaluate(()=>localStorage.getItem('complywise_active_business_id'));report.assessment_id=await page.evaluate(()=>localStorage.getItem('complywise_active_assessment_id'));
  for(const [name,url] of Object.entries({compliance:'/compliance',documents:'/documents',workflows:'/workflows',schemes:'/schemes',standards:'/standards',dashboard:'/dashboard',calendar:'/calendar',assistant:'/assistant',settings:'/settings'})){
   await page.goto('http://localhost:3000'+url);await expect(page.locator('main')).toBeVisible();await page.waitForLoadState('networkidle',{timeout:30000});await shot('07-'+name);report.stages.push(name);
  }
  for(const width of [768,390]){await page.setViewportSize({width,height:900});await page.goto('http://localhost:3000/standards');await page.waitForLoadState('networkidle',{timeout:30000});report['overflow_'+width]=await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1);await shot('08-standards-'+width);}
  report.status='COMPLETED';
 }catch(exc){report.status='FAILED';report.failure_class=exc.name;report.failure_message=exc.message.split('\n')[0];await shot('failure');}
 finally{
  report.seconds=(Date.now()-start)/1000;await browser.close();
  if(registered){try{execFileSync(path.join(root,'backend/.venv/Scripts/python.exe'),['manage.py','shell','-c',"import os; from django.contrib.auth import get_user_model; from apps.businesses.models import Business,WorkspaceGuidance; u=get_user_model().objects.get(email=os.environ['COMPLYWISE_QA_CLEANUP_EMAIL']); assert u.full_name=='Browser Functional QA' and u.email.startswith('browser-hardening-') and u.email.endswith('@example.test'); WorkspaceGuidance.objects.filter(business__owner=u).delete(); [b.delete() for b in list(Business.objects.filter(owner=u))]; u.delete()"],{cwd:path.join(root,'backend'),stdio:'pipe',env:{...process.env,COMPLYWISE_QA_CLEANUP_EMAIL:email}});report.temporary_identity_removed=true}catch{report.temporary_identity_removed=false}}
  writeFileSync(out,JSON.stringify(report,null,2));console.log(JSON.stringify({status:report.status,seconds:report.seconds,questions:report.questions.length,errors:report.errors.length,temporary_identity_removed:report.temporary_identity_removed}));
  if(report.status!=='COMPLETED')process.exitCode=1;
 }
})().catch(()=>{console.error('Live browser diagnostic setup failed');process.exitCode=1});
