/** Actual execution on the harness-owned disposable backend. Never run on a shared demo. */
export function dataMappingRuntimeJourney() {
  return `
  {
    await click('Sign out');await login(accounts.users.length-1);
    const metadata=(handler,version)=>{const entry=catalog.find(row=>row.metadata?.handler_key===handler&&row.metadata.handler_version===version);check(entry,'Actual mapper handler '+handler+' '+version);return entry.metadata;};
    const start=metadata('start','1'),finish=metadata('finish','1'),transform=metadata('transform','2');
    const root=(await http('/api/v1/workflows',{code:'owned-mapper-runtime',name:'Owned mapper runtime',access_mode:'RESTRICTED',is_active:true})).data;
    let mappedVersion=(await http('/api/v1/workflow-versions',{workflow_ref_id:root.ref_id,number:1})).data;
    const requestSchema={type:'object',properties:{lines:{type:'array',items:{type:'object',properties:{note:{type:'string'}}}}}};
    const integerSchema={type:['string','integer']};
    const executable={steps:[{key:'start',type_code:start.code,type_version_ref:start.ref_id,config:{}},{key:'map_integer',type_code:transform.code,type_version_ref:transform.ref_id,config:{conversion_key:'integer'}},{key:'map_string',type_code:transform.code,type_version_ref:transform.ref_id,config:{conversion_key:'string',format:'mapped:{}'}},{key:'finish',type_code:finish.code,type_version_ref:finish.ref_id,config:{}}],transitions:[{source:'start',target:'map_integer',outcome:'next',priority:0,is_default:true},{source:'map_integer',target:'map_string',outcome:'next',priority:0,is_default:true},{source:'map_string',target:'finish',outcome:'next',priority:0,is_default:true}],bindings:[{step:'map_integer',target_port:'value',target_schema:integerSchema,source_kind:'REQUEST',source_path:'/lines/0/note',source_schema:requestSchema,ordinal:0},{step:'map_string',target_port:'value',target_schema:{},source_kind:'STEP_OUTPUT',source_step:'map_integer',source_port:'result',source_schema:{type:'integer'},ordinal:0}],targets:[]};
    const validated=(await http('/api/v1/workflows/validate',executable)).data;check(validated.valid===true,'Real server accepts indexed request field and composed conversions');
    mappedVersion=(await http('/api/v1/workflow-versions/'+encodeURIComponent(mappedVersion.ref_id)+'/graph',executable,'PUT')).data;
    mappedVersion=(await http('/api/v1/workflow-versions/'+encodeURIComponent(mappedVersion.ref_id)+'/publish',{})).data;check(mappedVersion.status==='PUBLISHED','Owned disposable executable pin published');
    const mappingType=(await http('/api/v1/request-types',{code:'owned-mapper-runtime',name:'Owned mapper runtime',workflow_ref_id:root.ref_id,form_ref_id:requestType.form_ref_id,client_targets:requestType.client_targets,is_active:true})).data;

    let authored=(await http('/api/v1/workflow-versions',{workflow_ref_id:root.ref_id,number:2})).data;
    const editable={...executable,bindings:[{step:'map_integer',target_port:'value',target_schema:integerSchema,source_kind:'CONSTANT',constant_value:'17',ordinal:0},executable.bindings[1]]};
    authored=(await http('/api/v1/workflow-versions/'+encodeURIComponent(authored.ref_id)+'/graph',editable,'PUT')).data;
    const authoredPath='/api/v1/workflow-versions/'+encodeURIComponent(authored.ref_id)+'/workspace';
    await http(authoredPath,{document:{dialect:'bpms.workspace/1',graph:editable,positions:Object.fromEntries(editable.steps.map((step,index)=>[step.key,{x:index*320,y:40}])),viewport:{x:0,y:0,zoom:1},collapsed:[],routing:{}},workspace_ref_id:null},'PUT');
    await go('/studio/workflow-versions/'+encodeURIComponent(authored.ref_id)+'/edit','app-workflow-board');
    await wait(()=>board().querySelector('.board-node[data-node-key="map_integer"] .data-port'),'Real conversion port definitions loaded');
    board().querySelector('.board-node[data-node-key="map_integer"] .node-handle').click();
    await wait(()=>connections()?.querySelector('app-mapping-list button'),'Real mapper opened');
    const mapper=connections();mapper.querySelector('details summary').click();
    const requestPicker=mapper.querySelector('app-studio-choice');fill('mapping-request-search',mappingType.name);await click('Find references',requestPicker);await choose('Selected resource',mappingType.name,requestPicker);await wait(()=>button('Binding suggestions',mapper),'Actual request type selected');await click('Binding suggestions',mapper);
    await wait(()=>button('Binding suggestions',mapper),'Actual completion returned');await click('Edit data mapping',mapper);
    await choose('Source port','request.lines · array',mapper);fill('mapping-item-index','0');await choose('Collection item field','note',mapper);await click('Update data mapping',mapper);await save();
    const uiDocument=(await http(authoredPath,undefined,'GET')).data.document;
    const uiBinding=uiDocument.graph.bindings.find(row=>row.step==='map_integer');check(uiBinding.source_kind==='REQUEST'&&uiBinding.source_path==='/lines/0/note'&&uiBinding.ordinal===0,'Actual UI produced the indexed canonical request binding');check(JSON.stringify(uiDocument.graph.transitions)===JSON.stringify(editable.transitions),'Actual mapping did not change control edges');check((await http('/api/v1/workflows/validate',uiDocument.graph)).data.valid===true,'Actual server validates UI-produced mapping');
    await click('Reload',board());await wait(()=>!board().querySelector('.board-node.selected'),'Mapping reload settled');board().querySelector('.board-node[data-node-key="map_integer"] .node-handle').click();await wait(()=>connections()?.textContent.includes('/lines/0/note'),'Actual indexed mapping reopened');
    await record('APP-FE-023.2 actual authorized completion and indexed collection field controls, positive server validation and exact current-reference WIP save/reopen without JSON');
    const savedWorkspace=(await http(authoredPath,undefined,'GET')).data;
    authored=(await http('/api/v1/workflow-versions/'+encodeURIComponent(savedWorkspace.workflow_version_ref_id)+'/workspace/promote',{workspace_ref_id:savedWorkspace.workspace_ref_id})).data;
    authored=(await http('/api/v1/workflow-versions/'+encodeURIComponent(authored.ref_id)+'/publish',{})).data;
    const draft=(await http('/api/v1/business-requests',{request_type_ref_id:mappingType.ref_id,data:{amount:'17',lines:[{note:'42'}]}})).data;
    const submitted=(await http('/api/v1/business-requests/'+encodeURIComponent(draft.ref_id)+'/submit',{submit_key:'owned-mapper-runtime'})).data;check(submitted.process_ref_id,'Real mapped process created');
    const process=(await http('/api/v1/processes/'+encodeURIComponent(submitted.process_ref_id),undefined,'GET')).data;check(process.status==='COMPLETED'&&!process.last_error_code,'Indexed source and composed transforms actually complete');check(process.workflow_version_ref_id===authored.ref_id,'Process pins the exact UI-authored published mapping');
    const timeline=(await http('/api/v1/processes/'+encodeURIComponent(submitted.process_ref_id)+'/timeline',{})).data;
    for(const key of ['map_integer','map_string'])check(timeline.steps.find(row=>row.step_key===key)?.executions.some(row=>row.status==='COMPLETED'),'Recorded transform execution '+key);
    await record('APP-FE-023.2 actual UI-authored indexed mapping, exact transform v2 contracts, composed conversion publication and completed pinned process on owned disposable services');
    let nestedVersion=(await http('/api/v1/workflow-versions',{workflow_ref_id:root.ref_id,number:3})).data;
    const objectSchema={type:'object',properties:{value:{}},additionalProperties:false};
    const nestedGraph={steps:[{key:'start',type_code:start.code,type_version_ref:start.ref_id,config:{}},{key:'object_value',type_code:transform.code,type_version_ref:transform.ref_id,config:{conversion_key:'object',projection:{value:'/value'}}},{key:'string_value',type_code:transform.code,type_version_ref:transform.ref_id,config:{conversion_key:'string'}},{key:'integer_value',type_code:transform.code,type_version_ref:transform.ref_id,config:{conversion_key:'integer'}},{key:'finish',type_code:finish.code,type_version_ref:finish.ref_id,config:{}}],transitions:[{source:'start',target:'object_value',outcome:'next',is_default:true},{source:'object_value',target:'string_value',outcome:'next',is_default:true},{source:'string_value',target:'integer_value',outcome:'next',is_default:true},{source:'integer_value',target:'finish',outcome:'next',is_default:true}],bindings:[{step:'object_value',target_port:'value',target_schema:{type:'object'},source_kind:'CONSTANT',constant_value:{value:'42'},ordinal:0},{step:'string_value',target_port:'value',target_schema:{},source_kind:'CONSTANT',constant_value:'17',ordinal:0},{step:'integer_value',target_port:'value',target_schema:integerSchema,source_kind:'STEP_OUTPUT',source_step:'string_value',source_port:'result',source_schema:{type:'string'},ordinal:0}],targets:[]};
    nestedVersion=(await http('/api/v1/workflow-versions/'+encodeURIComponent(nestedVersion.ref_id)+'/graph',nestedGraph,'PUT')).data;
    const nestedPath='/api/v1/workflow-versions/'+encodeURIComponent(nestedVersion.ref_id)+'/workspace';
    await http(nestedPath,{document:{dialect:'bpms.workspace/1',graph:nestedGraph,positions:Object.fromEntries(nestedGraph.steps.map((step,index)=>[step.key,{x:index*320,y:40}])),viewport:{x:0,y:0,zoom:1},collapsed:[],routing:{}},workspace_ref_id:null},'PUT');
    await go('/studio/workflow-versions/'+encodeURIComponent(nestedVersion.ref_id)+'/edit','app-workflow-board');
    await wait(()=>board().querySelector('.board-node[data-node-key="string_value"] .data-port'),'Nested mapping ports');
    board().querySelector('.board-node[data-node-key="string_value"] .node-handle').click();await wait(()=>connections()?.querySelector('app-mapping-list button'),'Nested mapper opened');
    const nestedMapper=connections();nestedMapper.querySelector('details summary').click();const nestedPicker=nestedMapper.querySelector('app-studio-choice');fill('mapping-request-search',mappingType.name);await click('Find references',nestedPicker);await choose('Selected resource',mappingType.name,nestedPicker);await click('Binding suggestions',nestedMapper);await wait(()=>button('Binding suggestions',nestedMapper),'Authorized prior-output completion');await click('Edit data mapping',nestedMapper);
    await choose('Source port','steps.object_value.outputs.result › value · Any value',nestedMapper);await click('Update data mapping',nestedMapper);await save();
    const nestedWorkspace=(await http(nestedPath,undefined,'GET')).data;const nestedBinding=nestedWorkspace.document.graph.bindings.find(row=>row.step==='string_value');
    check(nestedBinding.source_kind==='STEP_OUTPUT'&&nestedBinding.source_path==='/value'&&JSON.stringify(nestedBinding.source_schema)===JSON.stringify(objectSchema),'UI retains nested pointer and exact pinned root schema');
    check((await http('/api/v1/workflows/validate',nestedWorkspace.document.graph)).data.valid,'Actual nested graph validation');
    nestedVersion=(await http('/api/v1/workflow-versions/'+encodeURIComponent(nestedWorkspace.workflow_version_ref_id)+'/workspace/promote',{workspace_ref_id:nestedWorkspace.workspace_ref_id})).data;
    nestedVersion=(await http('/api/v1/workflow-versions/'+encodeURIComponent(nestedVersion.ref_id)+'/publish',{})).data;
    const nestedDraft=(await http('/api/v1/business-requests',{request_type_ref_id:mappingType.ref_id,data:{amount:'17',lines:[]}})).data;
    const nestedSubmitted=(await http('/api/v1/business-requests/'+encodeURIComponent(nestedDraft.ref_id)+'/submit',{submit_key:'owned-nested-output-runtime'})).data;
    const nestedProcess=(await http('/api/v1/processes/'+encodeURIComponent(nestedSubmitted.process_ref_id),undefined,'GET')).data;
    check(nestedProcess.status==='COMPLETED'&&!nestedProcess.last_error_code&&nestedProcess.workflow_version_ref_id===nestedVersion.ref_id,'Actual nested scalar reaches integer conversion; whole-object substitution would fail');
    const priorProcess=(await http('/api/v1/processes/'+encodeURIComponent(submitted.process_ref_id),undefined,'GET')).data;check(priorProcess.workflow_version_ref_id===authored.ref_id&&priorProcess.status==='COMPLETED','Prior published process pin is unchanged');
    await record('APP-FE-023 actual UI-authored nested STEP_OUTPUT selection, exact schema, promotion/publication and completed conversion with unchanged prior pin');
    await click('Sign out');await login(0);
    await go('/studio/workflow-versions/'+encodeURIComponent(version.ref_id)+'/edit','app-workflow-board');await select('owned_service');
  }
`;
}
