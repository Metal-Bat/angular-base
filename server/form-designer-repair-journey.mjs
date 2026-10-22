/** Extra form-only acceptance on the existing owned disposable real-service journey. */
export function formDesignerRepairJourney() {
  return String.raw`
  {
    const repairRoot = (await http('/api/v1/forms', { code: 'owned-designer-repairs', name: 'Owned designer repairs' })).data;
    const repairDocuments = {
      data_schema: { type: 'object', properties: {
        rows: { type: 'array', items: { type: 'object', properties: { note: { type: 'string' } } } },
        files: { type: 'array', items: { type: 'string' } },
        owner: { type: 'string' }, reason: { type: 'string' },
      } },
      render_schema: { dialect: 'bpms.render/1', root: { component: 'vertical', node_key: 'repair-root', label: 'Repairs', children: [
        { component: 'repeater', node_key: 'repair-rows', label: 'Rows', scope: '/properties/rows', children: [
          { component: 'text', node_key: 'repair-note', label: 'Note', scope: '/properties/rows/items/properties/note' },
        ] },
        { component: 'attachment_collection', node_key: 'repair-files', label: 'Receipts', scope: '/properties/files', options: { allowed_kinds: null, preview: false }, messages: { label: { key: 'receipts', arguments: {} } } },
        { component: 'user', node_key: 'repair-owner', label: 'Owner', scope: '/properties/owner' },
        { component: 'textarea', node_key: 'repair-reason', label: 'Reason', scope: '/properties/reason' },
      ] } },
      page_settings: {}, variants: [],
      localization: { dialect: 'bpms.messages/1', default_locale: 'en', supported_locales: ['en', 'fa'], required_locales: ['en', 'fa'], catalogs: {
        en: { receipts: { text: 'Receipts', parameters: {}, source_revision: null } }, fa: {},
      } },
    };
    let repairVersion = (await http('/api/v1/form-versions', { ...repairDocuments, form_ref_id: repairRoot.ref_id, number: 1 })).data;
    await go('/studio/form-versions/' + encodeURIComponent(repairVersion.ref_id) + '/edit', 'app-form-builder');
    await wait(() => editor().textContent.includes('Repairs') && button('Save draft', editor()), 'Owned repair draft loaded');
    const repairSection = async (name) => {
      const header = () => [...editor().querySelectorAll('app-form-inspector p-accordion-header')].find((el) => el.textContent.trim() === name);
      await wait(() => header()?.getClientRects().length, 'Repair section ' + name);
      if (header().getAttribute('aria-expanded') !== 'true') header().click();
      await wait(() => header()?.getAttribute('aria-expanded') === 'true', 'Open repair section ' + name);
    };
    await selectNode('Rows'); await repairSection('Validation constraints');
    fill('field-constraints-maxItems', '2'); fill('field-constraints-minItems', '3');
    await wait(() => !button('Apply properties', editor()) && !button('Save draft', editor()), 'Contradictory row limits fenced');
    fill('field-constraints-maxItems', '4'); await click('Apply properties', editor());
    await click('Undo', editor()); await repairSection('Validation constraints');
    check(document.getElementById('field-constraints-minItems').value === '', 'One row-limit application has one undo step');
    await click('Redo', editor()); await repairSection('Validation constraints');
    check(document.getElementById('field-constraints-minItems').value === '3' && document.getElementById('field-constraints-maxItems').value === '4', 'Row limits restored exactly');
    await selectNode('Receipts'); await repairSection('Appearance');
    fill('field-options-max_items', '-');
    await wait(() => !button('Apply properties', editor()) && !button('Save draft', editor()), 'Invalid attachment limit fenced');
    await choose('Allow removal', 'No', editor());
    check(document.getElementById('field-options-max_items').value === '-', 'Attachment number survives other settings');
    fill('field-options-max_items', '3'); fill('field-options-min_items', '0'); fill('field-options-max_item_bytes', '1048576');
    fill('field-options-mime', 'image/*');
    await wait(() => !button('Apply properties', editor()), 'Unsupported wildcard is retained for correction');
    fill('field-options-mime', 'image/webp\napplication/pdf');
    await click('Apply properties', editor()); await click('Save draft', editor());
    await wait(() => editor().textContent.includes('Saved') && button('Save draft', editor()), 'Actual resource properties saved');
    repairVersion = (await http('/api/v1/form-versions/' + encodeURIComponent(repairVersion.ref_id), undefined, 'GET')).data;
    const actualFields = repairVersion.data_schema.properties;
    check(actualFields.rows.minItems === 3 && actualFields.rows.maxItems === 4 && JSON.stringify(actualFields.rows.items) === JSON.stringify(repairDocuments.data_schema.properties.rows.items), 'Actual canonical row limits and original item schema');
    const fileOptions = repairVersion.render_schema.root.children[1].options;
    check(fileOptions.min_items === 0 && fileOptions.max_items === 3 && fileOptions.max_item_bytes === 1048576 && fileOptions.allow_remove === false && fileOptions.preview === false && fileOptions.allowed_kinds === null, 'Actual zero/false/null attachment options');
    check(JSON.stringify(fileOptions.allowed_mime_types) === JSON.stringify(['image/webp', 'application/pdf']), 'Actual exact MIME types');
    await click('Reload', editor()); await wait(() => button('Save draft', editor()), 'Resource properties reopened');
    await selectNode('Receipts'); await repairSection('Appearance');
    check(document.getElementById('field-options-max_items').value === '3' && document.getElementById('field-options-min_items').value === '0', 'Saved attachment limits reopened');
    check(document.getElementById('field-options-mime').value === 'image/webp\napplication/pdf', 'Saved MIME types reopened');
    await record('APP-FE-017 actual purpose-built row/attachment settings, invalid-buffer fences, exact zero/false/null and undo/save/reopen');

    await selectNode('Reason'); await click('Rules', editor());
    await choose('When field', 'Owner', editor()); await choose('Operator', 'Equals', editor());
    const resourceComposer = () => editor().querySelector('app-form-rule-value app-form-rule-resource');
    await wait(() => resourceComposer()?.querySelector('[role=combobox][aria-label="Value"]')?.getAttribute('aria-disabled') === 'false', 'Authorized rule source ready');
    const optionPage = await http('/api/v1/forms/options', { documents: {
      data_schema: repairVersion.data_schema, render_schema: repairVersion.render_schema,
      page_settings: repairVersion.page_settings, variants: repairVersion.variants, localization: repairVersion.localization,
    }, locale: 'en', query: { node_pointer: '/root/children/2', data: {}, page: 1, size: 20, generation: 0 } });
    const authorized = optionPage.result.items[0];
    check(authorized && authorized.key.startsWith('json:'), 'Authorized service option required');
    await choose('Value', authorized.value, resourceComposer());
    await click('Add rule', editor());
    await wait(() => editor().querySelector('.rule-list')?.textContent.includes(authorized.value), 'Readable current resource rule');
    await click('Apply properties', editor()); await click('Save draft', editor());
    await wait(() => editor().textContent.includes('Saved') && button('Save draft', editor()), 'Actual resource comparison saved');
    repairVersion = (await http('/api/v1/form-versions/' + encodeURIComponent(repairVersion.ref_id), undefined, 'GET')).data;
    const storedRules = repairVersion.render_schema.root.children[3].rules;
    const storedRule = storedRules[0];
    check(storedRules.length === 1 && JSON.stringify(Object.keys(storedRule).sort()) === JSON.stringify(['effect', 'operator', 'scope', 'value']) && storedRule.scope === '/properties/owner' && storedRule.operator === 'eq' && storedRule.effect === 'show' && storedRule.value === JSON.parse(authorized.key.slice(5)), 'Exact selected scalar and rule fields stored without reference decoding');
    await click('Reload', editor()); await wait(() => button('Save draft', editor()), 'Resource comparison reopened');
    await selectNode('Reason'); await click('Rules', editor());
    await wait(() => editor().querySelector('.rule-list')?.textContent.includes(authorized.value), 'Saved rule resolves its authorized current name');
    await record('APP-FE-018 actual authorized user comparison, exact canonical value and readable current-name save/reopen');

    await click('Settings', editor());
    await wait(() => document.getElementById('form-page-title')?.getClientRects().length, 'Ordinary page settings');
    const assignPageField = (name) => {
      const label = [...editor().querySelectorAll('app-form-pages .page-field label')].find((element) => element.textContent.trim() === name);
      check(label, 'Page field ' + name); label.click();
    };
    const schemaBeforePages = JSON.stringify(repairVersion.data_schema);
    fill('form-page-title', 'Documents'); assignPageField('Rows'); assignPageField('Receipts');
    await click('Apply page', editor());
    await wait(() => document.getElementById('form-page-title').value === '', 'First page applied');
    fill('form-page-title', 'Review'); assignPageField('Owner'); assignPageField('Reason');
    await click('Apply page', editor());
    await wait(() => editor().querySelectorAll('.page-list > li').length === 2, 'Two authored pages');
    await click('Move up', editor().querySelectorAll('.page-list > li')[1]);
    check(editor().querySelector('.page-list h3').textContent.trim() === 'Review', 'Page order changed');
    await click('Undo', editor());
    await wait(() => editor().querySelector('.page-list h3')?.textContent.trim() === 'Documents', 'Page order undo');
    await click('Remove page', editor().querySelector('.page-list > li'));
    await wait(() => editor().querySelectorAll('.page-list > li').length === 1, 'Page organization removed');
    await click('Undo', editor());
    await wait(() => editor().querySelectorAll('.page-list > li').length === 2, 'Page organization restored');
    await click('Save draft', editor());
    await wait(() => editor().textContent.includes('Saved') && button('Save draft', editor()), 'Actual pages saved');
    repairVersion = (await http('/api/v1/form-versions/' + encodeURIComponent(repairVersion.ref_id), undefined, 'GET')).data;
    const savedPages = repairVersion.page_settings.pages;
    check(savedPages.length === 2 && savedPages[0].key === 'page_1' && savedPages[0].title === 'Documents' && JSON.stringify(savedPages[0].scopes) === JSON.stringify(['/properties/rows', '/properties/files']) && savedPages[1].key === 'page_2' && savedPages[1].title === 'Review' && JSON.stringify(savedPages[1].scopes) === JSON.stringify(['/properties/owner', '/properties/reason']), 'Actual stable page keys, titles, order and scopes');
    check(JSON.stringify(repairVersion.data_schema) === schemaBeforePages, 'Page commands never alter canonical fields');
    await click('Reload', editor()); await wait(() => button('Save draft', editor()), 'Pages reopened');
    await click('Settings', editor());
    await wait(() => editor().querySelectorAll('.page-list > li').length === 2, 'Actual saved pages reopened');
    await click('Design', editor());
    await choose('Page', 'Review', editor().querySelector('app-form-canvas'));
    await wait(() => editor().querySelectorAll('.field-card').length === 2, 'Design page filters placements without deleting fields');
    check([...editor().querySelectorAll('.field-card strong')].map((element) => element.textContent.trim()).join(',') === 'Owner,Reason', 'Design page uses canonical scope membership');
    await choose('Page', 'All fields', editor().querySelector('app-form-canvas'));
    await wait(() => editor().querySelectorAll('.field-card').length === 5, 'All design placements restored');
    await click('Preview', editor());
    const pageRuntime = () => editor().querySelector('app-runtime-form');
    await wait(() => editor().querySelector('.preview-freshness')?.textContent.trim() === 'Up to date' && pageRuntime()?.querySelector('nav h2')?.textContent.trim() === 'Documents', 'Actual projected first page');
    await click('Next page', pageRuntime());
    await wait(() => pageRuntime()?.querySelector('nav h2')?.textContent.trim() === 'Review', 'Actual second page');
    await choose('Owner', authorized.value, pageRuntime());
    const pageReason = () => {
      const label = [...(pageRuntime()?.querySelectorAll('app-field-wrapper label') ?? [])].find((element) => element.textContent.trim() === 'Reason');
      return label ? document.getElementById(label.htmlFor) : null;
    };
    await wait(() => pageReason()?.getClientRects().length, 'Server rule responds to automatic sample refresh');
    const reasonInput = pageReason();
    fill(reasonInput.id, 'Retained across page navigation');
    await click('Previous page', pageRuntime()); await click('Next page', pageRuntime());
    await wait(() => pageReason()?.value === 'Retained across page navigation', 'Canonical preview answers survive page changes');
    await record('APP-FE-019 actual ordinary page assignment/order/removal/history, unchanged schema, save/reopen and paged preview answer retention');

    await click('Validate', editor());
    await wait(() => editor().querySelector('.issues-tray li button') && editor().querySelector('.diagnostics-mode')?.getClientRects().length, 'Actual validation warnings tray');
    const localizationIssue = [...editor().querySelectorAll('.issues-tray li')].find((el) => el.querySelector('button')?.textContent.includes('Translations'));
    check(localizationIssue, 'Missing translation has a readable repair target');
    localizationIssue.querySelector('button').click();
    await wait(() => document.getElementById('form-translations-title') === document.activeElement, 'Actual warning focuses Languages');
    check(document.getElementById('message-key')?.getClientRects().length, 'Translation repair controls visible');
    await record('APP-FE-019 actual backend warning severity, readable issue ownership and focused Languages repair');
  }
`;
}
