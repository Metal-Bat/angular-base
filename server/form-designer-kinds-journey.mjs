/** Exercise every advertised kind through the ordinary UI on an owned real draft. */
export function formDesignerKindsJourney() {
  return String.raw`
  {
    const kindsRoot = (await http('/api/v1/forms', { code: 'owned-designer-kinds', name: 'Owned field kinds' })).data;
    let kindsVersion = (await http('/api/v1/form-versions', {
      form_ref_id: kindsRoot.ref_id, number: 1, data_schema: { type: 'object', properties: {} },
      render_schema: { dialect: 'bpms.render/1', root: { component: 'vertical', node_key: 'kinds-root', label: 'Kinds', children: [] } },
      page_settings: {}, variants: [],
    })).data;
    await go('/studio/form-versions/' + encodeURIComponent(kindsVersion.ref_id) + '/edit', 'app-form-builder');
    await wait(() => editor().textContent.includes('Kinds') && button('Save draft', editor()), 'Owned all-kind draft');
    await click('Design', editor());
    const kinds = [
      ['text', 'Text'], ['textarea', 'Multiline text'], ['integer', 'Whole number'], ['number', 'Decimal number'], ['date', 'Date'],
      ['datetime', 'Date and time'], ['boolean', 'Checkbox'], ['choice', 'Choice'], ['calculated', 'Calculated value'], ['display', 'Display text'],
      ['user', 'User'], ['group', 'Work group'], ['media', 'Media'], ['attachment_collection', 'Attachments'], ['action', 'Action'],
      ['vertical', 'Vertical layout'], ['horizontal', 'Horizontal layout'], ['grid', 'Grid layout'], ['repeater', 'Repeated fields'], ['table', 'Table'],
    ];
    for (const [kind, label] of kinds) {
      const openTools = button('Tools', editor());
      if (openTools?.getAttribute('aria-expanded') === 'true') await click('Tools', editor());
      await click('Select root layout', editor());
      const toolsToggle = button('Tools', editor());
      if (toolsToggle && toolsToggle.getAttribute('aria-expanded') !== 'true') await click('Tools', editor());
      editor().querySelector('p-tab[value=components]').click();
      const allKinds = [...editor().querySelectorAll('.form-palette details')].find((element) => element.querySelector('summary')?.textContent.trim() === 'All field types and layouts');
      check(allKinds, 'All-kind palette');
      if (!allKinds.open) allKinds.querySelector('summary').click();
      await click(label, allKinds);
      await wait(() => document.getElementById('field-label')?.getClientRects().length && document.getElementById('field-label').value === label, 'Ordinary kind properties ' + kind);
      fill('field-label', 'Check ' + label);
      await click('Apply properties', editor());
    }
    await click('Save draft', editor());
    await wait(() => editor().textContent.includes('Saved') && button('Save draft', editor()), 'Every kind saved');
    kindsVersion = (await http('/api/v1/form-versions/' + encodeURIComponent(kindsVersion.ref_id), undefined, 'GET')).data;
    const kindNodes = kindsVersion.render_schema.root.children;
    check(kindNodes.length === 20 && kindNodes.every((node, index) => node.component === kinds[index][0] && node.label === 'Check ' + kinds[index][1]), 'Actual exact kinds and captions');
    const boundKinds = kindNodes.filter((node) => typeof node.scope === 'string');
    check(new Set(boundKinds.map((node) => node.scope)).size === boundKinds.length && Object.keys(kindsVersion.data_schema.properties).length === boundKinds.length, 'Fresh canonical identities without layout fields');
    await click('Validate', editor());
    await wait(() => editor().querySelector('.issues-tray') && editor().querySelector('.validation-result')?.textContent.trim()==='Validation passed', 'Authoritative all-kind validation');
    check(!editor().querySelector('.issues-tray li button'), 'All-kind draft has no validation issues');
    await click('Reload', editor()); await wait(() => button('Save draft', editor()), 'Every kind reopened');
    await click('Design', editor());
    await wait(() => editor().querySelectorAll('.field-card').length === 20, 'Every actual kind placement reopened');
    await click('Preview', editor());
    await wait(() => editor().querySelector('.preview-freshness')?.textContent.trim() === 'Up to date' && editor().querySelector('app-runtime-form'), 'Authoritative every-kind runtime preview');
    check(!editor().querySelector('app-runtime-form [role=alert]'), 'No unsupported runtime kind');
    await record('APP-FE-017 actual all twenty advertised kinds, ordinary creation/properties, fresh bindings, save/reopen/validate and authoritative preview');
  }
`;
}
