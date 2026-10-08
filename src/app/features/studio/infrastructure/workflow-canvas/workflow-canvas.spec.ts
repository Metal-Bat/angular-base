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
});
