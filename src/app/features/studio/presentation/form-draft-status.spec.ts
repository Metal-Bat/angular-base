import { formDraftStatus } from './form-draft-status';

it('distinguishes buffered, applied and confirmed changes without a false saved result', () => {
  let pending = ['inspector'];
  let dirty = true;
  let error = '';
  const view: Parameters<typeof formDraftStatus>[0] = {
    pending: () => pending,
    dirty: () => dirty,
    error: () => error,
    diagnostics: () => 'Saved',
  };
  expect(formDraftStatus(view)).toBe('Apply pending edits');
  pending = [];
  expect(formDraftStatus(view)).toBe('Unsaved draft changes');
  dirty = false;
  expect(formDraftStatus(view)).toBe('Saved');
  error = 'Review the uncertain operation';
  expect(formDraftStatus(view)).toBe('Review operation status');
  expect(
    formDraftStatus({ ...view, error: () => '', diagnostics: () => '' }),
  ).toBe('No unsaved changes');
});
