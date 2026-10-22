import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ActorState } from '../../../../core/auth/actor-state';
import { FORM_RESOURCES } from '../../../forms/bindings';
import { RequestActions } from './request-actions';

const draft = { ref: 'request-current', status: 'DRAFT' };
describe('Request menu command ownership', () => {
  it('does not execute by rendering a menu and rechecks live guards when a command is selected', async () => {
    const transferBusy = signal(false);
    const cancelRequest = vi.fn().mockResolvedValue(undefined);
    const resume = vi.fn().mockResolvedValue(undefined);
    const requestReport = vi.fn().mockResolvedValue([]);
    TestBed.configureTestingModule({
      providers: [
        {
          provide: FORM_RESOURCES,
          useValue: {
            transferBusy,
            pendingAttachment: (): null => null,
            cancelRequest,
            resume,
            requestReport,
          },
        },
      ],
    });
    const fixture = TestBed.createComponent(RequestActions);
    const item = signal(draft);
    fixture.componentRef.setInput('editor', {
      item,
      busy: (): boolean => false,
      blocked: (): boolean => false,
      error: signal(''),
    });
    await fixture.whenStable();
    const commands = fixture.componentInstance.commands();
    expect(cancelRequest).not.toHaveBeenCalled();
    expect(resume).not.toHaveBeenCalled();
    expect(requestReport).not.toHaveBeenCalled();
    expect(commands).toHaveLength(3);
    transferBusy.set(true);
    commands[0].command();
    expect(cancelRequest).not.toHaveBeenCalled();
    transferBusy.set(false);
    commands[0].command();
    expect(cancelRequest).toHaveBeenCalledOnce();
    item.set({ ...draft, status: 'SUBMITTED' });
    await fixture.whenStable();
    expect(fixture.componentInstance.commands()).toHaveLength(1);
    TestBed.inject(ActorState).reset();
    fixture.componentInstance.commands()[0].command();
    expect(requestReport).not.toHaveBeenCalled();
  });
  it('ignores a private report projection after actor cleanup', async () => {
    let finish!: (value: { reference: string; status: string }[]) => void;
    const requestReport = vi.fn().mockImplementation(
      () =>
        new Promise((resolve) => {
          finish = resolve;
        }),
    );
    TestBed.configureTestingModule({
      providers: [
        {
          provide: FORM_RESOURCES,
          useValue: {
            transferBusy: (): boolean => false,
            pendingAttachment: (): null => null,
            requestReport,
          },
        },
      ],
    });
    const fixture = TestBed.createComponent(RequestActions);
    fixture.componentRef.setInput('editor', {
      item: (): typeof draft => draft,
      busy: (): boolean => false,
      blocked: (): boolean => false,
      error: signal(''),
    });
    await fixture.whenStable();
    const pending = fixture.componentInstance.report();
    TestBed.inject(ActorState).reset();
    finish([{ reference: 'private-request', status: 'SUBMITTED' }]);
    await pending;
    expect(fixture.componentInstance.reports()).toEqual([]);
    expect(fixture.componentInstance.disabled()).toBe(true);
  });
});
