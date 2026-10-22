// Test-owned singleton profile and private bytes; never contacts a real account.
const image = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aP4sAAAAASUVORK5CYII=",
  "base64",
);
export function createProfileFixture() {
  let version = 0;
  let uploads = 0;
  const owned = new Set(["fixture-avatar-current"]);
  const value = {
    first_name: "Fixture",
    last_name: "User",
    avatar_ref_id: "fixture-avatar-current",
  };
  const json = (body, status = 200) => ({
    body,
    status,
    contentType: "application/json",
  });
  return {
    handle(method, path, raw) {
      if (path === "/api/v1/me/profile") {
        if (method === "PATCH") {
          const patch = JSON.parse(raw);
          if (patch.ref_id !== `fixture-profile-${version}`)
            return json({ success: false }, 409);
          if (patch.avatar_ref_id && !owned.has(patch.avatar_ref_id))
            return json({ success: false }, 404);
          for (const key of ["first_name", "last_name", "avatar_ref_id"]) {
            if (Object.hasOwn(patch, key)) value[key] = patch[key];
          }
          version++;
        }
        return json({
          success: true,
          data: { ...value, ref_id: `fixture-profile-${version}` },
        });
      }
      if (path === "/api/v1/media/images" && method === "POST") {
        uploads++;
        const reference = `fixture-avatar-upload-${uploads}`;
        owned.add(reference);
        return json({ success: true, data: { ref_id: reference } });
      }
      if (path.startsWith("/api/v1/media/images/") && method === "GET") {
        const reference = decodeURIComponent(path.split("/").at(-1));
        return owned.has(reference)
          ? { bytes: image, contentType: "image/png", status: 200 }
          : json({ success: false }, 404);
      }
      return null;
    },
  };
}
