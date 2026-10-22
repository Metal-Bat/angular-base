import { publicBrowserStorageCheck } from "./browser-storage-policy.mjs";
/** Real-backend receipt journey; credentials stay in the private harness. */
export function receiptBrowserJourney(credentials) {
  return `(async()=>{
 const accounts=${JSON.stringify(credentials).replaceAll("<", "\\u003c")};
 const scenario=accounts.scenario;
 const wait=async(predicate,name)=>{for(let n=0;n<1200;n++){if(predicate())return;await new Promise(r=>setTimeout(r,25));}throw Error('Timed out: '+name);};
 const check=(v,n)=>{if(!v)throw Error(n);};
 const button=(labels,root=document)=>[...root.querySelectorAll('button')].find(e=>labels.includes(e.textContent.trim())&&!e.disabled);
 const click=async(labels,root=document)=>{await wait(()=>button(labels,root),labels.join('/'));button(labels,root).click();};
 const fill=(id,value)=>{const input=document.getElementById(id);check(input,'Missing control '+id);input.value=value;input.dispatchEvent(new Event('input',{bubbles:true}));};
 const confirm=async()=>{await wait(()=>document.querySelector('dialog[open]'),'confirmation');await click(['Continue','ادامه','متابعة'],document.querySelector('dialog[open]'));};
 const tasks=async()=>{await wait(()=>!document.querySelector('app-case-detail button.reload-control:disabled'),'settled task action');document.querySelector('a[href="/operations/tasks"]').click();let attempts=0;await wait(()=>{const found=document.querySelector('app-task-inbox a[href*="/operations/tasks/"]');if(!found&&document.querySelector('dialog[open]')){const proceed=button(['Continue','ادامه','متابعة'],document.querySelector('dialog[open]'));if(proceed)proceed.click();}if(!found&&attempts++%80===0){if(!document.querySelector('app-task-inbox'))document.querySelector('a[href="/operations/tasks"]')?.click();const refresh=document.querySelector('app-task-inbox button.reload-control');if(refresh&&!refresh.disabled)refresh.click();}return found;},'available work');document.querySelector('app-task-inbox a[href*="/operations/tasks/"]').click();};
 try{
  check(scenario?.id==='purchase-connected/1'&&scenario.ai_mode==='scripted_no_network','Shared scenario contract');
  await wait(()=>document.querySelector('#username'),'login');fill('username',accounts.users[0]);fill('password',accounts.password);document.querySelector('form').dispatchEvent(new Event('submit',{bubbles:true,cancelable:true}));
  await wait(()=>document.querySelector('a[href="/operations/tasks"]'),'authenticated actor');
  await wait(()=>document.documentElement.lang===accounts.language,'persisted actor language');
  if(accounts.language==='ar')check(document.documentElement.dir==='rtl','Arabic persisted RTL');
  await tasks();await click(['Claim','دریافت کار','استلام']);
  await wait(()=>button(['Approve','تأیید','Approve']),'approval view');
  await wait(()=>document.getElementById('field-'+encodeURIComponent('/quantity')),'order input');
  fill('field-'+encodeURIComponent('/item_code'),scenario.order_payload.item_code);
  fill('field-'+encodeURIComponent('/quantity'),String(scenario.order_payload.quantity));
  check(document.getElementById('field-'+encodeURIComponent('/quantity'))?.value===String(scenario.order_payload.quantity),'Entered approved quantity');
  await click(['Approve','تأیید','Approve']);await confirm();
  if(accounts.lose_approval_reply){
   await wait(()=>document.querySelector('app-case-detail [role="alert"]'),'uncertain approval result');
   check(document.getElementById('field-'+encodeURIComponent('/quantity'))?.value===String(scenario.order_payload.quantity),'Unsaved approval input was lost');
   await wait(()=>document.querySelector('app-case-detail button.reload-control:not(:disabled)'),'current-state control');
   document.querySelector('app-case-detail button.reload-control').click();
   await confirm();
  }

  await wait(()=>document.querySelector('app-case-detail')?.textContent.includes(accounts.language==='fa'?'تکمیل‌شده':accounts.language==='ar'?'مكتمل':'COMPLETED'),'human action committed');
  await tasks();await click(['Claim','دریافت کار','استلام']);
  await wait(()=>button(['Acknowledge receipt','تأیید دریافت رسید','Acknowledge receipt']),'actual worker receipt view');
  const root=document.querySelector('app-runtime-form');check(root,'receipt form');
  check([...root.querySelectorAll('input,textarea,select')].every(e=>e.disabled||e.readOnly||e.type==='hidden'),'Receipt fields editable');
  check(root.textContent.includes('CREATED')||[...root.querySelectorAll('input')].some(e=>e.value==='CREATED'),'Missing real receipt state');
  const actualFingerprint=[...root.querySelectorAll('input,textarea')].map(e=>e.value).find(value=>/^[a-f0-9]{64}$/.test(value))??root.textContent.match(/[a-f0-9]{64}/)?.[0];
  check(actualFingerprint,'Actual confirmed receipt fingerprint');
  if(accounts.language==='fa')check(document.documentElement.dir==='rtl'&&root.textContent.includes('اثر انگشت'),'Localized receipt/RTL');
  await click(['Acknowledge receipt','تأیید دریافت رسید','Acknowledge receipt']);await confirm();
  await wait(()=>document.querySelector('app-case-detail')?.textContent.includes(accounts.language==='fa'?'تکمیل‌شده':accounts.language==='ar'?'مكتمل':'COMPLETED'),'receipt acknowledgment');
  await click(['Process tracking','پیگیری فرایند','متابعة العملية'],document.querySelector('app-case-summary'));
  await wait(()=>document.querySelector('app-case-summary [role=alert]'),'Filtered-task destination denial');
  check(!document.querySelector('app-process-entry'),'Contracted task reviewer gained full process access');
  check(!document.querySelector('app-order-recovery input'),'Ordinary reviewer cannot invoke operator recovery');
  const extra=[];
  if(accounts.requester){
   const taskPath=location.pathname;
   await click(['Sign out','خروج','تسجيل الخروج']);await wait(()=>document.querySelector('#username'),'Requester login');
   check(!document.querySelector('app-case-detail'),'Old reviewer state cleared');
   fill('username',accounts.requester);fill('password',accounts.password);document.querySelector('form').dispatchEvent(new Event('submit',{bubbles:true,cancelable:true}));
   await wait(()=>document.querySelector('.account-avatar')&&!document.querySelector('app-login'),'Authorized requester session');
   history.pushState({},'',taskPath);dispatchEvent(new PopStateEvent('popstate'));
   await wait(()=>document.querySelector('app-case-summary'),'Requester task metadata');
   await click(['Process tracking','پیگیری فرایند','متابعة العملية'],document.querySelector('app-case-summary'));
   await wait(()=>document.querySelector('app-process-evidence section[aria-busy="false"]')&&!document.querySelector('app-process-evidence [role=alert]'),'Authorized authoritative receipt/AI projection');
   const evidence=document.querySelector('app-process-evidence');
   check(evidence.textContent.includes(actualFingerprint),'Process projection matches real worker fingerprint');
   check(!document.querySelector('app-order-recovery input'),'Requester cannot invoke operator recovery');
   if(accounts.language==='fa')check(evidence.textContent.includes('رسیدها و شواهد اجرای هوش مصنوعی')&&document.documentElement.dir==='rtl','Evidence localization/RTL');
   extra.push('authorized-requester-process-receipt','actor-switch-cleanup');
  }
  check(${publicBrowserStorageCheck},'Private browser persistence');
  await fetch('/__result',{method:'POST',body:JSON.stringify({ok:true,diagnostics:window.fixtureDiagnostics,scenarios:[...extra,scenario.id,'ordinary-auth','human-approve','actual-worker-order','readonly-receipt','acknowledge','filtered-task-process-denied','ordinary-recovery-denied',accounts.language]})});
 }catch(error){await fetch('/__result',{method:'POST',body:JSON.stringify({ok:false,error:error.message,diagnostics:window.fixtureDiagnostics,ui:{taskInbox:!!document.querySelector('app-task-inbox'),caseDetail:!!document.querySelector('app-case-detail'),tracking:!!document.querySelector('app-process-entry'),evidence:!!document.querySelector('app-process-evidence'),evidenceBusy:document.querySelector('app-process-evidence section')?.getAttribute('aria-busy'),evidenceError:!!document.querySelector('app-process-evidence [role=alert]'),dialog:!!document.querySelector('dialog[open]'),href:location.pathname.split('/').slice(0,3).join('/'),alerts:[...document.querySelectorAll('[role=alert]')].map(e=>e.textContent.includes('kept')?'kept':e.textContent.includes('permission')?'permission':'other')}})});}
})();`;
}
