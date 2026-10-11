import { TestBed } from '@angular/core/testing';
import { ActorState } from '../../../../core/auth/actor-state';
import { Locale } from '../../../../core/localization/locale';
import { ORDER_RECOVERY, PROCESS_EVIDENCE } from '../../bindings';
import { ProcessEvidenceSnapshot } from '../../domain/process-evidence';
import { ProcessEvidence } from './process-evidence';

const snapshot: ProcessEvidenceSnapshot = {
  orders: {
    page: 1,
    totalPages: 2,
    total: 21,
    items: [
      {
        operation: 'operation',
        execution: 'execution',
        state: 'CONFIRMED',
        receipt: {
          identity: 'receipt',
          state: 'CREATED',
          payloadHash: 'a'.repeat(64),
        },
      },
    ],
  },
  ai: {
    page: 1,
    totalPages: 3,
    total: 41,
    items: [
      {
        execution: 'ai-execution',
        attempt: 1,
        status: 'QUEUED',
        agent: 'pinned-agent',
        agentAvailable: false,
        model: 'pinned-model',
        fields: ['quantity'],
        recommendation: null,
        budget: null,
      },
    ],
  },
};
describe('Process evidence view', () => {
  const setup = (
    read = vi.fn().mockResolvedValue(snapshot),
  ): {
    fixture: import('@angular/core/testing').ComponentFixture<ProcessEvidence>;
    read: typeof read;
  } => {
    TestBed.configureTestingModule({
      providers: [
        {
          provide: ORDER_RECOVERY,
          useValue: { authority: vi.fn().mockResolvedValue(false) },
        },
        { provide: PROCESS_EVIDENCE, useValue: { read } },
      ],
    });
    const fixture = TestBed.createComponent(ProcessEvidence);
    fixture.componentRef.setInput('reference', 'current-process');
    return { fixture, read };
  };
  it('renders receipt and pinned evidence in English/Farsi without a business command', async () => {
    const { fixture, read } = setup();
    await fixture.whenStable();
    expect(fixture.nativeElement.textContent).toContain('receipt');
    expect(fixture.nativeElement.textContent).toContain('pinned-agent');
    expect(fixture.nativeElement.textContent).toContain(
      'No recommendation is available',
    );
    expect(
      fixture.nativeElement.querySelector('input,textarea,select'),
    ).toBeNull();
    await TestBed.inject(Locale).set('fa');
    await fixture.whenStable();
    expect(fixture.nativeElement.textContent).toContain(
      'رسیدها و شواهد اجرای هوش مصنوعی',
    );
    for (const label of [
      'Attempt',
      'Recommendation',
      'Confidence',
      'Currency',
      'Model',
    ]) {
      expect(TestBed.inject(Locale).text(label)).not.toBe(label);
    }
    expect(read).toHaveBeenCalledOnce();
  });
  it('keeps independent pages and cancels old reference reads', async () => {
    const { fixture, read } = setup();
    await fixture.whenStable();
    const firstAbort = read.mock.calls[0][3] as AbortSignal;
    await fixture.componentInstance.refresh(2, 3);
    expect(firstAbort.aborted).toBe(true);
    expect(read.mock.calls[1].slice(0, 3)).toEqual(['current-process', 2, 3]);
    fixture.componentRef.setInput('reference', 'new-current-process');
    await fixture.whenStable();
    expect(read.mock.calls[2].slice(0, 3)).toEqual([
      'new-current-process',
      1,
      1,
    ]);
  });
  it('clears old evidence and ignores a late old-account completion', async () => {
    let resolve!: (value: ProcessEvidenceSnapshot) => void;
    const read = vi.fn().mockImplementation(
      () =>
        new Promise<ProcessEvidenceSnapshot>((done) => {
          resolve = done;
        }),
    );
    const { fixture } = setup(read);
    await fixture.whenStable();
    const abort = read.mock.calls[0][3] as AbortSignal;
    TestBed.inject(ActorState).reset();
    resolve(snapshot);
    await fixture.whenStable();
    expect(abort.aborted).toBe(true);
    expect(fixture.componentInstance.snapshot()).toBeNull();
    await fixture.componentInstance.refresh();
    expect(read).toHaveBeenCalledOnce();
  });
  it('removes stale evidence when current authorization or decoding fails', async () => {
    const { fixture, read } = setup();
    await fixture.whenStable();
    read.mockRejectedValueOnce(Error('404'));
    await fixture.componentInstance.refresh();
    await fixture.whenStable();
    expect(fixture.componentInstance.snapshot()).toBeNull();
    expect(
      fixture.nativeElement.querySelector('[role="alert"]')?.textContent,
    ).toContain('current access');
  });
});
