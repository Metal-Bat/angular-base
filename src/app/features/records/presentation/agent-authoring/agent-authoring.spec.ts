import { By } from '@angular/platform-browser';
import { SelectControl } from '../../../../shared/ui/select-control/select-control';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { ActorState } from '../../../../core/auth/actor-state';
import { SessionContext } from '../../../../core/auth/session-context';
import { Feedback } from '../../../../core/feedback/feedback';
import { ApiFailure } from '../../../../core/transport/api-failure';
import { AGENT_AUTHORING } from '../../bindings';
import {
  AgentPage,
  AgentWorkflowContext,
} from '../../application/agent-authoring-port';
import { AgentAuthoring } from './agent-authoring';
const page = <T>(items: T[]): AgentPage<T> => ({
  items,
  page: 1,
  size: 10,
  total: items.length,
  totalPages: items.length ? 1 : 0,
});
const root = { ref: 'root', name: 'Invoice review' };
const version = { ref: 'version', name: '1' };
const draft = {
  ref: 'request',
  name: 'Quarterly invoice',
  status: 'DRAFT',
  version: 'version',
  createdAt: '2026-10-28T08:00:00Z',
};
const report = {
  ref: 'report',
  name: 'report.users',
  createdAt: '2026-10-28T08:00:00Z',
  version: 1,
  classification: 'INTERNAL',
  fields: ['username'],
  maxRows: 3,
};
const context: AgentWorkflowContext = {
  version: 'version',
  step: 'classify',
  checksum: 'checksum',
  schema: {
    type: 'object',
    properties: {
      routes: { type: 'array' },
      count: { type: 'integer' },
      flag: { type: 'boolean' },
    },
  },
  origin: 'NONE',
  decision: { state: 'MISSING', inputKey: 'routes', options: [], issues: [] },
};
const record = {
  ref_id: 'agent',
  status: 'PUBLISHED',
  spec: {
    decision: { mode: 'input', options_input_key: 'routes' },
    data_policy: { allowed_fields: ['routes', 'count', 'flag'] },
  },
};
function api(): {
  [
    K in keyof import('../../application/agent-authoring-port').AgentAuthoringPort
  ]: ReturnType<typeof vi.fn>;
} {
  return {
    workflows: vi.fn().mockResolvedValue(page([root])),
    versions: vi.fn().mockResolvedValue(page([version])),
    steps: vi.fn().mockResolvedValue([{ ref: 'classify', name: 'classify' }]),
    context: vi.fn().mockResolvedValue(context),
    decision: vi.fn().mockResolvedValue(context.decision),
    sources: vi.fn().mockResolvedValue(page([report])),
    lookup: vi.fn().mockResolvedValue({ source: report, limit: 3 }),
    requests: vi.fn().mockResolvedValue(page([draft])),
    request: vi.fn().mockResolvedValue(draft),
    evaluate: vi.fn().mockResolvedValue({
      request: 'request-current',
      status: 'RUNNING',
      process: 'process',
    }),
  };
}
async function setup(
  mock = api(),
  status = 'PUBLISHED',
  permissions = ['workflows.manage', 'requests.start'],
): Promise<{
  fixture: ComponentFixture<AgentAuthoring>;
  vm: AgentAuthoring;
  mock: ReturnType<typeof api>;
}> {
  TestBed.configureTestingModule({
    providers: [
      provideRouter([]),
      { provide: AGENT_AUTHORING, useValue: mock },
    ],
  });
  TestBed.inject(SessionContext).resolve({
    status: 'authenticated',
    permissions,
  });
  const fixture = TestBed.createComponent(AgentAuthoring);
  fixture.componentRef.setInput('record', { ...record, status });
  await fixture.whenStable();
  return { fixture, vm: fixture.componentInstance, mock };
}
async function bind(vm: AgentAuthoring): Promise<void> {
  await vm.chooseWorkflow(root);
  await vm.chooseVersion(version);
  await vm.inspect();
}

describe('Saved Agent authoring', () => {
  it('uses the rendered step dropdown output to select among several pinned AI steps', async () => {
    const mock = api();
    mock.steps.mockResolvedValue([
      { ref: 'first', name: 'First' },
      { ref: 'second', name: 'Second' },
    ]);
    const { fixture, vm } = await setup(mock);
    await vm.chooseWorkflow(root);
    await vm.chooseVersion(version);
    await fixture.whenStable();
    const dropdown = fixture.debugElement.query(By.directive(SelectControl))
      .componentInstance as SelectControl;
    dropdown.choose('second');
    await fixture.whenStable();
    expect(vm.step()).toBe('second');
    await vm.inspect();
    expect(mock.context).toHaveBeenCalledWith(
      'agent',
      'version',
      'second',
      null,
      expect.any(AbortSignal),
    );
  });
  it('browses named resources, shows missing versus empty choices and performs no incidental execution', async () => {
    const { fixture, vm, mock } = await setup();
    await bind(vm);
    await fixture.whenStable();
    expect(vm.context()?.schema?.['type']).toBe('object');
    expect(fixture.nativeElement.textContent).toContain('Invoice review');
    expect(fixture.nativeElement.textContent).toContain(
      'No choice sample is available',
    );
    vm.useSample.set(true);
    vm.toggleInput('routes', true);
    mock.context.mockResolvedValueOnce({
      ...context,
      origin: 'AUTHOR',
      decision: { ...context.decision, state: 'EMPTY' },
    });
    await vm.previewSample();
    await fixture.whenStable();
    expect(mock.context.mock.calls.at(-1)?.slice(0, 4)).toEqual([
      'agent',
      'version',
      'classify',
      { routes: [] },
    ]);
    expect(fixture.nativeElement.textContent).toContain(
      'The choice sample is empty',
    );
    expect(mock.evaluate).not.toHaveBeenCalled();
    expect(mock.lookup).not.toHaveBeenCalled();
  });
  it('invalidates late preview output while retaining correctable typed sample values', async () => {
    const { fixture, vm, mock } = await setup();
    await bind(vm);
    vm.useSample.set(true);
    vm.toggleInput('count', true);
    vm.sampleValue('count', '0');
    vm.toggleInput('flag', true);
    vm.sampleValue('flag', false);
    let finish!: (value: AgentWorkflowContext) => void;
    mock.context.mockReturnValueOnce(
      new Promise<AgentWorkflowContext>((resolve) => (finish = resolve)),
    );
    const pending = vm.previewSample();
    vm.sampleValue('count', '1');
    finish({
      ...context,
      origin: 'AUTHOR',
      decision: {
        ...context.decision,
        state: 'VALID',
        options: [
          {
            key: 'old',
            labels: { en: 'OLD PRIVATE PREVIEW' },
            description: 'Old',
          },
        ],
      },
    });
    await pending;
    await fixture.whenStable();
    expect(vm.samplePreview()).toBeNull();
    expect(vm.sampleValues()).toEqual({ count: '1', flag: false });
    vm.selectStep('other');
    expect(vm.sampleValues()).toEqual({ count: '1', flag: false });
    expect(fixture.nativeElement.textContent).not.toContain(
      'OLD PRIVATE PREVIEW',
    );
  });
  it('keeps sample row identity after another row is removed', async () => {
    const { vm } = await setup();
    vm.addChoice();
    vm.addChoice();
    const [first, second] = vm.choices();
    vm.removeChoice(first.row);
    vm.choiceValue(second.row, 'en', 'Retained label');
    vm.choiceValue(first.row, 'en', 'Late removed row');
    expect(vm.choices()).toHaveLength(1);
    expect(vm.choices()[0].en).toBe('Retained label');
  });
  it('enforces source limits and removes prior ready evidence when authorization changes', async () => {
    const { fixture, vm, mock } = await setup();
    vm.chooseSource(report);
    vm.limit = 4;
    await vm.previewLookup();
    expect(mock.lookup).not.toHaveBeenCalled();
    vm.limit = 3;
    await vm.previewLookup();
    expect(vm.lookup()?.limit).toBe(3);
    mock.lookup.mockRejectedValueOnce(new ApiFailure(403, 'DENIED', null, []));
    await vm.previewLookup();
    expect(vm.lookup()).toBeNull();
    await fixture.whenStable();
    expect(fixture.nativeElement.textContent).not.toContain(
      'Lookup preview ready.',
    );
    expect(mock.evaluate).not.toHaveBeenCalled();
  });
  it('requires publication and both UI permissions without granting authority through a selection', async () => {
    const { vm, mock } = await setup(api(), 'DRAFT');
    await vm.chooseRequest(draft);
    await vm.submitEvaluation();
    expect(vm.canEvaluate()).toBe(false);
    expect(mock.requests).not.toHaveBeenCalled();
    expect(mock.evaluate).not.toHaveBeenCalled();
  });
  it('confirms one saved request and recovers uncertainty using the identical payload and key', async () => {
    const { fixture, vm, mock } = await setup();
    await vm.chooseRequest(draft);
    const feedback = TestBed.inject(Feedback);
    let work = vm.submitEvaluation();
    expect(feedback.confirmation()?.message).toContain('Quarterly invoice');
    feedback.answer(false);
    await work;
    expect(mock.evaluate).not.toHaveBeenCalled();
    mock.evaluate.mockRejectedValueOnce(
      new ApiFailure(0, null, null, [], true),
    );
    work = vm.submitEvaluation();
    feedback.answer(true);
    await work;
    expect(vm.needsReconciliation()).toBe(true);
    expect(mock.evaluate).toHaveBeenCalledTimes(1);
    await vm.submitEvaluation();
    await vm.retrySubmission();
    expect(mock.evaluate).toHaveBeenCalledTimes(1);
    mock.request.mockResolvedValueOnce({
      ...draft,
      ref: 'request-current',
      status: 'RUNNING',
    });
    await vm.checkRequest();
    const retry = vm.retrySubmission();
    feedback.answer(true);
    await retry;
    expect(mock.evaluate).toHaveBeenCalledTimes(2);
    expect(mock.evaluate.mock.calls[0].slice(0, 3)).toEqual(
      mock.evaluate.mock.calls[1].slice(0, 3),
    );
    expect(mock.evaluate.mock.calls[1][1]).toBe('request');
    expect(vm.result()?.process).toBe('process');
    await fixture.whenStable();
    expect(fixture.nativeElement.textContent).toContain(
      'Request submission confirmed',
    );
  });
  it('clears actor-owned samples and ignores delayed catalog rows without refetching old pins', async () => {
    const mock = api();
    let finish!: (value: ReturnType<typeof page<typeof report>>) => void;
    mock.sources.mockReturnValueOnce(
      new Promise((resolve) => (finish = resolve)),
    );
    const { fixture, vm } = await setup(mock);
    vm.sampleValue('count', '12');
    TestBed.inject(ActorState).reset();
    finish(page([{ ...report, name: 'OLD PRIVATE REPORT' }]));
    await fixture.whenStable();
    expect(vm.reports()).toBeNull();
    expect(vm.sampleValues()).toEqual({});
    expect(vm.active()).toBe(false);
    expect(mock.sources).toHaveBeenCalledTimes(1);
    expect(fixture.nativeElement.textContent).not.toContain(
      'OLD PRIVATE REPORT',
    );
  });
});
