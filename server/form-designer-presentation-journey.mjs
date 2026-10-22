/** Reopened form defects through real preview HTTP; all answers remain synthetic. */
export function formDesignerPresentationJourney() {
  return `
  const root=(await http('/api/v1/forms',{code:'owned-display-features',name:'Owned display features'})).data;
  const documents={data_schema:{type:'object',properties:{notes:{type:'string'},rows:{type:'array',minItems:1,maxItems:2,items:{type:'object',properties:{title:{type:'string'}}}}}},render_schema:{dialect:'bpms.render/1',root:{component:'vertical',node_key:'root',children:[{component:'textarea',node_key:'notes',label:'Notes',scope:'/properties/notes',options:{rows:8,placeholder:'Explain the request'}},{component:'table',node_key:'rows',label:'Line items',scope:'/properties/rows',children:[{component:'text',node_key:'title',label:'Title',scope:'/properties/rows/items/properties/title'}]}]}}};
  const version=(await http('/api/v1/form-versions',{...documents,form_ref_id:root.ref_id,number:1})).data;
  await go('/studio/form-versions/'+encodeURIComponent(version.ref_id)+'/edit','app-form-builder');await click('Focus mode');await click('Preview',editor());
  const preview=()=>editor().querySelector('app-form-live-preview');
  const ready=async()=>{await new Promise(r=>setTimeout(r,75));await wait(()=>preview()?.querySelector('.preview-freshness')?.textContent.trim()==='Up to date','Actual preview fresh');};
  await ready();
  const notes=()=>preview().querySelector('app-runtime-form textarea');check(notes().rows===8&&notes().placeholder==='Explain the request','Configured textarea presentation');notes().value='Retained sample';notes().dispatchEvent(new Event('input',{bubbles:true}));await ready();
  await click('Add row',preview());await ready();
  const table=()=>preview().querySelector('table[aria-label="Line items"]');
  await wait(()=>table()?.querySelector('tbody input'),'Actual table first row');check([...table().querySelectorAll('thead th')].some(el=>el.textContent.trim()==='Title'),'Semantic original table column');
  const key=table().querySelector('tbody tr').dataset.rowKey;
  let title=table().querySelector('tbody input');title.value='First sample';title.dispatchEvent(new Event('input',{bubbles:true}));await ready();
  check([...table().querySelectorAll('button')].find(el=>el.title==='Remove row').disabled,'Canonical minimum enforced');
  await click('Add row',preview());await ready();check([...preview().querySelectorAll('button')].find(el=>el.textContent.trim()==='Add row').disabled,'Canonical maximum enforced');
  let rows=table().querySelectorAll('tbody tr');rows[1].querySelector('button[title="Move up"]').click();await ready();check(table().querySelectorAll('tbody tr')[1].dataset.rowKey===key,'Moved sample retains exact UUID identity');
  table().querySelector('tbody tr button[title="Remove row"]').click();await ready();table().querySelector('button[title="Duplicate row"]').click();await ready();
  check([...table().querySelectorAll('tbody input')].every(el=>el.value==='First sample'),'Duplicate preserves canonical sample');check(table().querySelectorAll('tbody tr')[1].dataset.rowKey!==key,'Duplicate receives a fresh preview identity');check(notes().value==='Retained sample','Unrelated answer retained');
  await record('APP-FE-016/019 actual textarea configuration, semantic table, row bounds, moves and duplicate identities');
  const sampleKeys=[...table().querySelectorAll('tbody tr')].map(row=>row.dataset.rowKey);
  preview().querySelector('app-form-preview-context summary').click();
  await click('Use current sample as prior values',preview());await ready();
  check(preview().querySelector('#prior-sample-notes')?.value==='Retained sample','Prior values use typed sample fields');
  preview().querySelector('#preview-simulated-policy').click();await ready();
  check(!preview().querySelector('[role=alert]:not([hidden])'),'Actual policy accepts only read/write/required/hidden keys');
  await choose('Purpose','Correction',preview());await ready();
  const priorDetails=[...preview().querySelectorAll('app-runtime-form details')].find(item=>item.querySelector('summary')?.textContent.trim()==='Previous submission');
  check(priorDetails,'Prior submission fields are available');priorDetails.querySelector('summary').click();await wait(()=>priorDetails.textContent.includes('First sample'),'Readable prior collection rows');
  check(priorDetails.textContent.includes('Notes')&&priorDetails.textContent.includes('Title'),'Prior captions use resolved field meaning');
  check(!priorDetails.textContent.includes('/properties/')&&!priorDetails.textContent.includes('{')&&!priorDetails.textContent.includes('['),'Prior values have no pointers or JSON serialization');

  check([...table().querySelectorAll('tbody tr')].map(row=>row.dataset.rowKey).join('|')===sampleKeys.join('|'),'Prior snapshot and policy retain stable current row keys');
  check(!editor().querySelector('pre,textarea.font-mono,#node-json,#schema-json,#behavior-json,#sample-json,#preview-context'),'No form document editors or JSON dumps remain');
  await choose('Purpose','Entry',preview());await ready();
  await record('APP-FE-019 actual typed simulated permissions and prior correction values preserve row identities without JSON controls');
  await go('/studio/form-versions?selected='+encodeURIComponent(version.ref_id),'app-resource-catalog');await wait(()=>[...document.querySelectorAll('[role=tab]')].some(el=>el.textContent.trim()==='Display'),'Display tab');[...document.querySelectorAll('[role=tab]')].find(el=>el.textContent.trim()==='Display').click();
  const display=()=>document.querySelector('app-form-display');await wait(()=>display()&&button('Add row',display()),'Separate display collection adapter');await click('Add row',display());await wait(()=>display().querySelector('tbody input'),'Display first row');title=display().querySelector('tbody input');title.value='Display sample';title.dispatchEvent(new Event('input',{bubbles:true}));
  const displayKey=display().querySelector('tbody tr').dataset.rowKey;
  await choose('Form view','Summary',display());await wait(()=>display().textContent.includes('Display sample')&&!button('Add row',display()),'Readonly summary');
  await choose('Form view','Entry form',display());await wait(()=>display().querySelector('tbody input')?.value==='Display sample','Display answer retained');check(display().querySelector('tbody tr').dataset.rowKey===displayKey,'Display refresh preserves identity');await click('Duplicate row',display());await wait(()=>display().querySelectorAll('tbody input').length===2,'Display local duplicate');
  await record('APP-FE-019 actual separate Display page entry/summary round-trip and local collection operations');
  const ordered=value=>Array.isArray(value)?value.map(ordered):value&&typeof value==='object'?Object.fromEntries(Object.entries(value).sort(([a],[b])=>a.localeCompare(b)).map(([key,item])=>[key,ordered(item)])):value;
  const saved=(await http('/api/v1/form-versions/'+encodeURIComponent(version.ref_id),undefined,'GET')).data;check(JSON.stringify(ordered(saved.data_schema))===JSON.stringify(ordered(documents.data_schema))&&JSON.stringify(ordered(saved.render_schema))===JSON.stringify(ordered(documents.render_schema)),'Samples never alter authored documents');
  await record('APP-FE-016/019 actual reopened document remains unchanged after synthetic row editing');
`;
}
