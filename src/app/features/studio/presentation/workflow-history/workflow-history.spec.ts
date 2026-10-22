import { TestBed } from '@angular/core/testing';
import { ActorState } from '../../../../core/auth/actor-state';
import { STUDIO_API } from '../../bindings';
import { WorkflowHistory } from './workflow-history';

async function prepare(): Promise<{
  view: WorkflowHistory;
  auxiliary: ReturnType<typeof vi.fn>;
}> {
  const auxiliary = vi.fn();
  TestBed.configureTestingModule({
    providers: [{ provide: STUDIO_API, useValue: { auxiliary } }],
  });
  TestBed.overrideComponent(WorkflowHistory, { set: { template: '' } });
  const fixture = TestBed.createComponent(WorkflowHistory);
  fixture.componentRef.setInput('version', 'owned-version');
  await fixture.whenStable();
  return { view: fixture.componentInstance, auxiliary };
}

describe('Saved workflow history ownership', () => {
  it('reads the existing history operation and keeps page size when moving between pages', async () => {
    const { view, auxiliary } = await prepare();
    auxiliary.mockResolvedValue({
      items: [{ id: 'owned-history', operation: 'UPDATE' }],
      page: 1,
      totalPages: 2,
    });
    view.open.set(true);
    await view.load(1, 50);
    expect(auxiliary).toHaveBeenCalledWith(
      'workspaceHistory',
      { page: 1, size: 50 },
      { ref_id: 'owned-version' },
    );
    expect(view.rows()).toHaveLength(1);
    auxiliary.mockResolvedValue({ items: [], page: 2, totalPages: 2 });
    await view.load(2);
    expect(auxiliary).toHaveBeenLastCalledWith(
      'workspaceHistory',
      { page: 2, size: 50 },
      { ref_id: 'owned-version' },
    );
  });
  it('ignores a history response after closing the viewer or changing the actor', async () => {
    const { view, auxiliary } = await prepare();
    let resolve!: (value: unknown) => void;
    auxiliary.mockReturnValue(
      new Promise((done) => {
        resolve = done;
      }),
    );
    view.open.set(true);
    const loading = view.load();
    view.close();
    resolve({ items: [{ id: 'old-private-entry' }], page: 1, totalPages: 1 });
    await loading;
    expect(view.rows()).toEqual([]);
    expect(view.open()).toBe(false);
    view.selected.set({ id: 'old-private-entry' });
    view.rows.set([{ id: 'old-private-entry' }]);
    TestBed.inject(ActorState).reset();
    expect(view.selected()).toBeNull();
    expect(view.rows()).toEqual([]);
  });
  it('removes stale private entries on a failed authorized refresh without changing the draft', async () => {
    const { view, auxiliary } = await prepare();
    auxiliary.mockRejectedValue(new Error('unavailable'));
    view.open.set(true);
    view.rows.set([{ id: 'previous-entry' }]);
    await view.load();
    expect(view.rows()).toEqual([]);
    expect(view.error()).toContain('Your draft is retained');
    expect(view.busy()).toBe(false);
  });
});
