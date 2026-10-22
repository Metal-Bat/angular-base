import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap } from '@angular/router';
import { BehaviorSubject } from 'rxjs';
import { Feedback } from '../../../../core/feedback/feedback';
import { CANVAS_VIEW, STUDIO_API } from '../../bindings';
import { emptyWorkspace } from '../../domain/authoring';
import { WorkflowBoardState } from './workflow-board-state';
@Component({ template: '' })
class RouteBoard extends WorkflowBoardState {}
it('reloads the exact workflow and read-only status when the same editor route changes and returns', async () => {
  const paramMap = new BehaviorSubject(convertToParamMap({ ref: 'parent' }));
  const get = vi.fn(async (_resource: string, ref: string) => ({
    ref_id: ref,
    status: ref === 'child' ? 'PUBLISHED' : 'DRAFT',
  }));
  TestBed.configureTestingModule({
    providers: [
      {
        provide: ActivatedRoute,
        useValue: { snapshot: { paramMap: paramMap.value }, paramMap },
      },
      { provide: CANVAS_VIEW, useValue: {} },
      {
        provide: Feedback,
        useValue: { confirm: async (): Promise<boolean> => true },
      },
      {
        provide: STUDIO_API,
        useValue: {
          get,
          workspace: async (ref: string): Promise<unknown> => ({
            version: ref,
            reference: null,
            promoted: null,
            document: emptyWorkspace(),
          }),
          auxiliary: async (): Promise<unknown> => ({
            items: [],
            totalPages: 1,
          }),
        },
      },
    ],
  });
  const f = TestBed.createComponent(RouteBoard);
  await f.whenStable();
  expect(f.componentInstance.reference()).toBe('parent');
  paramMap.next(convertToParamMap({ ref: 'child' }));
  await f.whenStable();
  await vi.waitFor(() =>
    expect(f.componentInstance.status()).toBe('PUBLISHED'),
  );
  expect(f.componentInstance.reference()).toBe('child');
  expect(f.componentInstance.readonly()).toBe(true);
  paramMap.next(convertToParamMap({ ref: 'parent' }));
  await f.whenStable();
  await vi.waitFor(() => expect(f.componentInstance.status()).toBe('DRAFT'));
  expect(f.componentInstance.reference()).toBe('parent');
  expect(f.componentInstance.readonly()).toBe(false);
  expect(get.mock.calls.map((args) => args[1])).toEqual([
    'parent',
    'child',
    'parent',
  ]);
});
