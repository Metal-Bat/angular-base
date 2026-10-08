import { Component, input } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { ActorState } from '../../../../core/auth/actor-state';
import { CANVAS_LOADER, STUDIO_API } from '../../bindings';
import { emptyWorkspace } from '../../domain/authoring';
import { WorkflowDiagram } from './workflow-diagram';
@Component({ selector: 'app-test-canvas', template: '' })
class TestCanvas {
  readonly connect = input<unknown>();
  readonly edges = input<unknown>();
  readonly moveNode = input<unknown>();
  readonly nodes = input<unknown>();
  readonly readOnly = input<unknown>();
  readonly routeEdge = input<unknown>();
  readonly selected = input<unknown>();
  readonly selectNode = input<unknown>();
  readonly transform = input<unknown>();
  readonly viewport = input<unknown>();
}
const graph = {
  steps: [{ key: 'one', type_code: 'task', type_version_ref: 'type' }],
  transitions: [],
};
describe('Read-only workflow detail diagram', () => {
  const get = vi.fn();
  const search = vi.fn();
  const auxiliary = vi.fn();
  const workspace = vi.fn();
  beforeEach(() => {
    get.mockReset().mockImplementation(async (_key, ref) => ({
      ref_id: ref + '-current',
      number: 2,
      status: 'PUBLISHED',
    }));
    search.mockReset().mockResolvedValue({
      items: [{ ref_id: 'version', number: 2, status: 'PUBLISHED' }],
      page: 1,
      totalPages: 1,
    });
    auxiliary.mockReset().mockResolvedValue(graph);
    workspace.mockReset().mockResolvedValue({
      document: {
        ...emptyWorkspace(),
        graph: { steps: [] },
        positions: { one: { x: 500, y: 50 } },
      },
    });
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        {
          provide: STUDIO_API,
          useValue: { get, search, auxiliary, workspace },
        },
        {
          provide: CANVAS_LOADER,
          useValue: async (): Promise<typeof TestCanvas> => TestCanvas,
        },
      ],
    });
  });
  it('reads the current version graph and uses saved positions without draft graph substitution', async () => {
    const fixture = TestBed.createComponent(WorkflowDiagram);
    fixture.componentRef.setInput('workflow', 'root-current');
    await fixture.whenStable();
    const viewer = fixture.componentInstance;
    expect(search).toHaveBeenCalledWith('workflow-versions', 1, {
      workflow_ref_id: 'root-current',
      size: 20,
      filters: [],
      sort_orders: [{ field_name: 'number', operation: 'desc' }],
    });
    expect(auxiliary).toHaveBeenCalledWith('workflowGraph', undefined, {
      ref_id: 'version-current',
    });
    expect(viewer.nodes()[0].key).toBe('one');
    expect(viewer.nodes()[0].position).toEqual({ x: 500, y: 50 });
    expect(viewer.canvasInputs().readOnly).toBe(true);
    expect(viewer.current()?.['status']).toBe('PUBLISHED');
  });
  it('renders the executable graph when saved workspace layout is unavailable', async () => {
    workspace.mockRejectedValue(Error('no workspace'));
    const fixture = TestBed.createComponent(WorkflowDiagram);
    fixture.componentRef.setInput('version', 'direct-version');
    await fixture.whenStable();
    expect(search).not.toHaveBeenCalled();
    expect(fixture.componentInstance.nodes()[0].position).toEqual({
      x: 40,
      y: 40,
    });
    expect(fixture.componentInstance.error()).toBe('');
  });
  it('mounts an empty canvas for a workflow without versions', async () => {
    search.mockResolvedValue({ items: [], page: 1, totalPages: 0 });
    const fixture = TestBed.createComponent(WorkflowDiagram);
    fixture.componentRef.setInput('workflow', 'empty-workflow');
    await fixture.whenStable();
    expect(
      fixture.nativeElement.querySelector('app-test-canvas'),
    ).not.toBeNull();
    expect(fixture.componentInstance.nodes()).toEqual([]);
    expect(fixture.componentInstance.current()).toBeNull();
    expect(fixture.nativeElement.textContent).toContain(
      'This workflow has no versions yet.',
    );
    expect(auxiliary).not.toHaveBeenCalled();
    fixture.componentInstance.transform({ x: 30, y: 20, zoom: 1.2 });
    expect(fixture.componentInstance.viewport()).toEqual({
      x: 30,
      y: 20,
      zoom: 1.2,
    });
  });
  it('mounts the canvas when an existing version contains zero steps', async () => {
    auxiliary.mockResolvedValue({ steps: [], transitions: [] });
    const fixture = TestBed.createComponent(WorkflowDiagram);
    fixture.componentRef.setInput('version', 'empty-version');
    await fixture.whenStable();
    await vi.waitFor(() =>
      expect(fixture.componentInstance.busy()).toBe(false),
    );
    fixture.detectChanges();
    expect(
      fixture.nativeElement.querySelector('app-test-canvas'),
    ).not.toBeNull();
    expect(fixture.componentInstance.nodes()).toEqual([]);
    expect(fixture.componentInstance.current()).not.toBeNull();
  });
  it('discards a late graph response after actor reset', async () => {
    let complete!: (value: unknown) => void;
    auxiliary.mockImplementation(
      () =>
        new Promise((resolve) => {
          complete = resolve;
        }),
    );
    const fixture = TestBed.createComponent(WorkflowDiagram);
    await fixture.whenStable();
    const pending = fixture.componentInstance.show('private');
    await Promise.resolve();
    TestBed.inject(ActorState).reset();
    complete(graph);
    await pending;
    expect(fixture.componentInstance.nodes()).toEqual([]);
    expect(fixture.componentInstance.current()).toBeNull();
  });
});
