export const accessibilityScript = `
 const accessibility = [];
 const auditAccessibility = async (context) => {
   if (!window.axe) { check(!${process.env.ACCESSIBILITY_CHECKS === "1"}, 'Accessibility engine missing'); return; }
   await document.fonts.ready;
   await Promise.all(document.getAnimations().filter(animation => animation.effect?.getComputedTiming().iterations !== Infinity).map(animation => animation.finished.catch(() => {})));
   const result = await window.axe.run(document, {runOnly: {type: 'tag', values: ['wcag2a','wcag2aa','wcag21aa','wcag22aa']}});
   const simplify = items => items.map(item => ({id: item.id, impact: item.impact, targets: item.nodes.map(node => node.target), contrast: item.id === 'color-contrast' ? item.nodes.map(node => node.any.map(check => check.data)) : undefined}));
   accessibility.push({context, violations: simplify(result.violations), incomplete: simplify(result.incomplete), passes: result.passes.length});
   check(result.violations.length === 0, 'Accessibility '+context+': '+JSON.stringify(simplify(result.violations)));
 };
`;
