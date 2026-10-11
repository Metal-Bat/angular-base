export function notificationBrowserJourney(credentials) {
  return `
(async()=>{
 const accounts=${JSON.stringify(credentials).replaceAll("<", "\\u003c")};
 const wait=async(predicate,name)=>{for(let i=0;i<800;i++){if(predicate())return;await new Promise(r=>setTimeout(r,25));}throw Error('Timed out: '+name);};
 const check=(value,message)=>{if(!value)throw Error(message);};
 const button=(label,root=document)=>[...root.querySelectorAll('button')].find(el=>el.textContent.trim()===label&&!el.disabled);
 const click=async(label,root=document)=>{await wait(()=>button(label,root),label);button(label,root).click();};
 const fill=(id,value)=>{const input=document.getElementById(id);check(input,'Missing '+id);input.value=value;input.dispatchEvent(new Event('input',{bubbles:true}));};
 const login=async(actor)=>{await wait(()=>document.querySelector('#username'),'login');fill('username',accounts.users[actor]);fill('password',accounts.password);document.querySelector('form').dispatchEvent(new Event('submit',{bubbles:true,cancelable:true}));await wait(()=>document.querySelector('a[href="/operations/tasks"]'),'signed in');};
 const language=async(value)=>{
  const picker=document.querySelector('[data-language-picker]'),control=picker.querySelector('[role="combobox"]');
  const option=[...picker.querySelector('select').options].find(row=>row.value===value);
  control.focus();control.click();await wait(()=>control.getAttribute('aria-expanded')==='true','language choices');
  const popup=()=>document.getElementById(control.getAttribute('aria-controls'));
  await wait(()=>popup()?.querySelector('[role="option"][aria-label="'+option.textContent.trim()+'"]'),'language option');
  popup().querySelector('[role="option"][aria-label="'+option.textContent.trim()+'"]').click();
  await wait(()=>document.documentElement.lang===value&&control.getAttribute('aria-expanded')==='false','language applied');
 };
 const dark=async()=>{
  const control=document.querySelector('[data-theme-picker] [role="combobox"]');control.click();
  const popup=()=>document.getElementById(control.getAttribute('aria-controls'));
  await wait(()=>popup()?.querySelector('[data-theme-option="blue-dark"]'),'theme options');
  popup().querySelector('[data-theme-option="blue-dark"]').closest('[role="option"]').click();
  await wait(()=>document.documentElement.classList.contains('app-dark')&&control.getAttribute('aria-expanded')==='false','theme saved');
 };
 const alerts=()=>document.querySelectorAll('.notification-alerts p-message');
 const count=()=>Number(document.querySelector('[data-notification-count]')?.textContent||0);
 const action=async(name)=>{const response=await fetch('/__notification-action/'+name,{method:'POST'});check(response.ok,'Owned producer '+name);};
 try{
  await login(1);document.querySelector('a[href="/operations/tasks"]').click();await wait(()=>document.querySelector('app-task-inbox'),'task inbox');
  await wait(()=>window.liveEvidence.resync>0,'actual initial resync');
  await new Promise(r=>setTimeout(r,500));check(alerts().length===0,'Historical unread created popup');const before=count();
  await language('fa');await dark();await action('account');await wait(()=>count()>before&&alerts().length===1,'actual worker pushed account notification');
  check(document.documentElement.dir==='rtl'&&/[\u0600-\u06ff]/.test(alerts()[0].textContent),'Farsi live notification/RTL');
  check(window.liveEvidence.changed>0,'No actual SSE changed event');
  const subject=alerts()[0].textContent;await action('duplicate');await new Promise(r=>setTimeout(r,500));check(alerts().length===1,'Duplicate popup');
  await language('en');
  const popup=alerts()[0];check(popup.querySelector('button').tabIndex===0,'Dismiss keyboard access');popup.querySelector('button').click();await wait(()=>alerts().length===0,'dismiss notification');
  const bell=document.querySelector('button[aria-label="Notifications"]');bell.click();await wait(()=>document.querySelector('#notification-panel a[href*="notification="]'),'recent notifications');
  check(document.querySelector('#notification-panel').textContent.includes(subject.trim()),'Recent list missing new subject');bell.click();
  const priorTasks=document.querySelectorAll('app-task-inbox a[href*="/operations/tasks/"]').length;
  await action('task');await wait(()=>document.querySelectorAll('app-task-inbox a[href*="/operations/tasks/"]').length>priorTasks,'cartable invalidation');
  check(document.querySelector('#inbox-view').textContent==='available','Cartable filter changed');
  bell.click();await wait(()=>document.querySelector('#notification-panel a[href*="notification="]'),'open notification');document.querySelector('#notification-panel a[href*="notification="]').click();
  await wait(()=>document.querySelector('app-personal-service-detail h2'),'inbox detail');check(button('Mark read'),'Opening did not mark read');
  fill('notification-search','unsaved filter');const detail=document.querySelector('app-personal-service-detail h2').textContent;
  await action('account');await wait(()=>alerts().length>0,'second live notification');check(document.getElementById('notification-search').value==='unsaved filter','Unsaved filter discarded');check(document.querySelector('app-personal-service-detail h2').textContent===detail,'Open detail discarded');
  await click('Mark read');await wait(()=>document.querySelector('app-personal-service-detail button')&&!button('Mark read'),'explicit metadata read');
  while(alerts().length){alerts()[0].querySelector('button').click();await new Promise(r=>setTimeout(r,50));}
  const offlineCount=count(),resyncs=window.liveEvidence.resync;await action('offline');await action('account');
  check(alerts().length===0,'Offline history alerted');await action('online');
  await wait(()=>window.liveEvidence.resync>resyncs&&count()>offlineCount,'offline persisted reconciliation');
  check(alerts().length===0,'Offline unread replayed as popup');
  check(document.documentElement.classList.contains('app-dark'),'Notification update changed theme');
  const existingAlerts=alerts().length;await new Promise(r=>setTimeout(r,500));check(alerts().length===existingAlerts,'Reconnect replayed unread');
  await click('Open',document.querySelector('app-personal-service-detail'));await wait(()=>document.querySelector('app-case-detail'),'current authorized destination');
  await wait(()=>button('Claim'),'unclaimed task destination loaded');
  await click('Sign out');await wait(()=>document.querySelector('#username'),'logout');check(alerts().length===0&&!document.querySelector('[data-notification-count]'),'Old actor UI retained');
  await login(0);await wait(()=>window.liveEvidence.connections>=3,'second actor stream');await new Promise(r=>setTimeout(r,700));check(alerts().length===0,'New actor replayed history');
  check(localStorage.length===0&&sessionStorage.length===0,'Browser storage contains private state');
  await click('Sign out');await action('cleanup');
  await fetch('/__result',{method:'POST',body:JSON.stringify({ok:true,diagnostics:window.fixtureDiagnostics,live:window.liveEvidence})});
 }catch(error){await fetch('/__result',{method:'POST',body:JSON.stringify({ok:false,error:error.message,diagnostics:window.fixtureDiagnostics,live:window.liveEvidence})});}
})();`;
}
export const liveObservationScript = `
window.liveEvidence={connections:0,changed:0,resync:0};
const NativeEventSource=window.EventSource;
window.EventSource=class extends NativeEventSource {
 constructor(...args){super(...args);window.liveEvidence.connections++;this.addEventListener('inbox.changed',()=>window.liveEvidence.changed++);this.addEventListener('inbox.resync',()=>window.liveEvidence.resync++);}
};`;
