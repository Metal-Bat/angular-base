import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { provideRouter } from '@angular/router';
import { STUDIO_API } from '../../bindings';
import { handlers } from '../../domain/node-inspector';
import { NodeInspector } from '../node-inspector/node-inspector';
import { SubprocessInput } from './subprocess-input';
it('fences immediate Apply after invalid child input and accepts the corrected value synchronously', async () => {
  TestBed.configureTestingModule({
    providers: [provideRouter([]), { provide: STUDIO_API, useValue: {} }],
  });
  const f = TestBed.createComponent(NodeInspector);
  const handler = handlers.find((row) => row.handler_key === 'subprocess')!;
  f.componentRef.setInput('step', {
    key: 'call',
    type_code: 'SUBPROCESS',
    type_version_ref: 'type',
    config: {},
    subprocess: {
      workflow_version_ref: 'child',
      inputs: [
        {
          name: 'amount',
          source_kind: 'CONSTANT',
          source_schema: { type: 'integer', minimum: 0 },
          constant_value: 1,
        },
      ],
    },
  });
  f.componentRef.setInput('catalog', [
    {
      type_schema: handler.config_schema,
      metadata: {
        ref_id: 'type',
        code: 'SUBPROCESS',
        handler_key: 'subprocess',
        handler_version: '1',
      },
    },
  ]);
  f.componentRef.setInput('graph', { steps: [], transitions: [] });
  f.componentRef.setInput('children', [
    {
      category: 'subprocess',
      key: 'child:1',
      title: 'Child',
      metadata: {
        workflow_version_ref: 'child',
        interface: {
          inputs: [
            { name: 'amount', value_schema: { type: 'integer', minimum: 0 } },
          ],
        },
      },
    },
  ]);
  await f.whenStable();
  const applied = vi.fn();
  f.componentInstance.applied.subscribe(applied);
  const row = f.debugElement.query(By.directive(SubprocessInput))
    .componentInstance as SubprocessInput;
  row.edit(-1);
  f.componentInstance.apply();
  expect(applied).not.toHaveBeenCalled();
  row.edit(0);
  f.componentInstance.apply();
  expect(applied).toHaveBeenCalledOnce();
  expect(applied.mock.calls[0][0].subprocess.inputs[0].constant_value).toBe(0);
});
