export const userRecordSections = [
  {
    title: 'Identity',
    keys: ['first_name', 'last_name', 'username', 'email', 'password'],
  },
  { title: 'Account', keys: ['is_active', 'is_superuser'] },
  { title: 'Activity', keys: ['created_at', 'updated_at', 'deleted_at'] },
] as const;
