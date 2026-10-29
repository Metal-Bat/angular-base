/** Existing controls round-trip declared schemas against owned actual services. */
export function bindingContractJourney() {
  return `
  {
    const returnVersion=version.ref_id;
    await click('Sign out');await login(accounts.users.length-1);
    const registered=(key,number='1')=>{const row=catalog.find(item=>item.metadata?.handler_key===key&&item.metadata.handler_version===number);check(row,'Registered binding type '+key+'/'+number);return row.metadata;};
    const normalized=value=>Array.isArray(value)?value.map(normalized):value&&typeof value==='object'?Object.fromEntries(Object.keys(value).sort().map(key=>[key,normalized(value[key])])):value;
    const same=(left,right)=>JSON.stringify(normalized(left))===JSON.stringify(normalized(right));
    for(const legacy of [false,true]){
      const start=registered('start'),finish=registered('finish'),transform=registered('transform',legacy?'1':'2');
      const suffix=legacy?'legacy':'request';
      const root=(await http('/api/v1/workflows',{code:'owned-binding-'+suffix,name:'Owned binding '+suffix,access_mode:'RESTRICTED',is_active:true})).data;
      let draft=(await http('/api/v1/workflow-versions',{workflow_ref_id:root.ref_id,number:1})).data;
      const binding={step:'cast',target_port:'value',target_schema:legacy?transform.ports.find(port=>port.direction==='INPUT'&&port.port_key==='value').value_schema:{type:['string','integer']},source_kind:legacy?'CONSTANT':'REQUEST',ordinal:0,...(legacy?{constant_value:'17'}:{source_path:'/amount',source_schema:{type:'object',properties:{amount:{type:'string'}},required:['amount']}})};
      const graph={steps:[{key:'start',type_code:start.code,type_version_ref:start.ref_id},{key:'cast',type_code:transform.code,type_version_ref:transform.ref_id,config:{conversion_key:'integer'}},{key:'finish',type_code:finish.code,type_version_ref:finish.ref_id}],bindings:[binding],targets:[],transitions:[{source:'start',target:'cast',outcome:'next',is_default:true},{source:'cast',target:'finish',outcome:'next',is_default:legacy,...(legacy?{}:{condition:'request.amount == "17"'})}]};
      draft=(await http('/api/v1/workflow-versions/'+encodeURIComponent(draft.ref_id)+'/graph',graph,'PUT')).data;
      await go('/studio/workflow-versions/'+encodeURIComponent(draft.ref_id)+'/edit','app-workflow-board');
      await wait(()=>board().querySelectorAll('.board-node').length===3&&button('Save workspace',board()),'Current binding graph mounted');
      await click('Save workspace',board());await wait(()=>board().textContent.includes('Workspace saved. This is not an executable graph.'),'Binding workspace saved through UI');
      await click('Reload',board());await wait(()=>board().querySelectorAll('.board-node').length===3&&button('Save workspace',board()),'Binding workspace reloaded through UI');
      const saved=(await http('/api/v1/workflow-versions/'+encodeURIComponent(draft.ref_id)+'/workspace',undefined,'GET')).data;
      check(same(saved.document.graph.bindings[0].source_schema??null,binding.source_schema??null),'UI retained exact declared source schema '+suffix);
      check(same(saved.document.graph.bindings[0].target_schema,binding.target_schema),'UI retained registered target schema '+suffix);
      await record('APP-FE-024 actual '+suffix+' executable-to-canvas save/reload preserves exact declared source and canonical target schemas');
      draft=(await http('/api/v1/workflow-versions/'+encodeURIComponent(draft.ref_id)+'/workspace/promote',{workspace_ref_id:saved.workspace_ref_id})).data;
      draft=(await http('/api/v1/workflow-versions/'+encodeURIComponent(draft.ref_id)+'/publish',{})).data;
      const published=(await http('/api/v1/workflow-versions/'+encodeURIComponent(draft.ref_id)+'/graph',undefined,'GET')).data;
      check(same(published.bindings[0].source_schema??null,binding.source_schema??null),'Publication retained declared schema '+suffix);
      check(same(published.bindings[0].target_schema,binding.target_schema),'Publication retained canonical target '+suffix);
      const type=(await http('/api/v1/request-types',{code:'owned-binding-'+suffix,name:'Owned binding '+suffix,workflow_ref_id:root.ref_id,form_ref_id:requestType.form_ref_id,client_targets:requestType.client_targets,is_active:true})).data;
      const request=(await http('/api/v1/business-requests',{request_type_ref_id:type.ref_id,data:{amount:'17',lines:[{note:'42'}]}})).data;
      const submitted=(await http('/api/v1/business-requests/'+encodeURIComponent(request.ref_id)+'/submit',{submit_key:'owned-binding-'+suffix})).data;
      const process=(await http('/api/v1/processes/'+encodeURIComponent(submitted.process_ref_id),undefined,'GET')).data;
      check(process.status==='COMPLETED'&&!process.last_error_code,'Actual published binding execution completed '+suffix);
      const timeline=(await http('/api/v1/processes/'+encodeURIComponent(submitted.process_ref_id)+'/timeline',{})).data;
      check(timeline.steps.find(row=>row.step_key==='cast')?.executions.some(row=>row.status==='COMPLETED'&&row.attempts.some(attempt=>attempt.status==='SUCCEEDED')),'Actual bounded conversion succeeded '+suffix);
      await record('APP-FE-024 actual '+suffix+' promote/publish/reload and submitted request execute through unchanged pins and the existing bounded Transform engine');
    }
    await click('Sign out');await login(0);await go('/studio/workflow-versions/'+encodeURIComponent(returnVersion)+'/edit','app-workflow-board');await select('owned_service');
  }
`;
}
