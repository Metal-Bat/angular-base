import { runtimeFixture } from "../src/app/features/forms/testing/runtime-fixtures.ts";
// Disposable synthetic upstream. No production data, authoring grants or credentials.
export function createWorkspaceFixture() {
  let requestRef = "request/1";
  let requestStatus = "DRAFT";
  let taskRef = "task/1";
  let taskStatus = "OPEN";
  let data = {
    amount: 0,
    decimal: "12345678901234567890.123456789",
    approved: false,
    choice: 1,
  };
  const records = [];
  const page = (items, index = 1, size = 20) => ({
    success: true,
    result: {
      items,
      page: index,
      size,
      total: items.length,
      total_pages: items.length ? 1 : 0,
    },
  });
  const request = () => ({
    ref_id: requestRef,
    status: requestStatus,
    form_version_ref_id: "opaque/pinned",
    workflow_version_ref_id: "workflow/pinned",
    process_ref_id: requestStatus === "DRAFT" ? null : "process/current",
    data,
  });
  const runtime = (kind) => {
    const dto = runtimeFixture(kind);
    dto.resource_ref_id = kind === "REQUEST" ? requestRef : taskRef;
    dto.data = { ...data };
    dto.actions =
      kind === "WORK_ITEM" && ["CLAIMED", "IN_PROGRESS"].includes(taskStatus)
        ? dto.actions
        : [];
    if (
      (kind === "REQUEST" && requestStatus !== "DRAFT") ||
      (kind === "WORK_ITEM" && !["CLAIMED", "IN_PROGRESS"].includes(taskStatus))
    ) {
      dto.purpose = kind === "REQUEST" ? "summary" : "observer";
      dto.writable_scopes = [];
      dto.field_metadata = dto.field_metadata.map((field) => ({
        ...field,
        writable: false,
      }));
    }
    if (kind === "WORK_ITEM" && dto.purpose === "edit") {
      dto.writable_scopes = ["/properties/amount", "/properties/choice"];
      dto.field_metadata = dto.field_metadata.map((field) => ({
        ...field,
        writable: dto.writable_scopes.includes(field.scope),
      }));
    }
    return dto;
  };
  const task = () => ({
    ref_id: taskRef,
    status: taskStatus,
    kind: "HUMAN_TASK",
    claimant_ref_id: ["CLAIMED", "IN_PROGRESS"].includes(taskStatus)
      ? "opaque-browser-user"
      : null,
    runtime_state: runtime("WORK_ITEM"),
    form_version_ref_id: "opaque/pinned",
  });
  return {
    records,
    handle(method, path, body) {
      const payload = body ? JSON.parse(body) : null;
      records.push({ method, path, payload });
      const clean = new URL(path, "http://fixture.invalid").pathname;
      const success = (value) => ({ success: true, data: value });
      if (clean.endsWith("/request-types/eligible/search")) {
        return page(
          [
            {
              ref_id: "type/eligible",
              name: "Synthetic application",
              code: "SYNTHETIC",
              form_version_ref_id: "opaque/pinned",
              workflow_version_ref_id: "workflow/pinned",
              render_dialect: "bpms.render/1",
            },
          ],
          payload.page,
        );
      }
      if (clean.endsWith("/business-requests/search")) {
        return page([request()], payload.page);
      }
      if (clean.endsWith("/work-items/search")) {
        return page([task()], payload.page);
      }
      if (clean.endsWith("/options")) {
        return {
          success: true,
          result: {
            dialect: "bpms.options/1",
            key_encoding: "json-scalar/1",
            state: "READY",
            generation: payload.generation,
            locale: "en",
            source_revision: "source-pinned",
            dependency_fingerprint: "synthetic-dependency",
            dependencies: {},
            page: 1,
            size: 20,
            total: 2,
            total_pages: 1,
            items: [
              { key: "json:1", value: "One" },
              { key: "json:2", value: "Two" },
            ],
          },
        };
      }
      if (clean.endsWith("/business-requests") && method === "POST") {
        requestStatus = "DRAFT";
        data = {
          amount: 0,
          decimal: "12345678901234567890.123456789",
          approved: false,
          choice: 1,
        };
        return success(request());
      }
      if (clean.includes("/business-requests/") && clean.endsWith("/view")) {
        return success(runtime("REQUEST"));
      }
      if (clean.includes("/business-requests/") && clean.endsWith("/submit")) {
        requestRef = "request/submitted";
        requestStatus = "RUNNING";
        return success(request());
      }
      if (clean.includes("/business-requests/") && method === "PUT") {
        data = payload.data;
        requestRef = "request/saved";
        return success(request());
      }
      if (clean.includes("/business-requests/")) {
        return success(request());
      }
      if (clean.includes("/work-items/") && clean.endsWith("/runtime")) {
        return success(runtime("WORK_ITEM"));
      }
      if (clean.includes("/work-items/") && clean.endsWith("/claim")) {
        taskStatus = "CLAIMED";
        taskRef = "task/claimed";
        return success(task());
      }
      if (clean.includes("/work-items/") && clean.endsWith("/save")) {
        data = { ...data, ...payload.data };
        taskRef = "task/saved";
        return success(task());
      }
      if (clean.includes("/work-items/") && clean.endsWith("/complete")) {
        data = { ...data, ...payload.data };
        taskRef = "task/completed";
        taskStatus = "COMPLETED";
        return success(task());
      }
      if (clean.includes("/work-items/")) {
        return success(task());
      }
      if (clean.includes("/processes/") && clean.includes("/timeline")) {
        return success({
          process_ref_id: "process/current",
          business_request_ref_id: requestRef,
          status: "RUNNING",
          current_positions: [],
          steps: [],
          children: [],
          coverage_started_at: null,
          events: { items: [], page: 1, size: 20, total: 0, total_pages: 0 },
        });
      }
      if (clean.includes("/processes/")) {
        return success({
          ref_id: "process/current",
          status: "RUNNING",
          workflow_version_ref_id: "workflow/pinned",
        });
      }
      return null;
    },
  };
}
