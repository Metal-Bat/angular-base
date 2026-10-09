import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap } from '@angular/router';
import { ActorState } from '../../../../core/auth/actor-state';
import { Feedback } from '../../../../core/feedback/feedback';
import { CANVAS_VIEW, STUDIO_API } from '../../bindings';
import { emptyWorkspace } from '../../domain/authoring';
import { WorkflowBoardState } from './workflow-board-state';
@Component({ template: '' })
class BoardHarness extends WorkflowBoardState {}
async function prepare(): Promise<{
  board: BoardHarness;
  approve: () => void;
  action: ReturnType<typeof vi.fn>;
  promote: ReturnType<typeof vi.fn>;
}> {
  let approve!: () => void;
  const confirmation = new Promise<boolean>((resolve) => {
    approve = (): void => resolve(true);
  });
  const workspace = {
    reference: 'saved-workspace',
    version: 'draft-version',
    promoted: 'checksum',
    document: emptyWorkspace(),
  };
  const action = vi
    .fn()
    .mockResolvedValue({ ref_id: 'published-version', status: 'PUBLISHED' });
  const promote = vi.fn().mockResolvedValue({ ref_id: 'draft-version' });
  TestBed.configureTestingModule({
    providers: [
      {
        provide: ActivatedRoute,
        useValue: {
          snapshot: { paramMap: convertToParamMap({ ref: 'draft-version' }) },
        },
      },
      { provide: CANVAS_VIEW, useValue: {} },
      {
        provide: Feedback,
        useValue: { confirm: (): Promise<boolean> => confirmation },
      },
      {
        provide: STUDIO_API,
        useValue: {
          get: async (): Promise<unknown> => ({
            ref_id: 'draft-version',
            status: 'DRAFT',
          }),
          workspace: async (): Promise<unknown> => workspace,
          auxiliary: async (): Promise<unknown> => ({
            items: [],
            totalPages: 1,
          }),
          action,
          promote,
        },
      },
    ],
  });
  const fixture = TestBed.createComponent(BoardHarness);
  fixture.detectChanges();
  await fixture.whenStable();
  await vi.waitFor(() => {
    expect(fixture.componentInstance.busy()).toBe(false);
  });
  expect(fixture.componentInstance.status()).toBe('DRAFT');
  return { board: fixture.componentInstance, approve, action, promote };
}
describe('Publication intent fencing', () => {
  it('does not publish after the confirming actor changes', async () => {
    const { board, approve, action } = await prepare();
    const pending = board.publish();
    TestBed.inject(ActorState).reset();
    approve();
    await pending;
    expect(action).not.toHaveBeenCalled();
    expect(board.reference()).toBe('');
  });
  it('does not promote when unsaved work appears during confirmation', async () => {
    const { board, approve, promote } = await prepare();
    const pending = board.promote();
    board.dirty.set(true);
    approve();
    await pending;
    expect(promote).not.toHaveBeenCalled();
    expect(board.dirty()).toBe(true);
  });
  it('publishes only the exact reviewed version and adopts its current immutable ref', async () => {
    const { board, approve, action } = await prepare();
    const pending = board.publish();
    approve();
    await pending;
    expect(action).toHaveBeenCalledWith(
      'workflow-versions',
      'draft-version',
      'publish',
    );
    expect(board.reference()).toBe('published-version');
    expect(board.status()).toBe('PUBLISHED');
  });
});
