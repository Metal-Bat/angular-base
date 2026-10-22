import { formIssues } from './form-issues';
import { JsonObject } from '../../forms/domain/runtime-document';

const documents: JsonObject = {
  render_schema: {
    root: {
      component: 'vertical',
      children: [
        {
          component: 'number',
          scope: '/properties/amount',
          label: 'Stored amount',
        },
      ],
    },
  },
};
const fields = [
  {
    path: [0],
    label: 'Resolved amount',
    scope: '/properties/amount',
    identity: 'amount',
  },
];
describe('Readable form issues', () => {
  it('uses effective field labels and keeps warnings distinct from errors and exact technical codes', () => {
    const issues = formIssues(
      JSON.stringify({
        issues: [
          {
            pointer: '/render_schema/root/children/0/options/max_items',
            code: 'render.option',
          },
        ],
        warnings: [
          {
            pointer: '/localization/messages/title',
            code: 'translation.missing',
          },
        ],
      }),
      documents,
      fields,
    );
    expect(issues).toMatchObject([
      {
        severity: 'Error',
        label: 'Resolved amount',
        path: [0],
        mode: 'design',
        message: 'Review this field’s presentation options.',
      },
      {
        severity: 'Warning',
        mode: 'languages',
        code: 'translation.missing',
        label: 'Translations',
      },
    ]);
  });
  it('maps canonical constraint descendants to their placement and leaves document issues in settings', () => {
    const issues = formIssues(
      JSON.stringify({
        issues: [
          {
            pointer: '/data_schema/properties/amount/minimum',
            code: 'data.minimum',
          },
          { pointer: '/page_settings/default_view', code: 'future.setting' },
        ],
      }),
      documents,
      fields,
    );
    expect(issues).toMatchObject([
      { path: [0], label: 'Resolved amount', mode: 'design' },
      {
        path: null,
        mode: 'settings',
        message: 'Review this configuration.',
        code: 'future.setting',
      },
    ]);
  });
  it('does not render malformed diagnostics or invent severity from arbitrary text', () => {
    for (const text of [
      'Saved',
      '{"unfinished":',
      'null',
      '[]',
      '{"issues":[{"code":"x"}]}',
    ]) {
      expect(formIssues(text, documents, fields)).toEqual([]);
    }
  });
});
