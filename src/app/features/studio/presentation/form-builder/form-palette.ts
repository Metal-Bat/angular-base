import { palette } from '../../domain/form-authoring';

export const componentLabels: Readonly<Record<string, string>> = {
  vertical: 'Vertical layout',
  horizontal: 'Horizontal layout',
  grid: 'Grid layout',
  text: 'Text',
  textarea: 'Multiline text',
  integer: 'Whole number',
  number: 'Decimal number',
  date: 'Date',
  datetime: 'Date and time',
  boolean: 'Checkbox',
  choice: 'Choice',
  calculated: 'Calculated value',
  display: 'Display text',
  user: 'User',
  group: 'Work group',
  repeater: 'Repeated fields',
  table: 'Table',
  media: 'Media',
  attachment_collection: 'Attachments',
  action: 'Action',
};
export function componentCategory(kind: string): string {
  if (['vertical', 'horizontal', 'grid'].includes(kind)) {
    return 'Layouts';
  }
  if (['repeater', 'table', 'media', 'attachment_collection'].includes(kind)) {
    return 'Collections and files';
  }
  if (['display', 'action', 'calculated'].includes(kind)) {
    return 'Display and behavior';
  }
  return 'Fields';
}

export const quickFieldTypes = [
  'text',
  'textarea',
  'choice',
  'boolean',
  'integer',
  'date',
] as const;

export const paletteCategories = [
  'Layouts',
  'Fields',
  'Collections and files',
  'Display and behavior',
];

export function filterFormPalette(
  search: string,
  category: string,
  text: (key: string) => string,
): (typeof palette)[number][] {
  const term = search.trim().toLowerCase();
  return palette.filter(
    (kind) =>
      (!category || componentCategory(kind) === category) &&
      (kind + ' ' + componentLabels[kind] + ' ' + text(componentLabels[kind]))
        .toLowerCase()
        .includes(term),
  );
}
