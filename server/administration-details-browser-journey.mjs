import { foundationsBrowserHelpers } from "./foundations-browser-journey.mjs";

/** Actual owned records; every schedule stays disabled and no task is dispatched. */
export function administrationDetailsBrowserJourney(credentials) {
  return `
(async()=>{
${foundationsBrowserHelpers(credentials)}
 try {
  await login(accounts.users.length-1);
  const http=async(path,body,method='POST')=>{
   const status=await(await fetch('/session/status')).json();
   const response=await fetch(path,{method,headers:{'content-type':'application/json','x-csrf-token':status.csrfToken},...(body===undefined?{}:{body:JSON.stringify(body)})});
   const envelope=await response.json();check(response.ok,'Owned Administration operation '+path+' ('+response.status+')');return envelope;
  };
  const catalog=()=>document.querySelector('app-resource-catalog');
  const editor=()=>catalog().querySelector('app-catalog-editor .page-editor');
  const ready=async()=>wait(()=>catalog()?.querySelector('tbody tr')&&!catalog().textContent.includes('Loading…'),'Owned catalog list');
  const openFirst=async()=>{await ready();await click('Open',catalog().querySelector('app-record-table'));await wait(()=>catalog().querySelector('app-catalog-relations'),'Named catalog detail');};
  await go('/administration/clients','app-resource-catalog');await ready();
  const query=()=>catalog().querySelector('app-list-query');
  await click('Advanced filters',query());await click('Add filter',query());
  await choose('Field','Type',query());await choose('Operation','Is one of',query());
  const multi=query().querySelector('p-multiselect');multi.querySelector('.p-multiselect-label').click();
  await wait(()=>[...document.querySelectorAll('[role=option]')].some(row=>row.textContent.trim()==='WEB'),'Client type options');
  [...document.querySelectorAll('[role=option]')].find(row=>row.textContent.trim()==='WEB').click();
  multi.querySelector('[role=combobox]').dispatchEvent(new KeyboardEvent('keydown',{key:'Escape',code:'Escape',bubbles:true}));
  await wait(()=>multi.querySelector('[role=combobox]').getAttribute('aria-expanded')==='false','Membership closed');
  await click('Apply',query());await ready();
  check([...catalog().querySelectorAll('tbody tr')].every(row=>row.textContent.includes('WEB')),'Actual WEB membership results');
  await record('APP-FE-031 actual multi-option client type filter applied against persisted records');
  await openFirst();
  const clientName=catalog().querySelector('h1').textContent.trim();
  const versions=[...catalog().querySelectorAll('a')].find(link=>link.textContent.trim()==='Versions');check(versions?.pathname==='/administration/client-releases','Versions stays in Administration');
  const clientRef=new URL(versions.href).searchParams.get('parent');
  versions.click();await wait(()=>location.pathname==='/administration/client-releases'&&button('Create',catalog()),'Scoped client releases');
  await click('Create',catalog());await wait(()=>editor()?.querySelector('#author-version'),'Release editor');
  check(!editor().querySelector('textarea'),'Release settings use fields');
  fill('author-version','9.3.1');fill('author-api_version','1');
  const capabilities=editor().querySelector('app-list-values');
  const rowInput=()=>capabilities.querySelector('input');rowInput().value='forms/1';rowInput().dispatchEvent(new Event('input',{bubbles:true}));
  await click('Add value',capabilities);await wait(()=>capabilities.querySelectorAll('input').length===2,'Capability row');
  check(!button('Save',editor()),'Unfinished capability blocks save');
  const second=capabilities.querySelectorAll('input')[1];second.value='media/1';second.dispatchEvent(new Event('input',{bubbles:true}));
  await click('Save',editor());await wait(()=>!editor()&&catalog().querySelector('app-catalog-relations'),'Actual release saved');
  const releases=(await http('/api/v1/client-releases/search',{client_ref_id:clientRef,page:1,size:100,filters:[],sort_orders:[]})).result.items;
  const release=releases.find(row=>row.version==='9.3.1');check(release&&JSON.stringify(release.renderer_capabilities)===JSON.stringify(['forms/1','media/1']),'Exact capability array persisted');
  check(catalog().querySelector('app-catalog-relations').textContent.includes(clientName),'Named parent after save');
  await record('APP-FE-031 actual scoped Administration release creation, incomplete-row fence, exact capabilities and named client');

  await go('/studio/request-types','app-resource-catalog');await openFirst();await click('Edit',catalog().querySelector('app-catalog-header'));await wait(()=>editor(),'Request settings');
  check(!editor().querySelector('textarea'),'Request settings never require JSON');
  const before=(await http('/api/v1/request-types/search',{page:1,size:100,filters:[],sort_orders:[]})).result.items;
  const current=before.find(row=>row.name===catalog().querySelector('h1').textContent.trim());check(current,'Current request type');
  fill('author-name',current.name+' updated');await click('Save',editor());await wait(()=>!editor(),'Request type saved');
  const after=(await http('/api/v1/request-types/search',{page:1,size:100,filters:[],sort_orders:[]})).result.items.find(row=>row.code===current.code);
  check(after?.name===current.name+' updated'&&after.form_ref_id===current.form_ref_id&&after.workflow_ref_id===current.workflow_ref_id,'Named dependency pins preserved');
  check(JSON.stringify(after.client_targets)===JSON.stringify(current.client_targets),'Untouched client restrictions preserved');
  await record('APP-FE-031 actual request settings update and unchanged form/workflow pins and client restrictions');
  await click('Back to list',catalog());await ready();await click('Advanced filters',query());await click('Add filter',query());
  await choose('Field','Created At',query());await choose('Operation','Is one of',query());
  const dates=query().querySelector('app-list-values');
  const date=dates.querySelector('.date-entry input');date.value='2026-10-17';date.dispatchEvent(new Event('input',{bubbles:true}));
  await click('Add value',dates);await click('Apply',query());
  check(query().querySelector('[role=alert]'),'Unfinished date membership retained');
  check(dates.querySelectorAll('app-temporal-control').length===2,'Independent calendar membership rows');
  await click('Remove 2',dates);
  await click('Apply',query());await wait(()=>button('Apply',query())&&!query().querySelector('[role=alert]'),'Actual date membership accepted');
  await record('APP-FE-031 actual datetime membership controls, incomplete-row fence and backend filter acceptance');


  await go('/administration/tasks/definitions','app-resource-page');
  const resource=()=>document.querySelector('app-resource-page');
  await wait(()=>resource()?.querySelector('tbody tr')&&!resource().textContent.includes('Loading…'),'Registered definitions');
  check(!button('Create',resource().querySelector('app-record-page-header')),'Task definitions remain producer-owned');
  await click('Open',resource().querySelector('app-record-table'));await wait(()=>resource().querySelector('app-record-detail'),'Registered task details');
  check(resource().textContent.includes('Execution'),'Task execution metadata grouped');
  await record('APP-FE-032 actual registered task definition list/detail without invented writes');

  await go('/administration/tasks/schedules','app-resource-page');
  await wait(()=>button('Create',resource().querySelector('app-record-page-header')),'Schedule list');
  await click('Create',resource().querySelector('app-record-page-header'));
  const schedule=()=>resource().querySelector('app-record-editor');
  await wait(()=>document.getElementById('record-name'),'Schedule editor');
  await choose('Schedule type','interval',schedule());fill('record-name','Owned Administration interval');await new Promise(resolve=>setTimeout(resolve,75));fill('record-interval_seconds','60');await new Promise(resolve=>setTimeout(resolve,75));
  await choose('Schedule type','clocked',schedule());check(!document.getElementById('record-interval_seconds'),'Inactive interval hidden');
  await choose('Schedule type','interval',schedule());check(document.getElementById('record-interval_seconds').value==='60','Interval draft retained');
  const enabled=document.getElementById('record-enabled');check(enabled?.type==='checkbox','Explicit enabled control');if(enabled.checked)enabled.click();
  document.getElementById('record-task_name').parentElement.querySelector('button').click();
  await wait(()=>document.querySelector('app-reference-picker .p-dialog tbody tr'),'Registered task picker');
  fill('reference-search','system.ping');await click('Search',document.querySelector('app-reference-picker .p-dialog'));await wait(()=>document.querySelector('app-reference-picker tbody')?.textContent.includes('system.ping'),'Registered ping task');await click('Select',[...document.querySelectorAll('app-reference-picker tbody tr')].find(row=>row.textContent.includes('system.ping')));
  await click('Save',schedule());check(!schedule().querySelector('.field-error-summary'),'Schedule validation: '+(schedule().querySelector('.field-error-summary')?.textContent.trim()||''));await confirm();await wait(()=>!document.getElementById('record-editor-save')||schedule().querySelector('[role=alert]'),'Schedule completion');check(!document.getElementById('record-editor-save'),'Schedule validation: '+[...schedule().querySelectorAll('[role=alert]')].map(row=>row.textContent.trim()).join('; '));
  const schedules=(await http('/api/v1/tasks/schedules/search',{page:1,size:100,filters:[],sort_orders:[]})).result.items;
  const saved=schedules.find(row=>row.name==='Owned Administration interval');check(saved?.enabled===false&&saved.interval_seconds===60&&saved.schedule_type==='interval','Disabled actual schedule persisted');
  check(saved.clocked_at===null||saved.clocked_at===undefined,'Inactive clocked draft absent');
  await record('APP-FE-032 actual disabled interval schedule, registered task selection, variant switching and exact persistence');
  const instant=new Date(Date.now()+86400000).toISOString();
  const clocked=(await http('/api/v1/tasks/schedules',{name:'Owned paused clocked',task_name:saved.task_name,schedule_type:'clocked',clocked_at:instant,one_off:true,enabled:false})).data;
  await go('/administration/tasks/schedules?selected='+encodeURIComponent(clocked.ref_id),'app-resource-page');
  await wait(()=>resource().querySelector('app-record-detail')&&resource().querySelector('h1').textContent.includes('Owned paused clocked'),'Current clocked detail');
  await click('Edit',resource().querySelector('app-record-page-header'));await wait(()=>document.getElementById('record-queue'),'Clocked update fields');
  check(!document.getElementById('record-interval_seconds'),'No interval on a clocked update');
  const queues=(await http('/api/v1/tasks/queues/select?page=1&size=25',undefined,'GET')).result.items;check(queues.length,'Registered queue choices');
  const queueChoice=queues[0];check(document.getElementById('record-queue').readOnly,'Queue uses registered choices');
  document.getElementById('record-queue').parentElement.querySelector('button').click();
  await wait(()=>[...document.querySelectorAll('app-reference-picker tbody tr')].some(row=>row.textContent.includes(queueChoice.value)),'Registered queue picker');
  await click('Select',[...document.querySelectorAll('app-reference-picker tbody tr')].find(row=>row.textContent.includes(queueChoice.value)));
  await wait(()=>!document.querySelector('app-reference-picker .p-dialog'),'Queue selected');
  await click('Save',schedule());await confirm();await wait(()=>!document.getElementById('record-editor-save'),'Clocked update persisted');
  const updated=(await http('/api/v1/tasks/schedules/search',{page:1,size:100,filters:[],sort_orders:[]})).result.items.find(row=>row.name==='Owned paused clocked');
  check(updated?.queue===queueChoice.key&&updated.enabled===false&&updated.schedule_type==='clocked'&&Date.parse(updated.clocked_at)===Date.parse(instant),'Clocked update invariants: '+JSON.stringify({queueMatches:updated?.queue===queueChoice.key,enabled:updated?.enabled,type:updated?.schedule_type,timeMatches:Date.parse(updated?.clocked_at)===Date.parse(instant)}));
  await record('APP-FE-032 actual non-interval schedule edit preserves timing, remains disabled and omits rejected interval null');


  await go('/administration/commands/users','app-admin-console');
  const consoleRoot=()=>document.querySelector('app-admin-console');await choose('Operation','List Admin Users',consoleRoot());
  await wait(()=>document.getElementById('body-size'),'Typed command settings');check(!consoleRoot().querySelector('app-admin-command-form textarea'),'Command settings use schema fields');
  fill('body-size','0');await wait(()=>!button('Load',consoleRoot()),'Invalid command size blocks execution');fill('body-size','25');await click('Load',consoleRoot());
  await wait(()=>consoleRoot().querySelector('app-record-summary'),'Read-only command response');
  await record('APP-FE-032 actual typed Administration command validation and read-only result');
  await fetch('/__result',{method:'POST',body:JSON.stringify({ok:true,scenarios,diagnostics:window.fixtureDiagnostics})});
 }catch(error){await fetch('/__result',{method:'POST',body:JSON.stringify({ok:false,error:error.message,scenarios,diagnostics:window.fixtureDiagnostics})});}
})();`;
}
