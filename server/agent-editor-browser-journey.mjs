import { agentAuthoringBrowserJourney } from "./agent-authoring-browser-journey.mjs";
import { foundationsBrowserHelpers } from "./foundations-browser-journey.mjs";

/** Actual owned services; seeded connection metadata never proves vendor execution. */
export function agentEditorBrowserJourney(credentials) {
  return `
(async()=>{
${foundationsBrowserHelpers(credentials)}
 try {
  await login(0);
  const session=async()=>await(await fetch('/session/status')).json();
  const request=async(path,body,method='POST')=>fetch(path,{method,headers:{'content-type':'application/json','x-csrf-token':(await session()).csrfToken},...(body===undefined?{}:{body:JSON.stringify(body)})});
  const http=async(path,body,method)=>{const response=await request(path,body,method);check(response.ok,'Actual agent operation '+path+' ('+response.status+')');return await response.json();};
  const spec={connection_ref:accounts.agent_connection,provider_key:'typesafe',model_id:'owned-model',prompt_version:'1',instructions:'Owned agent instructions',decision:{question:'Which result?',options_input_key:'choices',review_below:0.8},data_policy:{allowed_fields:['question','choices'],allowed_classifications:['PUBLIC'],redacted_fields:[],allowed_tools:[],allowed_retrieval_sources:[]},field_classifications:{question:'PUBLIC',choices:'PUBLIC'},user_limits:{requests:2,tool_calls:0,input_tokens:1000,output_tokens:500,total_tokens:1500,elapsed_seconds:30,spend_usd:'0.50',strict_spend:false}};
  let agent=(await http('/api/v1/ai-agents',{code:'owned-agent-editor',name:'Owned agent editor',spec})).data;
  const connection=(await http('/api/v1/ai-agents/connections/select',{page:1,size:20,search:'Owned agent connection'})).result.items;
  check(connection.some(row=>row.key===accounts.agent_connection&&row.value==='Owned agent connection'),'Actual authorized named connection');
  const metadata=(await http('/api/v1/ai-agents/connections/'+encodeURIComponent(accounts.agent_connection)+'/models/owned-model/metadata',undefined,'GET')).data;
  check(metadata.model_id==='owned-model'&&metadata.source==='configured'&&metadata.provider_retention==='Owned acceptance metadata only','Configured metadata without provider call');
  check(!('secret_ref' in metadata)&&!('secret_version' in metadata),'No credential metadata');
  await record('APP-FE-030 actual owned draft, authorized connection selection and model metadata; seeded verification only');
  await go('/administration/agents','app-resource-page');
  await wait(()=>document.querySelector('app-record-table')?.textContent.includes('Owned agent editor'),'Actual agent list');
  await click('Open',document.querySelector('app-record-table'));
  await wait(()=>document.querySelector('app-agent-detail'),'Readable agent detail');
  await click('Edit',document.querySelector('app-record-page-header'));
  const editor=()=>document.querySelector('.page-editor');
  const set=async(id,value)=>{fill(id,value);await new Promise(r=>setTimeout(r,75));};
  const tab=async(name)=>{const row=[...editor().querySelectorAll('[role=tab]')].find(el=>el.textContent.trim()===name);check(row,'Missing agent section '+name);row.click();await new Promise(r=>setTimeout(r,50));};
  await tab('Instructions and decision');
  await set('agent-instructions','Owned multiline instructions\\nKeep the human decision.');
  await choose('Choice source','Fixed choices',editor());
  for(const label of ['Proceed','Need details']){await click('Add choice',editor());const index=editor().querySelectorAll('.choice-row').length-1;await set('agent-choice-label-'+index,label);await set('agent-choice-description-'+index,label+' after review');}
  const firstKey=document.getElementById('agent-choice-key-0').value;
  check(/^choice_[a-f0-9]{32}$/.test(firstKey),'Generated stable choice identity');
  await tab('Usage limits');await set('agent-limit-requests','1e');await wait(()=>!button('Save',editor()),'Invalid numeric Save fence');await set('agent-limit-tool_calls','0');check(document.getElementById('agent-limit-requests').value==='1e','Invalid text retained');await set('agent-limit-requests','3');await set('agent-limit-spend_usd','0.000001');
  await tab('Configuration checks');await click('Check configuration',editor());await wait(()=>editor().textContent.includes('Local configuration checks passed'),'Pure local validation');
  await click('Save',editor());await confirm();await wait(()=>!editor(),'Saved actual static decision');
  agent=(await http('/api/v1/ai-agents/'+encodeURIComponent(agent.ref_id),undefined,'GET')).data;
  check(agent.spec.decision.options.length===2&&agent.spec.decision.options[0].key===firstKey&&!('options_input_key' in agent.spec.decision),'Exact static decision union');
  check(agent.spec.instructions==='Owned multiline instructions\\nKeep the human decision.'&&agent.spec.user_limits.tool_calls===0&&Number(agent.spec.user_limits.spend_usd)===0.000001,'Exact multiline, zero and decimal persistence');
  check(agent.status==='DRAFT'&&agent.checksum===null,'Draft never published');
  await record('APP-FE-030 actual full-page static-choice save, exact limits and pure configuration check');
  await click('Edit',document.querySelector('app-record-page-header'));await tab('Instructions and decision');await choose('Choice source','Choices supplied by the workflow',editor());await choose('Workflow choices input Required','choices',editor());await click('Save',editor());await confirm();await wait(()=>!editor(),'Saved actual input decision');
  agent=(await http('/api/v1/ai-agents/'+encodeURIComponent(agent.ref_id),undefined,'GET')).data;
  check(agent.spec.decision.options_input_key==='choices'&&!('options' in agent.spec.decision),'Exact input decision union');
  await record('APP-FE-030 actual permitted-input choice selection and union round-trip');
  const query=await http('/api/v1/ai-agents/search',{page:1,size:20,filters:[{field_name:'status',operation:'equal',value:'DRAFT'},{field_name:'name',operation:'contains',value:'Owned agent'},{field_name:'number',operation:'gte',value:1}],sort_orders:[{field_name:'created_at',operation:'desc'},{field_name:'name',operation:'asc'}]});
  check(query.result.items.some(row=>row.ref_id===agent.ref_id),'Actual typed agent list query');
  await record('APP-FE-030 actual typed SearchRequest filtering and ordered sorts; distinct from retrieval');

  const checksTab=[...document.querySelectorAll('app-agent-detail [role=tab]')].find(row=>row.textContent.trim()==='Saved version checks');check(checksTab,'Saved agent checks tab');checksTab.click();await wait(()=>document.querySelector('app-agent-authoring'),'Saved authoring consumer');
  const checks=()=>document.querySelector('app-agent-authoring');await click('Inspect saved choices',checks());await wait(()=>checks().querySelector('section[aria-labelledby="agent-choice-preview-title"] [role=status]'),'Actual decision preview');check(checks().textContent.includes('No choice sample is available'),'Missing choice inputs are honest');
  const retrieval=checks().querySelector('app-agent-retrieval-checks');await click('Search',retrieval);await wait(()=>!retrieval.textContent.includes('Loading…'),'Actual permitted source search');check(!retrieval.querySelector('app-record-table tbody tr td button'),'No invented source for disabled lookup policy');
  check(checks().textContent.includes('A published agent and request-start permission are required for evaluation.')&&!button('Submit governed evaluation',checks()),'Draft agent cannot submit an evaluation');
  const preview=(await http('/api/v1/ai-agents/'+encodeURIComponent(agent.ref_id)+'/decision-preview',{sample_inputs:{question:'Synthetic author question',choices:[{key:'a',labels:{en:'A'},description:'A'},{key:'b',labels:{en:'B'},description:'B'}]}})).data;check(preview.sample_state==='VALID'&&preview.provider_called===false,'Actual explicit choice preview never calls provider');
  await record('APP-FE-030 actual saved Agent checks consumer, missing/valid explicit sample states, permitted empty retrieval and draft evaluation fence without provider dispatch');
${agentAuthoringBrowserJourney()}
  await click('Sign out');await login(1);
  const denied=await request('/api/v1/ai-agents/'+encodeURIComponent(agent.ref_id),undefined,'GET');check([403,404].includes(denied.status),'Other author denied private agent');
  const deniedModel=await request('/api/v1/ai-agents/connections/'+encodeURIComponent(accounts.agent_connection)+'/models/owned-model/metadata',undefined,'GET');check([403,404].includes(deniedModel.status),'Unauthorized connection metadata denied');
  const visible=(await http('/api/v1/ai-agents/search',{page:1,size:20,filters:[],sort_orders:[]})).result.items;check(!visible.some(row=>row.code==='owned-agent-editor'),'Private agent absent from outsider search');
  await record('APP-FE-030 actual other-author detail, connection metadata and search authorization');
  await fetch('/__result',{method:'POST',body:JSON.stringify({ok:true,scenarios,diagnostics:window.fixtureDiagnostics})});
 }catch(error){await fetch('/__result',{method:'POST',body:JSON.stringify({ok:false,scenarios,error:error.message,diagnostics:window.fixtureDiagnostics})});}
})();`;
}
