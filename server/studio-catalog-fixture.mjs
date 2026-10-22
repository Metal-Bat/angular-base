import {
  formOptionsFixture,
  formPreviewFixture,
} from "./form-preview-fixture.mjs";
// Disposable catalogs: no requests are sent to the user's backend.
export function createStudioCatalogFixture({ typedChoice = false } = {}) {
  const calls = [];
  const roots = [
    "forms",
    "workflows",
    "clients",
    "request-types",
    "form-components",
    "form-data-types",
  ];
  const versions = [
    "form-versions",
    "workflow-versions",
    "client-releases",
    "form-component-versions",
    "form-data-type-versions",
  ];
  const rows = new Map(
    [...roots, ...versions].map((key) => [
      key,
      [
        {
          ref_id: "fixture-" + key + "-v1",
          code: "example",
          name: "Example " + key,
          number: 1,
          version: "1.0.0",
          status: "DRAFT",
          is_active: true,
          is_enabled: true,
          created_at: "2026-10-04T08:00:00Z",
          default_priority: 1,
        },
      ],
    ]),
  );
  Object.assign(rows.get("clients")[0], {
    kind: "WEB",
    platform: "browser",
    confidential: true,
  });
  Object.assign(rows.get("client-releases")[0], {
    api_version: "1",
    renderer_capabilities: ["forms/1"],
    client_ref_id: "fixture-clients-v1",
  });
  Object.assign(rows.get("request-types")[0], {
    form_ref_id: "fixture-forms-v1",
    workflow_ref_id: "fixture-workflows-v1",
    client_targets: [
      {
        client_ref_id: "fixture-clients-v1",
        minimum_release: "1.0.0",
        maximum_release_exclusive: null,
      },
    ],
  });
  Object.assign(rows.get("form-versions")[0], {
    data_schema: { type: "object", properties: { name: { type: "string" } } },
    render_schema: {
      dialect: "bpms.render/1",
      root: {
        component: "vertical",
        children: [
          {
            component: "text",
            node_key: "sample_name",
            scope: "/properties/name",
            label: "Sample name",
          },
        ],
      },
    },
  });
  if (typedChoice) {
    const form = rows.get("form-versions")[0];
    form.data_schema.properties.decision = {
      type: ["string", "number", "boolean"],
    };
    form.render_schema.root.children.push({
      component: "choice",
      node_key: "decision",
      label: "Decision",
      scope: "/properties/decision",
      source: {
        kind: "custom",
        items: [{ key: "option1", value: "Option 1" }],
      },
    });
  }

  rows.get("workflows").push({
    ...rows.get("workflows")[0],
    ref_id: "fixture-empty-workflow",
    code: "empty",
    name: "Empty workflow",
  });
  const data = (value) => ({ success: true, data: value });
  const page = (items, body) => ({
    success: true,
    result: {
      items,
      page: body.page ?? 1,
      size: body.size ?? 20,
      total: items.length ? 45 : 0,
      total_pages: items.length ? Math.ceil(45 / (body.size ?? 20)) : 0,
    },
  });
  return {
    calls,
    handle(method, url, raw) {
      if (
        method === "POST" &&
        [
          "/api/v1/me/saved-views/search",
          "/api/v1/me/favorites/search",
        ].includes(url)
      ) {
        const body = JSON.parse(raw);
        return {
          success: true,
          result: {
            items: [],
            page: body.page,
            size: body.size,
            total: 0,
            total_pages: 0,
          },
        };
      }
      if (method === "POST" && url === "/api/v1/resource-links") {
        const body = JSON.parse(raw);
        return data({
          ...body,
          available: true,
          route_key: body.kind,
          label: "Example " + body.kind,
          locator: "fixture-stable-" + body.ref_id,
        });
      }
      if (method === "POST" && url === "/api/v1/forms/options") {
        return formOptionsFixture(JSON.parse(raw));
      }
      if (method === "POST" && url === "/api/v1/forms/runtime-preview") {
        const body = JSON.parse(raw);
        calls.push({
          method,
          key: "forms",
          reference: "runtime-preview",
          body,
        });
        return formPreviewFixture(body);
      }
      const [, , , key, reference, action] = new URL(
        url,
        "http://fixture.invalid",
      ).pathname.split("/");
      if (
        key === "designer" &&
        reference === "selectors" &&
        ["forms", "workflows", "request_types"].includes(action)
      ) {
        const body = raw ? JSON.parse(raw) : {};
        const matches = rows.get(action.replaceAll("_", "-")) ?? [];
        return page(
          matches
            .filter(
              (row) =>
                !body.search ||
                row.name.toLowerCase().includes(body.search.toLowerCase()),
            )
            .map((row) => ({ key: row.ref_id, value: row.name })),
          body,
        );
      }
      if (key === "resource-links" && reference === "selected") {
        const body = raw ? JSON.parse(raw) : {};
        const owned = (body.resources ?? []).every((item) =>
          rows.has(item.kind.replaceAll("_", "-")),
        );
        if (!owned) return null;
        return data(
          body.resources.map((item) => {
            const row = rows
              .get(item.kind.replaceAll("_", "-"))
              .find((candidate) => candidate.ref_id === item.ref_id);
            return {
              kind: item.kind,
              ref_id: item.ref_id,
              available: !!row,
              label: row?.name ?? "",
              number: row?.number ?? null,
            };
          }),
        );
      }
      if (key === "designer" && reference === "library") {
        const body = raw ? JSON.parse(raw) : {};
        calls.push({ method, key, reference, action, body });
        if (action === "search")
          return page(
            [
              {
                kind: "component",
                ref_id: "library-version",
                root_ref_id: "library-root",
                code: "library-card",
                title: "Reusable example",
                number: 1,
                status: "PUBLISHED",
                category: "layout",
              },
            ],
            body,
          );
        if (action === "select")
          return page(
            [{ key: "library-version", value: "Reusable example" }],
            body,
          );
        if (action === "templates")
          return data({
            ref_id: "created-template",
            name: body.name,
            status: "DRAFT",
          });
        return data({});
      }
      if (!rows.has(key)) return null;
      const body = raw ? JSON.parse(raw) : {};
      calls.push({ method, key, reference, action, body });
      if (action === "graph")
        return data({
          steps: [
            {
              key: "prepare",
              type_code: "transform",
              type_version_ref: "type-v1",
            },
            {
              key: "review",
              type_code: "approval",
              type_version_ref: "type-v1",
            },
          ],
          transitions: [
            { source: "prepare", target: "review", outcome: "ready" },
          ],
          bindings: [],
        });
      if (action === "workspace")
        return data({
          workspace_ref_id: "workspace",
          workflow_version_ref_id: reference,
          document: {
            dialect: "bpms.workspace/1",
            graph: { steps: [], transitions: [], bindings: [] },
            positions: {
              prepare: { x: 40, y: 40 },
              review: { x: 350, y: 100 },
            },
            viewport: { x: 0, y: 0, zoom: 1 },
            collapsed: [],
            routing: {},
          },
        });
      if (reference === "select") {
        return page(
          rows
            .get(key)
            .filter(
              (row) =>
                !body.search ||
                String(row.name ?? row.version)
                  .toLowerCase()
                  .includes(body.search.toLowerCase()),
            )
            .map((row) => ({
              key: row.ref_id,
              value: row.name ?? row.version,
            })),
          body,
        );
      }
      if (reference === "search") {
        if (
          key === "workflow-versions" &&
          body.workflow_ref_id === "fixture-empty-workflow"
        )
          return page([], body);
        return page(rows.get(key), body);
      }
      if (reference === "report") return page(rows.get(key), body);
      if (action === "history")
        return page(
          [
            {
              operation: "UPDATE",
              changed_at: "2026-10-04T08:00:00Z",
              from_values: { password: "hidden", name: null },
              to_values: { name: "Changed" },
            },
          ],
          body,
        );
      const row =
        rows.get(key).find((row) => row.ref_id === reference) ??
        rows.get(key)[0];
      if (method === "PUT") {
        Object.assign(row, body, { ref_id: "fixture-" + key + "-v2" });
        return data(row);
      }
      if (action === "publish") {
        row.status = "PUBLISHED";
        row.ref_id = "fixture-" + key + "-published";
        return data(row);
      }
      if (!reference && method === "POST") {
        const created = {
          ...row,
          ...body,
          ref_id: "fixture-" + key + "-created",
        };
        rows.get(key).push(created);
        return data(created);
      }
      return data(row);
    },
  };
}
export const studioCatalogBrowserScript = String.raw`
 const root=()=>document.querySelector('app-resource-catalog');
 const button=(scope,label)=>[...scope.querySelectorAll('button')].find(b=>(b.textContent.trim()||b.getAttribute('aria-label'))===label);
 const click=async(scope,label)=>{await wait(()=>button(scope,label)&&!button(scope,label).disabled,label);button(scope,label).click();await new Promise(r=>setTimeout(r,40));};
 const modal=()=>document.querySelector('.p-dialog') ?? document.querySelector('.page-editor');
 const fill=(id,value)=>{const input=document.getElementById(id);check(input,'Missing '+id);input.value=value;input.dispatchEvent(new Event('input',{bubbles:true}));};
 const navigate=async(key)=>{history.pushState(null,'','/studio/'+key);window.dispatchEvent(new PopStateEvent('popstate'));await wait(()=>root()?.querySelector('h1')?.textContent.trim()===titles[key]&&!root().textContent.includes('Loading…'),key);};
 const titles={'forms':'Forms','workflows':'Workflows','clients':'Clients','request-types':'Request types','form-components':'Reusable components','form-data-types':'Reusable data types','form-versions':'Form versions','workflow-versions':'Workflow versions','client-releases':'Client releases','form-component-versions':'Component versions','form-data-type-versions':'Data type versions'};
 const confirm=async()=>{await wait(()=>document.querySelector('dialog')?.open,'Confirm');await click(document.querySelector('dialog'),'Continue');};
 await wait(()=>root()?.querySelector('tbody button'),'Catalog table');
 check(!document.getElementById('author-name'),'Create form displayed under list');
 await auditAccessibility('studio-forms-light');
 const table=root().querySelector('app-record-table');const pager=table.querySelector('nav');check(pager.compareDocumentPosition(table.querySelector('p-table'))&Node.DOCUMENT_POSITION_PRECEDING,'Pagination is not below table');
 const pageSize=pager.querySelector('[role=combobox]');check(pageSize.textContent.trim()==='25','Saved page size is readable');check(pager.textContent.includes('Page 1 of 2'),'Saved page size governs initial pagination');pageSize.click();await wait(()=>document.getElementById(pageSize.getAttribute('aria-controls')),'Owned page-size options');const sizeList=document.getElementById(pageSize.getAttribute('aria-controls'));const twenty=[...sizeList.querySelectorAll('[role=option]')].find(option=>option.textContent.trim()==='20');check(twenty,'Standard 20-row option');twenty.click();await wait(()=>pageSize.textContent.trim()==='20'&&pager.textContent.includes('Page 1 of 3'),'Explicit pagination size');
 await click(pager,'Last');await wait(()=>pager.textContent.includes('Page 3 of 3'),'last page');await click(pager,'First');await wait(()=>pager.textContent.includes('Page 1 of 3'),'first page');const pageInput=pager.querySelector('input[type="number"]');pageInput.value='2';pageInput.dispatchEvent(new Event('input',{bubbles:true}));await click(pager,'Go');await wait(()=>pager.textContent.includes('Page 2 of 3'),'custom page');await click(pager,'Next');await wait(()=>pager.textContent.includes('Page 3 of 3'),'next page');await click(pager,'Previous');await wait(()=>pager.textContent.includes('Page 2 of 3'),'previous page');await click(pager,'First');await wait(()=>pager.textContent.includes('Page 1 of 3'),'first page restored');
 const headerFilter=table.querySelector('thead button[aria-label="Filter Code"]');check(headerFilter,'Header filter missing');headerFilter.click();await wait(()=>document.querySelector('.column-filter input[name="value"]'),'header filter popup');await wait(()=>document.querySelector('.column-filter')?.contains(document.activeElement),'header filter focus');await auditAccessibility('studio-header-filter-open');const filterForm=document.querySelector('.column-filter');check(filterForm.contains(document.activeElement),'Header filter focus escaped');const filterValue=filterForm.querySelector('input[name="value"]');filterValue.value='example';filterValue.dispatchEvent(new Event('input',{bubbles:true}));await click(filterForm,'Apply');await wait(()=>!document.querySelector('.column-filter')&&table.querySelector('.filter-active'),'header filter applied');await auditAccessibility('studio-header-filter-applied');headerFilter.click();await wait(()=>document.querySelector('.column-filter'),'header filter reopen');await click(document.querySelector('.column-filter'),'Clear');await wait(()=>!document.querySelector('.column-filter')&&!table.querySelector('.filter-active'),'header filter cleared');const sort=table.querySelector('thead button[aria-label="Sort Code"]');sort.click();await wait(()=>table.querySelector('th[aria-sort="ascending"]'),'ascending header');sort.click();await wait(()=>table.querySelector('th[aria-sort="descending"]'),'descending header');sort.click();await wait(()=>!table.querySelector('th[aria-sort="descending"]'),'sort cleared');

 const advanced=root().querySelector('app-list-query');check(advanced.getBoundingClientRect().top<table.getBoundingClientRect().top,'Advanced filters are below table');await click(advanced,'Advanced filters');await click(advanced,'Add filter');await wait(()=>advanced.querySelector('[data-query-operation="0"] [role="combobox"]'),'Advanced condition');advanced.querySelector('[data-query-operation="0"] [role="combobox"]').click();await wait(()=>[...document.querySelectorAll('[role="option"]')].some(option=>option.textContent.trim()==='Is not one of'),'List condition');[...document.querySelectorAll('[role="option"]')].find(option=>option.textContent.trim()==='Is not one of').click();await wait(()=>advanced.querySelector('app-list-values input'),'List values');const fillValue=(input,value)=>{input.value=value;input.dispatchEvent(new Event('input',{bubbles:true}));};fillValue(advanced.querySelector('app-list-values input'),'excluded-one');await click(advanced,'Add value');await wait(()=>advanced.querySelectorAll('app-list-values input').length===2,'Added list value');fillValue(advanced.querySelectorAll('app-list-values input')[1],'remove-this');advanced.querySelector('app-list-values button[aria-label="Remove 2"]').click();await wait(()=>advanced.querySelectorAll('app-list-values input').length===1,'Removed list value');await click(advanced,'Add value');await wait(()=>advanced.querySelectorAll('app-list-values input').length===2,'Another list value');fillValue(advanced.querySelectorAll('app-list-values input')[1],'excluded-two');await click(advanced,'Apply');await wait(()=>!root().textContent.includes('Loading…'),'Applied list values');await auditAccessibility('studio-advanced-list-values',advanced);await click(advanced,'Clear');await wait(()=>!advanced.querySelector('app-list-values'),'List values cleared');await click(advanced,'Advanced filters');
 await click(root(),'Create');await wait(()=>modal()?.querySelector('#author-name'),'Create dialog');await auditAccessibility('studio-create-dialog');for(const control of modal().querySelectorAll('input[required],textarea[required],select[required]')){const label=modal().querySelector('label[for="'+control.id+'"]');const star=label?.querySelector('span[aria-hidden="true"]');check(star?.textContent.trim()==='*','Missing required marker '+control.id);check(Math.abs(star.getBoundingClientRect().top-label.getBoundingClientRect().top)<8,'Required marker below label');} 
 await wait(()=>modal()?.contains(document.activeElement),'Create dialog focus');
 check(modal().contains(document.activeElement),'Create dialog focus escaped');
 check(!document.querySelector('.p-dialog'),'Ordinary creation must be a page');check(modal().querySelector('.page-editor-toolbar'),'Persistent save toolbar missing');fill('author-code','added');fill('author-name','Added form');await click(modal(),'Save');await wait(()=>!modal()&&root().textContent.includes('Added form'),'Created detail');
 await click(root(),'Back to list');await wait(()=>root().querySelector('tbody button[aria-label="Edit"]'),'Studio direct edit');await click(root(),'Edit');await wait(()=>modal()?.querySelector('#author-name'),'Edit dialog');fill('author-name','Renamed form');await click(modal(),'Save');await wait(()=>!modal()&&root().textContent.includes('Renamed form'),'Saved detail');
 await click(root(),'History');await wait(()=>modal()?.querySelector('tbody button'),'Studio history list');await click(modal(),'Open');await wait(()=>modal()?.querySelector('.change-comparison tbody tr'),'Studio history comparison');const historyRow=modal().querySelector('.change-comparison tbody tr');check(historyRow.textContent.includes('Name')&&historyRow.textContent.includes('No value')&&historyRow.textContent.includes('Changed'),'Studio comparison values');check(!modal().querySelector('pre')&&!modal().textContent.includes('hidden'),'Studio raw history or secret');await auditAccessibility('studio-history-comparison',modal());modal().querySelector('.p-dialog-close-button').click();await wait(()=>!modal(),'Studio history closed');
 await click(root(),'Back to list');await wait(()=>root()?.querySelector('tbody button')&&!root().textContent.includes('Loading…'),'Back to list');await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));
 await click(root(),'Advanced filters');await click(root(),'Add filter');await wait(()=>root().querySelector('input[data-query-value="0"]'),'Filter');const val=root().querySelector('input[data-query-value="0"]');val.value='example';val.dispatchEvent(new Event('input',{bubbles:true}));await click(root().querySelector('app-list-query'),'Apply');await wait(()=>!root().textContent.includes('Loading…'),'Apply');val.value='unapplied';val.dispatchEvent(new Event('input',{bubbles:true}));await click(root(),'Preview report');await confirm();await wait(()=>modal()?.textContent.includes('Report preview'),'Report');check(modal().textContent.includes('Renamed form'),'Typed report result');modal().querySelector('.p-dialog-close-button').click();await wait(()=>!modal(),'Report preview closed');check(root().querySelector('tbody').textContent.includes('Renamed form'),'Report replaced list');

 // Creation reuses the existing form and version contracts with a blank document.
 await navigate('forms');await click(root(),'Open');await wait(()=>root().querySelector('a[href*="form-versions"]'),'Form actions');
 [...root().querySelectorAll('a')].find(link=>link.textContent.trim()==='Create draft').click();
 await wait(()=>modal()?.querySelector('#author-number'),'Blank draft creation');
 check(!modal().querySelector('textarea'),'No required document JSON in normal draft creation');
 fill('author-number','2');await click(modal(),'Save');await wait(()=>!modal()&&root().querySelector('a[href$="/edit"]'),'Draft created');
 check(root().textContent.includes('DRAFT'),'Created version remains a draft');
 for(const key of ['workflows','clients','request-types','form-components','form-data-types']){await navigate(key);await wait(()=>root().querySelector('tbody button'),'Table '+key);await auditAccessibility('studio-'+key);
 if(key==='workflows'){
   await click(root(),'Create');await wait(()=>modal()?.querySelector('p-select'),'Workflow access dropdown');
   const access=()=>modal().querySelector('p-select');
   check(!modal().querySelector('select[name="access_mode"]'),'Native access dropdown remains');
   const chooseAccess=async(label)=>{access().querySelector('[role="combobox"]').click();await wait(()=>[...document.querySelectorAll('[role="option"]')].some(option=>option.textContent.trim()===label),'Access options');[...document.querySelectorAll('[role="option"]')].find(option=>option.textContent.trim()===label).click();await wait(()=>access().querySelector('.p-select-label').textContent.trim()===label,'Selected access');};
   await chooseAccess('Open access');access().querySelector('.p-select-clear-icon').dispatchEvent(new MouseEvent('click',{bubbles:true}));await wait(()=>access().textContent.includes('Choose a value'),'Cleared access');await chooseAccess('Restricted access');await chooseAccess('Open access');
   await auditAccessibility('studio-workflow-access-dropdown',modal());fill('author-code','access-choice');fill('author-name','Access choice');await click(modal(),'Save');await wait(()=>!modal()&&root().textContent.includes('Access choice'),'Workflow access saved');await click(root(),'Back to list');
   await click(root(),'Open');await wait(()=>root().querySelector('p-tabs'),'Workflow detail tabs');check(!root().querySelector('app-workflow-diagram'),'Diagram loaded before Display tab');[...root().querySelectorAll('[role="tab"]')].find(tab=>tab.textContent.trim()==='Display').click();await wait(()=>root().querySelector('app-workflow-diagram .board-node'),'Workflow detail diagram');
   check(document.querySelector('nav a[href="/studio/workflows"]'),'Direct workflow navigation missing');
   check(root().querySelectorAll('.board-node').length===2,'Graph steps missing');
   check(root().querySelector('.transition-label')?.textContent==='ready','Transition outcome missing');
   check(!root().querySelector('.workflow-commands'),'Editing actions in diagram');
   const node=root().querySelector('.board-node');node.dispatchEvent(new KeyboardEvent('keydown',{key:'ArrowRight',bubbles:true}));
   await click(root().querySelector('app-workflow-diagram'),'Fit to view');
   node.querySelector('button').click();await wait(()=>root().querySelector('app-workflow-diagram aside'),'Step inspector');
   check(root().querySelector('app-workflow-diagram aside').textContent.includes('ready'),'Transition inspector missing');
   await auditAccessibility('studio-workflow-diagram');
   await click(root(),'Back to list');await wait(()=>root().querySelector('tbody button[aria-label="Open"]')&&!root().querySelector('tbody button[aria-label="Open"]').disabled,'Workflow list for empty canvas');const emptyRow=[...root().querySelectorAll('tbody tr')].find(row=>row.textContent.includes('Empty workflow'));check(emptyRow,'Empty workflow missing');emptyRow.querySelector('button[aria-label="Open"]').click();await wait(()=>root().querySelector('p-tabs'),'Empty workflow tabs');[...root().querySelectorAll('[role="tab"]')].find(tab=>tab.textContent.trim()==='Display').click();await wait(()=>root().querySelector('app-workflow-canvas .canvas-empty'),'Empty workflow canvas');const emptyCanvas=root().querySelector('app-workflow-canvas');check(!emptyCanvas.querySelector('.board-node'),'Empty workflow contains steps');check(emptyCanvas.querySelector('.canvas-stage').getBoundingClientRect().height>=350,'Empty canvas collapsed');await click(emptyCanvas,'Zoom in');await wait(()=>emptyCanvas.querySelector('.zoom-value').textContent==='110%','Empty canvas zoom');await click(emptyCanvas,'Reset view');await wait(()=>emptyCanvas.querySelector('.zoom-value').textContent==='100%','Empty canvas reset');check(button(emptyCanvas,'Fit to view').disabled,'Fit enabled without steps');await auditAccessibility('studio-empty-workflow-display');
 }
 }
 for(const key of ['form-versions','workflow-versions','client-releases','form-component-versions','form-data-type-versions']){await navigate(key);check(button(root(),'Create').disabled,'Unscoped create enabled');await click(root(),'Choose parent');await wait(()=>modal()?.querySelector('tbody button'),'Parent choices');await click(modal(),'Select');await wait(()=>!modal()&&root().querySelector('tbody button'),'Scoped versions');}
 history.pushState(null,'','/studio/library');window.dispatchEvent(new PopStateEvent('popstate'));
 await wait(()=>document.querySelector('app-library-tools tbody button'),'Library list');
 const library=document.querySelector('app-library-tools');
 check(!document.getElementById('template-code'),'Template form displayed underneath library list');
 check(!library.querySelector('.library-advanced').open,'Advanced library tools expanded by default');
 await click(library,'Select');check(button(library,'Create template')&&!button(library,'Create template').disabled,'Template create disabled after selection');
 await click(library,'Create template');await wait(()=>modal()?.querySelector('#template-code'),'Template dialog');fill('template-code','copied');fill('template-name','Copied definition');
 await auditAccessibility('studio-library-template-dialog');await click(modal(),'Cancel');await wait(()=>!modal(),'Cancel template');
 await click(library,'Create template');await wait(()=>modal()?.querySelector('#template-code'),'Template create again');fill('template-code','copied');fill('template-name','Copied definition');await click(modal(),'Create template');await confirm();await wait(()=>!modal(),'Template created');
 await auditAccessibility('studio-library');
 await navigate('form-versions');await click(root(),'Choose parent');await wait(()=>modal()?.querySelector('tbody button'),'Parent dialog');await click(modal(),'Select');await wait(()=>!modal()&&root().querySelector('tbody button'),'Versions');await click(root(),'Open');await wait(()=>button(root(),'Edit'),'Draft detail');await click(root(),'Actions');await wait(()=>document.querySelector('.p-menu'),'Lifecycle action menu');[...document.querySelectorAll('.p-menu [role=menuitem]')].find(item=>item.textContent.trim()==='publish').querySelector('a').click();await confirm();await wait(()=>root().textContent.includes('PUBLISHED'),'Published');check(!button(root(),'Edit'),'Published version editable');

 // Saved and immutable versions use the same runtime renderer in four views.
 check(!root().querySelector('app-form-display'),'Form display loaded before its tab');
 [...root().querySelectorAll('[role="tab"]')].find(tab=>tab.textContent.trim()==='Display').click();
 await wait(()=>root().querySelector('app-form-display app-runtime-form input'),'Form display input');
 const formDisplay=root().querySelector('app-form-display');
 const sampleInput=formDisplay.querySelector('app-runtime-form input');
 sampleInput.value='Preview answer';sampleInput.dispatchEvent(new Event('input',{bubbles:true}));
 await wait(()=>formDisplay.querySelector('app-runtime-form input').value==='Preview answer','Synthetic answer updated');
 const chooseView=async(label)=>{document.getElementById('display-form-state').click();await wait(()=>[...document.querySelectorAll('[role="option"]')].some(option=>option.textContent.trim()===label),'Form view choices');[...document.querySelectorAll('[role="option"]')].find(option=>option.textContent.trim()===label).click();};
 for(const [purpose,label] of [['summary','Summary'],['print','Print view'],['correction','Correction'],['edit','Entry form']]) {
   await chooseView(label);await wait(()=>formDisplay.querySelector('[data-preview-purpose="'+purpose+'"]'),'Form view '+purpose);
   check(formDisplay.textContent.includes('Preview answer')||formDisplay.querySelector('app-runtime-form input')?.value==='Preview answer','Answers retained across views');
   check(formDisplay.textContent.includes('Sample name'),'Saved form definition retained');
   await auditAccessibility('form-display-'+purpose);
 }
 await click(formDisplay,'Reset sample answers');await wait(()=>formDisplay.querySelector('app-runtime-form input')?.value==='','Explicit sample reset');
 await toggleTheme();await wait(()=>document.documentElement.classList.contains('app-dark'),'Dark');await auditAccessibility('studio-published-dark');await chooseLanguage('fa');await wait(()=>document.documentElement.dir==='rtl','RTL');await auditAccessibility('studio-published-rtl');
 await fetch('/test-result',{method:'POST',body:JSON.stringify({ok:true,accessibility})});
`;
