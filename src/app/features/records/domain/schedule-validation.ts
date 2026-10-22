import { RecordField, RecordRow } from './records';
const variants: Readonly<Record<string, string>> = {
  interval_seconds: 'interval',
  clocked_at: 'clocked',
  cron_minute: 'crontab',
  cron_hour: 'crontab',
  cron_day_of_week: 'crontab',
  cron_day_of_month: 'crontab',
  cron_month_of_year: 'crontab',
};
/** Preserve inactive drafts while projecting only the selected create variant. */
export function scheduleFields(
  fields: readonly RecordField[],
  values: Record<string, string | boolean>,
  updating = false,
): readonly RecordField[] {
  return fields
    .filter(
      (field) =>
        !variants[field.key] || variants[field.key] === values['schedule_type'],
    )
    .map((field) =>
      updating && field.key === 'interval_seconds'
        ? { ...field, nullable: false }
        : field,
    );
}
/** Cross-field invariants from PeriodicTaskCreateDTO; the server remains authoritative. */
export function scheduleErrors(values: RecordRow): Record<string, string> {
  const errors: Record<string, string> = {};
  for (const [key, variant] of Object.entries(variants)) {
    if (
      values[key] !== null &&
      values[key] !== undefined &&
      values['schedule_type'] !== variant
    ) {
      errors[key] = 'This field belongs to a different schedule type.';
    }
  }
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
  for (const key of ['start_at', 'clocked_at']) {
    if (
      values[key] &&
      values['expires_at'] &&
      Date.parse(String(values['expires_at'])) <=
        Date.parse(String(values[key]))
    ) {
      errors['expires_at'] =
        'Expiry must be after the start and scheduled time.';
    }
  }
  return errors;
}

/** Validate changed bounds against the current schedule without replaying omitted fields. */
export function scheduleUpdateErrors(
  changes: RecordRow,
  current: RecordRow,
): Record<string, string> {
  if (
    !Object.hasOwn(changes, 'start_at') &&
    !Object.hasOwn(changes, 'expires_at')
  ) {
    return {};
  }
  const values = { ...current, ...changes };
  for (const key of ['start_at', 'clocked_at']) {
    if (
      values[key] &&
      values['expires_at'] &&
      Date.parse(String(values['expires_at'])) <=
        Date.parse(String(values[key]))
    ) {
      // A retained expiry must point at the changed start control, which is editable.
      return {
        [Object.hasOwn(changes, 'expires_at') ? 'expires_at' : 'start_at']:
          'Expiry must be after the start and scheduled time.',
      };
    }
  }
  return {};
}
