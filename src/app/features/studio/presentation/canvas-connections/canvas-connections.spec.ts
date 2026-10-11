import { TestBed } from '@angular/core/testing';
import { CanvasConnections } from './canvas-connections';
import { CanvasNode } from '../../domain/workflow-authoring';
const nodes: CanvasNode[] = ['one', 'two'].map((key) => ({
  key,
  title: key,
  position: { x: 0, y: 0 },
  ports: [
    { key: 'value', direction: 'OUTPUT', schema: { type: 'string' } },
    { key: 'input', direction: 'INPUT', schema: { type: 'string' } },
  ],
}));
describe('Keyboard canvas connections', () => {
  it('offers real ports, preserves edge kinds and fences disabled commands', async () => {
    const fixture = TestBed.createComponent(CanvasConnections);
    fixture.componentRef.setInput('nodes', nodes);
    fixture.componentRef.setInput('edges', []);
    await fixture.whenStable();
    const vm = fixture.componentInstance;
    const output = vi.fn();
    vm.connectRequested.subscribe(output);
    vm.source.set('data:one:out:value');
    vm.target.set('control:two:in');
    vm.submit();
    expect(output).not.toHaveBeenCalled();
    vm.target.set('data:two:in:input');
    vm.submit();
    expect(output).toHaveBeenCalledWith({
      source: 'data:one:out:value',
      target: 'data:two:in:input',
      outcome: 'next',
    });
    fixture.componentRef.setInput('disabled', true);
    vm.submit();
    expect(output).toHaveBeenCalledTimes(1);
  });
  it('loads existing endpoints and emits reconnection without replacing edge metadata', async () => {
    const fixture = TestBed.createComponent(CanvasConnections);
    fixture.componentRef.setInput('nodes', nodes);
    fixture.componentRef.setInput('edges', [
      {
        id: 'edge',
        kind: 'control',
        source: 'control:one:out',
        target: 'control:two:in',
        label: 'approve',
      },
    ]);
    await fixture.whenStable();
    const vm = fixture.componentInstance;
    const reconnect = vi.fn();
    vm.reconnectRequested.subscribe(reconnect);
    vm.edgeId.set('edge');
    expect(vm.source()).toBe('control:one:out');
    expect(vm.target()).toBe('control:two:in');
    expect(vm.outcome()).toBe('approve');
    fixture.componentRef.setInput(
      'nodes',
      nodes.map((node) => ({ ...node, title: 'Updated ' + node.title })),
    );
    fixture.componentRef.setInput('edges', [
      {
        id: 'edge',
        kind: 'control',
        source: 'control:one:out',
        target: 'control:two:in',
        label: 'approve',
      },
    ]);
    expect(vm.edgeId()).toBe('edge');
    expect(vm.source()).toBe('control:one:out');
    expect(vm.target()).toBe('control:two:in');
    vm.target.set('control:one:in');
    vm.submit();
    expect(reconnect).toHaveBeenCalledWith({
      id: 'edge',
      source: 'control:one:out',
      target: 'control:one:in',
    });
    fixture.componentRef.setInput('edges', []);
    expect(vm.edgeId()).toBe('');
    expect(vm.source()).toBe('');
  });
});
