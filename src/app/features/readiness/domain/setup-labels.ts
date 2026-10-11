/** Human labels for the frozen setup contract; wire keys remain unchanged. */
export const setupLabels: Readonly<Record<string, string>> = {
  schema_head: 'Database schema',
  system_permissions: 'System permissions',
  demo_roles: 'Demo roles',
  system_handlers: 'System handlers',
  client_release: 'Client release',
  enabled_templates: 'Enabled request types',
  configured_connections: 'Configured connections',
  database_facts: 'Database status',
  cache: 'Cache connectivity',
  broker: 'Queue connectivity',
  s3: 'Private storage connectivity',
  worker_execution: 'Worker execution',
  scheduler_execution: 'Scheduler execution',
};
export const setupReasons: Readonly<Record<string, string>> = {
  'setup.connectivity_verified': 'Connectivity verified',
  'setup.probe_unavailable': 'Connectivity could not be verified',
  'setup.database_unavailable': 'Database is unavailable',
  'setup.operator_probe_required':
    'Separate operator execution evidence is required',
  'setup.fact_verified': 'Configuration verified',
  'setup.dependency_missing': 'A required dependency is missing',
  'setup.optional_not_configured': 'Optional configuration is absent',
  'setup.catalog_limit': 'The catalog exceeds the inspection limit',
};
