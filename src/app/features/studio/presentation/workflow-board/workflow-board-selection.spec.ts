import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap } from '@angular/router';
import { CANVAS_VIEW, STUDIO_API } from '../../bindings';
import { emptyWorkspace } from '../../domain/authoring';
import { graphSteps } from '../../domain/workflow-authoring';
import { WorkflowBoard } from './workflow-board';
import { ActorState } from '../../../../core/auth/actor-state';

async function prepare(): Promise<WorkflowBoard> {
  const document = emptyWorkspace();
  document.graph = {
    ...document.graph,
    steps: ['a', 'b', 'c'].map((key) => ({
      key,
      type_code: 'TEST',
      config: {},
    })),
  };
  TestBed.configureTestingModule({
    providers: [
      {
        provide: ActivatedRoute,
        useValue: {
          snapshot: { paramMap: convertToParamMap({ ref: 'draft' }) },
        },
      },
      { provide: CANVAS_VIEW, useValue: {} },
      {
        provide: STUDIO_API,
        useValue: {
          get: async (): Promise<unknown> => ({
            ref_id: 'draft',
            status: 'DRAFT',
          }),
          workspace: async (): Promise<unknown> => ({
            version: 'draft',
            reference: 'workspace',
            document,
          }),
          auxiliary: async (): Promise<unknown> => ({
            items: [],
            totalPages: 1,
          }),
        },
      },
    ],
  });
  TestBed.overrideComponent(WorkflowBoard, { set: { template: '' } });
  const fixture = TestBed.createComponent(WorkflowBoard);
  await fixture.whenStable();
  return fixture.componentInstance;
}

describe('Workflow selection and navigation', () => {
  it('single selection replaces the group; duplication and undo target the new node', async () => {
    const board = await prepare();
    const before = structuredClone(board.document());
    board.selectMany(['a', 'b']);
    expect(board.selectionKeys()).toEqual(['a', 'b']);
    board.select('c');
    expect(board.selected()).toBe('c');
    expect(board.selectionKeys()).toEqual(['c']);
    board.duplicate();
    expect(
      graphSteps(board.document().graph).map((step) => step['key']),
    ).toEqual(['a', 'b', 'c', 'c_copy_1']);
    board.undo();
    expect(board.document()).toEqual(before);
    board.selectMany([]);
    expect(board.selected()).toBe('');
    expect(board.selectionKeys()).toEqual([]);
    board.duplicate();
    expect(board.document()).toEqual(before);
  });
  it('node menu duplication replaces a previous group and reload/actor cleanup clear selection', async () => {
    const board = await prepare();
    board.selectMany(['a', 'b']);
    board.inputs().duplicateNode('c');
    expect(board.selectionKeys()).toEqual(['c_copy_1']);
    expect(graphSteps(board.document().graph)).toHaveLength(4);
    TestBed.inject(ActorState).reset();
    expect(board.selected()).toBe('');
    expect(board.selectionKeys()).toEqual([]);
    expect(board.pendingStep()).toBe('');
  });
  it('retains a pending inspector owner while browsing other nodes and keeps all mutations guarded', async () => {
    const board = await prepare();
    board.select('a');
    board.markPending('typed');
    board.select('c');
    expect(board.selected()).toBe('c');
    expect(board.pendingStep()).toBe('a');
    expect(board.inspectedSteps().map((step) => step['key'])).toEqual(['a']);
    expect(board.typedReadonly()).toBe(true);
    const before = structuredClone(board.document().graph);
    board.inputs().duplicateNode('c');
    board.connect('control:a:out', 'control:c:in', 'next');
    expect(board.document().graph).toEqual(before);
    board.select('a');
    expect(board.typedReadonly()).toBe(false);
    board.discardPending('typed');
    expect(board.pendingStep()).toBe('');
    expect(board.pending()).toEqual([]);
  });
  it('navigation preserves buffers and semantic undo, including published versions', async () => {
    const board = await prepare();
    board.select('a');
    board.selectedJson = 'unfinished';
    board.markPending('node');
    board.viewport({ x: 30, y: 40, zoom: 2 });
    expect(board.pending()).toEqual(['node']);
    expect(board.selectedJson).toBe('unfinished');
    expect(board.dirty()).toBe(false);
    board.discardPending('node');
    board.duplicate();
    const graph = structuredClone(board.document().graph);
    board.viewport({ x: 80, y: 90, zoom: 3 });
    board.undo();
    expect(graphSteps(board.document().graph)).toHaveLength(3);
    expect(board.document().viewport).toEqual({ x: 80, y: 90, zoom: 3 });
    board.undo(true);
    expect(board.document().graph).toEqual(graph);
    board.status.set('PUBLISHED');
    board.dirty.set(false);
    board.viewport({ x: 0, y: 0, zoom: 1 });
    expect(board.dirty()).toBe(false);
    expect(board.document().graph).toEqual(graph);
    board.viewport({ x: NaN, y: 0, zoom: 1 });
    expect(board.document().viewport).toEqual({ x: 0, y: 0, zoom: 1 });
  });
});
