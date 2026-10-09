// Disposable self-only preferences fixture. No real user or backend writes.
export function createPreferencesFixture() {
  let version = 0;
  const settings = {
    schema_version: 1,
    appearance: { theme_key: "blue", theme_mode: "light", density: "compact" },
    locale: {
      language: "en",
      timezone: "Asia/Tehran",
      calendar: "gregory",
      numbering: "latn",
    },
    workspace: { landing_key: "requests", page_size: 25 },
    notifications: { email_enabled: true },
  };
  return {
    handle(method, path, body) {
      if (path !== "/api/v1/me/preferences") return null;
      if (method === "PATCH") {
        const patch = JSON.parse(body);
        if (patch.ref_id !== `fixture-preferences-${version}`)
          return { status: 409, body: { success: false } };
        for (const group of ["appearance", "locale"]) {
          if (patch[group]) Object.assign(settings[group], patch[group]);
        }
        version++;
      }
      return {
        status: 200,
        body: {
          success: true,
          data: {
            ...structuredClone(settings),
            ref_id: `fixture-preferences-${version}`,
          },
        },
      };
    },
  };
}
