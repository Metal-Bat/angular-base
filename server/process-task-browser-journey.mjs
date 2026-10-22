/** Adds scoped real-service task commands to the existing isolated authoring journey. */
export function processTaskBrowserJourney() {
  return String.raw`
  const taskPanel=()=>document.querySelector('app-advanced-task');
  const taskCurrent=async()=>(await http('/api/v1/work-items/'+encodeURIComponent(claimed.ref_id),undefined,'GET')).data;
  const taskMenu=async(label)=>{await click('More task actions',taskPanel());const target=()=>[...document.querySelectorAll('.p-menu [role=menuitem]')].find(row=>row.textContent.trim()===label&&row.getAttribute('aria-disabled')!=='true'&&row.getClientRects().length>0);await wait(target,'Actual task command '+label);(target().querySelector('a')??target()).click();await new Promise(resolve=>setTimeout(resolve,75));};
  await taskMenu('Mark read');await wait(()=>button('More task actions',taskPanel()),'Actual read command acknowledged');
  const waitTask=async(predicate,label)=>{for(const end=Date.now()+15000;Date.now()<end;){const current=await taskCurrent();if(predicate(current))return current;await new Promise(resolve=>setTimeout(resolve,50));}throw Error('Timed out: '+label);};
  let taskState=await waitTask(row=>!!row.read_at,'Actual read acknowledgement');check(taskState.read_at&&taskState.status==='CLAIMED','Actual read state without business decision');
  await taskMenu('Pin');await wait(()=>button('More task actions',taskPanel()),'Actual pin command acknowledged');
  taskState=await waitTask(row=>!!row.pinned_at,'Actual pin acknowledgement');check(taskState.pinned_at&&taskState.status==='CLAIMED','Actual personal pin persists without decision');
  await taskMenu('Add comment');const taskDialog=()=>[...document.querySelectorAll('[role=dialog]')].find(row=>row.textContent.includes('Post comment'));
  await wait(()=>taskDialog()?.querySelector('#additional-comment'),'Actual focused comment dialog');fill('additional-comment','Owned task command acceptance');await click('Post comment',taskDialog());await wait(()=>!taskDialog(),'Actual comment acknowledged');
  taskState=await taskCurrent();check(taskState.status==='CLAIMED'&&taskState.claimant_ref_id===claimed.claimant_ref_id,'Comment preserves actual claimant and pending human decision');
  check(!document.querySelector('app-advanced-task pre')&&!document.querySelector('#forward-user')&&!document.querySelector('#forward-group'),'Ordinary task commands have no JSON or copied references');
  await record('APP-FE-029 actual read/pin/comment persistence through focused controls, current refs and no human decision');
  await taskMenu('Forward task');const forwardDialog=()=>[...document.querySelectorAll('[role=dialog]')].find(row=>row.textContent.includes('Choose an authorized recipient.'));
  await wait(forwardDialog,'Actual forwarding dialog');check(button('Choose user',forwardDialog())&&![...forwardDialog().querySelectorAll('button')].some(row=>row.textContent.trim()==='Forward'&&!row.disabled),'Forward requires a named recipient and reason');
  await click('Choose user',forwardDialog());await wait(()=>document.querySelector('app-reference-picker [role=alert]'),'Ordinary reviewer selector safely denied');check(document.querySelector('app-reference-picker [role=alert]').textContent.includes('No permitted operations.'),'No fabricated directory authority');
  await click('Close',document.querySelector('app-reference-picker [role=dialog]'));await click('Cancel',forwardDialog());
  taskState=await taskCurrent();check(taskState.status==='CLAIMED','Opening/cancelling forwarding does not transfer or decide');
  await record('APP-FE-029 actual ordinary-reviewer forwarding selector denial and cancellation without copied IDs or broader process access');
`;
}
