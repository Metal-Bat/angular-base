import { mutationReference } from './workspace-decoders';
it('retains the task current reference when its DTO also contains the parent request', () => {
  expect(
    mutationReference({
      ref_id: 'task-current',
      request_ref_id: 'parent-request',
    }),
  ).toBe('task-current');
  expect(
    mutationReference({
      ref_id: 'forwarded-task',
      request_ref_id: 'parent-request',
    }),
  ).toBe('forwarded-task');
});
it('retains the explicit owning reference for attachment and runtime wrappers', () => {
  expect(
    mutationReference({
      request_ref_id: 'request-current',
      attachment: { ref_id: 'attachment' },
    }),
  ).toBe('request-current');
  expect(
    mutationReference({
      work_item_ref_id: 'task-current',
      attachment: { ref_id: 'attachment' },
    }),
  ).toBe('task-current');
  expect(
    mutationReference({
      resource_ref_id: 'runtime-current',
      ref_id: 'nested-record',
    }),
  ).toBe('runtime-current');
  expect(() => mutationReference({ ref_id: '' })).toThrow(
    'Invalid mutation reference',
  );
});
