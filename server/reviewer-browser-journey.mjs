import { literalScopesJourney } from "./literal-scopes-journey.mjs";
import { foundationsBrowserHelpers } from "./foundations-browser-journey.mjs";
import { publicBrowserStorageCheck } from "./browser-storage-policy.mjs";
/** Existing requester/reviewer controls against guarded owned services. */
export function reviewerBrowserJourney(credentials) {
  return `
(async()=>{
${foundationsBrowserHelpers(credentials)}
 const request=async(path,body,method='POST')=>fetch(path,{method,headers:{'content-type':'application/json','x-csrf-token':(await(await fetch('/session/status')).json()).csrfToken},...(body===undefined?{}:{body:JSON.stringify(body)})});
 const http=async(path,body,method)=>{const response=await request(path,body,method);const envelope=await response.json();check(response.ok,'Owned reviewer operation '+path.split('/').slice(0,4).join('/')+' ('+response.status+') '+JSON.stringify(envelope.data?.issues?.map(row=>({pointer:row.pointer,code:row.code}))??[]));return envelope;};
 const commands=async()=> (await(await fetch('/__reviewer-evidence')).json()).commands;
 const taskControls=()=>document.querySelector('app-task-controls');
 const field=scope=>'field-'+encodeURIComponent(scope);
 const edit=async(id,value)=>{await wait(()=>{const input=document.getElementById(id);return (input instanceof HTMLInputElement||input instanceof HTMLTextAreaElement)&&!input.matches(':disabled')&&!input.readOnly;},'Editable control '+id);fill(id,value);};
 const signIn=async actor=>{await click('Sign out');await login(actor);};
 try {
  await login(accounts.users.length-1);
  const actors=await Promise.all(accounts.users.slice(0,3).map(async name=>{const rows=(await http('/api/v1/designer/selectors/users',{page:1,size:20,search:name})).result.items;const user=rows.find(row=>row.value===name||row.value.includes(name));check(user,'Owned reviewer identity');return user.key;}));
  const catalog=(await http('/api/v1/designer/catalog',{page:1,size:100})).result.items;
  const type=key=>{const row=catalog.find(item=>item.category==='step_type'&&item.metadata?.handler_key===key&&item.metadata.handler_version==='1');check(row,'Registered reviewer handler');return row.metadata;};
  const form=(await http('/api/v1/forms',{code:'owned-reviewer-corrections',name:'Owned correction review'})).data;
  let formVersion=(await http('/api/v1/form-versions',{form_ref_id:form.ref_id,number:1,behavior_dialect:'bpms.behavior/1',data_dialect:'https://json-schema.org/draft/2020-12/schema',render_dialect:'bpms.render/1',data_schema:{type:'object',properties:{amount:{type:'integer'},note:{type:'string'},private_note:{type:'string'},lines:{type:'array',items:{type:'object',properties:{note:{type:'string'}}}}},required:['amount']},render_schema:{dialect:'bpms.render/1',outcomes:['approve','return'],root:{component:'vertical',children:[{component:'integer',scope:'/properties/amount',label:'Amount'},{component:'text',scope:'/properties/note',label:'Note'},{component:'text',scope:'/properties/private_note',label:'Private note'},{component:'repeater',scope:'/properties/lines',label:'Lines',children:[{component:'text',scope:'/properties/lines/items/properties/note',label:'Row note'}]}]}},page_settings:{}})).data;
  formVersion=(await http('/api/v1/form-versions/'+encodeURIComponent(formVersion.ref_id)+'/publish',{})).data;
  const workflow=(await http('/api/v1/workflows',{code:'owned-reviewer-corrections',name:'Owned correction review',access_mode:'RESTRICTED'})).data;
  let workflowVersion=(await http('/api/v1/workflow-versions',{workflow_ref_id:workflow.ref_id,number:1})).data;
  const scopes=['/properties/amount','/properties/note','/properties/lines','/properties/lines/items/properties/note'];
  const action=(key,kind)=>({key,kind,outcome_key:key,title:{en:key==='return'?'Return':'Approve'},required_scopes:[],require_comment:kind==='return',validation:'partial'});
  const contract=correction=>({default_view:'edit',inherit_previous:true,correction_entry:correction,views:[{key:'edit',purpose:'edit',title:{en:'Review'},scopes}],actions:correction?[action('approve','complete')]:[action('approve','complete'),action('return','return')]});
  const step=(key,handler,extra={})=>({key,type_code:type(handler).code,type_version_ref:type(handler).ref_id,...extra});
  const policy={read:scopes,write:scopes,required:[],hidden:['/properties/private_note']};
  const graph={steps:[step('start','start'),step('review','human_task',{form_ref:formVersion.ref_id,task_contract:contract(false),field_policy:policy,flow:{max_visits:5}}),step('correct','human_task',{form_ref:formVersion.ref_id,task_contract:contract(true),field_policy:policy,flow:{max_visits:3}}),step('finish','finish')],transitions:[{source:'start',target:'review',outcome:'next',is_default:true},{source:'review',target:'correct',outcome:'return',is_default:true},{source:'review',target:'finish',outcome:'approve',is_default:true},{source:'correct',target:'review',outcome:'approve',is_default:true}],targets:[{step:'review',user_ref:actors[1]},{step:'review',user_ref:actors[2]},{step:'correct',user_ref:actors[0]}],bindings:[]};
  workflowVersion=(await http('/api/v1/workflow-versions/'+encodeURIComponent(workflowVersion.ref_id)+'/graph',graph,'PUT')).data;
  workflowVersion=(await http('/api/v1/workflow-versions/'+encodeURIComponent(workflowVersion.ref_id)+'/publish',{})).data;
  const kind=(await http('/api/v1/request-types',{code:'owned-reviewer-corrections',name:'Owned correction review',workflow_ref_id:workflow.ref_id,form_ref_id:form.ref_id,is_active:true})).data;
  await http('/api/v1/workflows/'+encodeURIComponent(workflow.ref_id)+'/grants',{user_ref_id:actors[0],can_view:false,can_start:true});
  const intakeResponse=await fetch('/__reviewer-intake',{method:'POST'});check(intakeResponse.ok,'Owned read-only intake');const intake=await intakeResponse.json();check(intake.workflow_start&&intake.form_resolves,'Owned eligibility metadata '+JSON.stringify(intake));
  await signIn(0);
  const draft=(await http('/api/v1/business-requests',{request_type_ref_id:kind.ref_id,data:{amount:7,note:'Original',private_note:'owned-hidden-sentinel',lines:[{note:'Original row'}]}})).data;
  await go('/operations/requests/'+encodeURIComponent(draft.ref_id),'app-case-detail');await wait(()=>document.getElementById(field('/amount')),'Owned requester form');
  const submit=button('Submit',document.querySelector('app-case-page-header'));check(submit,'Actual submit control');submit.click();submit.click();await confirm();
  await wait(()=>document.querySelector('.console-record-status')?.textContent.trim()==='RUNNING','One actual request submitted');
  check((await commands()).filter(row=>row.action==='submit').length===1,'Repeated submit gesture sends one command');
  await record('APP-FE-028 actual repeated submit gesture, one command and exact published case pin');
  const currentRequest=(await http('/api/v1/business-requests/'+encodeURIComponent(draft.ref_id),undefined,'GET')).data;
  await signIn(1);
  const available=(await http('/api/v1/work-items/search',{cartable:'available',page:1,size:100})).result.items;
  const review=available.find(row=>row.request_ref_id===currentRequest.ref_id);check(review,'Actual review work discovered');
  const raceResponse=await fetch('/__reviewer-race',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({ref:review.ref_id})});check(raceResponse.ok,'Actual authenticated competing claims');const race=await raceResponse.json();check(race.statuses.filter(code=>code===200).length===1&&race.statuses.filter(code=>code===409).length===1,'One claim winner');
  const loser=race.winner===1?2:1;await signIn(loser);await go('/operations/tasks/'+encodeURIComponent(review.ref_id),'app-case-detail');await wait(()=>document.querySelector('app-case-detail [role=alert]'),'Losing reviewer access denial');check(!document.querySelector('app-runtime-form'),'Losing reviewer receives no private runtime');check(!taskControls()||(!button('Approve',taskControls())&&!button('Return',taskControls())),'Losing reviewer cannot decide');
  await record('APP-FE-029 actual concurrent HTTP claim race, one winner and losing reviewer denied UI without private runtime');
  await signIn(race.winner);await go('/operations/tasks/'+encodeURIComponent(review.ref_id),'app-case-detail');await wait(()=>document.querySelector('app-correction-feedback-editor'),'Actual correction authoring');
  check(!document.getElementById(field('/private_note'))&&!document.querySelector('app-runtime-form').textContent.includes('owned-hidden-sentinel'),'Hidden data not disclosed to reviewer');
  const draftFeedback=()=>document.querySelector('app-correction-feedback-editor');
  await click('Add correction',draftFeedback());await choose('Field to correct','Amount',draftFeedback());await edit('correction-message-0','Correct the amount');
  check(!button('Return',taskControls()),'Required comment fences Return');await edit('task-comment','Please correct the amount');
  document.querySelector('app-case-page-header a').click();await wait(()=>document.querySelector('dialog[open]'),'Unsaved feedback navigation guard');await click('Cancel',document.querySelector('dialog[open]'));check(document.getElementById('correction-message-0').value==='Correct the amount','Cancelled navigation retains correction');
  await click('Return',taskControls());await confirm();await wait(()=>document.querySelector('.console-record-status')?.textContent.trim()==='RETURNED','Actual return committed');check((await commands()).filter(row=>row.action==='return').length===1,'One return command');
  await record('APP-FE-029 actual field feedback, required comment, navigation retention and declared Return');
  await signIn(0);
  const corrections=(await http('/api/v1/work-items/search',{cartable:'available',page:1,size:100})).result.items;
  const correction=corrections.find(row=>row.request_ref_id===currentRequest.ref_id);check(correction,'Actual requester correction task');
  await go('/operations/tasks/'+encodeURIComponent(correction.ref_id),'app-case-detail');await wait(taskControls,'Actual task controls loaded');await click('Claim',taskControls());await wait(()=>document.getElementById(field('/amount'))&&!document.getElementById(field('/amount')).disabled,'Actual correction form');
  const feedback=()=>document.querySelector('app-advanced-task .task-feedback');await wait(()=>feedback()?.getAttribute('aria-busy')==='false','Actual scoped correction feedback');feedback().open=true;check(feedback().textContent.includes('Correct the amount'),'Correction instructions visible');const savesBeforeResolve=(await commands()).filter(row=>row.action==='save').length;await edit(field('/amount'),'8');await wait(()=>document.querySelector('app-case-detail')?.textContent.includes('Unsaved changes'),'Actual editable change is recorded');await click('Resolve',feedback());await wait(()=>feedback()?.querySelector('li[data-feedback-status="RESOLVED"]'),'Actual feedback resolved');check(feedback().textContent.includes('Correction resolved'),'Resolved feedback has a readable status');check(feedback().open,'Feedback stays expanded after save and resolve');check(document.getElementById(field('/amount')).value==='8','Save-before-resolve retains corrected value');check((await commands()).filter(row=>row.action==='save').length===savesBeforeResolve+1,'Exactly one save precedes feedback resolution');
  await click('Approve',taskControls());await confirm();await wait(()=>document.querySelector('.console-record-status')?.textContent.trim()==='COMPLETED','Actual correction resubmitted');
  await record('APP-FE-029 actual requester correction, save-before-resolve and return-to-review through authored routes');
  await signIn(race.winner);
  const round=(await http('/api/v1/work-items/search',{cartable:'available',page:1,size:100})).result.items.find(row=>row.request_ref_id===currentRequest.ref_id);check(round,'Actual returned review task');
  await go('/operations/tasks/'+encodeURIComponent(round.ref_id),'app-case-detail');await wait(taskControls,'Actual task controls loaded');await click('Claim',taskControls());await wait(()=>document.getElementById(field('/amount'))?.value==='8','Returned review carries corrected value');
  await fetch('/__reviewer-evidence',{method:'POST',body:JSON.stringify({dropCompletion:true})});await click('Approve',taskControls());await confirm();
  let before=[];for(const deadline=Date.now()+15000;Date.now()<deadline;){before=await commands();if(before.some(row=>row.action==='complete'&&row.dropped))break;await new Promise(resolve=>setTimeout(resolve,50));}check(before.filter(row=>row.action==='complete'&&row.dropped).length===1,'One completion committed before receipt loss');await wait(()=>document.querySelector('app-case-detail [role=alert]')&&!button('Approve',taskControls()),'Actual uncertain decision fence');
  await click('Check current state',document.querySelector('app-case-detail'));if(document.querySelector('dialog[open]'))await confirm();await wait(()=>document.querySelector('.console-record-status')?.textContent.trim()==='COMPLETED','Authoritative completed state read');check((await commands()).filter(row=>row.action==='complete').length===before.filter(row=>row.action==='complete').length,'Reconciliation sends no duplicate decision');
  await record('APP-FE-028/029 actual committed lost decision reply, authoritative reconciliation and no repeated mutation');
  await signIn(0);
  const final=(await http('/api/v1/business-requests/'+encodeURIComponent(draft.ref_id),undefined,'GET')).data;
  check(final.status==='COMPLETED'&&final.workflow_version_ref_id===workflowVersion.ref_id,'Completed case keeps original published workflow pin');
  const view=(await http('/api/v1/business-requests/'+encodeURIComponent(final.ref_id)+'/view',undefined,'GET')).data;check(view.data.amount===7&&view.data.private_note==='owned-hidden-sentinel','Original submitted request data remains immutable');const proofResponse=await fetch('/__reviewer-finish',{method:'POST'});check(proofResponse.ok,'Read-only owned correction evidence');const proof=await proofResponse.json();check(proof.one_decision_per_task&&proof.hidden_data==='preserved'&&proof.corrected_task_submissions==='verified','Permitted corrections preserve hidden data and commit one decision per task');
  check(${publicBrowserStorageCheck},'Private actor state not persisted');
  await record('APP-FE-028 actual completed correction cycle, immutable pins and preserved hidden canonical data');
${literalScopesJourney()}
  await fetch('/__result',{method:'POST',body:JSON.stringify({ok:true,scenarios,diagnostics:window.fixtureDiagnostics})});
 }catch(error){await fetch('/__result',{method:'POST',body:JSON.stringify({ok:false,error:error.message,scenarios,diagnostics:window.fixtureDiagnostics,ui:{task:!!taskControls(),status:document.querySelector('.console-record-status')?.textContent.trim(),blocked:!!document.querySelector('app-case-detail [role=alert]'),confirmation:!!document.querySelector('dialog[open]'),feedbackBusy:document.querySelector('.task-feedback')?.getAttribute('aria-busy'),feedbackOpen:document.querySelector('.task-feedback')?.open,alerts:[...document.querySelectorAll('app-case-detail [role=alert]')].map(row=>row.textContent.includes('kept')?'retained':row.textContent.includes('service')?'service':row.textContent.includes('required')?'validation':'other')}})});}
})();`;
}
