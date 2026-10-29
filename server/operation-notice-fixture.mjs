// UI transport fixture only; real operation/receipt/authority acceptance uses the backend harness.
export function createOperationNoticeFixture() {
  const date = "2026-10-28T08:00:00Z";
  const notices = ["unknown", "confirmed", "legacy"].map((state) => ({
    schema_version: 1,
    ref_id: "notice_" + state,
    template_key:
      state === "confirmed" ? "application.map_08" : "application.map_07",
    template_version: "1",
    locale: "en",
    subject: {
      unknown: "Operation requires attention",
      confirmed: "Business receipt confirmed",
      legacy: "Notification unavailable",
    }[state],
    content:
      state === "legacy" ? null : "Inspect the current process evidence.",
    priority: 5,
    status: "ACTIVE",
    read_at: null,
    created_at: date,
    target: {
      kind: "operation",
      available: state !== "legacy",
      ref_id: state === "legacy" ? null : "process_" + state,
      route_key: state === "legacy" ? null : "processes",
    },
  }));
  return (method, path, raw) => {
    const input = raw ? JSON.parse(raw) : {};
    const data = (value) => ({ success: true, data: value });
    const result = (items) => ({
      success: true,
      result: {
        items,
        page: input.page ?? 1,
        size: input.size ?? 20,
        total: items.length,
        total_pages: items.length ? 1 : 0,
      },
    });
    if (path === "/api/v1/inbox/unread")
      return data({
        total: notices.filter((item) => item.read_at === null).length,
      });
    if (["/api/v1/inbox/search", "/api/v1/inbox/report"].includes(path))
      return result(notices);
    const notice = notices.find(
      (item) =>
        path === "/api/v1/inbox/" + item.ref_id ||
        path === "/api/v1/inbox/" + item.ref_id + "/read",
    );
    if (notice) {
      if (path.endsWith("/read")) notice.read_at = date;
      return data(notice);
    }
    const match =
      /^\/api\/v1\/processes\/process_(unknown|confirmed)(\/.*)?$/.exec(path);
    if (!match) return null;
    const [, state, action = ""] = match;
    const reference = "process_" + state;
    if (!action)
      return data({
        ref_id: reference,
        status: "RUNNING",
        workflow_version_ref_id: "workflow_pinned",
      });
    if (action === "/timeline")
      return data({
        process_ref_id: reference,
        business_request_ref_id: "request_current",
        status: "RUNNING",
        current_positions: [],
        steps: [],
        transitions: [],
        children: [],
        coverage_started_at: null,
        events: { items: [], page: 1, size: 20, total: 0, total_pages: 0 },
      });
    if (action === "/ai-evidence/search") return result([]);
    if (action === "/orders/search")
      return result([
        {
          operation_id: "operation_" + state,
          step_execution_ref_id: "execution_" + state,
          state: state === "unknown" ? "UNKNOWN" : "CONFIRMED",
          receipt:
            state === "unknown"
              ? null
              : {
                  operation_id: "operation_confirmed",
                  receipt_id: "receipt_confirmed",
                  state: "CREATED",
                  payload_hash: "a".repeat(64),
                },
        },
      ]);
    return null;
  };
}
