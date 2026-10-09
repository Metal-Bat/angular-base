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
   diagnostics.push({kind:'console-'+level,...(code?{code}:{})});original(...args);
  };
 }
 window.addEventListener('error',()=>diagnostics.push({kind:'runtime-error'}));
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
