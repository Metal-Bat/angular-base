import { TestBed } from '@angular/core/testing';
import { ActorState } from '../../../../core/auth/actor-state';
import { STUDIO_API } from '../../bindings';
import { OperationChoice } from './operation-choice';
const operations = [
  {
    key: 'sandbox.order.create/1',
    handler: 'service_task',
    version: '1',
    scopes: ['NORMAL'],
    providers: ['sandbox'],
    approvalPolicy: 'purchase-human-approval/1',
    businessEffect: true,
    retryPolicy: 'reconcile_before_retry',
    reconciliation: 'receipt_lookup',
  },
  {
    key: 'sandbox.order.cancel/1',
    handler: 'service_task',
    version: '1',
    scopes: ['COMPENSATION'],
    providers: ['sandbox'],
  },
  {
    key: 'connection.status',
    handler: 'connection_status',
    version: '1',
    scopes: ['NORMAL'],
    providers: [],
  },
];
it('filters exact registered handler/version/scope and never accepts arbitrary operations', async () => {
  TestBed.configureTestingModule({
    providers: [
      {
        provide: STUDIO_API,
        useValue: { auxiliary: vi.fn().mockResolvedValue(operations) },
      },
    ],
  });
  const fixture = TestBed.createComponent(OperationChoice);
  fixture.componentRef.setInput('handler', 'service_task');
  fixture.componentRef.setInput('version', '1');
  fixture.componentRef.setInput('value', 'sandbox.order.create/1');
  await fixture.whenStable();
  const vm = fixture.componentInstance;
  const picked = vi.fn();
  vm.picked.subscribe(picked);
  expect(vm.rows().map((row) => row.key)).toEqual(['sandbox.order.create/1']);
  expect(fixture.nativeElement.textContent).toContain(
    'purchase-human-approval/1',
  );
  vm.choose('arbitrary');
  vm.choose('sandbox.order.cancel/1');
  expect(picked).not.toHaveBeenCalled();
  vm.choose('sandbox.order.create/1');
  expect(picked).toHaveBeenCalledWith('sandbox.order.create/1');
  fixture.componentRef.setInput('compensation', true);
  await fixture.whenStable();
  expect(vm.rows().map((row) => row.key)).toEqual(['sandbox.order.cancel/1']);
  fixture.componentRef.setInput('disabled', true);
  await fixture.whenStable();
  vm.choose('sandbox.order.cancel/1');
  expect(picked).toHaveBeenCalledOnce();
});
it('fences late operation catalogs after logout', async () => {
  let resolve!: (rows: unknown) => void;
  const promise = new Promise((done) => {
    resolve = done;
  });
  TestBed.configureTestingModule({
    providers: [
      {
        provide: STUDIO_API,
        useValue: { auxiliary: (): Promise<unknown> => promise },
      },
    ],
  });
  const fixture = TestBed.createComponent(OperationChoice);
  fixture.componentRef.setInput('handler', 'service_task');
  fixture.componentRef.setInput('version', '1');
  await fixture.whenStable();
  TestBed.inject(ActorState).reset();
  resolve(operations);
  await fixture.whenStable();
  expect(fixture.componentInstance.rows()).toEqual([]);
});
