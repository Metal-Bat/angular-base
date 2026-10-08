export const accessibilityScript = `
 const accessibility = [];
 const auditAccessibility = async (context, target = document) => {
   if (!window.axe) { check(!${process.env.ACCESSIBILITY_CHECKS === "1"}, 'Accessibility engine missing'); return; }
   window.fixtureStage='accessibility-fonts-'+context;
   await document.fonts.ready;
   window.fixtureStage='accessibility-motion-'+context;
   // Let the workspace's transitions (up to 300 ms) settle. Enumerating
   // animation objects during color-scheme changes can stall Firefox.
   await new Promise(resolve => setTimeout(resolve, 400));
   window.fixtureStage='accessibility-audit-'+context;
   const result = await window.axe.run(target, {runOnly: {type: 'tag', values: ['wcag2a','wcag2aa','wcag21aa','wcag22aa']}});
   const simplify = items => items.map(item => ({id: item.id, impact: item.impact, targets: item.nodes.map(node => node.target), contrast: item.id === 'color-contrast' ? item.nodes.map(node => node.any.map(check => check.data)) : undefined}));
   accessibility.push({context, violations: simplify(result.violations), incomplete: simplify(result.incomplete), passes: result.passes.length});
   check(result.violations.length === 0, 'Accessibility '+context+': '+JSON.stringify(simplify(result.violations)));
 };
`;
