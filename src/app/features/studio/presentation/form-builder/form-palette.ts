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
