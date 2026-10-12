import { formPreviewFixture } from "./form-preview-fixture.mjs";
export function createFoundationsFixture() {
  let read = false;
  let bulkMode = false;
  let bulkArrivalStaged = false;
  const bulkUnread = new Set(
    Array.from({ length: 21 }, (_, index) => "bulk-" + index),
  );
  const bulkCreated = "2026-10-12T03:00:00Z";
  const bulkItem = (ref) => ({
    ...item(ref),
    created_at: ref === "bulk-new" ? "2026-10-12T04:00:00Z" : bulkCreated,
    read_at: bulkUnread.has(ref) ? null : "2026-10-12T05:00:00Z",
  });
  let form = {
    ref_id: "form-fixture-current",
    status: "DRAFT",
    data_schema: {
      type: "object",
      properties: { amount: { type: "integer", minimum: 0 } },
    },
    render_schema: {
      dialect: "bpms.render/1",
      root: {
        component: "vertical",
        children: [
          {
            component: "integer",
            node_key: "stable_amount",
            scope: "/properties/amount",
            label: "Amount",
            options: { read_only: false },
          },
        ],
      },
    },
    reuse_instances: { retained: true },
  };
  let formRevision = 0;
  const item = (ref = "notice-old") => ({
    schema_version: 1,
    template_key: "fixture",
    template_version: "1",
    locale: "en",
    priority: 1,
    target: {
      kind: "account",
      route_key: "me",
      available: true,
      ref_id: "actor",
    },
    ref_id: ref,
    subject: "Inbox fixture subject",
    status: "DELIVERED",
    created_at: "2026-10-08T08:00:00Z",
    content: "Safe fixture body",
    read_at: read ? "2026-10-08T09:00:00Z" : null,
  });
  return {
    handle(method, path, body) {
      if (method === "POST" && path === "/api/v1/forms/runtime-preview")
        return formPreviewFixture(JSON.parse(body));
      if (path.split("?")[0] === "/api/v1/me/help-state" && method === "GET")
        return {
          success: true,
          data: {
            release_key: null,
            states: { items: [], page: 1, size: 100, total: 0, total_pages: 0 },
          },
        };
      if (
        path === "/api/v1/me/help-state/seen" ||
        path === "/api/v1/me/help-state/dismiss"
      )
        return {
          success: true,
          data: { saved: false, reason: "manifest_unavailable", state: null },
        };
      if (path === "/api/v1/me/help-state/reset")
        return { success: true, data: { deleted_records: 0 } };
      if (path.startsWith("/api/v1/form-versions/form-fixture")) {
        if (method === "GET") return { success: true, data: form };
        if (
          method === "PUT" &&
          path === "/api/v1/form-versions/" + form.ref_id
        ) {
          form = {
            ...form,
            ...JSON.parse(body),
            ref_id: "form-fixture-" + ++formRevision,
          };
          return { success: true, data: form };
        }
      }
      if (path === "/api/v1/inbox/unread")
        return {
          success: true,
          data: { total: bulkMode ? bulkUnread.size : read ? 0 : 31 },
        };
      if (path === "/api/v1/inbox/search") {
        const query = JSON.parse(body);
        if (
          query.sort_orders?.some(
            (sort) =>
              sort.field_name === "created_at" && sort.operation === "desc",
          )
        )
          bulkMode = true;
        if (bulkMode) {
          const cutoff = query.filters?.find(
            (filter) =>
              filter.field_name === "created_at" && filter.operation === "lte",
          )?.value;
          const rows = [
            ...Array.from({ length: 21 }, (_, index) => "bulk-" + index),
            ...(bulkUnread.has("bulk-new") ? ["bulk-new"] : []),
          ]
            .map(bulkItem)
            .filter(
              (row) =>
                (!query.unread || row.read_at === null) &&
                (!cutoff || row.created_at <= cutoff),
            );
          const result = {
            success: true,
            result: {
              items: rows.slice((query.page - 1) * 20, query.page * 20),
              page: query.page,
              size: 20,
              total: rows.length,
              total_pages: Math.ceil(rows.length / 20),
            },
          };
          if (!cutoff && !bulkArrivalStaged) {
            bulkUnread.add("bulk-new");
            bulkArrivalStaged = true;
          }
          return result;
        }
        const unread = query.filters?.some(
          (filter) =>
            filter.field_name === "read_at" && filter.operation === "isNull",
        );
        return {
          success: true,
          result: {
            items:
              unread && read
                ? []
                : [
                    item(),
                    {
                      ...item("notice-fail"),
                      subject: "Inbox fixture failure",
                    },
                  ],
            page: query.page,
            size: 20,
            total: unread && read ? 0 : 31,
            total_pages: unread && read ? 0 : 2,
          },
        };
      }
      if (bulkMode && path.startsWith("/api/v1/inbox/bulk-")) {
        const ref = path.split("/")[4];
        if (method === "POST" && path.endsWith("/read")) bulkUnread.delete(ref);
        return { success: true, data: bulkItem(ref) };
      }
      if (
        method === "GET" &&
        ["/api/v1/inbox/notice-old", "/api/v1/inbox/notice-current"].includes(
          path,
        )
      )
        return { success: true, data: item("notice-current") };
      if (method === "POST" && path === "/api/v1/inbox/notice-current/read") {
        read = true;
        return { success: true, data: item("notice-read") };
      }
      if (method === "GET" && path === "/api/v1/inbox/notice-fail")
        return {
          success: false,
          code: "TECH_FAILED",
          data: { private_payload: "never-display-private-payload" },
        };
      return null;
    },
  };
}
export const foundationsBrowserScript = `
  await wait(()=>document.querySelector('app-help-page'),'help page');
  const help=document.querySelector('app-help-page');
  check(!help.textContent.includes('Viewed this session'),'opening a route must not mark help viewed');
  const topic=help.querySelector('[data-help-key="requests.start"]');
  const opener=topic.querySelector('button');opener.focus();opener.click();
  await wait(()=>help.querySelector('article h2')===document.activeElement,'help topic focus');
  check(topic.textContent.includes('Viewed this session'),'explicit viewed status');
  [...help.querySelectorAll('article button')].find(button=>button.textContent.trim()==='Close').click();
  check(document.activeElement===opener,'help restores initiating focus');
  await chooseLanguage('fa');
  await wait(()=>topic.textContent.includes('در این نشست مشاهده نشده'),'help locale-specific status');
  opener.click();await wait(()=>help.querySelector('article[lang="fa"]'),'Persian help content');
  await auditAccessibility('help-persian');
  await chooseLanguage('en');
  topic.querySelectorAll('button')[1].click();
  await wait(()=>topic.textContent.includes('Dismissed this session'),'dismissed help');
  [...help.querySelectorAll('button')].find(button=>button.textContent.trim()==='Reset saved help status').click();
  await wait(()=>document.querySelector('dialog')?.open,'help reset confirmation');
  [...document.querySelector('dialog').querySelectorAll('button')].find(button=>button.textContent.trim()==='Continue').click();
  await wait(()=>topic.textContent.includes('Not viewed this session'),'explicit help-only reset');
  const router=window.ng.getComponent(document.querySelector('app-app-shell')).router;
  await router.navigateByUrl('/operations/notifications');
  await wait(()=>document.querySelector('app-personal-services')?.textContent.includes('Inbox fixture subject'),'notification list');
  const services=document.querySelector('app-personal-services');
  const vm=window.ng.getComponent(services);
  check(vm.total()===31,'server total differs from page length');
  const readControl=document.getElementById('notification-read');check(readControl.getAttribute('role')==='combobox'&&readControl.getAttribute('aria-label')==='Read status'&&readControl.tabIndex===0,'named keyboard-accessible inbox filter');readControl.click();
  await wait(()=>[...document.querySelectorAll('[role="option"]')].some(option=>option.textContent.trim()==='Unread'),'unread option');
  [...document.querySelectorAll('[role="option"]')].find(option=>option.textContent.trim()==='Unread').click();
  const search=document.getElementById('notification-search');search.value='Inbox';search.dispatchEvent(new Event('input',{bubbles:true}));
  services.querySelector('form').dispatchEvent(new Event('submit',{bubbles:true,cancelable:true}));
  await wait(()=>!vm.busy()&&vm.total()===31,'applied inbox query');
  const row=[...services.querySelectorAll('button')].find(button=>button.textContent.trim()==='Inbox fixture subject');
  row.click();await wait(()=>vm.detail()?.ref==='notice-current','ref refreshed on open');
  check(vm.detail().read===false,'opening detail does not mark read');
  await wait(()=>[...services.querySelectorAll('button')].some(button=>button.textContent.trim()==='Mark read'&&!button.disabled),'mark-read action ready');
  [...services.querySelectorAll('button')].find(button=>button.textContent.trim()==='Mark read').click();
  await wait(()=>vm.detail()?.read===true,'current-ref explicit mark-read');
  await auditAccessibility('notification-detail');
  await wait(()=>!vm.busy()&&vm.total()===0,'read removed from applied unread list');
  check(vm.readFilter==='unread'&&search.value==='Inbox','live reconciliation preserved inbox filters');
  document.getElementById('notification-read').click();
  await wait(()=>[...document.querySelectorAll('[role="option"]')].some(option=>option.textContent.trim()==='All notifications'),'all notifications option');
  [...document.querySelectorAll('[role="option"]')].find(option=>option.textContent.trim()==='All notifications').click();
  await wait(()=>vm.readFilter==='all','all notification filter selected');
  services.querySelector('form').dispatchEvent(new Event('submit',{bubbles:true,cancelable:true}));
  await wait(()=>!vm.busy()&&vm.total()===31&&[...services.querySelectorAll('button')].some(button=>button.textContent.trim()==='Inbox fixture failure'&&!button.disabled),'all notifications restored for support failure');
  [...services.querySelectorAll('button')].find(button=>button.textContent.trim()==='Inbox fixture failure').click();
  await wait(()=>document.querySelector('app-error-notification button[aria-label="Copy request reference: fixture-request-001"]'),'returned support reference');
  check(!document.querySelector('app-root').textContent.includes('never-display-private-payload'),'support notice excludes private response body');
  let copiedReference=null;
  const descriptor=Object.getOwnPropertyDescriptor(navigator,'clipboard');
  Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText:async value=>{copiedReference=value;}}});
  document.querySelector('app-error-notification button[aria-label="Copy request reference: fixture-request-001"]').click();
  await wait(()=>copiedReference==='fixture-request-001','copy exact returned reference');
  if(descriptor){Object.defineProperty(navigator,'clipboard',descriptor);}else{delete navigator.clipboard;}
  await wait(()=>document.querySelector('app-error-notification').getAnimations({subtree:true}).every(animation=>animation.playState!=='running'),'support toast animation settled');
  await auditAccessibility('support-reference');
  document.querySelector('app-error-notification .p-toast-close-button').click();
  const bulkButton = [...services.querySelectorAll('button')].find(button=>button.textContent.trim()==='Mark all as read');
  check(bulkButton && !bulkButton.disabled,'mark all read available');bulkButton.click();
  await wait(()=>services.textContent.includes('Existing notifications are marked as read.')&&!bulkButton.disabled,'bulk read finished');
  check(vm.preview.unreadCount()===1,'notification arriving during batch remains unread');
  await auditAccessibility('notification-mark-all-read');
  document.querySelector('button[aria-label="Notifications"]').click();
  await wait(()=>document.querySelector('#notification-panel app-inbox-read-control button')&&!document.querySelector('#notification-panel app-inbox-read-control button').disabled,'bell mark all read action');
  document.querySelector('#notification-panel app-inbox-read-control button').click();
  await wait(()=>vm.preview.unreadCount()===0&&document.querySelector('#notification-panel app-inbox-read-control button').disabled,'bell batch refreshes unread badge');
  document.querySelector('button[aria-label="Notifications"]').click();
  await router.navigateByUrl('/operations/foundation-preview');
  await wait(()=>document.querySelector('app-calendar-views'),'calendar preview');
  const calendar=document.querySelector('app-calendar-views');
  const readiness=document.querySelector('app-readiness-panel');
  await wait(()=>readiness.textContent.includes('Overall status: Unknown')&&calendar.textContent.includes('Calendar fixture holiday'),'required unknown prevents ready');
  const views=()=>[...calendar.querySelectorAll('[role="group"] button')];
  for(const mode of ['Week','Month','Agenda']) {
    const control=views().find(button=>button.textContent.trim()===mode);control.focus();control.click();
    await wait(()=>control.getAttribute('aria-pressed')==='true','calendar '+mode);
    check(calendar.textContent.includes('Calendar fixture holiday')&&calendar.textContent.includes('Calendar fixture deadline'),'consistent events '+mode);
  }
  await auditAccessibility('calendar-agenda');
  await chooseLanguage('fa');await wait(()=>calendar.textContent.includes('تمام روز'),'Persian calendar');
  check(document.documentElement.dir==='rtl','calendar RTL');
  check(calendar.querySelector('time').getAttribute('datetime')==='2026-10-08','Gregorian civil day remains exact');
  await auditAccessibility('calendar-persian');
  const preview=window.ng.getComponent(document.querySelector('app-foundation-preview'));
  preview.projection.set({status:'failed',stale:false,events:[]});
  await wait(()=>calendar.querySelector('[role="alert"]'),'calendar failure');
  check(!calendar.textContent.includes('رویدادی در این بازه'),'failure must not appear empty');
  preview.projection.set({status:'ready',stale:false,events:[]});
  await wait(()=>calendar.textContent.includes('رویدادی در این بازه'),'genuine calendar empty');
  await chooseLanguage('en');
  const inspector=document.querySelector('app-form-inspector');
  const fieldLabel=document.getElementById('field-label');fieldLabel.value='Friendly amount';fieldLabel.dispatchEvent(new Event('input',{bubbles:true}));
  [...inspector.querySelectorAll('button')].find(button=>button.textContent.trim()==='Apply properties').click();
  await wait(()=>preview.documents().render_schema.root.children[0].label==='Friendly amount','typed inspector apply');
  check(preview.documents().render_schema.root.children[0].node_key==='amount_node'&&preview.documents().data_schema.properties.amount.minimum===0&&preview.documents().reuse_instances.retained,'identity and untouched metadata retained');
  await auditAccessibility('form-authoring-english');
  const metric=document.querySelector('app-metric-card');check(metric.textContent.includes('Total: 0')&&metric.querySelector('table'),'metric zero and accessible table');
  const measurements=[];
  for(const size of [25,100,250]) {
    const started=performance.now();preview.canvasSize.set(size);
    await wait(()=>document.querySelectorAll('app-workflow-canvas .board-node').length===size,'measured canvas '+size);
    await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));
    const canvas=document.querySelector('app-workflow-canvas');await wait(()=>window.ng.getComponent(canvas).rendered(),'Foblex nodes measured '+size);
    const before=canvas.querySelector('.board-node').style.transform;
    canvas.querySelector('.board-node').dispatchEvent(new KeyboardEvent('keydown',{key:'ArrowRight',bubbles:true,cancelable:true}));
    check(canvas.querySelector('.board-node').style.transform===before,'read-only movement guard '+size);
    measurements.push({nodes:size,renderMilliseconds:Number((performance.now()-started).toFixed(2)),evidence:'fixture-only'});
  }
  preview.canvasSize.set(25);await wait(()=>document.querySelectorAll('app-workflow-canvas .board-node').length===25,'restore canvas size');
  await wait(()=>document.getElementById('canvas-find').getAttribute('aria-disabled')!=='true','canvas controls rendered');document.getElementById('canvas-find').click();await wait(()=>[...document.querySelectorAll('[role="option"]')].some(option=>option.textContent.includes('measure_12')),'find-node options');
  [...document.querySelectorAll('[role="option"]')].find(option=>option.textContent.includes('measure_12')).click();await wait(()=>preview.canvasSelected()==='measure_12','find centers selected node');
  await chooseLanguage('fa');await wait(()=>inspector.textContent.includes('اعمال ویژگی‌ها'),'localized inspector');
  check(document.documentElement.dir==='rtl','authoring and metrics RTL');await auditAccessibility('form-authoring-persian');
  await chooseLanguage('en');await router.navigateByUrl('/studio/form-versions/form-fixture/edit');
  await wait(()=>document.querySelector('app-form-builder'),'form builder route');
  const builder=document.querySelector('app-form-builder');const editorVm=window.ng.getComponent(builder);
  await wait(()=>!editorVm.busy()&&editorVm.reference()==='form-fixture-current','fresh form reference');
  [...builder.querySelectorAll('.designer ul button')].find(button=>button.textContent.trim()==='Amount').click();
  await wait(()=>document.getElementById('field-label').value==='Amount','selected field inspector');
  const labelInput=document.getElementById('field-label');labelInput.value='Friendly amount';labelInput.dispatchEvent(new Event('input',{bubbles:true}));
  [...builder.querySelectorAll('button')].find(button=>button.textContent.trim()==='Apply properties').click();
  await wait(()=>!editorVm.pending().length,'applied typed field edit');
  await wait(()=>[...builder.querySelectorAll('button')].some(button=>button.textContent.trim()==='Save draft'&&!button.disabled),'save button rendered enabled');
  [...builder.querySelectorAll('button')].find(button=>button.textContent.trim()==='Save draft').click();
  await wait(()=>editorVm.reference()==='form-fixture-1'&&!editorVm.busy(),'save replaces current reference');
  builder.querySelector('.designer ul button').click();
  builder.querySelector('.designer > .form-palette details > summary').click();
  const nameInput=document.getElementById('property-name');nameInput.value='note';nameInput.dispatchEvent(new Event('input',{bubbles:true}));
  const displayInput=document.getElementById('component-label');displayInput.value='Note label';displayInput.dispatchEvent(new Event('input',{bubbles:true}));
  await wait(()=>[...builder.querySelectorAll('button')].some(button=>button.textContent.trim()==='Add to selected layout'&&!button.disabled),'add button rendered enabled');
  [...builder.querySelectorAll('button')].find(button=>button.textContent.trim()==='Add to selected layout').click();
  await wait(()=>editorVm.outline().length===3,'keyboard-friendly add with independent label');
  const addedKey=editorVm.documents().render_schema.root.children[1].node_key;
  await wait(()=>[...builder.querySelectorAll('button')].some(button=>button.textContent.trim()==='Save draft'&&!button.disabled),'save button rendered enabled');
  [...builder.querySelectorAll('button')].find(button=>button.textContent.trim()==='Save draft').click();
  await wait(()=>editorVm.reference()==='form-fixture-2'&&!editorVm.busy(),'second save uses replaced reference');
  builder.querySelector('button[aria-label="Reload"]').click();await wait(()=>!editorVm.busy()&&editorVm.outline().length===3,'saved form reopened');
  check(editorVm.documents().render_schema.root.children[0].label==='Friendly amount'&&editorVm.documents().render_schema.root.children[0].node_key==='stable_amount'&&editorVm.documents().render_schema.root.children[1].node_key===addedKey&&editorVm.documents().render_schema.root.children[1].scope==='/properties/note','form roundtrip preserves keys/scopes/labels');
  check(editorVm.documents().data_schema.properties.amount.minimum===0&&editorVm.documents().reuse_instances.retained,'form save retains canonical and reuse metadata');

  const formCards=builder.querySelector('app-form-canvas');
  [...formCards.querySelectorAll('.field-type-buttons button')].find(button=>button.textContent.trim()==='Text').click();
  await wait(()=>editorVm.outline().length===4&&editorVm.selected().length,'Visual field added');
  const cardKey=editorVm.outline().at(-1).identity;
  check(editorVm.outline().at(-1).scope==='/properties/field_1','Automatic stable field key');
  await wait(()=>[...formCards.querySelectorAll('.field-card')].at(-1)?.getAttribute('aria-pressed')==='true','New field selected in the rendered canvas');
  const visualLabel=document.getElementById('field-label');visualLabel.value='Visual field';visualLabel.dispatchEvent(new Event('input',{bubbles:true}));
  [...builder.querySelectorAll('button')].find(button=>button.textContent.trim()==='Apply properties').click();
  await wait(()=>formCards.textContent.includes('Visual field'),'Card label updated');
  const outlineBefore=JSON.stringify(editorVm.documents());
  [...builder.querySelectorAll('button')].find(button=>button.textContent.trim()==='Preview').click();
  await wait(()=>!editorVm.busy()&&builder.querySelector('app-runtime-form input'),'Unsaved form rendered');
  check(JSON.stringify(editorVm.documents())===outlineBefore&&editorVm.dirty(),'Preview preserves unsaved design');
  check(editorVm.outline().at(-1).identity===cardKey,'Preview preserves field identity');
  await auditAccessibility('form-builder-english');await chooseLanguage('fa');await wait(()=>builder.textContent.includes('اعمال ویژگی‌ها'),'form builder Persian');await auditAccessibility('form-builder-persian');
  check(localStorage.length===0&&sessionStorage.length===0,'no personal browser persistence');
  await fetch('/test-result',{method:'POST',body:JSON.stringify({ok:true, accessibility, measurements})});
`;
