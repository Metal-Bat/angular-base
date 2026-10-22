import { accessStateObserved, catalogGrantBody } from './catalog-access';
describe('Scoped access inputs', () => {
  it('keeps workflow rights separate and retains explicit false', () => {
    expect(
      catalogGrantBody(true, {
        kind: 'users',
        target: 'chosen-user',
        view: false,
        start: true,
      }),
    ).toEqual({
      user_ref_id: 'chosen-user',
      work_group_ref_id: null,
      can_view: false,
      can_start: true,
    });
  });
  it('sends only the declared recipient fields for a reusable definition', () => {
    expect(
      catalogGrantBody(false, {
        kind: 'work_groups',
        target: 'chosen-group',
        view: true,
        start: true,
      }),
    ).toEqual({ user_ref_id: null, work_group_ref_id: 'chosen-group' });
  });
  it('rejects an absent recipient and a workflow grant without any capability', () => {
    expect(() =>
      catalogGrantBody(true, {
        kind: 'users',
        target: '',
        view: true,
        start: false,
      }),
    ).toThrow();
    expect(() =>
      catalogGrantBody(true, {
        kind: 'users',
        target: 'chosen',
        view: false,
        start: false,
      }),
    ).toThrow();
  });
  it('does not infer revoked-grant absence from one page in a multi-page list', () => {
    expect(accessStateObserved([], 2, { ref: 'grant' })).toBe(false);
    expect(accessStateObserved([], 0, { ref: 'grant' })).toBe(true);
  });
  it('confirms the exact requested current rights without sending another command', () => {
    const body = {
      user_ref_id: 'chosen',
      work_group_ref_id: null,
      can_view: true,
      can_start: false,
    };
    expect(
      accessStateObserved([{ ...body, ref_id: 'grant' }], 2, { body }),
    ).toBe(true);
    expect(
      accessStateObserved([{ ...body, can_start: true }], 1, { body }),
    ).toBe(false);
  });
});
