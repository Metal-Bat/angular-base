import {
  decodeChoice,
  encodeChoice,
  fieldValue,
  instancePointer,
  MISSING,
  replaceField,
} from '../domain/canonical-values';
import {
  deferredPrimitives,
  implementedPrimitives,
  unsupportedNodes,
} from '../domain/primitive-registry';
import { primitiveKinds, RuntimeDocument } from '../domain/runtime-document';
import { validateRuntime, validateValue } from '../domain/runtime-validation';
import { readRuntimeDocument } from './runtime-document-adapter';
import {
  actors,
  collectionFixture,
  contextFixture,
  machineStates,
  runtimeFixture,
  taskFixture,
} from '../testing/runtime-fixtures';
import { effectiveRequired } from '../domain/resolved-behavior';
function document(): RuntimeDocument {
  const result = readRuntimeDocument(runtimeFixture());
  if (result.status !== 'ready') {
    throw new Error('Invalid fixture');
  }
  return result.document;
}
describe('Canonical runtime and conformance matrix', () => {
  it('accounts for all 20 primitive kinds with explicit deferred binary/collection controls', () => {
    expect([...implementedPrimitives, ...deferredPrimitives].sort()).toEqual(
      [...primitiveKinds].sort(),
    );
    expect(actors.outsider).toEqual([]);
    expect(machineStates.request).toContain('RUNNING');
    expect(collectionFixture()['item_identity']).toEqual({
      '/rows': ['row-a', 'row-b'],
    });
    expect(
      unsupportedNodes({ ...document().render, component: 'repeater' }),
    ).toEqual([]);
  });
  it.each(['summary', 'print', 'observer', 'correction'] as const)(
    'decodes the authorized %s fixture context',
    (purpose) => {
      const result = readRuntimeDocument(contextFixture(purpose));
      expect(result.status).toBe('ready');
      if (result.status !== 'ready') {
        return;
      }
      expect(result.document.purpose).toBe(purpose);
      if (purpose !== 'correction') {
        expect(result.document.policy.writable).toEqual([]);
        expect(result.document.actions).toEqual([]);
      } else {
        expect(result.document.before?.['amount']).toBe(100);
      }
      expect(taskFixture('AI_APPROVAL')['form_version_ref_id']).toBeNull();
    },
  );
  it.each(['', null, false, 0, '۱۲۳.۴۵', '12345678901234567890.123456789'])(
    'preserves %j apart from missing',
    (value) => {
      const data = replaceField(
        {},
        '/properties/outer/properties/value',
        value,
      );
      expect(fieldValue(data, '/properties/outer/properties/value')).toBe(
        value,
      );
      expect(
        fieldValue(
          replaceField(data, '/properties/outer/properties/value', MISSING),
          '/properties/outer/properties/value',
        ),
      ).toBe(MISSING);
    },
  );
  it('maps escaped nested scopes to instance pointers and avoids prototype mutation', () => {
    expect(instancePointer('/properties/a~1b/properties/c~0d')).toBe(
      '/a~1b/c~0d',
    );
    expect(() =>
      replaceField({}, '/properties/__proto__/properties/polluted', true),
    ).toThrow();
    expect(() =>
      replaceField({ parent: null }, '/properties/parent/properties/value', 1),
    ).toThrow();
  });
  it.each([1, '1', true, false, 'فارسی', 1.5])(
    'retains the typed option scalar %j',
    (value) => {
      expect(decodeChoice(encodeChoice(value))).toBe(value);
    },
  );
  it('rejects malformed option keys and nullable/number/date errors without silently normalizing', () => {
    expect(() => decodeChoice('json:{"hostile":true}')).toThrow();
    expect(validateValue(null, { type: ['string', 'null'] }, true)).toBeNull();
    expect(validateValue(MISSING, { type: ['string', 'null'] }, true)).toBe(
      'Required',
    );
    expect(validateValue('', { type: 'string' }, true)).toBeNull();
    expect(
      validateValue('2026-02-30', { type: 'string', format: 'date' }, false),
    ).not.toBeNull();
    expect(
      validateValue(
        '2026-10-03T12:30:00',
        { type: 'string', format: 'date-time' },
        false,
      ),
    ).not.toBeNull();
    expect(
      validateValue(
        '2026-10-03T12:30:00+03:30',
        { type: 'string', format: 'date-time' },
        false,
      ),
    ).toBeNull();
    expect(validateValue('125', { type: 'number' }, false)).toBe(
      'Invalid value type',
    );
  });
  it('shows required hints only from authorized metadata and server-resolved flags', () => {
    const doc = document();
    expect(validateRuntime(doc, { amount: -1 })[0].pointer).toBe('/amount');
    const changed = {
      ...doc,
      render: {
        ...doc.render,
        children: [
          {
            ...doc.render.children[0],
            display: { runtime_state: { visible: false, required: true } },
          },
        ],
      },
    };
    expect(effectiveRequired(changed)).not.toContain('/properties/amount');
  });
});
