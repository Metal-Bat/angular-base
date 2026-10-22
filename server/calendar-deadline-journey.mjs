/** Derived deadlines reuse the actual workflow/task and Calendar owners. */
export function calendarDeadlineJourney() {
  return `
  {
    await click('Sign out');await login(accounts.users.length-1);
    const kind=(await api('/api/v1/request-types/'+encodeURIComponent(accounts.request_type))).data;
    const versions=(await api('/api/v1/workflow-versions/search','POST',{workflow_ref_id:kind.workflow_ref_id,page:1,size:100,filters:[],sort_orders:[]})).result.items;
    const published=versions.find(row=>row.status==='PUBLISHED');check(published,'Owned deadline workflow');
    const graph=(await api('/api/v1/workflow-versions/'+encodeURIComponent(published.ref_id)+'/graph')).data;
    const review=graph.steps.find(step=>step.key==='review');check(review,'Owned deadline human task');
    let successor=(await api('/api/v1/workflow-versions','POST',{workflow_ref_id:kind.workflow_ref_id,number:Math.max(...versions.map(row=>row.number))+1})).data;
    successor=(await api('/api/v1/workflow-versions/'+encodeURIComponent(successor.ref_id)+'/graph','PUT',{...graph,steps:graph.steps.map(step=>step.key===review.key?{...step,timeout_seconds:3600}:step)})).data;
    successor=(await api('/api/v1/workflow-versions/'+encodeURIComponent(successor.ref_id)+'/publish','POST',{})).data;
    await click('Sign out');await login(0);
    const draft=(await api('/api/v1/business-requests','POST',{request_type_ref_id:accounts.request_type,data:{amount:'17',summary:'Owned calendar deadline',lines:[]}})).data;
    const submitted=(await api('/api/v1/business-requests/'+encodeURIComponent(draft.ref_id)+'/submit','POST',{submit_key:'owned-calendar-deadline'})).data;
    check(submitted.workflow_version_ref_id===successor.ref_id,'Deadline request pins the new published version');
    await click('Sign out');await login(1);
    const item=(await api('/api/v1/work-items/search','POST',{cartable:'available',page:1,size:100})).result.items.find(row=>row.request_ref_id===submitted.ref_id);check(item?.due_at,'Actual workflow deadline');
    await userTimezone('UTC','/operations/calendar','app-calendar-page');document.querySelector('app-calendar-page .calendar-settings summary').click();fill('calendar-date',item.due_at.slice(0,10));
    const day=item.due_at.slice(0,10);const end=new Date(Date.parse(day+'T00:00:00Z')+86400000).toISOString().slice(0,10);
    const deadline=(await api('/api/v1/calendar/events/search','POST',{start_date:day,end_date:end,timezone:'UTC',include_work_deadlines:true,page:1,size:100})).result.items.find(row=>row.source_kind==='work_item'&&row.ref_id===item.ref_id);check(deadline,'Authorized derived Calendar entry');
    await wait(()=>button(deadline.title,document.querySelector('app-calendar-views')),'Actual derived deadline visible');await inspectCalendar(deadline.title);
    check(calendarDetails().querySelector('a[href="/operations/tasks/'+encodeURIComponent(item.ref_id)+'"]'),'Deadline opens the actual task');check(!button('Edit',calendarDetails())&&!button('Delete',calendarDetails()),'Workflow deadline cannot be edited or deleted as a personal event');
    await click('Work reminders',calendarDetails());await wait(()=>document.querySelector('app-work-reminders time'),'Purposeful work reminder controls');check(document.querySelector('app-work-reminders').textContent.includes('Workflow deadlines are read-only.'),'Deadline immutable guidance');
    await click('Save reminders',document.querySelector('app-work-reminders'));await wait(()=>document.querySelector('app-work-reminders li')?.textContent.includes('PENDING'),'Actual task reminder saved');
    const configured=(await api('/api/v1/calendar/work-reminders/'+encodeURIComponent(item.ref_id))).data;check(configured.length===1&&configured[0].status==='PENDING','One actual deadline reminder');
    await record('APP-FE-014 actual published workflow deadline, authorized Calendar projection, task link, read-only controls and reminder configuration');
    await go('/operations/tasks/'+encodeURIComponent(item.ref_id),'app-case-detail');await wait(()=>document.querySelector('app-task-controls')&&button('Claim',document.querySelector('app-task-controls')),'Deadline task claim');await click('Claim',document.querySelector('app-task-controls'));await wait(()=>document.querySelector('app-task-controls')&&button('Approve',document.querySelector('app-task-controls')),'Claimed deadline task');await click('Approve',document.querySelector('app-task-controls'));await confirm();await wait(()=>document.querySelector('.console-record-status')?.textContent.trim()==='COMPLETED','Deadline task completed');
    const remaining=(await api('/api/v1/calendar/events/search','POST',{start_date:day,end_date:end,timezone:'UTC',include_work_deadlines:true,page:1,size:100})).result.items;check(!remaining.some(row=>row.source_kind==='work_item'&&row.ref_id===item.ref_id),'Closed task leaves live Calendar projection');
    const closedRead=await fetch('/api/v1/calendar/work-reminders/'+encodeURIComponent(item.ref_id));check(closedRead.status===404,'Closed task no longer grants reminder access');const cancelled=await action('deadline');check(cancelled.completed&&cancelled.cancelled===1&&cancelled.pending===0,'Task completion cancels its pending reminder');
    await go('/operations/calendar','app-calendar-page');await record('APP-FE-014 actual task completion removes derived deadline and cancels its single reminder');
  }
`;
}
