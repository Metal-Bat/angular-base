import { TestBed } from '@angular/core/testing';
import { ActorState } from '../../../../core/auth/actor-state';
import { PERSONAL_SERVICES } from '../../bindings';
import { CaseHistory } from './case-history';

describe('Case history context ownership', () => {
  it('loads only after History opens, clears on actor loss and ignores a late private response', async () => {
    let finish!: (value: {
      items: { revision: string; date: string; action: string }[];
      page: number;
      totalPages: number;
    }) => void;
    const history = vi.fn().mockImplementation(
      () =>
        new Promise((resolve) => {
          finish = resolve;
        }),
    );
    TestBed.configureTestingModule({
      providers: [{ provide: PERSONAL_SERVICES, useValue: { history } }],
    });
    const fixture = TestBed.createComponent(CaseHistory);
    fixture.componentRef.setInput('kind', 'task');
    fixture.componentRef.setInput('reference', 'authorized-task');
    await fixture.whenStable();
    expect(history).not.toHaveBeenCalled();
    fixture.componentInstance.open();
    expect(history).toHaveBeenCalledExactlyOnceWith(
      'task',
      'authorized-task',
      1,
    );
    TestBed.inject(ActorState).reset();
    finish({
      items: [{ revision: 'private', date: '2026-10-15', action: 'private' }],
      page: 1,
      totalPages: 1,
    });
    await fixture.whenStable();
    expect(fixture.componentInstance.items()).toEqual([]);
    expect(fixture.componentInstance.visible()).toBe(false);
    fixture.componentInstance.open();
    expect(history).toHaveBeenCalledTimes(1);
  });
  it('fences a history reply after switching the current reference', async () => {
    let finish!: (value: {
      items: { revision: string; date: string; action: string }[];
      page: number;
      totalPages: number;
    }) => void;
    const history = vi.fn().mockImplementation(
      () =>
        new Promise((resolve) => {
          finish = resolve;
        }),
    );
    TestBed.configureTestingModule({
      providers: [{ provide: PERSONAL_SERVICES, useValue: { history } }],
    });
    const fixture = TestBed.createComponent(CaseHistory);
    fixture.componentRef.setInput('kind', 'request');
    fixture.componentRef.setInput('reference', 'before');
    await fixture.whenStable();
    fixture.componentInstance.open();
    fixture.componentRef.setInput('reference', 'current');
    await fixture.whenStable();
    finish({
      items: [{ revision: 'before', date: '2026-10-15', action: 'outdated' }],
      page: 1,
      totalPages: 1,
    });
    await fixture.whenStable();
    expect(fixture.componentInstance.items()).toEqual([]);
    expect(fixture.componentInstance.visible()).toBe(false);
  });
});
