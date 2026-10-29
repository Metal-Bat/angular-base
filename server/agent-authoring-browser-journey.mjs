/** Positive actual-service consumers; required human authorization stops AI dispatch. */
export function agentAuthoringBrowserJourney() {
  return `
  {
    const openAgent=async name=>{
      await go('/administration/agents','app-resource-page');
      const row=()=>[...document.querySelectorAll('app-record-table tbody tr')].find(item=>item.textContent.includes(name));
      await wait(row,'Named authoring agent '+name);await click('Open',row());
      await wait(()=>document.querySelector('app-agent-detail'),'Current authoring agent detail');
      const tab=()=>[...document.querySelectorAll('app-agent-detail [role=tab]')].find(item=>item.textContent.trim()==='Saved version checks');
      await wait(tab,'Saved checks tab');tab().click();await wait(()=>document.querySelector('app-agent-authoring'),'Authoring consumer mounted');
    };
    await openAgent('Owned eligible agent');
    const checks=()=>document.querySelector('app-agent-authoring');
    const workflow=()=>checks().querySelector('app-agent-workflow-checks');fill('agent-workflow-search','Owned agent review');await click('Search',workflow());
    await wait(()=>workflow().querySelector('app-record-table tbody tr')?.textContent.includes('Owned agent review'),'Named owned workflow');
    await click('Select',workflow().querySelector('app-record-table'));await wait(()=>workflow().querySelectorAll('app-record-table').length===2,'Exact published workflow versions');
    await click('Select',workflow().querySelectorAll('app-record-table')[1]);await click('Inspect workflow inputs',workflow());
    await wait(()=>checks().textContent.includes('The choice sample is valid'),'Actual composed workflow constant choices');
    check(workflow().textContent.includes('question')&&workflow().textContent.includes('choices'),'Actual composed input declaration');
    await record('APP-FE-025/030 actual named workflow/version/AI-step selection and composed declared inputs with visible-constant choice preview; no runtime sample or provider call');
    const evaluation=()=>checks().querySelector('app-agent-evaluation-checks');
    await click('Refresh my draft requests',evaluation());await wait(()=>button('Select',evaluation()),'Eligible owned saved draft');await click('Select',evaluation());
    await wait(()=>button('Submit saved request',evaluation()),'Exact saved workflow agent pin accepted');
    const originalFetch=window.fetch;const originalOpen=XMLHttpRequest.prototype.open;const originalSend=XMLHttpRequest.prototype.send;const submissions=[];const observed=new WeakSet();
    window.fetch=async(input,init)=>{const url=input instanceof Request?input.url:String(input);if(url.endsWith('/evaluations'))submissions.push(JSON.parse(init?.body??await input.clone().text()));return originalFetch.call(window,input,init);};
    XMLHttpRequest.prototype.open=function(method,url,...rest){if(String(url).endsWith('/evaluations'))observed.add(this);return originalOpen.call(this,method,url,...rest);};
    XMLHttpRequest.prototype.send=function(body){if(observed.has(this))submissions.push(JSON.parse(String(body)));return originalSend.call(this,body);};
    try{
      await click('Submit saved request',evaluation());await wait(()=>document.querySelector('dialog[open]'),'Explicit governed submission confirmation');await click('Cancel',document.querySelector('dialog[open]'));check(submissions.length===0,'Cancel dispatches no request');
      await click('Submit saved request',evaluation());await confirm();await wait(()=>evaluation().textContent.includes('Request submission confirmed'),'Actual governed submission receipt');
      check(submissions.length===1&&submissions[0].request_ref===accounts.eligible_evaluation_request&&typeof submissions[0].submit_key==='string','One exact saved draft and original submission key');
      const processLink=evaluation().querySelector('a[href*="/operations/processes/"]');check(processLink,'Current process link');
      const processRef=decodeURIComponent(new URL(processLink.href).pathname.split('/').at(-1));
      const process=(await http('/api/v1/processes/'+encodeURIComponent(processRef),undefined,'GET')).data;
      check(process.current_positions.some(row=>row.step_key==='authorize'&&row.wait_kind==='HUMAN'),'Required human authorization precedes AI');
      const timeline=(await http('/api/v1/processes/'+encodeURIComponent(processRef)+'/timeline',{})).data;
      check(timeline.steps.find(row=>row.step_key==='classify').executions.length===0,'No AI execution before human approval');
      const replay=(await http('/api/v1/ai-agents/'+encodeURIComponent(accounts.eligible_agent)+'/evaluations',submissions[0])).data;
      check(replay.process_ref===processRef,'Original governed submission replay resolves the same process');
      await record('APP-FE-025/030 actual explicit governed submission/cancel, original-key single-process replay and current process tracking; required human authorization remains undecided and no AI/tool runs');
    }finally{window.fetch=originalFetch;XMLHttpRequest.prototype.open=originalOpen;XMLHttpRequest.prototype.send=originalSend;}
    await openAgent('Owned lookup plan');const lookup=()=>checks().querySelector('app-agent-retrieval-checks');
    await click('Search',lookup());await wait(()=>button('Select',lookup()),'Actual permitted owned saved report');await click('Select',lookup());
    await click('Preview lookup',lookup());await wait(()=>lookup().textContent.includes('Lookup preview ready. Human tool approval is still required before execution.'),'Actual bounded retrieval plan');
    check(lookup().textContent.includes('username')&&!lookup().textContent.includes('owned_unresolved'),'Only declared projected source fields, no credential metadata');
    await record('APP-FE-025/030 actual owned permitted report selection and bounded metadata-only retrieval preview; no report rows/tool/provider invocation or approval substitution');
  }
`;
}
