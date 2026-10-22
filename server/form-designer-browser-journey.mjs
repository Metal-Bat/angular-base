import { foundationsBrowserHelpers } from "./foundations-browser-journey.mjs";
import { formDesignerKindsJourney } from "./form-designer-kinds-journey.mjs";
import { formDesignerRepairJourney } from "./form-designer-repair-journey.mjs";
import { formDesignerPresentationJourney } from "./form-designer-presentation-journey.mjs";

/** Separate complete owned datasets; each keeps the existing browser/command deadline. */
export function formDesignerBrowserJourney(credentials, scope) {
  if (!["repairs", "kinds", "presentation"].includes(scope))
    throw Error("Unsupported form designer dataset");
  return `
(async () => {
${foundationsBrowserHelpers(credentials)}
 try {
  await login(0);
  const session = await (await fetch('/session/status')).json();
  const http = async (path, body, method = 'POST') => {
    const response = await fetch(path, { method, headers: { 'content-type': 'application/json', 'x-csrf-token': session.csrfToken }, ...(body === undefined ? {} : { body: JSON.stringify(body) }) });
    check(response.ok, 'Actual form operation ' + path + ' (' + response.status + ')');
    return response.json();
  };
  const editor = () => document.querySelector('app-form-builder');
  const designTools=async()=>{await click('Design',editor());const toggle=button('Tools',editor());if(toggle&&toggle.getAttribute('aria-expanded')!=='true')await click('Tools',editor());};
  const outline=async()=>{await designTools();editor().querySelector('p-tab[value=outline]').click();await wait(()=>editor().querySelector('p-tab[value=outline]')?.getAttribute('aria-selected')==='true','Visible outline');};
  const selectNode=async(label)=>{await outline();await wait(()=>[...editor().querySelectorAll('.form-outline>li>button')].some(el=>el.textContent.trim()===label),'Outline '+label);[...editor().querySelectorAll('.form-outline>li>button')].find(el=>el.textContent.trim()===label).click();await new Promise(r=>setTimeout(r,75));};
${scope === "repairs" ? formDesignerRepairJourney() : scope === "presentation" ? formDesignerPresentationJourney() : formDesignerKindsJourney()}
  await fetch('/__result', { method: 'POST', body: JSON.stringify({ ok: true, scenarios, diagnostics: window.fixtureDiagnostics }) });
 } catch (error) {
  await fetch('/__result', { method: 'POST', body: JSON.stringify({ ok: false, scenarios, error: error.message, diagnostics: window.fixtureDiagnostics }) });
 }
})();`;
}
