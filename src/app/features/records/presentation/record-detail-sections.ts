import { userRecordSections } from './record-sections';

type Section = { title: string; keys: readonly string[] };
const identity: Section = {
  title: 'Identity',
  keys: ['name', 'code', 'description', 'number', 'status'],
};
const activity: Section = {
  title: 'Activity',
  keys: [
    'created_at',
    'updated_at',
    'deleted_at',
    'started_at',
    'finished_at',
    'completed_at',
    'expires_at',
  ],
};
const sections: Readonly<Record<string, readonly Section[]>> = {
  roles: [identity, { title: 'Permissions', keys: ['permissions'] }, activity],
  permissions: [identity, activity],
  groups: [identity, { title: 'Account', keys: ['is_active'] }, activity],
  integrations: [
    identity,
    {
      title: 'Connection',
      keys: ['provider', 'kind', 'verification_status', 'non_secret_config'],
    },
    activity,
  ],
  'step-types': [
    identity,
    {
      title: 'Configuration',
      keys: [
        'is_available',
        'handler_key',
        'handler_version',
        'config_schema',
        'ports',
      ],
    },
    activity,
  ],
  'task-definitions': [
    identity,
    {
      title: 'Execution',
      keys: [
        'module',
        'callable_name',
        'signature',
        'bind',
        'queue',
        'max_retries',
        'retry_backoff',
        'retry_jitter',
        'time_limit',
        'soft_time_limit',
      ],
    },
    activity,
  ],
  'task-schedules': [
    identity,
    {
      title: 'Schedule',
      keys: [
        'task_name',
        'schedule_type',
        'enabled',
        'interval_seconds',
        'start_at',
        'clocked_at',
        'one_off',
        'cron_minute',
        'cron_hour',
        'cron_day_of_week',
        'cron_day_of_month',
        'cron_month_of_year',
      ],
    },
    { title: 'Execution', keys: ['queue', 'args', 'kwargs'] },
    activity,
  ],
  'task-executions': [
    {
      title: 'Execution',
      keys: ['task_name', 'status', 'duration_seconds', 'retries'],
    },
    { title: 'Worker', keys: ['queue', 'worker'] },
    activity,
  ],
  reports: [
    {
      title: 'Report',
      keys: ['file_name', 'definition_key', 'status', 'file_size'],
    },
    activity,
  ],
  audit: [
    { title: 'Event', keys: ['event_type', 'success', 'details'] },
    activity,
  ],
};

export function recordDetailSections(
  key: string,
  user: boolean,
): readonly Section[] {
  return user ? userRecordSections : (sections[key] ?? []);
}
