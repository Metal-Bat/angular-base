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
  const raf = () => new Promise(resolve => requestAnimationFrame(()=>requestAnimationFrame(resolve)));
  const goPerformance = async (path, count) => {
    history.pushState(null,'',path); window.dispatchEvent(new PopStateEvent('popstate'));
    await new Promise(resolve=>setTimeout(resolve,20));
    if (document.querySelector('dialog[open]')) [...document.querySelector('dialog[open]').querySelectorAll('button')].find(button=>button.textContent.trim()==='Continue').click();
    await wait(()=>count ? document.querySelectorAll('app-runtime-form input').length===count : !document.querySelector('app-runtime-form'), 'Runtime mount/teardown '+count);
    await raf();
  };
  for (const count of [16,64,256]) {
    const cycles = [];
    await fetch('/test-control?fields='+count);
    for (let cycle=0;cycle<5;cycle++) {
      const start = performance.now(); await goPerformance('/operations/requests/request%2F1',count);
      const mounted = performance.now();
      const control = document.querySelector('app-runtime-form input');
      check(control.value==='12345678901234567890.123456789','Exact runtime decimal changed');
      if (cycle===0) await auditAccessibility('runtime-'+count);
      control.value='edited-exact-string'; const editStart=performance.now();control.dispatchEvent(new Event('input',{bubbles:true}));await raf();
      const edited=performance.now();
      const domNodes=document.querySelectorAll('app-runtime-form *').length;
      await goPerformance('/operations',0);
      check(!document.querySelector('app-runtime-form input'),'Runtime DOM retained');
      cycles.push({mountMs:Math.round(mounted-start),editMs:Math.round(edited-editStart),domNodes,remainingRuntimeNodes:0,heapBytes:performance.memory?.usedJSHeapSize ?? null});
    }
    measurements.push({fields:count,cycles});
  }
  check(localStorage.length===0 && sessionStorage.length===0,'Performance fixture persisted private values');
  await fetch('/test-result',{method:'POST',body:JSON.stringify({ok:true, measurements, accessibility})});
`;
