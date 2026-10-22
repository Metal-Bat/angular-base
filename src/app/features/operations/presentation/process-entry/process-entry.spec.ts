import { ApiFailure } from '../../../../core/transport/api-failure';
import { BehaviorSubject } from 'rxjs';
import { TestBed } from '@angular/core/testing';
import {
  ActivatedRoute,
  convertToParamMap,
  provideRouter,
} from '@angular/router';
import { SessionContext } from '../../../../core/auth/session-context';
import { Locale } from '../../../../core/localization/locale';
import {
  ORDER_RECOVERY,
  PROCESS_EVIDENCE,
  PROCESS_READER,
} from '../../bindings';
import { ProcessReader, ProcessSnapshot } from '../../domain/process-tracking';
import { ProcessEntry } from './process-entry';

const process: ProcessSnapshot = {
  reference: 'current-process',
  request: 'request',
  workflow: 'immutable-pin',
  status: 'WAITING',
  positions: [],
  steps: [],
  children: [],
  events: [],
  page: 1,
  totalPages: 1,
  coverage: null,
};
describe('Process controls navigation', () => {
  let read: ReturnType<typeof vi.fn<ProcessReader>>;
  beforeEach(() => {
    read = vi.fn<ProcessReader>().mockResolvedValue(process);
    TestBed.configureTestingModule({
      providers: [
        {
          provide: ORDER_RECOVERY,
          useValue: { authority: vi.fn().mockResolvedValue(false) },
        },
        provideRouter([]),
        {
          provide: ActivatedRoute,
          useValue: {
            paramMap: new BehaviorSubject(
              convertToParamMap({ ref: 'old-process' }),
            ),
          },
        },
        { provide: PROCESS_READER, useValue: read },
        {
          provide: PROCESS_EVIDENCE,
          useValue: {
            read: vi.fn().mockResolvedValue({
              orders: { items: [], page: 1, totalPages: 0, total: 0 },
              ai: { items: [], page: 1, totalPages: 0, total: 0 },
            }),
          },
        },
      ],
    });
    TestBed.inject(SessionContext).resolve({
      status: 'authenticated',
      permissions: ['requests.start'],
    });
  });
  it('links the authoritative process to the existing guarded controls without executing commands', async () => {
    const fixture = TestBed.createComponent(ProcessEntry);
    fixture.componentInstance.polling.stop();
    await fixture.whenStable();
    const link = (): HTMLAnchorElement | null =>
      fixture.nativeElement.querySelector(
        'a[href^="/administration/processes"]',
      );
    expect(link()?.getAttribute('href')).toBe(
      '/administration/processes?ref_id=current-process',
    );
    expect(link()?.textContent).toContain('Process controls');
    expect(read).toHaveBeenCalledOnce();
    expect(fixture.componentInstance.snapshot()?.workflow).toBe(
      'immutable-pin',
    );
    await TestBed.inject(Locale).set('fa');
    await fixture.whenStable();
    expect(link()?.textContent).toContain('کنترل فرایند');
    expect(link()?.getAttribute('href')).toBe(
      '/administration/processes?ref_id=current-process',
    );
    TestBed.inject(SessionContext).clear();
    await fixture.whenStable();
    expect(link()).toBeNull();
    expect(fixture.componentInstance.snapshot()).toBeNull();
  });
  it('does not offer controls for an actor without destination authority', async () => {
    TestBed.inject(SessionContext).resolve({
      status: 'authenticated',
      permissions: [],
    });
    const fixture = TestBed.createComponent(ProcessEntry);
    fixture.componentInstance.polling.stop();
    await fixture.whenStable();
    expect(
      fixture.nativeElement.querySelector(
        'a[href^="/administration/processes"]',
      ),
    ).toBeNull();
  });
  it('loads a new child route and rejects late data from the previous route', async () => {
    const fixture = TestBed.createComponent(ProcessEntry);
    fixture.componentInstance.polling.stop();
    await fixture.whenStable();
    const params = TestBed.inject(ActivatedRoute).paramMap as BehaviorSubject<
      ReturnType<typeof convertToParamMap>
    >;
    let finish!: (value: ProcessSnapshot) => void;
    read.mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          finish = resolve;
        }),
    );
    params.next(convertToParamMap({ ref: 'child-one' }));
    await vi.waitFor(() =>
      expect(read.mock.calls.at(-1)![0]).toBe('child-one'),
    );
    const firstSignal = read.mock.calls.at(-1)![3]!;
    read.mockResolvedValueOnce({
      ...process,
      reference: 'child-two-current',
      status: 'COMPLETED',
    });
    params.next(convertToParamMap({ ref: 'child-two' }));
    await vi.waitFor(() =>
      expect(fixture.componentInstance.snapshot()?.reference).toBe(
        'child-two-current',
      ),
    );
    await fixture.whenStable();
    finish({ ...process, reference: 'late-child-one' });
    await fixture.whenStable();
    expect(firstSignal.aborted).toBe(true);
    expect(fixture.componentInstance.snapshot()?.reference).toBe(
      'child-two-current',
    );
    expect(read.mock.calls.at(-1)![0]).toBe('child-two');
  });
  it('refreshes the current page and reference, retaining outages but clearing revoked records', async () => {
    const fixture = TestBed.createComponent(ProcessEntry);
    const vm = fixture.componentInstance;
    vm.polling.stop();
    await fixture.whenStable();
    read.mockResolvedValueOnce({ ...process, page: 2, totalPages: 3 });
    await vm.load(2);
    read.mockRejectedValueOnce(new Error('offline'));
    await vm.load();
    expect(read.mock.calls.at(-1)!.slice(0, 3)).toEqual([
      'current-process',
      2,
      false,
    ]);
    expect(vm.snapshot()?.page).toBe(2);
    read.mockRejectedValueOnce(new ApiFailure(403, null, null, []));
    await vm.load();
    expect(vm.snapshot()).toBeNull();
    expect(vm.status()).toBe('');
  });
});
