import { TestBed } from '@angular/core/testing';
import { ActorState } from '../../../../core/auth/actor-state';
import { AGENT_METADATA } from '../../bindings';
import {
  AgentModel,
  AgentProvider,
} from '../../application/agent-metadata-port';
import { AgentCapabilities } from './agent-capabilities';
const provider: AgentProvider = {
  key: 'configured',
  available: true,
  unavailable_reason: null,
  supports_tools: false,
  supports_structured_output: true,
  strict_spend_supported: false,
  governed_execution: true,
};
const model = (connection: string): AgentModel => ({
  connection_ref: connection,
  provider: 'configured',
  model_id: 'model',
  source: 'configured',
  can_execute: false,
  supports_tools: false,
  supports_structured_output: true,
  region: connection,
  provider_retention: 'UNKNOWN',
});
describe('Agent metadata identity', () => {
  it('ignores old selections and clears actor output without querying old pins as the next actor', async () => {
    let resolve!: (value: AgentModel) => void;
    const old = new Promise<AgentModel>((done) => (resolve = done));
    const api = {
      provider: vi.fn().mockResolvedValue(provider),
      model: vi
        .fn()
        .mockReturnValueOnce(old)
        .mockResolvedValue(model('current')),
    };
    TestBed.configureTestingModule({
      providers: [{ provide: AGENT_METADATA, useValue: api }],
    });
    const fixture = TestBed.createComponent(AgentCapabilities);
    fixture.componentRef.setInput('config', {
      provider_key: 'configured',
      connection_ref: 'old',
      model_id: 'model',
    });
    fixture.detectChanges();
    await Promise.resolve();
    fixture.componentRef.setInput('config', {
      provider_key: 'configured',
      connection_ref: 'current',
      model_id: 'model',
    });
    await fixture.whenStable();
    resolve(model('old'));
    await fixture.whenStable();
    expect(fixture.componentInstance.model()?.region).toBe('current');
    expect(fixture.componentInstance.model()?.can_execute).toBe(false);
    expect(fixture.nativeElement.textContent).toContain('No');
    TestBed.inject(ActorState).reset();
    await fixture.whenStable();
    expect(fixture.componentInstance.model()).toBeNull();
    expect(fixture.componentInstance.provider()).toBeNull();
    expect(api.model).toHaveBeenCalledTimes(2);
  });
});
