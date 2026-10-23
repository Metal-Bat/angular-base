import { readFileSync } from "node:fs";
const frozen = JSON.parse(
  readFileSync(
    new URL(
      "../docs/reference/app-be-wave-four/inspector-en.json",
      import.meta.url,
    ),
  ),
);

/** Reviewed discovery, typed editing and actual execution on owned services. */
export function workflowPrimitivesJourney() {
  const expected = frozen.handlers.map((row) => ({
    key: row.handler_key,
    version: row.handler_version,
    fingerprint: row.contract_fingerprint,
  }));
  return `
  const primitiveReturnVersion=version.ref_id;
  {
    await click('Sign out');await login(accounts.users.length-1);
    const liveInspectors=(await http('/api/v1/designer/inspector-contract',undefined,'GET')).data;
    const expectedInspectors=${JSON.stringify(expected)};
    check(liveInspectors.fields.length===20&&liveInspectors.handlers.length===expectedInspectors.length,'Actual reviewed inspector registry size');
    for(const expected of expectedInspectors){const live=liveInspectors.handlers.find(row=>row.handler_key===expected.key&&row.handler_version===expected.version);check(live?.contract_fingerprint===expected.fingerprint,'Actual reviewed handler fingerprint '+expected.key);}
    await record('APP-FE-021 actual authenticated discovery matches all 23 frozen handler/version fingerprints and twenty field contracts');
    const pureType=key=>{const row=catalog.find(item=>item.metadata?.handler_key===key&&item.metadata.handler_version==='1');check(row,'Actual published pure handler '+key);return row.metadata;};
    const types={start:pureType('start'),sum:pureType('arithmetic'),compare:pureType('number_compare'),invert:pureType('boolean_logic'),branch:pureType('if_else'),pick:pureType('select_value'),zero:catalog.find(item=>item.metadata?.handler_key==='transform'&&item.metadata.handler_version==='2').metadata,finish:pureType('finish')};
    const pureStep=(key,type,config={})=>({key,type_code:type.code,type_version_ref:type.ref_id,config});
    const constant=(key,port,value)=>({step:key,target_port:port,target_schema:types[key].ports.find(item=>item.direction==='INPUT'&&item.port_key===port).value_schema,source_kind:'CONSTANT',constant_value:value,ordinal:0});
    const output=(key,port,source)=>({step:key,target_port:port,target_schema:types[key].ports.find(item=>item.direction==='INPUT'&&item.port_key===port).value_schema,source_kind:'STEP_OUTPUT',source_step:source,source_port:'result',source_schema:types[source].ports.find(item=>item.direction==='OUTPUT'&&item.port_key==='result').value_schema,ordinal:0});
    const root=(await http('/api/v1/workflows',{code:'owned-primitive-runtime',name:'Owned pure calculations',access_mode:'RESTRICTED',is_active:true})).data;
    let version=(await http('/api/v1/workflow-versions',{workflow_ref_id:root.ref_id,number:1})).data;
    const graph={steps:[pureStep('start',types.start),pureStep('sum',types.sum,{operation:'subtract'}),pureStep('compare',types.compare,{operation:'lt'}),pureStep('invert',types.invert,{operation:'or'}),pureStep('branch',types.branch),pureStep('pick',types.pick),pureStep('zero',types.zero,{conversion_key:'string'}),pureStep('wrong_branch',types.zero,{conversion_key:'integer'}),pureStep('finish',types.finish)],transitions:[{source:'start',target:'sum',outcome:'next',is_default:true},{source:'sum',target:'compare',outcome:'next',is_default:true},{source:'compare',target:'invert',outcome:'next',is_default:true},{source:'invert',target:'branch',outcome:'next',is_default:true},{source:'branch',target:'pick',outcome:'false',priority:0,is_default:false},{source:'branch',target:'wrong_branch',outcome:'true',priority:1,is_default:false},{source:'pick',target:'zero',outcome:'next',is_default:true},{source:'zero',target:'finish',outcome:'next',is_default:true},{source:'wrong_branch',target:'finish',outcome:'next',is_default:true}],bindings:[constant('sum','left',1),constant('sum','right',2),output('compare','left','sum'),constant('compare','right',3),output('invert','left','compare'),constant('invert','right',false),output('branch','condition','invert'),constant('pick','condition',false),constant('pick','if_true',null),constant('pick','if_false',0),{...output('zero','value','pick'),target_schema:{}},{step:'wrong_branch',target_port:'value',target_schema:{type:['string','integer']},source_kind:'CONSTANT',constant_value:'invalid-if-executed',ordinal:0}],targets:[]};
    version=(await http('/api/v1/workflow-versions/'+encodeURIComponent(version.ref_id)+'/graph',graph,'PUT')).data;
    await go('/studio/workflow-versions/'+encodeURIComponent(version.ref_id)+'/edit','app-workflow-board');
    for(const [key,label,wire] of [['sum','Add numbers','add'],['compare','Equal','eq'],['invert','Invert condition (NOT)','not']]){
      await wait(()=>board().querySelector('.board-node[data-node-key="'+key+'"] .node-handle'),'Pure primitive node '+key);
      board().querySelector('.board-node[data-node-key="'+key+'"] .node-handle').click();
      await wait(()=>board().querySelector('.board-node[data-node-key="'+key+'"].selected')&&document.getElementById('node-operation'),'Typed primitive controls '+key);
      const inspector=board().querySelector('app-node-inspector:has(#node-operation)');
      await choose('Operation',label,inspector);await click('Apply typed configuration',inspector);
      await wait(()=>!button('Apply typed configuration',inspector)?.disabled,'Applied primitive '+wire);
    }
    await click('Save workspace',board());await wait(()=>board().textContent.includes('Workspace saved. This is not an executable graph.'),'Pure workspace saved');
    let saved=(await http('/api/v1/workflow-versions/'+encodeURIComponent(version.ref_id)+'/workspace',undefined,'GET')).data;
    for(const [key,operation] of [['sum','add'],['compare','eq'],['invert','not']])check(saved.document.graph.steps.find(row=>row.key===key).config.operation===operation,'Canonical operation persisted '+key);
    check(saved.document.graph.bindings.find(row=>row.step==='pick'&&row.target_port==='if_false').constant_value===0&&saved.document.graph.bindings.find(row=>row.step==='pick'&&row.target_port==='if_true').constant_value===null,'Zero and null remain distinct');
    check((await http('/api/v1/workflows/validate',saved.document.graph)).data.valid,'Actual composed primitive graph validates');
    await record('APP-FE-021 actual human-readable arithmetic/comparison/logic controls persist canonical enums, exact version pins, zero and null through the existing workspace');
    version=(await http('/api/v1/workflow-versions/'+encodeURIComponent(version.ref_id)+'/workspace/promote',{workspace_ref_id:saved.workspace_ref_id})).data;
    version=(await http('/api/v1/workflow-versions/'+encodeURIComponent(version.ref_id)+'/publish',{})).data;
    const service=(await http('/api/v1/request-types',{code:'owned-primitive-service',name:'Owned pure service',workflow_ref_id:root.ref_id,form_ref_id:requestType.form_ref_id,client_targets:requestType.client_targets,is_active:true})).data;
    const requestDraft=(await http('/api/v1/business-requests',{request_type_ref_id:service.ref_id,data:{amount:'17',lines:[]}})).data;
    const submitted=(await http('/api/v1/business-requests/'+encodeURIComponent(requestDraft.ref_id)+'/submit',{submit_key:'owned-pure-calculation'})).data;
    const process=(await http('/api/v1/processes/'+encodeURIComponent(submitted.process_ref_id),undefined,'GET')).data;
    check(process.status==='COMPLETED'&&!process.last_error_code&&process.workflow_version_ref_id===version.ref_id,'Real pure calculation chain completes on its exact published pin');
    const timeline=(await http('/api/v1/processes/'+encodeURIComponent(submitted.process_ref_id)+'/timeline',{})).data;
    for(const key of ['sum','compare','invert','branch','pick','zero'])check(timeline.steps.find(row=>row.step_key===key)?.executions.some(row=>row.status==='COMPLETED'),'Actual pure execution '+key);
    check(timeline.steps.find(row=>row.step_key==='wrong_branch')?.executions.length===0&&timeline.transitions.some(row=>row.source_step_key==='branch'&&row.target_step_key==='pick'&&row.outcome==='false'),'Actual false branch taken without executing the invalid true branch');
    await record('APP-FE-021 actual published arithmetic, numeric comparison, boolean NOT, false routing and null/zero value selection complete through the existing process engine without external effects');
    await click('Sign out');await login(0);await go('/studio/workflow-versions/'+encodeURIComponent(primitiveReturnVersion)+'/edit','app-workflow-board');
  }
`;
}
