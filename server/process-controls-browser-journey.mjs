/** Extend the existing owned real-service journey; never replace its transport. */
export function processControlsBrowserJourney() {
  return `
  await wait(()=>document.querySelector('app-process-evidence section[aria-busy="false"]')&&!document.querySelector('app-process-evidence [role=alert]'),'Actual read-only process evidence');
  check(document.querySelector('app-process-evidence')?.textContent.includes('No order evidence'),'Actual empty authorized order projection');
  check(document.querySelector('app-process-evidence')?.textContent.includes('No AI evidence'),'Actual empty authorized AI projection');
  await record('APP-FE-026.2 actual authorized order/AI evidence search without business commands');
  const controlsDestination=document.querySelector('app-process-entry a[href^="/administration/processes"]');
  check(controlsDestination,'Authorized process controls destination');
  check(new URL(controlsDestination.href).searchParams.get('ref_id'),'Authoritative destination reference');
  const processCalls=[];const processOpen=XMLHttpRequest.prototype.open;
  XMLHttpRequest.prototype.open=function(method,url,...args){if(String(url).includes('/api/v1/processes/'))processCalls.push(method);return processOpen.call(this,method,url,...args);};
  try {
    controlsDestination.click();
    await wait(()=>document.querySelector('app-process-controls app-record-summary')&&button('Reload',document.querySelector('app-process-controls')),'Opened actual process controls');
    const currentControl=document.getElementById('process-reference');
    const authoritative=(await http('/api/v1/processes/'+encodeURIComponent(currentControl.value),undefined,'GET')).data;
    check(currentControl.value===authoritative.ref_id,'Controls retain authoritative backend current ref');
    await click('Reload',document.querySelector('app-process-controls'));
    await wait(()=>button('Reload',document.querySelector('app-process-controls')),'Current-reference reload settled');
    check(document.getElementById('process-reference').value===authoritative.ref_id,'Reload preserves current reference');
    check(processCalls.length>=2&&processCalls.every(method=>method==='GET'),'Opening and reloading controls execute no process command');
  } finally {XMLHttpRequest.prototype.open=processOpen;}
  await record('APP-FE-033.2 authorized direct process controls navigation without manual ref copying or business commands');
  await record('APP-FE-032.2 actual authoritative process ref and read-only reload');
  await go('/operations/media','app-generic-media');
  const fileBytes=Uint8Array.from({length:256*1024},(_,index)=>65+(index%26));
  const ownedFile=new DataTransfer();ownedFile.items.add(new File([fileBytes],'owned-transfer-036.txt',{type:'text/plain'}));
  const uploadControl=document.getElementById('private-upload');uploadControl.files=ownedFile.files;uploadControl.dispatchEvent(new Event('change',{bubbles:true}));
  await wait(()=>button('Download',document.querySelector('app-generic-media')),'Actual private upload settled');
  await click('Download',document.querySelector('app-generic-media'));
  await wait(()=>button('Download',document.querySelector('app-generic-media'))&&!document.querySelector('app-generic-media [role=alert]'),'Actual private download settled');
  await record('APP-FE-036.1 actual owned 256 KiB private upload/download through server-held session boundary');
`;
}
