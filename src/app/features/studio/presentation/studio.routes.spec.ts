import { studioRoutes } from './studio.routes';
import { workflowBoardRoutes } from './workflow-board.routes';
describe('Studio route permission policies', () => {
  it('declares an explicit policy on the lazy workflow editor leaf', () => {
    expect(workflowBoardRoutes[0].data).toEqual({
      access: 'authenticated',
      requiredPermissions: ['workflows.manage'],
    });
    expect(workflowBoardRoutes[0].canDeactivate).toHaveLength(1);
  });
  it('keeps form, workflow and request-type authoring capabilities separate', () => {
    const children = studioRoutes[0].children!;
    expect(
      children.find((route) => route.path === 'forms')?.data?.[
        'requiredPermissions'
      ],
    ).toEqual(['forms.manage']);
    expect(
      children.find((route) => route.path === 'workflows')?.data?.[
        'requiredPermissions'
      ],
    ).toEqual(['workflows.manage']);
    expect(
      children.find((route) => route.path === 'request-types')?.data?.[
        'requiredPermissions'
      ],
    ).toEqual(['requests.manage']);
    expect(
      children.find((route) => route.path === 'clients')?.data?.[
        'requiredPermissions'
      ],
    ).toEqual(['forms.manage']);
  });
});
