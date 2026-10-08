import {
  RuntimeAction,
  RuntimeCompatibility,
  RuntimeDocument,
} from '../domain/runtime-document';
import { readRender } from './runtime-render';
import {
  bool,
  jsonObject,
  list,
  object,
  scopes,
  strings,
  text,
} from './runtime-shape';
export type RuntimePin = Pick<
  RuntimeDocument['identity'],
  'formVersion' | 'versionNumber' | 'design'
>;
function action(value: unknown, readable: readonly string[]): RuntimeAction {
  const item = object(value);
  const kind = item['kind'];
  const validation = item['validation'];
  if (
    !['complete', 'reject', 'return'].includes(String(kind)) ||
    !['complete', 'partial'].includes(String(validation))
  ) {
    throw new Error('shape');
  }
  const required = scopes(item['required_scopes']);
  if (required.some((entry) => !readable.includes(entry))) {
    throw new Error('policy');
  }
  return Object.freeze({
    key: text(item['key']),
    kind: kind as RuntimeAction['kind'],
    outcome: text(item['outcome_key']),
    title: text(item['title']),
    confirmation:
      item['confirmation'] === null ? null : text(item['confirmation']),
    requiredScopes: required,
    requireComment: bool(item['require_comment']),
    validation: validation as RuntimeAction['validation'],
  });
}
function fields(
  value: unknown,
  readable: readonly string[],
  writable: readonly string[],
  required: readonly string[],
): RuntimeDocument['fields'] {
  const result = list(value, 256).map((item) => {
    const field = object(item);
    const path = text(field['scope']);
    if (
      !readable.includes(path) ||
      bool(field['writable']) !== writable.includes(path) ||
      bool(field['required']) !== required.includes(path)
    ) {
      throw new Error('policy');
    }
    const schema = jsonObject(field['validation_schema']);
    // This is already an authorized projection. Never fill it from an authoring schema.
    if (
      Object.keys(schema).some((key) =>
        ['default', 'examples', '$ref', '$defs'].includes(key),
      )
    ) {
      throw new Error('policy');
    }
    return Object.freeze({
      scope: path,
      schema,
      writable: bool(field['writable']),
      required: bool(field['required']),
    });
  });
  if (
    new Set(result.map((field) => field.scope)).size !== result.length ||
    readable.some((path) => !result.some((field) => field.scope === path))
  ) {
    throw new Error('policy');
  }
  return Object.freeze(result);
}

function identity(
  dto: Record<string, unknown>,
  pin?: RuntimePin,
): RuntimeDocument['identity'] {
  const kind = dto['resource_kind'];
  const version = dto['form_version_number'];
  if (
    !['REQUEST', 'WORK_ITEM'].includes(String(kind)) ||
    !Number.isSafeInteger(version) ||
    Number(version) < 1
  ) {
    throw new Error('shape');
  }
  const value = Object.freeze({
    resourceKind: kind as 'REQUEST' | 'WORK_ITEM',
    resource: text(dto['resource_ref_id']),
    formVersion: text(dto['form_version_ref_id']),
    versionNumber: Number(version),
    submission: text(dto['submission_ref_id']),
    design: text(dto['design_key']),
    view: text(dto['view_key']),
  });
  if (
    pin &&
    (pin.formVersion !== value.formVersion ||
      pin.versionNumber !== value.versionNumber ||
      pin.design !== value.design)
  ) {
    throw new Error('pin');
  }
  return value;
}
function presentation(dto: Record<string, unknown>): {
  purpose: RuntimeDocument['purpose'];
  locale: RuntimeDocument['locale'];
} {
  const purpose = dto['purpose'];
  const language = dto['resolved_locale'];
  const direction = dto['direction'];
  if (
    !['edit', 'summary', 'print', 'observer', 'correction'].includes(
      String(purpose),
    ) ||
    !['en', 'fa'].includes(String(language)) ||
    direction !== (language === 'fa' ? 'rtl' : 'ltr')
  ) {
    throw new Error('shape');
  }
  return {
    purpose: purpose as RuntimeDocument['purpose'],
    locale: Object.freeze({
      language: language as 'en' | 'fa',
      direction: direction as 'ltr' | 'rtl',
    }),
  };
}
function policy(
  dto: Record<string, unknown>,
  purpose: RuntimeDocument['purpose'],
): RuntimeDocument['policy'] {
  const readable = scopes(dto['readable_scopes']);
  const writable = scopes(dto['writable_scopes']);
  const required = scopes(dto['required_scopes']);
  if (
    [...writable, ...required].some((path) => !readable.includes(path)) ||
    (['observer', 'summary', 'print'].includes(purpose) &&
      (writable.length || list(dto['actions'] ?? [], 64).length))
  ) {
    throw new Error('policy');
  }
  return Object.freeze({
    readable: Object.freeze(readable),
    writable: Object.freeze(writable),
    required: Object.freeze(required),
  });
}
function behavior(dto: Record<string, unknown>): RuntimeDocument['behavior'] {
  const issues = list(dto['issues'] ?? [], 32).map((issue) => {
    const item = object(issue);
    const pointer = item['pointer'];
    if (
      typeof pointer !== 'string' ||
      (pointer !== '' && !pointer.startsWith('/')) ||
      pointer.length > 4096
    ) {
      throw new Error('shape');
    }
    return Object.freeze({ pointer, code: text(item['code']) });
  });
  return Object.freeze({
    provenance: jsonObject(dto['override_provenance'] ?? {}),
    issues: Object.freeze(issues),
  });
}
export function readRuntimeDocument(
  value: unknown,
  pin?: RuntimePin,
  capabilities: readonly string[] = [],
): RuntimeCompatibility {
  try {
    const dto = object(jsonObject(value));
    if (
      dto['runtime_dialect'] !== 'bpms.runtime/1' ||
      dto['render_dialect'] !== 'bpms.render/1' ||
      dto['data_dialect'] !== 'https://json-schema.org/draft/2020-12/schema'
    ) {
      throw new Error('dialect');
    }
    const display = presentation(dto);
    const access = policy(dto, display.purpose);
    const render = object(dto['render_schema']);
    if (render['dialect'] !== 'bpms.render/1') {
      throw new Error('dialect');
    }
    const actions = list(dto['actions'] ?? [], 64).map((item) =>
      action(item, access.readable),
    );
    if (new Set(actions.map((item) => item.key)).size !== actions.length) {
      throw new Error('shape');
    }
    const rows = Object.fromEntries(
      Object.entries(object(dto['item_identity'])).map(([path, keys]) => [
        path,
        strings(keys, 1000),
      ]),
    );
    const document: RuntimeDocument = Object.freeze({
      dialect: 'bpms.runtime/1',
      identity: identity(dto, pin),
      ...display,
      canonical: jsonObject(dto['data']),
      before:
        dto['before_data'] === null || dto['before_data'] === undefined
          ? null
          : jsonObject(dto['before_data']),
      rowIdentity: Object.freeze(rows),
      beforeRowIdentity:
        dto['before_item_identity'] === null ||
        dto['before_item_identity'] === undefined
          ? null
          : Object.freeze(
              Object.fromEntries(
                Object.entries(object(dto['before_item_identity'])).map(
                  ([path, keys]) => [path, strings(keys, 1000)],
                ),
              ),
            ),
      render: readRender(render['root'], access.readable, capabilities),
      page: jsonObject(dto['page_settings'] ?? {}),
      policy: access,
      fields: fields(
        dto['field_metadata'],
        access.readable,
        access.writable,
        access.required,
      ),
      actions: Object.freeze(actions),
      behavior: behavior(dto),
    });
    return { status: 'ready', document };
  } catch (error) {
    const reason = error instanceof Error ? error.message : 'shape';
    return ['dialect', 'primitive', 'capability'].includes(reason)
      ? {
          status: 'unsupported',
          reason: reason as 'dialect' | 'primitive' | 'capability',
        }
      : {
          status: 'invalid',
          reason: reason === 'policy' || reason === 'pin' ? reason : 'shape',
        };
  }
}
