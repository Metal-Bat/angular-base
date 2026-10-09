// Disposable records only; no user backend is contacted.
const date = "2026-10-06T08:00:00Z";
const group = {
  ref_id: "group-current",
  code: "reviewers",
  name: "Reviewers",
  description: "Review requests",
  is_active: false,
  created_at: date,
};
const connection = {
  ref_id: "connection-current",
  code: "notify",
  name: "Notification service",
  provider: "fixture",
  kind: "SERVICE",
  status: "ACTIVE",
  verification_status: "UNVERIFIED",
  non_secret_config: { endpoint_key: "hosted" },
  created_at: date,
};
const agent = {
  ref_id: "agent-current",
  code: "reviewer",
  name: "Review agent",
  number: 1,
  status: "DRAFT",
  created_at: date,
  spec: {
    connection_ref: "connection-current",
    provider_key: "fixture",
    model_id: "fixture-model",
    prompt_version: "1",
    instructions: "Review",
    decision: {
      question: "Proceed?",
      options_input_key: "choices",
      review_below: 0.8,
    },
    data_policy: {
      allowed_fields: ["question"],
      allowed_classifications: ["PUBLIC"],
      redacted_fields: [],
      allowed_tools: [],
      allowed_retrieval_sources: [],
    },
    field_classifications: { question: "PUBLIC" },
    user_limits: {
      requests: 1,
      tool_calls: 0,
      input_tokens: 10,
      output_tokens: 10,
      total_tokens: 20,
      elapsed_seconds: 30,
      spend_usd: 0,
      strict_spend: true,
    },
  },
};
const definition = {
  ref_id: "definition-current",
  name: "jobs.sample",
  queue: "default",
  module: "jobs",
  callable_name: "sample",
  signature: "()",
  bind: false,
  max_retries: 3,
  retry_backoff: false,
  retry_jitter: false,
};
const schedule = {
  ref_id: "schedule-current",
  name: "Daily sample",
  task_name: "jobs.sample",
  queue: "default",
  schedule_type: "interval",
  interval_seconds: 60,
  args: [],
  kwargs: {},
  enabled: true,
  one_off: false,
  created_at: date,
  total_run_count: 0,
};
const execution = {
  ref_id: "execution-current",
  task_id: "actual-task-id",
  task_name: "jobs.sample",
  state: "FAILURE",
  queue: "default",
  created_at: date,
  retries: 0,
};
const process = {
  ref_id: "process-current",
  status: "PAUSED",
  current_step: "review",
  created_at: date,
};
const resources = {
  "/api/v1/admin/work-groups": group,
  "/api/v1/integration-connections": connection,
  "/api/v1/ai-agents/connections": connection,
  "/api/v1/ai-agents": agent,
  "/api/v1/tasks/definitions": definition,
  "/api/v1/tasks/schedules": schedule,
  "/api/v1/tasks/executions": execution,
  "/api/v1/processes": process,
};
export function otherCrudFixture(url, body, method) {
  const path = new URL(url, "http://fixture.invalid").pathname;
  const match = Object.entries(resources).find(
    ([base]) => path === base || path.startsWith(base + "/"),
  );
  if (!match) {
    return null;
  }
  const [base, row] = match;
  const input = body ? JSON.parse(body) : {};
  const data = (value) => ({ success: true, data: value });
  const page = (items) => ({
    success: true,
    result: {
      items,
      page: input.page ?? 1,
      size: input.size ?? 20,
      total: items.length,
      total_pages: items.length ? 1 : 0,
    },
  });
  if (path.endsWith("/retry")) {
    if (!path.endsWith("/actual-task-id/retry")) {
      throw Error("Execution retry must use actual task ID");
    }
    return data({ task_id: "queued-new-task", state: "QUEUED" });
  }
  if (path.endsWith("/pause")) {
    process.status = "PAUSED";
    return data(null);
  }
  if (path.endsWith("/resume")) {
    process.status = "RUNNING";
    return data(null);
  }
  if (path.endsWith("/publish")) {
    agent.status = "PUBLISHED";
    return data({ ...agent });
  }
  if (path.endsWith("/timeline")) {
    return page([{ event: "PAUSED", created_at: date }]);
  }
  if (path.endsWith("/history")) {
    return page([]);
  }
  if (path.endsWith("/models/select")) {
    return page([{ key: "fixture-model", value: "Review model" }]);
  }
  if (path.endsWith("/select")) {
    return page([
      {
        key: base.endsWith("definitions") ? row.name : row.ref_id,
        value: row.name ?? row.code,
      },
    ]);
  }
  if (path.endsWith("/search")) {
    return page([row]);
  }
  if (path === base && method === "POST") {
    if (
      base.endsWith("schedules") &&
      (!Array.isArray(input.args) ||
        typeof input.kwargs !== "object" ||
        input.interval_seconds !== 120)
    ) {
      throw Error("Schedule inputs must preserve arrays, objects and numbers");
    }
    return data({ ...row, ...input, ref_id: "created-record" });
  }
  if (method === "PUT") {
    Object.assign(row, input);
    return data({ ...row });
  }
  if (method === "DELETE") {
    return data(null);
  }
  return data({ ...row });
}

export const otherCrudScript = `
 const goCrud=async(path,title)=>{window.fixtureStage=title;history.pushState(null,'',path);window.dispatchEvent(new PopStateEvent('popstate'));await wait(()=>document.querySelector('h1')?.textContent.trim()===title&&document.querySelector('app-record-table button[aria-label="Open"]:not(:disabled)'),'Ready '+title);};
 const openCrud=async()=>{document.querySelector('app-record-table button[aria-label="Open"]').click();await wait(()=>document.querySelector('app-resource-page app-record-summary'),'Current record');};
 const button=(scope,label)=>[...document.querySelectorAll(scope+' button')].find(item=>item.textContent.trim()===label);
 const fillCrud=(id,value)=>{const item=document.getElementById(id);check(item,'Missing '+id);item.value=value;item.dispatchEvent(new Event('input',{bubbles:true}));};
 const chooseCrud=async(id,value)=>{const host=document.getElementById(id).closest('app-select-control');const option=[...host.querySelectorAll('option')].find(item=>item.value===value);check(option,'Missing option '+value);document.getElementById(id).click();await wait(()=>[...document.querySelectorAll('[role="option"]')].some(item=>item.textContent.trim()===option.textContent.trim()),'Select '+value);[...document.querySelectorAll('[role="option"]')].find(item=>item.textContent.trim()===option.textContent.trim()).click();};
 const pickCrud=async(id,label)=>{const field=document.getElementById(id);check(field.readOnly,'Reference accepts typed keys '+id);const trigger=field.closest('.reference-control').querySelector('button');trigger.focus();trigger.click();await wait(()=>document.querySelector('app-reference-picker .p-dialog tbody button:not(:disabled)'),'Picker ready '+id);const picker=document.querySelector('app-reference-picker .p-dialog');check(picker.textContent.includes(label),'Picker label '+label);await wait(()=>picker.contains(document.activeElement),'Picker focus');await auditAccessibility('reference-picker-'+id,picker);const action=picker.querySelector('tbody button');action.focus();action.dispatchEvent(new KeyboardEvent('keydown',{key:'Enter',bubbles:true}));action.click();await wait(()=>!document.querySelector('app-reference-picker .p-dialog')&&field.value===label,'Picked '+label);await wait(()=>document.activeElement===trigger,'Picker focus restore');};
 const confirmCrud=async()=>{await wait(()=>document.querySelector('dialog[open]'),'Review action');button('dialog[open]','Continue').click();};
 const submitCrud=async()=>{document.querySelector('.p-dialog form').dispatchEvent(new Event('submit',{bubbles:true,cancelable:true}));await confirmCrud();await wait(()=>!document.querySelector('.p-dialog'),'Saved');};
 const closeAction=async()=>{button('app-resource-actions .p-dialog','Cancel').click();await wait(()=>!document.querySelector('app-resource-actions .p-dialog'),'Closed action');};
 await goCrud('/administration/groups','Work groups');await openCrud();button('app-resource-page header','Edit').click();await wait(()=>document.getElementById('record-name'),'Group form');check(document.getElementById('record-is_active').checked===false,'Inactive work group cannot be edited');fillCrud('record-name','Updated reviewers');await auditAccessibility('work-group-editor');await submitCrud();check(text().includes('Updated reviewers'),'Updated group missing');
 await goCrud('/administration/integrations','Integration connections');await openCrud();button('app-resource-actions','Verify').click();await wait(()=>document.querySelector('app-resource-actions .p-dialog'),'Verify dialog');check(!document.getElementById('action-path-ref_id'),'Current connection reference should be carried automatically');await auditAccessibility('connection-action');button('app-resource-actions .p-dialog','Review command').click();await confirmCrud();await wait(()=>text().includes('Command accepted'),'Verify accepted');await closeAction();
 await goCrud('/administration/agents','AI agents');await openCrud();button('app-resource-page header','Edit').click();await wait(()=>document.getElementById('record-spec-model_id'),'Structured AI fields');check(document.getElementById('record-spec-model_id').value==='Selected resource'&&document.getElementById('record-spec-model_id').readOnly,'AI model key exposed');await pickCrud('record-spec-connection_ref','Notification service');await pickCrud('record-spec-model_id','Review model');check(document.getElementById('record-spec-user_limits-tool_calls').value==='0','AI numeric zero lost');check(!document.querySelector('app-record-fields textarea#record-spec'),'AI config uses raw JSON');await auditAccessibility('agent-editor');button('.p-dialog','Cancel').click();await confirmCrud();await wait(()=>!document.querySelector('.p-dialog'),'Closed agent editor');button('app-resource-actions','Publish').click();await wait(()=>document.querySelector('app-resource-actions .p-dialog'),'Publish dialog');button('app-resource-actions .p-dialog','Review command').click();await confirmCrud();await wait(()=>text().includes('PUBLISHED'),'Published state');await closeAction();check(!button('app-resource-page header','Edit'),'Published agent editable');
 await goCrud('/administration/tasks/schedules','Task schedules');button('app-resource-page header','Create').click();await wait(()=>document.getElementById('record-name'),'Schedule form');fillCrud('record-name','Browser schedule');await pickCrud('record-task_name','jobs.sample');await chooseCrud('record-schedule_type','interval');fillCrud('record-interval_seconds','120');const args=document.querySelector('#record-args');button('#record-args','Add value').click();await wait(()=>document.getElementById('record-args-0'),'Argument added');await chooseCrud('record-args-0-type','number');fillCrud('record-args-0','7');await auditAccessibility('schedule-editor');await submitCrud();
 await goCrud('/administration/tasks/definitions','Task definitions');await openCrud();check(button('app-resource-actions','Run Task'),'Missing run task action');
 await goCrud('/administration/tasks/executions','Task executions');await openCrud();button('app-resource-actions','Retry Execution').click();await wait(()=>document.querySelector('app-resource-actions .p-dialog'),'Retry dialog');check(!document.getElementById('action-path-task_id'),'Task ID was not carried automatically');button('app-resource-actions .p-dialog','Review command').click();await confirmCrud();await wait(()=>text().includes('QUEUED'),'Queue response');check(text().includes('Read current state'),'Queuing completion misrepresented');await closeAction();
 window.fixtureStage='Process controls';history.pushState(null,'','/administration/processes');window.dispatchEvent(new PopStateEvent('popstate'));await wait(()=>document.querySelector('app-process-controls'),'Process lookup');fillCrud('process-reference','process-current');document.querySelector('app-process-controls form').dispatchEvent(new Event('submit',{bubbles:true,cancelable:true}));await wait(()=>text().includes('PAUSED'),'Process detail');button('app-resource-actions','Get Process Timeline').click();await wait(()=>document.querySelector('app-resource-actions .p-dialog'),'Timeline dialog');button('app-resource-actions .p-dialog','Load').click();await wait(()=>document.querySelector('app-resource-actions app-record-table tbody tr'),'Timeline results');await auditAccessibility('process-timeline');await closeAction();
`;
