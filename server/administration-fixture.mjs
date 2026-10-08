import { otherCrudFixture, otherCrudScript } from "./other-crud-fixture.mjs";
// Synthetic browser fixture. Backend integration is recorded separately.
export function administrationFixture(path, body, method) {
  const other = otherCrudFixture(path, body, method);
  if (other) {
    return other;
  }
  if (
    !path.startsWith("/api/v1/admin/users") &&
    !path.startsWith("/api/v1/tasks/executions")
  )
    return null;
  const value = body ? JSON.parse(body) : {};
  if (path.endsWith("/search"))
    return {
      success: true,
      result: {
        items: [
          {
            ref_id: "current-user",
            username: "synthetic-user",
            is_active: true,
            password: "must-redact",
          },
        ],
        page: value.page ?? 1,
        size: value.size ?? 20,
        total: 41,
        total_pages: 3,
      },
    };
  if (path.endsWith("/retry"))
    return {
      success: true,
      data: { task_id: "queued-new-task", state: "QUEUED" },
    };
  if (path.endsWith("/reset-password"))
    return { success: true, data: null, code: 204 };
  if (method === "POST" && path === "/api/v1/admin/users")
    return {
      success: true,
      data: {
        ref_id: "created-user",
        username: value.username,
        password: "must-redact",
        is_active: true,
      },
    };
  return {
    success: true,
    data: {
      ref_id: "current-user",
      username: "synthetic-user",
      is_active: true,
    },
  };
}
export const administrationScript = `
  await wait(()=>document.querySelector('app-admin-console'),'Administration console');
  const selectCommand = async (fragment) => {
    await wait(()=>document.querySelector('app-select-control[inputId="admin-command"]')?.querySelector('option') && document.getElementById('admin-command')?.getAttribute('aria-disabled')!=='true' && !document.getElementById('admin-command')?.classList.contains('p-disabled'), 'Ready command menu');
    const control = document.getElementById('admin-command');
    const host = control.closest('app-select-control');
    const choice = [...host.querySelectorAll('option')].find(option=>option.value.includes(fragment));check(choice,'Available operation '+fragment);
    control.click();await wait(()=>[...document.querySelectorAll('[role="option"]')].some(option=>option.textContent.trim()===choice.textContent.trim()),'Command options');[...document.querySelectorAll('[role="option"]')].find(option=>option.textContent.trim()===choice.textContent.trim()).click();
    await new Promise(resolve=>setTimeout(resolve,40));
    if (document.querySelector('dialog[open]')) [...document.querySelector('dialog[open]').querySelectorAll('button')].find(button=>button.textContent.trim()==='Continue').click();
    await new Promise(resolve=>setTimeout(resolve,40));
  };
  const fillAdmin = (id, value) => {const input=document.getElementById(id); check(input,'Missing '+id); input.value=value; input.dispatchEvent(new Event('input',{bubbles:true}));};
  const loadAdmin = async () => {document.querySelector('app-admin-console form').dispatchEvent(new Event('submit',{bubbles:true,cancelable:true})); await new Promise(resolve=>setTimeout(resolve,40));};
  await auditAccessibility('administration');
  await selectCommand('create_user_'); fillAdmin('body-username','created-browser-user'); fillAdmin('body-password','synthetic-password'); await loadAdmin();
  await wait(()=>document.querySelector('dialog[open]'),'Mutation confirmation');
  check(!text().includes('created-user'),'Mutation sent before review');
  [...document.querySelector('dialog[open]').querySelectorAll('button')].find(button=>button.textContent.trim()==='Continue').click();
  await wait(()=>text().includes('Command accepted'),'Creation response');
  check(document.getElementById('body-password').value==='','Accepted password retained');
  check(!text().includes('must-redact'),'Response secret revealed');
  await selectCommand('list_admin_users_'); await loadAdmin(); await wait(()=>text().includes('synthetic-user'),'Search result');
  [...document.querySelectorAll('app-admin-console button')].find(button=>button.textContent.trim()==='Next').click();
  await wait(()=>document.querySelector('app-admin-console nav')?.textContent.includes('2 / 3'),'Second page');
  [...document.querySelectorAll('app-admin-console button')].find(button=>button.textContent.includes('Use current row')).click();
  await selectCommand('get_admin_user_'); check(document.getElementById('path-ref_id').value==='current-user','Current reference not carried to detail');
  await loadAdmin(); await wait(()=>document.querySelector('app-admin-console pre')?.textContent.includes('current-user'),'Current detail');
  for (const input of document.querySelectorAll('app-admin-console input:not([type=hidden]), app-admin-console [role=combobox], app-admin-console textarea')) check(document.querySelector('label[for="'+input.id+'"]'),'Unlabelled admin control');
 ${otherCrudScript}
  await fetch('/test-control?revoke=1'); window.dispatchEvent(new Event('focus'));
  await wait(()=>text().includes('Access denied'),'Revoked administration');
  check(!document.querySelector('app-admin-console,app-resource-page,app-process-controls'),'Private admin state retained after revoke');
  check(localStorage.length===0 && sessionStorage.length===0,'Admin persisted data');
  await fetch('/test-result',{method:'POST',body:JSON.stringify({ok:true, accessibility})});
`;
