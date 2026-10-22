import { createInlineAttachmentsFixture } from "./inline-attachments-fixture.mjs";
import { runtimeFixture } from "../src/app/features/forms/testing/runtime-fixtures.ts";
// Disposable synthetic upstream. No production data, authoring grants or credentials.
export function createWorkspaceFixture({
  actorReference = "opaque-browser-user",
  attachmentReceipt = null,
  inlineAttachments = false,
} = {}) {
  let requestRef = "request/1";
  let requestStatus = "DRAFT";
  let taskRef = "task/1";
  let taskStatus = "OPEN";
  const personal = {
    read_at: null,
    pinned_at: null,
    watching_at: null,
    archived_at: null,
  };
  let data = {
    amount: 0,
    decimal: "12345678901234567890.123456789",
    approved: false,
    choice: 1,
  };
  const records = [];
  const attachments = [];
  let attachmentAttempts = 0;
  if (attachmentReceipt || inlineAttachments) data.amount = [];
  let inlineRevision = 0;
  const inline = inlineAttachments
    ? createInlineAttachmentsFixture((references) => {
        data = { ...data, amount: references };
        requestRef = "request/inline-" + ++inlineRevision;
        return requestRef;
      })
    : null;
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
    created_at: "2026-10-15T08:30:00Z",
    submitted_at: null,
    closed_at: null,
    priority: 0,
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
    if (attachmentReceipt || inlineAttachments) {
      dto.render_schema = {
        dialect: "bpms.render/1",
        root: {
          component: "vertical",
          children: [
            {
              component: "attachment_collection",
              node_key: "receipts",
              scope: "/properties/amount",
              label: "Receipts",
              options: {
                caption_required: true,
                ...(inlineAttachments
                  ? {
                      allowed_kinds: ["file", "image"],
                      allowed_mime_types: ["text/plain", "image/webp"],
                      allow_replace: true,
                      allow_remove: true,
                      allow_reorder: true,
                      preview: true,
                    }
                  : {}),
              },
            },
          ],
        },
      };
      dto.field_metadata[0].validation_schema = {
        type: "array",
        items: { type: "string" },
      };
    }

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
    request_ref_id: requestRef,
    ...personal,
    created_at: "2026-10-15T09:00:00Z",
    closed_at: null,
    due_at: "2026-10-18T09:00:00Z",
    priority: 0,
    status: taskStatus,
    kind: "HUMAN_TASK",
    claimant_ref_id: ["CLAIMED", "IN_PROGRESS"].includes(taskStatus)
      ? actorReference
      : null,
    runtime_state: runtime("WORK_ITEM"),
    form_version_ref_id: "opaque/pinned",
  });
  return {
    records,
    upload: (...args) => inline?.upload(...args),
    content(method, path) {
      if (inline) return inline.content(method, path);
      return attachmentReceipt &&
        method === "GET" &&
        attachments.length &&
        path.endsWith("/attachments/fixture-attachment/content")
        ? Buffer.alloc(256 * 1024, "x")
        : null;
    },
    handle(method, path, body) {
      if (
        attachmentReceipt &&
        method === "POST" &&
        path === "/api/v1/media/files"
      ) {
        records.push({ method, path, transfer: true });
        return { success: true, data: { ref_id: "fixture-private-upload" } };
      }
      const payload = body ? JSON.parse(body) : null;
      records.push({ method, path, payload });
      const clean = new URL(path, "http://fixture.invalid").pathname;
      const success = (value) => ({ success: true, data: value });
      const inlineResult = inline?.handle(method, clean, payload);
      if (inlineResult) return inlineResult;
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
      if (
        (clean.includes("/business-requests/") ||
          clean.includes("/work-items/")) &&
        clean.endsWith("/history")
      ) {
        return page(
          [
            {
              version: 1,
              changed_at: "2026-10-15T00:00:00Z",
              action: "updated",
            },
          ],
          payload.page,
        );
      }
      if (clean.endsWith("/business-requests/report")) {
        return page([request()], payload.page);
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
      if (
        attachmentReceipt &&
        clean.includes("/business-requests/") &&
        clean.endsWith("/attachments")
      ) {
        if (method === "GET") return success(attachments);
        if (method === "POST") {
          attachmentAttempts++;
          if (attachmentAttempts > 1 || attachmentReceipt === "committed") {
            requestRef = "request/attachment-" + attachmentAttempts;
            const item = {
              ref_id: "fixture-attachment",
              upload_ref_id: payload.upload_ref_id,
              field_path: payload.field_path,
              caption: payload.caption,
              position: 0,
              kind: "file",
              content_type: "text/plain",
              size_bytes: 256 * 1024,
              contributing_group_ref_id: null,
              created_at: "2026-10-15T12:00:00Z",
            };
            attachments.push(item);
            data = {
              ...data,
              amount: attachments.map((entry) => entry.ref_id),
            };
          }
          // Fault injection: the original current-reference receipt is unavailable.
          // HTTP itself succeeds; no production console/network diagnostic is suppressed.
          return success(
            attachmentAttempts === 1
              ? {}
              : { request_ref_id: requestRef, attachment: attachments.at(-1) },
          );
        }
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
      if (clean.includes("/work-items/") && clean.endsWith("/view")) {
        const view = runtime("WORK_ITEM");
        return success({
          work_item_ref_id: taskRef,
          submission_ref_id: view.submission_ref_id,
          view_key: view.view_key,
          purpose: view.purpose,
          title: "Task review",
          data: view.data,
          item_identity: view.item_identity,
          before_data: view.before_data,
          before_item_identity: null,
          render_schema: view.render_schema,
          actions: view.actions,
          feedback: [],
          autosave_conflict: "VERSION_CONFLICT",
          unsaved_navigation: "warn_before_leave",
        });
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
      if (
        clean.includes("/work-items/") &&
        ["read", "pin", "watch", "archive"].some((action) =>
          clean.endsWith("/" + action),
        )
      ) {
        const action = clean.split("/").at(-1);
        const field = {
          read: "read_at",
          pin: "pinned_at",
          watch: "watching_at",
          archive: "archived_at",
        }[action];
        personal[field] = payload.value ? "2026-10-17T10:00:00Z" : null;
        return success(task());
      }
      if (clean.includes("/work-items/") && clean.endsWith("/comment")) {
        taskRef = "task/commented";
        return success(task());
      }
      if (clean.includes("/work-items/") && clean.endsWith("/forward")) {
        taskRef = "task/forwarded";
        taskStatus = "OPEN";
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
          current_positions: [
            {
              token_ref_id: "token-left",
              step_key: "left",
              execution_ref_id: "left-visit",
              status: "WAITING",
              wait_kind: "HUMAN",
            },
            {
              token_ref_id: "token-right",
              step_key: "right",
              execution_ref_id: "right-visit",
              status: "WAITING",
              wait_kind: "EVENT",
            },
          ],
          steps: [
            {
              step_key: "effect",
              display_order: 1,
              path_status: "WAITING",
              executions: [
                {
                  ref_id: "effect-visit",
                  visit_number: 2,
                  status: "WAITING",
                  wait_kind: "BACKGROUND",
                  last_error_code: "EFFECT_UNKNOWN",
                  started_at: null,
                  ended_at: null,
                  form_submission_ref_id: null,
                  work_item: null,
                  attempts: [
                    {
                      number: 1,
                      status: "FAILED",
                      error_code: "TIMEOUT",
                      started_at: "2026-10-08T10:00:00Z",
                      ended_at: null,
                    },
                  ],
                  inputs: { password: "never-rendered-fixture-input" },
                },
              ],
            },
          ],
          transitions: [],
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
