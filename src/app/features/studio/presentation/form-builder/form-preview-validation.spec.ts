import { TestBed } from '@angular/core/testing';
import {
  ActivatedRoute,
  convertToParamMap,
  provideRouter,
} from '@angular/router';
import { of } from 'rxjs';
import { ApiFailure } from '../../../../core/transport/api-failure';
import { STUDIO_API } from '../../bindings';
import { FormBuilder } from './form-builder';
it('retains safe preview validation issues for actionable diagnostics and permits recovery', async () => {
  const issues = [
    {
      pointer: '/render_schema/root/children/0/calculation',
      code: 'render.calculation',
    },
  ];
  const preview = vi
    .fn()
    .mockRejectedValue(new ApiFailure(422, 1002, 'safe-correlation', issues));
  TestBed.configureTestingModule({
    providers: [
      provideRouter([]),
      {
        provide: ActivatedRoute,
        useValue: {
          snapshot: { paramMap: convertToParamMap({ ref: 'draft' }) },
          paramMap: of(convertToParamMap({ ref: 'draft' })),
        },
      },
      {
        provide: STUDIO_API,
        useValue: {
          get: async (): Promise<unknown> => ({
            ref_id: 'draft',
            status: 'DRAFT',
            data_schema: { type: 'object', properties: {} },
            render_schema: { root: { component: 'vertical', children: [] } },
          }),
          preview,
        },
      },
    ],
  });
  const fixture = TestBed.createComponent(FormBuilder);
  await fixture.whenStable();
  const view = fixture.componentInstance;
  await view.renderPreview();
  expect(view.previewFreshness()).toBe('invalid');
  expect(JSON.parse(view.diagnostics()).issues).toEqual(issues);
  expect(view.previewError()).toBe(
    'Review diagnostics to correct the form configuration.',
  );
  preview.mockResolvedValue({ status: 'incompatible' });
  await view.renderPreview();
  expect(view.previewError()).toBe('Preview is incompatible');
  expect(view.readonly()).toBe(false);
});
