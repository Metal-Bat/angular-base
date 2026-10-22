import { readFileSync } from "node:fs";
const normalizedImage = readFileSync(
  new URL("./testing/inline-private-receipt.webp", import.meta.url),
);
// Synthetic private upstream for inline attachment browser tests only.
export function createInlineAttachmentsFixture(changed) {
  const uploads = new Map();
  let attachments = [];
  let serial = 0;
  const success = (data) => ({ success: true, data });
  const pngTypes = new Set(["image/png", "image/jpeg", "image/webp"]);
  const filename = (value) => value.replace(/["\r\n\\/]/g, "_");
  const commit = () => changed(attachments.map((item) => item.ref_id));
  return {
    async upload(method, path, bytes, headers) {
      if (
        method !== "POST" ||
        !["/api/v1/media/files", "/api/v1/media/images"].includes(path)
      )
        return null;
      const request = new Request("http://fixture.invalid" + path, {
        method,
        headers,
        body: bytes,
      });
      const data = await request.formData();
      const file = data.get("upload");
      if (!(file instanceof File)) throw Error("Missing synthetic upload");
      const kind = path.endsWith("/images") ? "image" : "file";
      if (kind === "image" && !pngTypes.has(file.type))
        throw Error("Invalid synthetic image");
      const ref = "fixture-private-" + ++serial;
      uploads.set(ref, {
        kind,
        name: filename(file.name),
        type: kind === "image" ? "image/webp" : file.type,
        bytes:
          kind === "image"
            ? normalizedImage
            : Buffer.from(await file.arrayBuffer()),
      });
      return success({ ref_id: ref });
    },
    content(method, path) {
      const match = path.match(/\/attachments\/([^/]+)\/content$/);
      if (method !== "GET" || !match) return null;
      const item = attachments.find(
        (entry) => entry.ref_id === decodeURIComponent(match[1]),
      );
      const upload = item && uploads.get(item.upload_ref_id);
      return upload
        ? {
            bytes: upload.bytes,
            contentType: upload.type,
            filename: upload.name,
          }
        : null;
    },
    handle(method, path, payload) {
      const match = path.match(
        /\/business-requests\/[^/]+\/attachments(?:\/([^/]+))?$/,
      );
      if (!match) return null;
      const reference = match[1] && decodeURIComponent(match[1]);
      if (method === "GET") return success(attachments);
      if (method === "POST" || (method === "PUT" && reference)) {
        const upload = uploads.get(payload.upload_ref_id);
        if (!upload) throw Error("Unknown synthetic upload");
        const prior =
          reference && attachments.find((item) => item.ref_id === reference);
        if (reference && !prior) throw Error("Unknown synthetic replacement");
        const item = {
          ref_id: "fixture-attachment-" + ++serial,
          upload_ref_id: payload.upload_ref_id,
          field_path: prior?.field_path ?? payload.field_path,
          caption: payload.caption,
          position: prior?.position ?? attachments.length,
          kind: upload.kind,
          content_type: upload.type,
          size_bytes: upload.bytes.length,
          contributing_group_ref_id: null,
          created_at: "2026-10-17T00:00:00Z",
        };
        attachments = prior
          ? attachments.map((old) => (old === prior ? item : old))
          : [...attachments, item];
        return success({ request_ref_id: commit(), attachment: item });
      }
      if (method === "DELETE") {
        attachments = attachments.filter((item) => item.ref_id !== reference);
      } else if (method === "PUT") {
        attachments = payload.attachment_ref_ids.map((ref, position) => ({
          ...attachments.find((item) => item.ref_id === ref),
          position,
        }));
      } else throw Error("Unexpected synthetic attachment operation");
      return success({ request_ref_id: commit() });
    },
  };
}
