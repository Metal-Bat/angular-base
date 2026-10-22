/** Existing owned full-foundations helpers; actual HTTP, never fixture acceptance. */
export function sharedUserRecoveryJourney() {
  return String.raw`
  const sharedUserRef=new URL(location.href).searchParams.get('selected');
  check(sharedUserRef,'Owned current user selection');
  const sharedUserRead=await fetch('/api/v1/admin/users/'+encodeURIComponent(sharedUserRef));
  check(sharedUserRead.ok,'Owned current user read');
  const sharedUser=(await sharedUserRead.json()).data;
  await click('Update User',actualUsers());
  await wait(()=>document.getElementById('record-first_name'),'Owned competing user editor');
  fill('record-first_name','Owned recovered identity');
  const sharedCompeting=await fetch('/api/v1/admin/users/'+encodeURIComponent(sharedUserRef),{
    method:'PUT',headers:{'content-type':'application/json','x-csrf-token':operatorSession.csrfToken},
    body:JSON.stringify({ref_id:sharedUserRef,username:sharedUser.username,email:sharedUser.email,
      first_name:'Owned concurrent identity',last_name:sharedUser.last_name})
  });
  check(sharedCompeting.ok,'Owned competing user update');
  const sharedConcurrent=(await sharedCompeting.json()).data;
  await click('Save',recordsDialog());await confirm();
  await wait(()=>document.querySelector('app-record-recovery h3'),'Actual stale user recovery');
  check(document.getElementById('record-first_name').value==='Owned recovered identity','Stale user draft retained');
  check(!button('Save',recordsDialog()),'Actual stale user save fenced');
  await click('Inspect current record',document.querySelector('app-record-recovery'));
  await wait(()=>document.querySelector('app-record-recovery')?.textContent.includes('Owned concurrent identity'),
    'Actual current record comparison');
  await click('Use current revision and keep my edits',document.querySelector('app-record-recovery'));
  await wait(()=>!document.querySelector('app-record-recovery section')&&!document.querySelector('dialog[open]')&&
    document.activeElement?.id==='record-editor-save','Internal revision navigation preserves focus and draft');
  check(document.getElementById('record-first_name').value==='Owned recovered identity','Reapply keeps explicit user intent');
  const sharedBeforeSave=await fetch('/api/v1/admin/users/'+encodeURIComponent(sharedConcurrent.ref_id));
  check(sharedBeforeSave.ok&&(await sharedBeforeSave.json()).data.first_name==='Owned concurrent identity',
    'Inspection and revision selection do not write');
  await click('Save',recordsDialog());await confirm();
  await wait(()=>!recordsDialog()&&actualUsers().querySelector('app-record-summary')?.textContent.includes('Owned recovered identity'),
    'Actual deliberate current-reference reapply');
  await record('APP-FE-007 actual competing user edit, readable comparison, no inspection write and deliberate current-ref recovery');
`;
}

export function sharedListQueryJourney() {
  return String.raw`
  await go('/operations/requests','app-request-list');
  const sharedRequests=()=>document.querySelector('app-request-list');
  await wait(()=>button('Advanced filters',sharedRequests())&&sharedRequests().querySelector('app-case-list'),
    'Actual operational request list');
  await click('Advanced filters',sharedRequests());await click('Add filter',sharedRequests());
  const sharedFilter=()=>sharedRequests().querySelector('app-list-query input[data-query-value="0"]');
  await wait(sharedFilter,'Actual typed request filter');
  sharedFilter().value='DRAFT';sharedFilter().dispatchEvent(new Event('input',{bubbles:true}));
  await new Promise(resolve=>setTimeout(resolve,75));
  await click('Apply',sharedRequests().querySelector('app-list-query'));
  await wait(()=>sharedRequests().querySelector('.applied-summary')?.textContent.includes('DRAFT')&&
    sharedRequests().querySelector('app-case-list')&&!sharedRequests().querySelector('[role=alert]')&&
    !sharedRequests().textContent.includes('Loading…'),'Actual request SearchRequest accepted');
  check(!sharedRequests().querySelector('app-list-query textarea'),'Request query has no JSON console');
  await record('APP-FE-028 actual typed request filter and confirmed operational list');
  await go('/operations/tasks','app-task-inbox');
  const sharedTasks=()=>document.querySelector('app-task-inbox');
  await wait(()=>sharedTasks().querySelector('app-case-list')&&!sharedTasks().textContent.includes('Loading…'),
    'Actual cartable loaded');
  const sharedTaskQuery=sharedTasks().querySelector('app-task-list-query');
  const sharedToggle=sharedTaskQuery.querySelector('[aria-label="Filters"]');
  check(sharedToggle,'Named task filter toggle');sharedToggle.click();
  await wait(()=>document.getElementById('task-filter-size')?.getClientRects().length,'Task filter fields visible');
  await choose('Status','OPEN',sharedTaskQuery);
  fill('task-filter-size','35');await new Promise(resolve=>setTimeout(resolve,75));
  await click('Apply',sharedTaskQuery);
  await wait(()=>sharedTasks().querySelector('app-case-list')&&!sharedTasks().querySelector('[role=alert]')&&
    !sharedTasks().textContent.includes('Loading…'),'Actual bounded CartableQueryDTO accepted');
  check(document.getElementById('task-filter-size').value==='35','Confirmed task page size retained');
  check(!sharedTaskQuery.querySelector('textarea'),'Task query has no JSON or unsupported sort console');
  await record('APP-FE-029 actual typed queue/status/page-size query without SearchRequest fields');
`;
}

export function sharedWorkflowAccessJourney() {
  return String.raw`
  const sharedAccessUserRef=new URL(location.href).searchParams.get('selected');
  check(sharedAccessUserRef,'Owned grant recipient remains selected');
  const sharedVersionResponse=await fetch('/api/v1/workflow-versions/'+encodeURIComponent(workflow.result.items[0].key));
  check(sharedVersionResponse.ok,'Actual published workflow read for parent context');
  const sharedPinnedVersion=(await sharedVersionResponse.json()).data;
  const sharedWorkflowRef=sharedPinnedVersion.workflow_ref_id;
  check(typeof sharedWorkflowRef==='string','Authorized workflow parent reference');
  await go('/studio/workflows?selected='+encodeURIComponent(sharedWorkflowRef),'app-resource-catalog');
  const sharedAccessHeader=()=>document.querySelector('app-catalog-header');
  await click('Access',sharedAccessHeader());
  const sharedAccessDialog=()=>document.querySelector('[role=dialog]:has(app-catalog-grant-list)');
  await wait(()=>sharedAccessDialog()&&document.getElementById('access-recipient-search'),'Actual typed Access dialog');
  check(!sharedAccessDialog().querySelector('pre,textarea,#grant-reference'),'No access JSON or copied-reference workflow');
  fill('access-recipient-search','owned-ordered-user');
  await click('Find references',sharedAccessDialog());
  await choose('Selected resource','owned-ordered-user',sharedAccessDialog());
  await click('Add grant',sharedAccessDialog());
  await wait(()=>document.querySelector('dialog[open]'),'Actual grant approval required');
  await click('Cancel',document.querySelector('dialog[open]'));
  await click('Add grant',sharedAccessDialog());await confirm();
  const sharedGrantRow=()=>[...sharedAccessDialog().querySelectorAll('tbody tr')].find(row=>row.textContent.includes('owned-ordered-user'));
  await wait(()=>sharedGrantRow()&&button('Revoke grant',sharedGrantRow()),'Actual named grant and exact rights');
  check(sharedGrantRow().textContent.includes('Yes')&&sharedGrantRow().textContent.includes('No'),'View true / Start false remain separate');
  check(!sharedAccessDialog().textContent.includes(sharedAccessUserRef),'Recipient reference stays private to the picker');
  await click('Revoke grant',sharedGrantRow());
  await wait(()=>document.querySelector('dialog[open]'),'Actual revoke approval required');
  await click('Cancel',document.querySelector('dialog[open]'));
  check(sharedGrantRow(),'Cancel preserves the exact grant');
  await click('Revoke grant',sharedGrantRow());await confirm();
  await wait(()=>!sharedGrantRow(),'Actual exact grant removed');
  await click('Close',sharedAccessDialog().querySelector('form'));
  await wait(()=>!sharedAccessDialog(),'Actual Access dialog closed');
  const sharedUnchangedVersion=await fetch('/api/v1/workflow-versions/'+encodeURIComponent(workflow.result.items[0].key));
  check(sharedUnchangedVersion.ok&&JSON.stringify((await sharedUnchangedVersion.json()).data.graph)===JSON.stringify(sharedPinnedVersion.graph),
    'Access changes never rewrite the published workflow graph');
  await record('APP-FE-031 actual named workflow Access, explicit add/revoke confirmations, unchanged parent and immutable version');
  await go('/users?selected='+encodeURIComponent(sharedAccessUserRef),'app-resource-page');
  await wait(()=>document.querySelector('app-record-detail')?.textContent.includes('Owned recovered identity'),
    'Owned current user restored for guarded deletion');
`;
}
