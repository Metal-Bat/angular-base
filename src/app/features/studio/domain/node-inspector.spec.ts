import {
  applyConfiguration,
  handlers,
  inspectorFor,
  patchOwned,
} from './node-inspector';
import source from '../../../../../docs/reference/app-be-wave-four/inspector-en.json';
import { JsonObject } from '../../forms/domain/runtime-document';
const registered = source.handlers.map((handler) => ({
  category: 'step_type',
  type_schema: handler.config_schema,
  metadata: {
    ref_id: handler.handler_key + handler.handler_version,
    code: handler.code,
    handler_key: handler.handler_key,
    handler_version: handler.handler_version,
    runtime_available: true,
  },
})) as unknown as JsonObject[];
describe('Frozen node inspector registry', () => {
  it('resolves every shipped handler/version against the current pin and exact schema', () => {
    expect(handlers.length).toBe(17);
    for (const handler of source.handlers) {
      const step = {
        key: 'step',
        type_code: handler.code,
        type_version_ref: handler.handler_key + handler.handler_version,
      };
      expect(inspectorFor(step, registered)?.handler_version).toBe(
        handler.handler_version,
      );
    }
  });
  it('rejects unknown pins, disabled handlers and same-version schema drift', () => {
    const step = {
      key: 'wait',
      type_code: 'TIMER',
      type_version_ref: 'timer1',
    };
    expect(
      inspectorFor({ ...step, type_version_ref: 'stale' }, registered),
    ).toBeNull();
    expect(inspectorFor({ ...step, config: [] }, registered)).toBeNull();
    expect(inspectorFor({ ...step, config: null }, registered)).toBeNull();
    const entry = registered.find(
      (row) => (row['metadata'] as JsonObject)['ref_id'] === 'timer1',
    )!;
    expect(
      inspectorFor(step, [
        {
          ...entry,
          type_schema: {
            type: 'object',
            properties: { unexpected: { type: 'string' } },
          },
        },
      ]),
    ).toBeNull();
    expect(
      inspectorFor(step, [
        {
          ...entry,
          metadata: {
            ...(entry['metadata'] as JsonObject),
            runtime_available: false,
          },
        },
      ]),
    ).toBeNull();
  });
  it('preserves identity, subprocess pins and unknown properties while validating timer bounds', () => {
    const handler = handlers.find((item) => item.handler_key === 'timer')!;
    const step = {
      key: 'wait',
      type_code: 'TIMER',
      type_version_ref: 'current-pin',
      config: { delay_seconds: 5, retained: { flag: false, zero: 0 } },
      subprocess: { workflow_version_ref: 'child-pin' },
    };
    const changed = applyConfiguration(step, handler, {
      delay_seconds: 10,
      retained: { altered: true },
      unowned: 'ignored',
    });
    expect(changed).toEqual({
      ...step,
      config: { ...step.config, delay_seconds: 10 },
    });
    expect(() =>
      applyConfiguration(step, handler, { delay_seconds: 0 }),
    ).toThrow();
    expect(() =>
      applyConfiguration(step, handler, { delay_seconds: 1.5 }),
    ).toThrow();
    expect(step.config.delay_seconds).toBe(5);
  });
  it('distinguishes optional removal from false and zero', () => {
    const handler = handlers.find((item) => item.handler_key === 'event_wait')!;
    const step = {
      key: 'event',
      config: {
        event_type: 'approved',
        expires_in_seconds: 50,
        unknown: false,
      },
    };
    expect(
      applyConfiguration(step, handler, { event_type: 'approved' })['config'],
    ).toEqual({ event_type: 'approved', unknown: false });
    expect(patchOwned({ flag: true, zero: 1 }, 'flag', false)).toEqual({
      flag: false,
      zero: 1,
    });
    expect(patchOwned({ zero: 1 }, 'zero', 0)).toEqual({ zero: 0 });
  });
});

it('round-trips transform v2 structured defaults and projections without JSON conversion', () => {
  const handler = handlers.find(
    (item) => item.handler_key === 'transform' && item.handler_version === '2',
  )!;
  const step = {
    key: 'convert',
    type_version_ref: 'immutable-pin',
    config: { conversion_key: 'object', null_behavior: 'default' },
  };
  const edited = applyConfiguration(step, handler, {
    ...step.config,
    default: { flag: false, zero: 0 },
    projection: { amount: '/request/amount' },
  });
  expect(edited['config']).toEqual({
    ...step.config,
    default: { flag: false, zero: 0 },
    projection: { amount: '/request/amount' },
  });
  expect(edited['type_version_ref']).toBe('immutable-pin');
  expect(() =>
    applyConfiguration(step, handler, { conversion_key: 'unsupported' }),
  ).toThrow();
});
