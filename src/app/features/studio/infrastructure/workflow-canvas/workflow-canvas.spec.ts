import { TestBed } from '@angular/core/testing';
import { WorkflowCanvas } from './workflow-canvas';

describe('Workflow palette placement', () => {
  beforeEach(() => {
    TestBed.overrideComponent(WorkflowCanvas, { set: { template: '' } });
  });
  it('places selected steps in canvas coordinates after pan and zoom', () => {
    const fixture = TestBed.createComponent(WorkflowCanvas);
    fixture.componentRef.setInput('nodes', []);
    const add = vi.fn();
    fixture.componentRef.setInput('paletteKey', 'registered-step');
    fixture.componentRef.setInput('viewport', { x: 40, y: 20, zoom: 2 });
    fixture.componentRef.setInput('addStep', add);
    const stage = document.createElement('div');
    vi.spyOn(stage, 'getBoundingClientRect').mockReturnValue(
      new DOMRect(100, 50, 600, 400),
    );
    fixture.componentInstance.place({
      currentTarget: stage,
      target: stage,
      clientX: 340,
      clientY: 270,
    } as unknown as MouseEvent);
    expect(add).toHaveBeenCalledWith('registered-step', { x: 100, y: 100 });

    fixture.componentRef.setInput('readOnly', true);
    fixture.componentInstance.placeWithKeyboard({
      currentTarget: stage,
      target: stage,
      preventDefault: vi.fn(),
    } as unknown as Event);
    expect(add).toHaveBeenCalledTimes(1);
  });

  it('does not add a selected palette step when clicking an existing node', () => {
    const fixture = TestBed.createComponent(WorkflowCanvas);
    fixture.componentRef.setInput('nodes', []);
    const add = vi.fn();
    fixture.componentRef.setInput('paletteKey', 'registered-step');
    fixture.componentRef.setInput('addStep', add);
    const node = document.createElement('div');
    node.className = 'board-node';
    fixture.componentInstance.place({ target: node } as unknown as MouseEvent);
    expect(add).not.toHaveBeenCalled();
  });
  it('connects control ports and fences read-only and pending modes', async () => {
    const fixture = TestBed.createComponent(WorkflowCanvas);
    const nodes = [
      { key: 'a', title: 'First', position: { x: 0, y: 0 }, ports: [] },
      { key: 'b', title: 'Second', position: { x: 200, y: 0 }, ports: [] },
    ];
    fixture.componentRef.setInput('nodes', nodes);
    fixture.componentRef.setInput('selectNode', vi.fn());
    const connect = vi.fn();
    fixture.componentRef.setInput('connect', connect);
    const vm = fixture.componentInstance;
    vm.beginLink('a');
    vm.select(new MouseEvent('click'), 'b');
    expect(connect).not.toHaveBeenCalled();
    expect(vm.pendingConnection()).toEqual({
      source: 'control:a:out',
      target: 'control:b:in',
    });
    vm.connectionOutcome.set('next');
    vm.confirmConnection();
    expect(connect).toHaveBeenCalledWith(
      'control:a:out',
      'control:b:in',
      'next',
    );
    expect(vm.linkSource()).toBe('');
    vm.beginLink('a');
    fixture.componentRef.setInput('disabled', true);
    await fixture.whenStable();
    expect(vm.linkSource()).toBe('');
    vm.select(new MouseEvent('click'), 'b');
    expect(connect).toHaveBeenCalledTimes(1);
    fixture.componentRef.setInput('disabled', false);
    fixture.componentRef.setInput('readOnly', true);
    vm.beginLink('a');
    expect(vm.linkSource()).toBe('');
  });
  it('anchors modifier selection and clears selection on a blank click', () => {
    const fixture = TestBed.createComponent(WorkflowCanvas);
    const select = vi.fn();
    const many = vi.fn();
    fixture.componentRef.setInput('selected', 'a');
    fixture.componentRef.setInput('selectionKeys', []);
    fixture.componentRef.setInput('selectNode', select);
    fixture.componentRef.setInput('selectNodes', many);
    const vm = fixture.componentInstance;
    vm.select(new MouseEvent('click', { shiftKey: true }), 'b');
    expect(many).toHaveBeenCalledWith(['a', 'b']);
    const stage = document.createElement('div');
    vm.place({ target: stage } as unknown as MouseEvent);
    expect(select).toHaveBeenCalledWith('');
  });
  it('keeps read-only navigation and inspection usable while blocking mutations', () => {
    const fixture = TestBed.createComponent(WorkflowCanvas);
    const node = {
      key: 'a',
      title: 'First',
      position: { x: 0, y: 0 },
      ports: [],
    };
    fixture.componentRef.setInput('nodes', [node]);
    fixture.componentRef.setInput('edges', []);
    fixture.componentRef.setInput('disabled', true);
    fixture.componentRef.setInput('readOnly', true);
    const select = vi.fn();
    const transform = vi.fn();
    fixture.componentRef.setInput('selectNode', select);
    fixture.componentRef.setInput('transform', transform);
    const vm = fixture.componentInstance;
    vm.rendered.set(true);
    vm.openMenu(new MouseEvent('contextmenu'), 'a');
    expect(select).toHaveBeenCalledWith('a');
    expect(vm.menuItems()[0].disabled).toBeUndefined();
    expect(vm.menuItems()[1].disabled).toBe(true);
    vm.changed({ position: { x: 10, y: 20 }, scale: 2 } as never);
    expect(transform).toHaveBeenCalledWith({ x: 10, y: 20, zoom: 2 });
    vm.beginLink('a');
    expect(vm.linkSource()).toBe('');
  });
  it('requires a deliberately chosen supported outcome and targets edge menu actions', () => {
    const fixture = TestBed.createComponent(WorkflowCanvas);
    fixture.componentRef.setInput('nodes', [
      {
        key: 'a',
        title: 'A',
        position: { x: 0, y: 0 },
        ports: [],
        outcomes: ['approve', 'return'],
      },
      { key: 'b', title: 'B', position: { x: 0, y: 0 }, ports: [] },
    ]);
    fixture.componentRef.setInput('edges', [
      {
        id: 'edge',
        source: 'control:a:out',
        target: 'control:b:in',
        kind: 'control',
      },
    ]);
    const connect = vi.fn();
    const inspect = vi.fn();
    const remove = vi.fn();
    fixture.componentRef.setInput('connect', connect);
    fixture.componentRef.setInput('inspectEdge', inspect);
    fixture.componentRef.setInput('deleteEdge', remove);
    const vm = fixture.componentInstance;
    vm.requestConnection('control:a:out', 'control:b:in');
    vm.confirmConnection();
    vm.connectionOutcome.set('invented');
    vm.confirmConnection();
    expect(connect).not.toHaveBeenCalled();
    vm.connectionOutcome.set('return');
    vm.confirmConnection();
    expect(connect).toHaveBeenCalledWith(
      'control:a:out',
      'control:b:in',
      'return',
    );
    vm.openEdgeMenu(new MouseEvent('contextmenu'), 'edge');
    expect(inspect).toHaveBeenCalledWith('edge');
    vm.menuItems()[1].command();
    expect(remove).toHaveBeenCalledWith('edge');
  });
});
