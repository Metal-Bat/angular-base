import { test } from "node:test";
import assert from "node:assert/strict";
import {
  formPreviewFixture,
  formOptionsFixture,
} from "./form-preview-fixture.mjs";
const documents = {
  data_schema: {
    type: "object",
    properties: { decision: { type: ["number", "boolean", "string"] } },
  },
  render_schema: {
    dialect: "bpms.render/1",
    root: {
      component: "vertical",
      children: [
        {
          component: "choice",
          scope: "/properties/decision",
          label: "Decision",
          source: {
            kind: "custom",
            items: [
              { key: 0, value: "Zero" },
              { key: false, value: "No" },
              { key: "0", value: "Text zero" },
            ],
          },
          messages: { label: { key: "decision" } },
          rules: [],
        },
      ],
    },
  },
};
test("runtime fixture projects authoring metadata without mutating stored definitions", () => {
  const before = structuredClone(documents);
  const dto = formPreviewFixture({
    documents,
    purpose: "edit",
    locale: "en",
    data: { decision: false },
  }).data;
  assert.equal(dto.render_schema.root.children[0].source, undefined);
  assert.equal(dto.render_schema.root.children[0].rules, undefined);
  assert.equal(dto.render_schema.root.children[0].messages, undefined);
  assert.deepEqual(documents, before);
  assert.deepEqual(dto.data, { decision: false });
});
test("static option fixture keeps reversible typed keys, selected filtering and generation", () => {
  const body = {
    documents,
    locale: "en",
    query: {
      node_pointer: "/root/children/0",
      data: { decision: false },
      generation: 3,
      page: 1,
      size: 20,
    },
  };
  assert.deepEqual(formOptionsFixture(body).result.items, [
    { key: "json:0", value: "Zero" },
    { key: "json:false", value: "No" },
    { key: 'json:"0"', value: "Text zero" },
  ]);
  assert.deepEqual(
    formOptionsFixture({
      ...body,
      query: { ...body.query, selected_keys: ["json:false"] },
    }).result.items,
    [{ key: "json:false", value: "No" }],
  );
  assert.equal(formOptionsFixture(body).result.generation, 3);
  assert.equal(
    formOptionsFixture({ ...body, query: { ...body.query, search: "absent" } })
      .result.state,
    "EMPTY",
  );
});
