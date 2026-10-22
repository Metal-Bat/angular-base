import { recordDefinitions } from './record-definitions';
import { formBody } from '../domain/records';
import {
  scheduleErrors,
  scheduleUpdateErrors,
} from '../domain/schedule-validation';

it('validates changed schedule bounds against retained current instants without inventing update fields', () => {
  const current = {
    schedule_type: 'clocked',
    start_at: '2026-12-01T09:00:00Z',
    clocked_at: '2026-12-01T10:00:00Z',
    expires_at: '2026-12-01T12:00:00Z',
  };
  expect(
    scheduleUpdateErrors({ expires_at: '2026-12-01T10:00:00Z' }, current),
  ).toHaveProperty('expires_at');
  expect(
    scheduleUpdateErrors({ start_at: '2026-12-01T13:00:00Z' }, current),
  ).toHaveProperty('start_at');
  expect(scheduleUpdateErrors({ expires_at: null }, current)).toEqual({});
  expect(scheduleUpdateErrors({ enabled: false }, current)).toEqual({});
  expect(
    scheduleUpdateErrors({ interval_seconds: 20 }, { interval_seconds: null }),
  ).toEqual({});
});

it('does not accept a clocked time without its one-off invariant', () => {
  expect(
    scheduleErrors({
      schedule_type: 'clocked',
      clocked_at: '2026-12-01T12:00:00Z',
      one_off: false,
    }),
  ).toHaveProperty('one_off');
});

it('rejects an interval payload containing another schedule variant', () => {
  const values = {
    name: 'Retained interval',
    task_name: 'system.ping',
    schedule_type: 'interval',
    interval_seconds: '60',
    clocked_at: '2026-12-01T12:00:00Z',
  };
  const body = formBody(
    recordDefinitions['task-schedules'].createFields,
    values,
  );
  expect(scheduleErrors(body)).toHaveProperty('clocked_at');
});

it('keeps inactive values in the draft but omits them from the selected schedule payload', async () => {
  const { scheduleFields } = await import('../domain/schedule-validation');
  const fields = recordDefinitions['task-schedules'].createFields;
  const draft = {
    name: 'Typed schedule',
    task_name: 'system.ping',
    schedule_type: 'interval',
    interval_seconds: '60',
    clocked_at: '2026-12-01T12:00:00Z',
    cron_minute: '*/5',
    one_off: false,
  };
  expect(formBody(scheduleFields(fields, draft), draft)).toMatchObject({
    schedule_type: 'interval',
    interval_seconds: 60,
  });
  expect(formBody(scheduleFields(fields, draft), draft)).not.toHaveProperty(
    'clocked_at',
  );
  expect(formBody(scheduleFields(fields, draft), draft)).not.toHaveProperty(
    'cron_minute',
  );
  draft.schedule_type = 'clocked';
  expect(formBody(scheduleFields(fields, draft), draft)['clocked_at']).toBe(
    '2026-12-01T12:00:00Z',
  );
  expect(draft.interval_seconds).toBe('60');
});

it('keeps non-interval updates free of rejected interval nulls and preserves an omitted legacy interval', async () => {
  const { scheduleFields } = await import('../domain/schedule-validation');
  const fields = recordDefinitions['task-schedules'].fields;
  const unchanged = { interval_seconds: '', enabled: false, queue: '' };
  const clocked = scheduleFields(
    fields,
    { ...unchanged, schedule_type: 'clocked' },
    true,
  );
  expect(formBody(clocked, unchanged)).not.toHaveProperty('interval_seconds');
  const legacy = scheduleFields(
    fields,
    { ...unchanged, schedule_type: 'interval' },
    true,
  );
  expect(formBody(legacy, unchanged)).not.toHaveProperty('interval_seconds');
  expect(
    formBody(legacy, { ...unchanged, interval_seconds: '15' }),
  ).toMatchObject({ enabled: false, interval_seconds: 15 });
});
