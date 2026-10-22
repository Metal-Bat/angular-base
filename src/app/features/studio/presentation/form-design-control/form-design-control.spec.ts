import { TestBed } from '@angular/core/testing';
import { FormDesignControl } from './form-design-control';

describe('Passive field meaning', () => {
  it('shows localized typed zero/false choices without answer controls', async () => {
    const fixture = TestBed.createComponent(FormDesignControl);
    fixture.componentRef.setInput('kind', 'choice');
    fixture.componentRef.setInput('label', 'Decision');
    fixture.componentRef.setInput('type', 'Choice');
    fixture.componentRef.setInput('presentation', {
      source: {
        kind: 'custom',
        items: [
          { key: 0, value: 'Zero' },
          { key: false, value: 'False' },
        ],
      },
      localized_options: [
        { value: 0, label: 'صفر' },
        { value: false, label: 'خیر' },
      ],
    });
    await fixture.whenStable();
    expect(fixture.nativeElement.textContent).toContain('صفر');
    expect(fixture.nativeElement.textContent).toContain('خیر');
    expect(
      fixture.nativeElement.querySelectorAll(
        'input, select, button, textarea, a',
      ),
    ).toHaveLength(0);
    fixture.componentRef.setInput('presentation', {});
    fixture.componentRef.setInput('schema', {
      type: 'string',
      oneOf: [{ const: 'a', title: 'Actual choice' }],
    });
    await fixture.whenStable();
    expect(fixture.nativeElement.textContent).toContain('Actual choice');
    expect(fixture.nativeElement.textContent).not.toContain('صفر');
  });

  it('presents approved file types and actual collection columns without an upload or row command', async () => {
    const fixture = TestBed.createComponent(FormDesignControl);
    fixture.componentRef.setInput('kind', 'attachment_collection');
    fixture.componentRef.setInput('label', 'Evidence');
    fixture.componentRef.setInput('type', 'Attachments');
    fixture.componentRef.setInput('presentation', {
      options: { allowed_mime_types: ['image/png', 'application/pdf'] },
    });
    await fixture.whenStable();
    expect(fixture.nativeElement.textContent).toContain('Upload attachment');
    expect(fixture.nativeElement.textContent).toContain(
      'image/png, application/pdf',
    );
    fixture.componentRef.setInput('kind', 'table');
    fixture.componentRef.setInput('childLabels', ['Item', 'Amount']);
    await fixture.whenStable();
    expect(
      [
        ...fixture.nativeElement.querySelectorAll('.collection-head > span'),
      ].map((node: Element) => node.textContent?.trim()),
    ).toEqual(['Item', 'Amount']);
    expect(
      fixture.nativeElement.querySelectorAll(
        'input, select, button, textarea, a',
      ),
    ).toHaveLength(0);
  });
});
