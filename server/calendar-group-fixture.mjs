// Disposable UI fixture; real membership authorization is verified in PostgreSQL/HTTP tests.
export function createCalendarGroupFixture() {
  const groups = [
    { key: "finance-current", value: "Finance" },
    { key: "operations-current", value: "Operations" },
  ];
  let event = null;
  return (method, url, raw) => {
    const path = new URL(url, "http://fixture.invalid").pathname;
    const input = raw ? JSON.parse(raw) : {};
    const data = (value) => ({ success: true, data: value });
    const page = (items, total = items.length) => ({
      success: true,
      result: {
        items,
        page: input.page ?? 1,
        size: input.size ?? 10,
        total,
        total_pages: Math.ceil(total / (input.size ?? 10)),
      },
    });
    if (path === "/api/v1/calendar/work-groups/select") {
      const matches = groups.filter((group) =>
        group.value.toLowerCase().includes((input.search ?? "").toLowerCase()),
      );
      return page(matches);
    }
    if (path === "/api/v1/calendar/events/search")
      return page(event ? [event] : []);
    if (path === "/api/v1/calendar/events" && method === "POST") {
      if (
        input.work_group_ref_id &&
        !groups.some((group) => group.key === input.work_group_ref_id)
      )
        throw Error("Unknown current group");
      event = {
        ref_id: "calendar-created",
        title: input.title,
        schedule: input.schedule,
        work_group_ref_id: input.work_group_ref_id,
        source_kind: "manual",
        route_key: "calendar_events",
        editable: true,
      };
      return data(event);
    }
    if (path === "/api/v1/calendar/events/calendar-created") return data(event);
    if (path === "/api/v1/calendar/events/calendar-created/reminders")
      return data([]);
    return null;
  };
}
