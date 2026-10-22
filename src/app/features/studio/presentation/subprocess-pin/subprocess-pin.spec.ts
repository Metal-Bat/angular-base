import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { STUDIO_API } from '../../bindings';
import { JsonObject } from '../../../forms/domain/runtime-document';
import { SubprocessPin } from './subprocess-pin';
it('combines rapid edits to different child inputs before the next parent render', async () => {
  TestBed.configureTestingModule({
    providers: [provideRouter([]), { provide: STUDIO_API, useValue: {} }],
  });
  const f = TestBed.createComponent(SubprocessPin);
  f.componentRef.setInput('catalog', [
    {
      category: 'subprocess',
      key: 'child:1',
      title: 'Child',
      metadata: {
        workflow_version_ref: 'child',
        interface: {
          inputs: [
            { name: 'payload', value_schema: { type: 'object' } },
            {
              name: 'rows',
              value_schema: { type: 'array', items: { type: 'string' } },
            },
          ],
        },
      },
    },
  ]);
  f.componentRef.setInput('graph', { steps: [], transitions: [] });
  f.componentRef.setInput('value', {
    workflow_version_ref: 'child',
    inputs: [],
  });
  await f.whenStable();
  const changed = vi.fn();
  f.componentInstance.changed.subscribe(changed);
  f.componentInstance.setInput('payload', { enabled: false });
  f.componentInstance.setInput('rows', ['']);
  const last = changed.mock.calls.at(-1)![0] as JsonObject;
  expect(
    (last['inputs'] as JsonObject[]).map((row) => [
      row['name'],
      row['constant_value'],
    ]),
  ).toEqual([
    ['payload', { enabled: false }],
    ['rows', ['']],
  ]);
});
