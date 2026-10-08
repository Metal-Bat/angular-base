// Disposable CRUD data. This fixture never contacts the user's backend.
export function createRecordsFixture() {
  const calls = [];
  const date = "2026-10-04T08:00:00Z";
  let version = 1;
  const created = [];
  let user = {
    ref_id: "fixture-user-v1",
    username: "Ali",
    email: "ali@example.test",
    first_name: "Ali",
    last_name: "Example",
    is_superuser: false,
    is_active: true,
    created_at: date,
    updated_at: null,
    deleted_at: null,
  };
  const admin = {
    ...user,
    ref_id: "fixture-admin-v1",
    username: "Administrator",
    is_superuser: true,
  };
  const role = {
    ref_id: "fixture-role-v1",
    name: "reviewer",
    description: "Review requests",
    permissions: ["requests.start"],
    created_at: date,
    updated_at: null,
    deleted_at: null,
  };
  const permission = {
    ref_id: "fixture-permission-v1",
    name: "requests.start",
    description: "Start requests",
    created_at: date,
    updated_at: null,
    deleted_at: null,
  };
  const report = {
    ref_id: "fixture-report",
    definition_key: "admin.users",
    status: "READY",
    file_name: "users.zip",
    created_at: date,
    expires_at: "2026-10-11T08:00:00Z",
    zip_password: "fixture-archive-password",
  };
  const history = {
    id: "fixture-history",
    operation: "UPDATE",
    changed_at: date,
    modifier_type: "user",
    modifier_id: "fixture-actor",
    reason: "Account updated",
    from_values: { password: "fixture-hidden-password", username: "Ali" },
    to_values: { username: "Ali Edited" },
  };
  const page = (items, query) => ({
    success: true,
    result: {
      items,
      page: query.page ?? 1,
      size: query.size ?? 20,
      total: items.length,
      total_pages: items.length ? 1 : 0,
    },
  });
  const data = (value) => ({ success: true, data: value });
  return {
    calls,
    handle(method, url, body) {
      const path = new URL(url, "http://fixture.invalid").pathname;
      if (
        !path.startsWith("/api/v1/admin/") &&
        !path.startsWith("/api/v1/reports")
      )
        return null;
      const payload = body ? JSON.parse(body) : {};
      calls.push({ method, path, payload });
      if (path.endsWith("/users/select"))
        return page(
          user.deleted_at && !payload.include_deleted
            ? []
            : [
                { key: user.ref_id, value: user.username },
                ...created.map((row) => ({
                  key: row.ref_id,
                  value: row.username,
                })),
              ],
          payload,
        );
      if (path.endsWith("/users/search")) return page([admin], payload);
      if (path.endsWith("/report")) return data(report);
      if (path.includes("/history") || path.endsWith("/history/search"))
        return page([history], payload);
      if (path.endsWith("/roles/search")) return page([role], payload);
      if (path.endsWith("/permissions/search"))
        return page([permission], payload);
      if (path.endsWith("/audit-events/search"))
        return page(
          [
            {
              ref_id: "fixture-audit",
              event_type: "role.assigned",
              success: true,
              user_id: "fixture-actor",
              ip_address: "127.0.0.1",
              created_at: date,
            },
          ],
          payload,
        );
      if (path.endsWith("/reports/search")) return page([report], payload);
      if (path.endsWith("/reports/fixture-report/download")) return null;
      if (path.includes("/reports/")) return data(report);
      if (path.endsWith("/roles")) return data(null);
      if (path.endsWith("/reset-password")) {
        user = {
          ...user,
          ref_id: "fixture-user-v" + ++version,
          updated_at: date,
        };
        return data(null);
      }
      if (path.startsWith("/api/v1/admin/users/")) {
        if (method === "PUT") {
          user = {
            ...user,
            ...payload,
            ref_id: "fixture-user-v" + ++version,
            updated_at: date,
          };
          return data(user);
        }
        if (method === "DELETE") {
          user = {
            ...user,
            ref_id: "fixture-user-v" + ++version,
            is_active: false,
            deleted_at: date,
          };
          return data(null);
        }
        if (path.endsWith("/restore")) {
          user = {
            ...user,
            ref_id: "fixture-user-v" + ++version,
            is_active: true,
            deleted_at: null,
          };
          return data(user);
        }
        return data(path.includes("fixture-admin") ? admin : user);
      }
      if (path.includes("/roles/")) return data(role);
      if (path.includes("/permissions/")) return data(permission);
      if (path.includes("/audit-events/"))
        return data({
          ref_id: "fixture-audit",
          event_type: "role.assigned",
          success: true,
          created_at: date,
          details: { role: "reviewer" },
        });
      if (path.endsWith("/users") && method === "POST") {
        const { password, ...values } = payload;
        const row = { ...user, ...values, ref_id: "fixture-created-user" };
        created.push(row);
        return data(row);
      }
      return data(null);
    },
  };
}
export const recordsBrowserScript = String.raw`
 const root=()=>document.querySelector('app-resource-page');
 const button=(scope,label)=>[...scope.querySelectorAll('button')].find(b=>(b.textContent.trim()||b.getAttribute('aria-label'))===label);
 const click=async(scope,label)=>{await wait(()=>button(scope,label)&&!button(scope,label).disabled,'button '+label);button(scope,label).click();await new Promise(r=>setTimeout(r,40));};
 const fill=(input,value)=>{check(input,'missing input');input.value=value;input.dispatchEvent(new Event(input.tagName==='SELECT'?'change':'input',{bubbles:true}));};
 const modal=()=>document.querySelector('.p-dialog');
 const confirm=async(approve)=>{await wait(()=>document.querySelector('dialog').open,'confirmation');const dialog=document.querySelector('dialog');const rect=dialog.getBoundingClientRect();check(Math.abs(rect.x+rect.width/2-document.documentElement.clientWidth/2)<2&&Math.abs(rect.y+rect.height/2-document.documentElement.clientHeight/2)<2,'confirmation is not centered');check(dialog.contains(document.activeElement),'confirmation focus');const actions=dialog.querySelector('.confirmation-actions');const actionButtons=[...actions.querySelectorAll('button')].map(item=>item.getBoundingClientRect());check(Math.abs(actionButtons[0].y+actionButtons[0].height/2-actionButtons[1].y-actionButtons[1].height/2)<2,'Confirmation buttons not aligned');check(Math.abs(actions.getBoundingClientRect().right-actionButtons[1].right)<2,'Confirmation footer not aligned to end');const themeProbe=document.createElement('span');themeProbe.style.background='var(--console-surface)';dialog.append(themeProbe);check(getComputedStyle(dialog).backgroundColor===getComputedStyle(themeProbe).backgroundColor,'Confirmation theme mismatch');themeProbe.remove();await click(dialog,approve?'Continue':'Cancel');await wait(()=>!dialog.open,'confirmation closed');};
 const navigate=async path=>{history.pushState(null,'',path);window.dispatchEvent(new PopStateEvent('popstate'));await wait(()=>root()?.dataset.resource===path.split('/').pop()&&root()?.querySelector('tbody button')&&!root().textContent.includes('Loading…'),'list '+path);};
 await wait(()=>root()?.querySelector('tbody button'),'Users list');
 check(root().querySelector('h1').textContent.trim()==='Users','Users default list');
 await click(root(),'Create User');await wait(()=>modal()?.querySelector('#record-password'),'Create fields for validation');fill(modal().querySelector('#record-username'),'validation-only');fill(modal().querySelector('#record-password'),'short');await click(modal(),'Save');await wait(()=>modal().querySelector('#record-password')?.getAttribute('aria-invalid')==='true'&&document.activeElement===modal().querySelector('#record-password'),'Invalid password focus');check(!document.querySelector('dialog[open]'),'Invalid input opened confirmation');const invalidPassword=modal().querySelector('#record-password');check(invalidPassword.getAttribute('aria-describedby')==='record-password-error','Error description missing');check(document.getElementById('record-password-error')?.textContent.trim(),'Inline password error missing');check(!modal().querySelector('#record-username').hasAttribute('aria-invalid'),'Valid username marked invalid');await auditAccessibility('users-invalid-password',modal());await click(modal(),'Cancel');await confirm(true);await wait(()=>!modal(),'Validation form cancelled');

 const checkTypography=scope=>{const expected=getComputedStyle(document.body).fontFamily;for(const element of scope.querySelectorAll('h1,h2,h3,th,td,label,input,select,textarea:not(.font-mono),button:not(.font-mono),.p-dialog-title,.p-select-label')){check(getComputedStyle(element).fontFamily===expected,'Inconsistent font on '+element.tagName+': '+getComputedStyle(element).fontFamily+' expected '+expected);}};
 checkTypography(root());

 const create=button(root(),'Create User').getBoundingClientRect();const heading=root().querySelector('h1').getBoundingClientRect();check(create.x>heading.x+heading.width,'Create User is not upper right');
 {const pager=root().querySelector('.table-pagination');const jump=pager.querySelector('.page-jump');const bounds=pager.querySelector('.pagination-controls').getBoundingClientRect();const footer=pager.getBoundingClientRect();check(Math.abs(bounds.x+bounds.width/2-footer.x-footer.width/2)<2,'Pagination controls not centered in footer');const parts=[jump.querySelector('label'),jump.querySelector('input'),jump.querySelector('.page-total'),jump.querySelector('button')].map(item=>item.getBoundingClientRect());check(Math.max(...parts.map(rect=>rect.y+rect.height/2))-Math.min(...parts.map(rect=>rect.y+rect.height/2))<2,'Page jump wraps or is misaligned');}
 {const size=parseFloat(getComputedStyle(document.documentElement).fontSize);for(const button of root().querySelectorAll('.row-actions-cell button')){const icon=button.querySelector('.pi');check(Math.abs(parseFloat(getComputedStyle(icon).fontSize)-size)<0.1,'Row action icon size mismatch');const bounds=button.getBoundingClientRect();check(Math.abs(bounds.width-size*2.5)<1&&Math.abs(bounds.height-size*2.5)<1,'Row action click area is inconsistent');}}
 await auditAccessibility('users-light');
 {const html=document.documentElement;const originalPalette=html.dataset.palette;const originalDark=html.classList.contains('app-dark');const colors=new Set();try{for(const palette of ['blue','indigo','violet','emerald','teal','rose','amber']){for(const dark of [false,true]){html.dataset.palette=palette;html.classList.toggle('app-dark',dark);await new Promise(resolve=>setTimeout(resolve,350));const sidebar=document.querySelector('#area-navigation');const logo=sidebar.querySelector('.sidebar-symbol');const icon=sidebar.querySelector('a:not(.active) > i:not(.nav-arrow)');check(getComputedStyle(icon).color===getComputedStyle(logo).color,'Sidebar icon palette mismatch');if(!dark){colors.add(getComputedStyle(logo).color);}const brand=document.querySelector('.brand-mark');const probe=document.createElement('span');probe.style.backgroundColor='var(--console-accent)';probe.style.color='var(--console-accent)';document.body.append(probe);check(getComputedStyle(brand).backgroundColor===getComputedStyle(probe).backgroundColor,'Brand palette mismatch');for(const actionIcon of root().querySelectorAll('tbody .p-button-text .pi')){check(getComputedStyle(actionIcon).color===getComputedStyle(probe).color,'Table action icon palette mismatch');}probe.remove();await auditAccessibility('navigation-'+palette+(dark?'-dark':'-light'),sidebar);}}check(colors.size===7,'Sidebar logos remain fixed across palettes');}finally{if(originalPalette){html.dataset.palette=originalPalette;}else{delete html.dataset.palette;}html.classList.toggle('app-dark',originalDark);}}
 if(root().querySelector('app-list-query button[aria-label="Advanced filters"]').getAttribute('aria-expanded')!=='true'){await click(root(),'Advanced filters');}
 await wait(()=>root().querySelector('.table-pagination p-select [role="combobox"]'),'page size control');
 const pager=root().querySelector('.table-pagination').getBoundingClientRect();const surface=root().querySelector('.list-surface').getBoundingClientRect();check(Math.abs(pager.x+pager.width/2-surface.x-surface.width/2)<2,'Pagination is not centered');
 const pageSize=root().querySelector('.table-pagination p-select [role="combobox"]');check(pageSize.tabIndex===0,'Page size is not keyboard accessible');pageSize.click();await wait(()=>document.querySelector('[role="option"]'),'page size options');const fifty=[...document.querySelectorAll('[role="option"]')].find(option=>option.textContent.trim()==='50');check(fifty,'Missing page size option');fifty.click();await click(root(),'Apply');await wait(()=>!root().textContent.includes('Loading…'),'page size applied');
 await click(root(),'Add filter');await wait(()=>root().querySelector('input[data-query-value="0"]'),'filter value');const operation=root().querySelector('app-select-control[data-query-operation="0"] [role="combobox"]');operation.click();await wait(()=>[...document.querySelectorAll('[role="option"]')].some(option=>option.textContent.trim()==='Contains'),'Operation options');[...document.querySelectorAll('[role="option"]')].find(option=>option.textContent.trim()==='Contains').click();fill(root().querySelector('input[data-query-value="0"]'),'Ali');
 await click(root(),'Advanced filters');await wait(()=>!root().querySelector('input[data-query-value="0"]'),'advanced panel closed');check(root().querySelector('button[aria-label="Advanced filters"]').getAttribute('aria-expanded')==='false','Collapsed filter state');await click(root(),'Advanced filters');await wait(()=>root().querySelector('input[data-query-value="0"]'),'advanced panel reopened');check(root().querySelector('input[data-query-value="0"]').value==='Ali','Collapsing lost filter draft');
 const filterControls=[...root().querySelectorAll('.filter-row .field-control > input, .filter-row .field-control > app-select-control')];check(filterControls.length===3,'Filter field structure');for(const control of filterControls){const bounds=control.getBoundingClientRect();check(Math.abs(bounds.height-parseFloat(getComputedStyle(document.documentElement).fontSize)*2.5)<2,'Inconsistent filter height '+bounds.height);check(document.querySelector('label[for="'+(control.id||control.querySelector('[role="combobox"]')?.id)+'"]'),'Unlabelled filter');}check(Math.max(...filterControls.map(control=>control.getBoundingClientRect().top))-Math.min(...filterControls.map(control=>control.getBoundingClientRect().top))<2,'Misaligned filter controls');checkTypography(root());await auditAccessibility('users-advanced-fields');

 check(root().querySelector('app-list-query').getBoundingClientRect().top < root().querySelector('app-record-table').getBoundingClientRect().top,'Advanced filters must be above the table');
 check(root().querySelector('.page-jump p-select'),'Page size must sit beside page jump');
 const chooseOperation=async label=>{root().querySelector('app-select-control[data-query-operation="0"] [role="combobox"]').click();await wait(()=>[...document.querySelectorAll('[role="option"]')].some(option=>option.textContent.trim()===label),'Filter options');[...document.querySelectorAll('[role="option"]')].find(option=>option.textContent.trim()===label).click();};
 await chooseOperation('Is one of');await wait(()=>root().querySelector('app-list-values input'),'Membership editor');
 fill(root().querySelector('app-list-values input'),'Ali');await click(root(),'Add value');await wait(()=>root().querySelectorAll('app-list-values input').length===2,'Add list value');
 fill(root().querySelectorAll('app-list-values input')[1],'Betty');await click(root(),'Apply');await wait(()=>!root().textContent.includes('Loading…'),'Membership applied');
 await chooseOperation('Contains');await wait(()=>root().querySelector('input[data-query-value="0"]'),'Text value');fill(root().querySelector('input[data-query-value="0"]'),'');await click(root(),'Apply');await wait(()=>root().querySelector('.filter-values .field-error'),'Invalid filter points to value');fill(root().querySelector('input[data-query-value="0"]'),'Ali');
 await click(root(),'Add sort');await wait(()=>root().querySelector('input[data-query-sort="0"]'),'sort');fill(root().querySelector('input[data-query-sort="0"]'),'username, created_at');await click(root(),'Apply');await wait(()=>!root().textContent.includes('Loading…'),'applied query');
 await click(root(),'Edit');await wait(()=>modal()?.querySelector('#record-username'),'edit dialog');for(const control of modal().querySelectorAll('input[required],textarea[required]')){const label=modal().querySelector('label[for="'+(control.id||control.querySelector('[role="combobox"]')?.id)+'"]');const star=label?.querySelector('span[aria-hidden="true"]');check(star?.textContent.trim()==='*','Missing required marker '+control.id);check(Math.abs(star.getBoundingClientRect().top-label.getBoundingClientRect().top)<8,'Required marker below label');} fill(modal().querySelector('#record-username'),'Ali Edited');
 await click(modal(),'Save');await confirm(false);check(modal().querySelector('#record-username').value==='Ali Edited','cancel lost edits');await click(modal(),'Save');await confirm(true);await wait(()=>!modal()&&root().textContent.includes('Ali Edited'),'updated version');
 await click(root(),'Back to list');await wait(()=>root().querySelector('tbody button[aria-label="More actions"]'),'row actions');
 const more=button(root(),'More actions');more.click();await wait(()=>document.querySelector('.p-menu [role="menuitem"]'),'row menu');check(more.getAttribute('aria-expanded')==='true','row menu expanded');check(document.getElementById(more.getAttribute('aria-controls'))?.getAttribute('role')==='menu','row menu controls reference');await auditAccessibility('users-row-menu');
 const menuItem=document.querySelector('.p-menu [role="menuitem"]');menuItem.dispatchEvent(new KeyboardEvent('keydown',{key:'Escape',code:'Escape',bubbles:true}));await wait(()=>!document.querySelector('.p-menu [role="menuitem"]'),'row menu escape');check(document.activeElement===more,'row menu focus restore');
 more.click();await wait(()=>document.querySelector('.p-menu [role="menuitem"]'),'row menu reopened');document.querySelector('.p-menu [role="menuitem"] a').click();await wait(()=>modal()?.querySelector('tbody button'),'history list');await click(modal(),'Open');await wait(()=>modal().querySelector('.change-comparison tbody tr'),'history comparison');const changeRow=modal().querySelector('.change-comparison tbody tr');check(changeRow.textContent.includes('Ali')&&changeRow.textContent.includes('Ali Edited'),'History before and after missing');check(!modal().querySelector('pre'),'History displayed as JSON');await auditAccessibility('users-history-comparison',modal());check(!modal().textContent.includes('fixture-hidden-password'),'history secret leaked');document.querySelector('.p-dialog-close-button').click();await wait(()=>!modal(),'history close');
 await click(root(),'Assign role');await wait(()=>modal()?.querySelector('tbody button'),'roles list');await click(modal(),'Select');await wait(()=>modal().textContent.includes('Selected role'),'role selected');await click(modal(),'Save');await confirm(true);await wait(()=>!modal()&&root().textContent.includes('Role assigned.'),'role saved');
 await click(root(),'Reset password');await wait(()=>modal()?.querySelector('#new-password'),'password form');fill(modal().querySelector('#new-password'),'fixture-reset-password');await click(modal(),'Save');await confirm(true);await wait(()=>!modal(),'password cleanup');check(!root().textContent.includes('fixture-reset-password'),'password displayed');
 await click(root(),'Delete');await confirm(true);await wait(()=>root().querySelector('.list-surface')&&!button(root(),'Open'),'deleted user hidden');if(root().querySelector('app-list-query button[aria-label="Advanced filters"]').getAttribute('aria-expanded')!=='true'){await click(root(),'Advanced filters');}fill(root().querySelector('input[data-query-extra="include_deleted"]'),'');const deletedOption=root().querySelector('input[data-query-extra="include_deleted"]');deletedOption.checked=true;deletedOption.dispatchEvent(new Event('change',{bubbles:true}));await click(root(),'Apply');await wait(()=>button(root(),'Open'),'deleted selector');await click(root(),'Open');await wait(()=>button(root(),'Restore User'),'restore action');await click(root(),'Restore User');await confirm(true);await wait(()=>root().textContent.includes('User restored.')&&button(root(),'Update User'),'restored reference');
 await click(root(),'Back to list');await click(root(),'Create User');await wait(()=>modal()?.querySelector('#record-password'),'create form');check(modal().querySelectorAll('input[required]').length===2,'Required fields differ from UserCreateDTO');for(const control of modal().querySelectorAll('app-control-field input:not([type="checkbox"])')){check(Math.abs(control.getBoundingClientRect().height-parseFloat(getComputedStyle(document.documentElement).fontSize)*2.5)<2,'Inconsistent CRUD input height');check(control.getBoundingClientRect().width<=control.closest('app-control-field').getBoundingClientRect().width+1,'CRUD input overflow');}for(const control of modal().querySelectorAll('input[required]')){const label=modal().querySelector('label[for="'+(control.id||control.querySelector('[role="combobox"]')?.id)+'"]');const star=label?.querySelector('span[aria-hidden="true"]');check(star?.textContent.trim()==='*','Missing required marker '+control.id);check(Math.abs(star.getBoundingClientRect().top-label.getBoundingClientRect().top)<8,'Required marker below label');}checkTypography(modal());await auditAccessibility('users-create-required-labels');fill(modal().querySelector('#record-username'),'Ali Added');fill(modal().querySelector('#record-password'),'fixture-created-password');await click(modal(),'Save');await confirm(true);await wait(()=>!modal()&&root().textContent.includes('Ali Added'),'created user list');
 await navigate('/administration/admin-users');if(root().querySelector('app-list-query button[aria-label="Advanced filters"]').getAttribute('aria-expanded')!=='true'){await click(root(),'Advanced filters');}await click(root(),'Add filter');await wait(()=>root().querySelector('input[data-query-value="0"]'),'admin filter');fill(root().querySelector('input[data-query-value="0"]'),'Administrator');await click(root(),'Add sort');await wait(()=>root().querySelector('input[data-query-sort="0"]'),'admin sort');fill(root().querySelector('input[data-query-sort="0"]'),'username, created_at');await click(root(),'Apply');await wait(()=>!root().textContent.includes('Loading…'),'admin query');fill(root().querySelector('input[data-query-value="0"]'),'unapplied draft');await click(root(),'Report Admin Users');await confirm(true);await wait(()=>root().textContent.includes('Report requested.'),'report queued');
 for(const path of ['/administration/roles','/administration/permissions','/administration/audit','/administration/history','/operations/reports']){await navigate(path);await auditAccessibility(path);}
 await click(root(),'Open');await wait(()=>root().querySelector('#report-password'),'owned report detail');check(root().querySelector('#report-password').value==='fixture-archive-password','archive password field');check(button(root(),'Download'),'ready download missing');
 {const field=root().querySelector('#report-password');const copy=root().querySelector('app-copy-field button');check(field.getBoundingClientRect().height>=50&&field.getBoundingClientRect().width>=300,'Report password field too small');const original=Object.getOwnPropertyDescriptor(navigator,'clipboard');const copies=[];Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText:async value=>{copies.push(value);}}});try{field.click();await wait(()=>root().querySelector('app-copy-field').textContent.includes('Copied to clipboard'),'Password field copied');copy.click();await wait(()=>copies.length===2,'Password icon copied');field.dispatchEvent(new KeyboardEvent('keydown',{key:'Enter',bubbles:true}));await wait(()=>copies.length===3,'Password keyboard copy');check(copies.every(value=>value==='fixture-archive-password'),'Wrong report password copied');check(copy.querySelector('.pi-check'),'Copy success icon missing');}finally{if(original){Object.defineProperty(navigator,'clipboard',original);}else{delete navigator.clipboard;}}await auditAccessibility('report-password-copy',root().querySelector('app-copy-field'));}
 await navigate('/users');await toggleTheme();await wait(()=>document.documentElement.classList.contains('app-dark'),'dark mode');await auditAccessibility('users-dark');
 {document.querySelector('[data-language-picker] [role="combobox"]').click();await wait(()=>[...document.querySelectorAll('[role="option"]')].some(option=>option.textContent.includes('فارسی')),'Language options');[...document.querySelectorAll('[role="option"]')].find(option=>option.textContent.includes('فارسی')).click();}await wait(()=>document.documentElement.dir==='rtl','Persian');checkTypography(root());check(getComputedStyle(root().querySelector('h1')).letterSpacing==='normal','Persian heading tracking');await auditAccessibility('users-rtl');
 await fetch('/test-result',{method:'POST',body:JSON.stringify({ok:true,accessibility})});
`;
