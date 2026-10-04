import { emptyWorkspace } from './authoring';
import { readWorkspace } from './workspace-document';
import { authorIssues } from './authoring-diagnostics';
describe('Workspace boundary and author diagnostics', () => {
  it('rejects malformed layout metadata without changing authored data', () => {
    const original = emptyWorkspace();
    expect(readWorkspace(original)).toEqual(original);
    expect(() =>
      readWorkspace({ ...original, routing: { edge: null } }),
    ).toThrow();
    expect(() =>
      readWorkspace({ ...original, viewport: { x: 0, y: 0, zoom: 0 } }),
    ).toThrow();
    expect(() =>
      readWorkspace({ ...original, collapsed: ['same', 'same'] }),
    ).toThrow();
    expect(original.routing).toEqual({});
  });
  it('maps step and edge issues to stable keys', () => {
    const graph = {
      steps: [{ key: 'first' }, { key: 'second' }],
      transitions: [{ source: 'first', target: 'second' }],
    };
    const issues = authorIssues(
      {
        issues: [
          { pointer: '/graph/steps/1/config', code: 'invalid' },
          { pointer: '/transitions/0/outcome', code: 'outcome' },
        ],
      },
      graph,
    );
    expect(issues.map((issue) => issue.node)).toEqual(['second', 'first']);
    expect(issues[1].edge).toBe('transitions/0');
  });
  it('maps nested binding diagnostics to the deepest component', () => {
    const documents = {
      render_schema: {
        root: {
          component: 'vertical',
          children: [{ component: 'text', scope: '/properties/value' }],
        },
      },
    };
    const issues = authorIssues(
      {
        issues: [
          { pointer: '/render_schema/root/children/0/scope', code: 'binding' },
        ],
      },
      documents,
      true,
    );
    expect(issues[0].path).toEqual([0]);
  });
});
