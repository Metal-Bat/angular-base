export const areaPermissions = {
  operations: ['requests.start'],
  studio: ['forms.manage', 'workflows.manage', 'requests.manage'],
  administration: [
    'forms.manage',
    'workflows.manage',
    'requests.start',
    'admin.users.manage',
    'admin.permissions.manage',
    'admin.work_groups.manage',
    'admin.tasks.manage',
    'admin.history.read',
    'integrations.manage',
    'processes.recover',
  ],
} as const;
export type Area = keyof typeof areaPermissions;
export function hasPermissions(
  permissions: readonly string[],
  all: readonly string[],
  any: readonly string[] = [],
): boolean {
  const has = (permission: string): boolean =>
    permissions.includes('*') || permissions.includes(permission);
  return all.every(has) && (any.length === 0 || any.some(has));
}
export function canEnterArea(
  permissions: readonly string[],
  area: Area,
): boolean {
  return hasPermissions(permissions, [], areaPermissions[area]);
}
