import { updateFieldValues } from './record-draft';
it('merges independently emitted sections without replacing newer fields or inactive schedule drafts', () => {
  const stale = {
    name: '',
    schedule_type: '',
    enabled: true,
    clocked_at: 'retained',
  };
  const named = updateFieldValues(stale, [{ key: 'name' }], {
    ...stale,
    name: 'Owned schedule',
  });
  const scheduled = updateFieldValues(
    named,
    [{ key: 'schedule_type' }, { key: 'enabled' }],
    { ...stale, schedule_type: 'interval', enabled: false },
  );
  expect(scheduled).toEqual({
    name: 'Owned schedule',
    schedule_type: 'interval',
    enabled: false,
    clocked_at: 'retained',
  });
  expect(
    updateFieldValues(scheduled, [{ key: 'queue' }], {
      ...stale,
      queue: 'paused',
    }),
  ).toMatchObject({ name: 'Owned schedule', enabled: false, queue: 'paused' });
});
