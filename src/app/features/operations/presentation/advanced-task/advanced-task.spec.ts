import { signal } from '@angular/core';
import type { WritableSignal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { ActorState } from '../../../../core/auth/actor-state';
import { FormResources } from '../../../forms/application/form-resources';
import { FORM_RESOURCES } from '../../../forms/bindings';
import { EditorPort } from '../../application/workspace-ports';
import { AdvancedTask } from './advanced-task';

describe('Supplemental task command drafts', () => {
  const setup = async (): Promise<{
    vm: AdvancedTask;
    context: WritableSignal<string>;
    settle: () => Promise<unknown>;
    destroy: () => void;
    resources: Pick<
      FormResources,
      'view' | 'comment' | 'forward' | 'transferBusy' | 'pendingAttachment'
    >;
  }> => {
    const resources = {
      view: vi.fn().mockResolvedValue([]),
      transferBusy: (): boolean => false,
      pendingAttachment: (): null => null,
      comment: vi.fn().mockResolvedValue(false),
      forward: vi.fn().mockResolvedValue(false),
    };
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        { provide: FORM_RESOURCES, useValue: resources },
      ],
    });
    const fixture = TestBed.createComponent(AdvancedTask);
    const context = signal('task:owner');
    const editor = {
      document: signal(null),
      contextKey: context,
      item: () => ({ ref: 'current', kind: 'HUMAN_TASK', status: 'CLAIMED' }),
      ownTask: () => true,
      canEdit: () => false,
      busy: () => false,
      blocked: () => false,
      error: signal(''),
      feedback: { confirm: vi.fn().mockResolvedValue(false) },
    } as unknown as EditorPort;
    fixture.componentRef.setInput('editor', editor);
    await fixture.whenStable();
    return {
      vm: fixture.componentInstance,
      resources,
      context,
      settle: () => fixture.whenStable(),
      destroy: () => fixture.destroy(),
    };
  };
  it('does not navigate after its task view is destroyed while forwarding is in flight', async () => {
    const { vm, resources, destroy } = await setup();
    const navigate = vi
      .spyOn(TestBed.inject(Router), 'navigate')
      .mockResolvedValue(true);
    let reply!: (value: boolean) => void;
    vi.mocked(resources.forward).mockImplementation(
      () =>
        new Promise((resolve) => {
          reply = resolve;
        }),
    );
    vm.open('forward');
    vm.reason.set('Finance');
    vm.pick({
      path: 'user_ref_id',
      value: 'opaque-user',
      label: 'Finance reviewer',
    });
    const pending = vm.forward();
    destroy();
    reply(true);
    await pending;
    expect(navigate).not.toHaveBeenCalled();
  });
  it('does not leave a newly opened task or clear its pending comment when an earlier handoff completes', async () => {
    const { vm, resources, context, settle } = await setup();
    const navigate = vi
      .spyOn(TestBed.inject(Router), 'navigate')
      .mockResolvedValue(true);
    let forwarded!: (value: boolean) => void;
    let commented!: (value: boolean) => void;
    vi.mocked(resources.forward).mockImplementation(
      () =>
        new Promise((resolve) => {
          forwarded = resolve;
        }),
    );
    vi.mocked(resources.comment).mockImplementation(
      () =>
        new Promise((resolve) => {
          commented = resolve;
        }),
    );
    vm.open('forward');
    vm.reason.set('Finance');
    vm.pick({
      path: 'user_ref_id',
      value: 'opaque-user',
      label: 'Finance reviewer',
    });
    const old = vm.forward();
    context.set('task:another');
    await settle();
    vm.open('comment');
    vm.comment.set('Keep this new task explanation');
    const current = vm.post();
    forwarded(true);
    await old;
    expect(navigate).not.toHaveBeenCalled();
    expect(vm.pending()).toBe(true);
    expect(vm.comment()).toBe('Keep this new task explanation');
    commented(true);
    await current;
    expect(vm.pending()).toBe(false);
  });
  it('does not unlock a new task command when a previous task comment completes', async () => {
    const { vm, resources, context, settle } = await setup();
    const replies: ((value: boolean) => void)[] = [];
    vi.mocked(resources.comment).mockImplementation(
      () => new Promise((resolve) => replies.push(resolve)),
    );
    vm.open('comment');
    vm.comment.set('Previous task comment');
    const old = vm.post();
    context.set('task:another');
    await settle();
    vm.open('comment');
    vm.comment.set('Current task comment');
    const current = vm.post();
    replies[0](true);
    await old;
    expect(vm.pending()).toBe(true);
    expect(vm.comment()).toBe('Current task comment');
    replies[1](true);
    await current;
    expect(vm.pending()).toBe(false);
  });
  it('retains a failed comment and clears it only after acknowledgement', async () => {
    const { vm, resources } = await setup();
    vm.open('comment');
    vm.comment.set('Keep this reviewer explanation');
    await vm.post();
    expect(vm.comment()).toBe('Keep this reviewer explanation');
    expect(vm.dialog()).toBe('comment');
    vi.mocked(resources.comment).mockResolvedValue(true);
    await vm.post();
    expect(vm.comment()).toBe('');
    expect(vm.dialog()).toBeNull();
  });
  it('requires selected recipients and keeps a cancelled forwarding draft', async () => {
    const { vm, resources } = await setup();
    vm.open('forward');
    vm.reason.set('Review by finance');
    await vm.forward();
    expect(resources.forward).not.toHaveBeenCalled();
    vm.pick({
      path: 'user_ref_id',
      value: 'opaque-user',
      label: 'Finance reviewer',
    });
    await vm.forward();
    expect(resources.forward).toHaveBeenCalledWith(
      ['opaque-user'],
      [],
      'Review by finance',
    );
    expect(vm.userLabel()).toBe('Finance reviewer');
    expect(await vm.canLeave()).toBe(false);
    await vm.close();
    expect(vm.dialog()).toBe('forward');
  });
  it('returns to the inbox after a confirmed handoff and clears actor-owned drafts', async () => {
    const { vm, resources } = await setup();
    const navigate = vi
      .spyOn(TestBed.inject(Router), 'navigate')
      .mockResolvedValue(true);
    vm.open('forward');
    vm.reason.set('Finance');
    vm.pick({
      path: 'user_ref_id',
      value: 'opaque-user',
      label: 'Finance reviewer',
    });
    vi.mocked(resources.forward).mockResolvedValue(true);
    await vm.forward();
    expect(navigate).toHaveBeenCalledWith(['/operations/tasks']);
    vm.open('comment');
    vm.comment.set('Private draft');
    TestBed.inject(ActorState).reset();
    expect(vm.comment()).toBe('');
    expect(vm.dialog()).toBeNull();
  });
});
