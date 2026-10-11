import { TestBed } from '@angular/core/testing';
import { ActorState } from '../../../../core/auth/actor-state';
import { Feedback } from '../../../../core/feedback/feedback';
import { ApiFailure } from '../../../../core/transport/api-failure';
import { ORDER_RECOVERY } from '../../bindings';
import { RecoveryCommand } from '../../domain/order-recovery';
import { OrderRecovery } from './order-recovery';

const command: RecoveryCommand = Object.freeze({
  operation: 'operation',
  process: 'current-process',
  execution: 'current-execution',
  commandKey: 'frozen-key',
  reason: 'INC-123',
  kind: 'order',
});
describe('Operator order recovery', () => {
  const setup = (): {
    fixture: import('@angular/core/testing').ComponentFixture<OrderRecovery>;
    port: {
      authority: ReturnType<typeof vi.fn>;
      prepare: ReturnType<typeof vi.fn>;
      execute: ReturnType<typeof vi.fn>;
    };
    feedback: { confirm: ReturnType<typeof vi.fn> };
  } => {
    const port = {
      authority: vi.fn().mockResolvedValue(true),
      prepare: vi.fn().mockResolvedValue(command),
      execute: vi.fn().mockResolvedValue({
        kind: 'cancellation',
        status: 'RUNNING',
        execution: 'current-execution',
      }),
    };
    const feedback = { confirm: vi.fn().mockResolvedValue(true) };
    TestBed.configureTestingModule({
      providers: [
        { provide: ORDER_RECOVERY, useValue: port },
        { provide: Feedback, useValue: feedback },
      ],
    });
    const fixture = TestBed.createComponent(OrderRecovery);
    fixture.componentRef.setInput('reference', 'old-process');
    fixture.componentInstance.operation.set('operation');
    fixture.componentInstance.reason.set('INC-123');
    return { fixture, port, feedback };
  };
  it('confirms frozen current references and labels queued cancellation without claiming completion', async () => {
    const { fixture, port } = setup();
    await fixture.whenStable();
    await fixture.componentInstance.lookup('cancellation');
    expect(port.prepare.mock.calls[0].slice(0, 5)).toEqual([
      'old-process',
      'operation',
      1,
      'INC-123',
      'cancellation',
    ]);
    expect(port.execute.mock.calls[0][0]).toBe(command);
    expect(fixture.componentInstance.message()).toContain(
      'not confirmed cancellation',
    );
    expect(fixture.componentInstance.reason()).toBe('');
  });
  it('retains the exact command after a lost reply and only reconciles it deliberately', async () => {
    const { fixture, port } = setup();
    await fixture.whenStable();
    port.execute.mockRejectedValueOnce(new ApiFailure(0, null, null, [], true));
    await fixture.componentInstance.lookup('order');
    expect(fixture.componentInstance.uncertain()).toBe(true);
    expect(fixture.componentInstance.frozen()).toBe(command);
    expect(fixture.componentInstance.reason()).toBe('INC-123');
    await fixture.componentInstance.lookup('order');
    expect(port.execute).toHaveBeenCalledOnce();
    await fixture.componentInstance.reconcileOriginal();
    expect(port.execute.mock.calls[1][0]).toBe(command);
    expect(port.prepare).toHaveBeenCalledOnce();
  });
  it('stops a pending confirmation and late callback when the actor changes', async () => {
    const { fixture, port, feedback } = setup();
    await fixture.whenStable();
    let approve!: (value: boolean) => void;
    feedback.confirm.mockImplementationOnce(
      () =>
        new Promise<boolean>((resolve) => {
          approve = resolve;
        }),
    );
    const work = fixture.componentInstance.lookup('order');
    await Promise.resolve();
    TestBed.inject(ActorState).reset();
    approve(true);
    await work;
    expect(port.execute).not.toHaveBeenCalled();
    expect(fixture.componentInstance.reason()).toBe('');
    expect(fixture.componentInstance.allowed()).toBe(false);
  });
  it('preserves unsaved input on declined navigation and rejects unsupported incident values', async () => {
    const { fixture, port, feedback } = setup();
    await fixture.whenStable();
    feedback.confirm.mockResolvedValueOnce(false);
    expect(await fixture.componentInstance.canLeave()).toBe(false);
    expect(fixture.componentInstance.reason()).toBe('INC-123');
    fixture.componentInstance.reason.set('private details / copied payload');
    await fixture.componentInstance.lookup('order');
    expect(port.prepare).not.toHaveBeenCalled();
  });
});
