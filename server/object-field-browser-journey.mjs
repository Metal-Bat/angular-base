/** Actual UI authoring, redacted preview, immutable publication and execution in owned services. */
export function objectFieldBrowserJourney() {
  return `
  {
    const returnVersion=version.ref_id;
    await click('Sign out');await login(accounts.users.length-1);
    const meta=(key,number='1')=>{const row=catalog.find(item=>item.metadata?.handler_key===key&&item.metadata.handler_version===number);check(row,'Object mapping handler '+key);return row.metadata;};
    const start=meta('start'),finish=meta('finish'),transform=meta('transform','2');
    const root=(await http('/api/v1/workflows',{code:'owned-object-fields',name:'Owned object fields',access_mode:'RESTRICTED',is_active:true})).data;
    let pin=(await http('/api/v1/workflow-versions',{workflow_ref_id:root.ref_id,number:1})).data;
    const names=['amount','count','status','flag','items','note'];
    const graph={steps:[{key:'start',type_code:start.code,type_version_ref:start.ref_id},{key:'cast',type_code:transform.code,type_version_ref:transform.ref_id,config:{conversion_key:'integer'}},{key:'assemble',type_code:transform.code,type_version_ref:transform.ref_id,config:{conversion_key:'object',projection:Object.fromEntries(names.map(name=>[name,'/'+name]))}},{key:'finish',type_code:finish.code,type_version_ref:finish.ref_id}],targets:[],transitions:[{source:'start',target:'cast',outcome:'next',is_default:true},{source:'cast',target:'assemble',outcome:'next',is_default:true},{source:'assemble',target:'finish',outcome:'next',is_default:true}],bindings:[{step:'cast',target_port:'value',target_schema:{type:['string','integer']},source_kind:'CONSTANT',constant_value:'0',ordinal:0},{step:'assemble',target_port:'value',target_schema:{type:'object'},source_kind:'CONSTANT',constant_value:{amount:'17',count:0,status:'RUNNING',flag:false,items:[],note:null},ordinal:0}]};
    pin=(await http('/api/v1/workflow-versions/'+encodeURIComponent(pin.ref_id)+'/graph',graph,'PUT')).data;
    pin=(await http('/api/v1/workflow-versions/'+encodeURIComponent(pin.ref_id)+'/publish',{})).data;
    const kind=(await http('/api/v1/request-types',{code:'owned-object-fields',name:'Owned object fields',workflow_ref_id:root.ref_id,form_ref_id:requestType.form_ref_id,client_targets:requestType.client_targets,is_active:true})).data;
    let draft=(await http('/api/v1/workflow-versions',{workflow_ref_id:root.ref_id,number:2})).data;
    draft=(await http('/api/v1/workflow-versions/'+encodeURIComponent(draft.ref_id)+'/graph',graph,'PUT')).data;
    const draftPath='/api/v1/workflow-versions/'+encodeURIComponent(draft.ref_id);
    const editable={...graph,bindings:[graph.bindings[0]]};
    await http(draftPath+'/workspace',{workspace_ref_id:null,document:{dialect:'bpms.workspace/1',graph:editable,positions:Object.fromEntries(graph.steps.map((step,index)=>[step.key,{x:index*320,y:40}])),viewport:{x:0,y:0,zoom:1},collapsed:[],routing:{}}},'PUT');
    await go('/studio/workflow-versions/'+encodeURIComponent(draft.ref_id)+'/edit','app-workflow-board');
    await wait(()=>board().querySelector('.board-node[data-node-key="assemble"] .data-port'),'Object mapping ports');
    board().querySelector('.board-node[data-node-key="assemble"] .node-handle').click();
    await wait(()=>connections()?.querySelector('#mapping-target'),'Object mapping inspector');
    await choose('Target port','value · object',connections());
    document.getElementById('mapping-request-search').closest('details').open=true;
    const picker=connections().querySelector('app-studio-choice:has(#mapping-request-search)');fill('mapping-request-search',kind.name);await click('Find references',picker);await choose('Selected resource',kind.name,picker);await click('Binding suggestions',connections());
    await wait(()=>button('Binding suggestions',connections()),'Object source suggestions');
    const composer=()=>connections().querySelector('app-object-field-mapping');composer().querySelector('details').open=true;
    const addField=async(name,source,type)=>{
      fill('object-field-name',name);
      if(source){await choose('Field source',source,composer());}
      else {await choose('Field type',type,composer());}
      await wait(()=>button('Add object field',composer()),'Typed object field ready '+name);await click('Add object field',composer());
      await wait(()=>!document.getElementById('object-field-name')?.value,'Object field applied '+name);
    };
    await addField('amount','request.amount');await addField('count','steps.cast.outputs.result');await addField('status','process.status');
    await addField('flag',null,'boolean');await addField('items',null,'array');await addField('note',null,'null');
    check(connections().querySelectorAll('app-mapping-list li').length===6,'Six explicit object mappings');
    const preview=()=>connections().querySelector('app-object-binding-preview');preview().querySelector('details').open=true;
    await click('Check object samples',preview());await wait(()=>preview().textContent.includes('MISSING'),'Missing author samples reported');
    const sections=[...preview().querySelectorAll('section')];for(const section of sections){const input=section.querySelector('input[type=checkbox]');if(input)input.click();}
    await wait(()=>document.getElementById('binding-sample-0'),'Explicit request sample control');fill('binding-sample-0','17');fill('binding-sample-1','0');fill('binding-sample-2','RUNNING');
    await click('Check object samples',preview());await wait(()=>preview().textContent.includes('VALID')&&!preview().textContent.includes('INVALID'),'Valid redacted structural preview');
    check(!preview().querySelector('[role=status]').textContent.includes('RUNNING'),'Preview does not echo sample values');
    await save();const saved=(await http(draftPath+'/workspace',undefined,'GET')).data;const fields=saved.document.graph.bindings.filter(row=>row.step==='assemble');
    check(fields.length===6&&new Set(fields.map(row=>row.source_kind)).size===4,'Actual WIP includes all four source kinds');check(fields.every((row,index)=>row.ordinal===index&&row.target_projection.dialect==='bpms.binding.object/1'),'Versioned destinations and dense ordering');
    await record('APP-FE-023/024 actual typed cross-source object authoring, explicit false/empty array/null, missing versus present samples and redacted pure preview');
    draft=(await http(draftPath+'/workspace/promote',{workspace_ref_id:saved.workspace_ref_id})).data;
    draft=(await http('/api/v1/workflow-versions/'+encodeURIComponent(draft.ref_id)+'/publish',{})).data;
    const published=(await http('/api/v1/workflow-versions/'+encodeURIComponent(draft.ref_id)+'/graph',undefined,'GET')).data;check(published.bindings.filter(row=>row.target_projection).length===6,'Published projection facts survive reload');
    const request=(await http('/api/v1/business-requests',{request_type_ref_id:kind.ref_id,data:{amount:'17',lines:[{note:'42'}]}})).data;
    const body={submit_key:'owned-object-fields'};const submitted=(await http('/api/v1/business-requests/'+encodeURIComponent(request.ref_id)+'/submit',body)).data;
    const replay=(await http('/api/v1/business-requests/'+encodeURIComponent(request.ref_id)+'/submit',body)).data;
    check(replay.process_ref_id===submitted.process_ref_id,'Original submission replay resolves one process');
    const process=(await http('/api/v1/processes/'+encodeURIComponent(submitted.process_ref_id),undefined,'GET')).data;
    check(process.status==='COMPLETED'&&!process.last_error_code&&process.workflow_version_ref_id===draft.ref_id,'Real published object composition completes on exact pin');
    await record('APP-FE-023/024 actual projection save/promote/publish/reload, existing-engine completed execution and unchanged single-process submission replay');
    await click('Sign out');await login(0);await go('/studio/workflow-versions/'+encodeURIComponent(returnVersion)+'/edit','app-workflow-board');await select('owned_service');
  }
`;
}
