import { publicBrowserStorageCheck } from "./browser-storage-policy.mjs";
import { runtimeFixture } from "../src/app/features/forms/testing/runtime-fixtures.ts";
export function largeRuntimeFixture(count) {
  if (![16, 64, 256].includes(count))
    throw Error("Unknown performance fixture size");
  const dto = runtimeFixture("REQUEST");
  const fields = Array.from({ length: count }, (_, index) => ({
    key: `field${index}`,
    scope: `/properties/field${index}`,
    label: `Field ${index + 1}`,
  }));
  dto.resource_ref_id = "request/1";
  dto.view_key = "request";
  dto.data = Object.fromEntries(
    fields.map((field) => [field.key, "12345678901234567890.123456789"]),
  );
  dto.readable_scopes = fields.map((field) => field.scope);
  dto.writable_scopes = [...dto.readable_scopes];
  dto.required_scopes = [];
  dto.field_metadata = fields.map((field) => ({
    scope: field.scope,
    validation_schema: { type: "string" },
    writable: true,
    required: false,
  }));
  const chunks = [];
  for (let index = 0; index < count; index += 64)
    chunks.push({
      component: "vertical",
      label: `Section ${index / 64 + 1}`,
      children: fields.slice(index, index + 64).map((field) => ({
        component: "text",
        scope: field.scope,
        label: field.label,
      })),
    });
  dto.render_schema = {
    dialect: "bpms.render/1",
    root: { component: "vertical", children: chunks },
  };
  dto.option_sources = [];
  dto.actions = [];
  return dto;
}
export const runtimePerformanceScript = `
  const measurements = [];
  const originalFetch = window.fetch;
  const originalOpen = XMLHttpRequest.prototype.open;
  const originalSend = XMLHttpRequest.prototype.send;
  const runtimeXhrs = new WeakSet();
  let runtimeRequests = 0, pendingRuntimeRequests = 0;
  const isRuntime = input => {const url = new URL(input, location.href);return url.pathname.includes('/business-requests/') && url.pathname.endsWith('/view');};
  XMLHttpRequest.prototype.open = function(method, url, ...args) {
    if (isRuntime(url)) runtimeXhrs.add(this); else runtimeXhrs.delete(this);
    return originalOpen.call(this, method, url, ...args);
  };
  XMLHttpRequest.prototype.send = function(body) {
    if (!runtimeXhrs.has(this)) return originalSend.call(this, body);
    runtimeRequests++; pendingRuntimeRequests++;
    let settled = false;
    const settle = () => {if (!settled) {settled=true;pendingRuntimeRequests--;this.removeEventListener('loadend',settle);}};
    this.addEventListener('loadend',settle,{once:true});
    try {return originalSend.call(this, body);} catch(error) {settle();throw error;}
  };
  window.fetch = async function(input, init) {
    const runtime = isRuntime(typeof input === 'string' ? input : input.url ?? String(input));
    if (runtime) { runtimeRequests++; pendingRuntimeRequests++; }
    try { return await originalFetch.call(this, input, init); }
    finally { if (runtime) pendingRuntimeRequests--; }
  };
  try {
  const raf = () => new Promise(resolve => requestAnimationFrame(()=>requestAnimationFrame(resolve)));
  const goPerformance = async (path, count) => {
    history.pushState(null,'',path); window.dispatchEvent(new PopStateEvent('popstate'));
    await wait(()=>document.querySelector('dialog[open]') || (count ? document.querySelectorAll('app-runtime-form input').length===count : !document.querySelector('app-runtime-form')), 'Runtime navigation or discard confirmation '+count);
    if (document.querySelector('dialog[open]')) [...document.querySelector('dialog[open]').querySelectorAll('button')].find(button=>button.textContent.trim()==='Continue').click();
    await wait(()=>count ? document.querySelectorAll('app-runtime-form input').length===count : !document.querySelector('app-runtime-form'), 'Runtime mount/teardown '+count);
    await raf();
  };
  for (const count of [16,64,256]) {
    const cycles = [];
    await fetch('/test-control?fields='+count);
    for (let cycle=0;cycle<5;cycle++) {
      const requestsBeforeMount = runtimeRequests;
      const start = performance.now(); await goPerformance('/operations/requests/request%2F1',count);
      const mounted = performance.now();
      const requestsDuringMount = runtimeRequests - requestsBeforeMount;
      check(requestsDuringMount>0,'Runtime request instrumentation did not observe the mount');
      const control = document.querySelector('app-runtime-form input');
      check(control.value==='12345678901234567890.123456789','Exact runtime decimal changed');
      if (cycle===0) await auditAccessibility('runtime-'+count);
      control.value='edited-exact-string'; const editStart=performance.now();control.dispatchEvent(new Event('input',{bubbles:true}));await raf();
      const edited=performance.now();
      const domNodes=document.querySelectorAll('app-runtime-form *').length;
      await goPerformance('/operations',0);
      const teardownStart = performance.now();
      const requestsAtTeardown = runtimeRequests;
      await new Promise(resolve => setTimeout(resolve, 250));
      const remainingRuntimeNodes = document.querySelectorAll('app-runtime-form, app-runtime-form *').length;
      const requestsAfterTeardown = runtimeRequests - requestsAtTeardown;
      check(remainingRuntimeNodes===0,'Runtime DOM retained');
      check(pendingRuntimeRequests===0 && requestsAfterTeardown===0,'Runtime view requests survived teardown');
      cycles.push({mountMs:Math.round(mounted-start),editMs:Math.round(edited-editStart),domNodes,requestsDuringMount,remainingRuntimeNodes,pendingRuntimeRequests,requestsAfterTeardown,quietWindowMs:Math.round(performance.now()-teardownStart),heapBytes:performance.memory?.usedJSHeapSize ?? null});
    }
    measurements.push({fields:count,cycles});
  }
  check(${publicBrowserStorageCheck},'Performance fixture persisted private values');
  await fetch('/test-result',{method:'POST',body:JSON.stringify({ok:true, measurements, accessibility})});
  } finally { window.fetch = originalFetch; XMLHttpRequest.prototype.open = originalOpen; XMLHttpRequest.prototype.send = originalSend; }
`;
