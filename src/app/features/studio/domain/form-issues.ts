import { JsonObject } from '../../forms/domain/runtime-document';
import { AuthorIssue, authorIssues } from './authoring-diagnostics';
import { OutlineItem } from './form-authoring';

export type FormIssue = AuthorIssue & {
  severity: 'Error' | 'Warning';
  label: string;
  message: string;
  mode: 'design' | 'settings' | 'languages';
};
const messages: Readonly<Record<string, string>> = {
  'localization.missing': 'Missing translation',
  'localization.stale': 'Stale translation',
  'localization.parameters':
    'Translation parameters must match the default message.',
  'render.invalid': 'Review this field’s configuration.',
  'render.option': 'Review this field’s presentation options.',
  'render.grid': 'Review this field’s position and span.',
  'render.outcome': 'Choose a declared action outcome.',
  'render.calculation': 'Review this field’s calculation.',
  'render.calculation_type': 'The calculation must match the field type.',
  'render.rule_value': 'The rule value must match the source field type.',
  'data.required': 'Complete the required value.',
  'data.minimum': 'The value is below the allowed minimum.',
  'data.maximum': 'The value is above the allowed maximum.',
};

/** Keep the producer's issue and warning lists distinct; raw codes remain technical detail. */
export function formIssues(
  text: string,
  documents: JsonObject,
  fields: readonly OutlineItem[],
): FormIssue[] {
  let result: Record<string, unknown>;
  try {
    const value: unknown = JSON.parse(text);
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
      return [];
    }
    result = value as Record<string, unknown>;
  } catch {
    return [];
  }
  return (['issues', 'warnings'] as const).flatMap((key) =>
    authorIssues({ issues: result[key] }, documents, true).map((issue) => {
      const field = fields.find(
        (item) => issue.path && item.path.join('.') === issue.path.join('.'),
      );
      const mode = issue.path
        ? 'design'
        : issue.pointer.startsWith('/localization')
          ? 'languages'
          : 'settings';
      return {
        ...issue,
        severity: key === 'issues' ? 'Error' : 'Warning',
        label:
          field?.label ??
          (mode === 'languages' ? 'Translations' : 'Form settings'),
        mode,
        message: messages[issue.code] ?? 'Review this configuration.',
      };
    }),
  );
}
