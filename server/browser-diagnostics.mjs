// Installed before Angular scripts. Only metadata is retained; console arguments,
// rejected values and private response bodies never enter reports.
export const browserDiagnosticsScript = `
(() => {
 const diagnostics=[];
 window.fixtureDiagnostics=diagnostics;
 for(const level of ['warn','error']) {
  const original=console[level].bind(console);
  console[level]=(...args)=>{
   const code=args.filter(value=>typeof value==='string').map(value=>value.match(/\\b(?:NG|FF)\\d{4}\\b/)?.[0]).find(Boolean);
   const locations=(new Error().stack??'').split('\\n').flatMap(frame=>{
    const match=frame.match(/\\/([^/?#:\\s]+\\.(?:js|ts)):(\\d+):(\\d+)/);
    return match?[{file:match[1],line:Number(match[2]),column:Number(match[3])}]:[];
   }).slice(0,5);
   diagnostics.push({kind:'console-'+level,...(code?{code}:{}),...(locations.length?{locations}:{})});original(...args);
  };
 }
 window.addEventListener('error',event=>diagnostics.push({kind:'runtime-error',...(event.filename?{file:event.filename.split(/[?#]/)[0].split('/').pop(),line:event.lineno,column:event.colno}:{})}));
 window.addEventListener('unhandledrejection',()=>diagnostics.push({kind:'unhandled-rejection'}));
})();
`;
export function assertBrowserDiagnostics(diagnostics) {
  if (!Array.isArray(diagnostics))
    throw Error("Missing browser diagnostic capture");
  if (diagnostics.length) {
    throw Error(
      `Unexpected browser diagnostics: ${JSON.stringify(diagnostics)}`,
    );
  }
}

export const browserDiagnosticDeliveryScript = `
(() => {
      const originalFetch = window.fetch.bind(window);
      const pendingDiagnostics = [];
      window.fixtureReportAccessibility = audit => originalFetch('/test-accessibility', {method:'POST', keepalive:true, body:JSON.stringify(audit)});
      const initialDiagnostics = [...window.fixtureDiagnostics];
      const originalPush = window.fixtureDiagnostics.push.bind(window.fixtureDiagnostics);
      window.fixtureDiagnostics.push = (...entries) => {
        const length = originalPush(...entries);
        pendingDiagnostics.push(originalFetch('/test-diagnostics', {
          method:'POST', keepalive:true, body:JSON.stringify(entries)
        }).then(response => response.ok, () => false));
        return length;
      };
      if (initialDiagnostics.length) {
        pendingDiagnostics.push(originalFetch('/test-diagnostics', {method:'POST', keepalive:true, body:JSON.stringify(initialDiagnostics)}).then(response => response.ok, () => false));
      }
      window.fetch = async (input, init) => {
        if (String(input).startsWith('/test-result')) {
          const delivered = await Promise.all(pendingDiagnostics);
          if (delivered.some(ok => !ok)) {
            await originalFetch('/test-diagnostics', {method:'POST', body:JSON.stringify([{kind:'diagnostic-delivery-failed'}])});
          }
        }
        return originalFetch(input, init);
      };

})();
`;
