import { TestBed } from '@angular/core/testing';
import { FormCanvas } from './form-canvas';
describe('Visual form cards', () => {
  it('keeps invalid draft bindings editable and selects a field without changing the document', async () => {
    const fixture = TestBed.createComponent(FormCanvas);
    const documents = {
      data_schema: { type: 'object', properties: {} },
      render_schema: {
        root: {
          component: 'vertical',
          children: [
            {
              node_key: 'original',
              component: 'text',
              scope: '/properties/missing',
              label: 'Question',
            },
          ],
        },
      },
    };
    fixture.componentRef.setInput('documents', documents);
    fixture.componentRef.setInput('selected', []);
    const select = vi.fn();
    fixture.componentInstance.selectedChange.subscribe(select);
    await fixture.whenStable();
    expect(fixture.nativeElement.textContent).toContain('Invalid field scope');
    fixture.nativeElement.querySelector('.field-card').click();
    expect(select).toHaveBeenCalledWith([0]);
    expect(documents.render_schema.root.children[0].node_key).toBe('original');
  });
});
