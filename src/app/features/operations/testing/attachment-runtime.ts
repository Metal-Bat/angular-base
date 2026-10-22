import {
  JsonObject,
  RuntimeDocument,
} from '../../forms/domain/runtime-document';
import { readRuntimeDocument } from '../../forms/infrastructure/runtime-document-adapter';
import { runtimeFixture } from '../../forms/testing/runtime-fixtures';

export function attachmentRuntime(nested = false): RuntimeDocument {
  const dto = runtimeFixture('REQUEST');
  const scope = nested
    ? '/properties/amount/items/properties/files'
    : '/properties/amount';
  dto['data'] = {
    ...(dto['data'] as JsonObject),
    amount: nested ? [{ files: [] }] : [],
  };
  const field: JsonObject = {
    component: 'attachment_collection',
    node_key: 'receipts',
    scope,
    label: 'Receipts',
  };
  dto['render_schema'] = {
    dialect: 'bpms.render/1',
    root: {
      component: 'vertical',
      children: [
        nested
          ? {
              component: 'repeater',
              scope: '/properties/amount',
              children: [field],
            }
          : field,
      ],
    },
  };
  const metadata = dto['field_metadata'] as JsonObject[];
  const schema: JsonObject = {
    type: 'array',
    items: nested
      ? {
          type: 'object',
          properties: { files: { type: 'array', items: { type: 'string' } } },
        }
      : { type: 'string' },
  };
  dto['field_metadata'] = metadata.map((entry, index) =>
    index === 0 ? { ...entry, validation_schema: schema } : entry,
  );
  dto['item_identity'] = nested ? { '/amount': ['row-a'] } : {};
  const result = readRuntimeDocument(dto);
  if (result.status !== 'ready') {
    throw Error('Invalid attachment runtime fixture');
  }
  return result.document;
}
