import { RecordRow } from './records';
/** Additional invariants enforced by PeriodicTaskCreateDTO's backend validator. */
export function scheduleErrors(values: RecordRow): Record<string, string> {
  const errors: Record<string, string> = {};
  if (
    values['schedule_type'] === 'interval' &&
    (values['interval_seconds'] === null ||
      values['interval_seconds'] === undefined)
  ) {
    errors['interval_seconds'] = 'Enter the interval in seconds.';
  }
  if (values['schedule_type'] === 'clocked') {
    if (!values['clocked_at']) {
      errors['clocked_at'] = 'Choose the scheduled time.';
    }
    if (values['one_off'] !== true) {
      errors['one_off'] = 'Clocked schedules must run once.';
    }
  }
  return errors;
}
