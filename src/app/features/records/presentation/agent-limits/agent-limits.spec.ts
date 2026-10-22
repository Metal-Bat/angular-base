import { TestBed } from '@angular/core/testing';
import { AgentLimits } from './agent-limits';
const original = {
  requests: 5,
  tool_calls: 0,
  input_tokens: 200,
  output_tokens: 100,
  total_tokens: 300,
  elapsed_seconds: 60,
  spend_usd: '0.000001',
  strict_spend: false,
};
describe('Agent limit editing', () => {
  it('normalizes localized spend without rounding or changing the visible draft', async () => {
    const fixture = TestBed.createComponent(AgentLimits);
    fixture.componentRef.setInput('value', original);
    const emitted = vi.fn();
    fixture.componentInstance.valueChange.subscribe(emitted);
    await fixture.whenStable();
    const vm = fixture.componentInstance;
    for (const [text, canonical] of [
      ['۰٫۰۰۰۰۰۱', '0.000001'],
      ['١٢٣٫٤٥٦٧٨٩', '123.456789'],
      ['۱E-۶', '1E-6'],
    ]) {
      vm.number('spend_usd', text);
      expect(vm.valid()).toBe(true);
      expect(vm.text('spend_usd')).toBe(text);
      expect(emitted).toHaveBeenLastCalledWith({
        ...original,
        spend_usd: canonical,
      });
    }
  });
  it('accepts canonical scientific decimal text without rounding its serialized value', async () => {
    const fixture = TestBed.createComponent(AgentLimits);
    fixture.componentRef.setInput('value', { ...original, spend_usd: '1E+2' });
    await fixture.whenStable();
    expect(fixture.componentInstance.valid()).toBe(true);
    const emitted = vi.fn();
    fixture.componentInstance.valueChange.subscribe(emitted);
    fixture.componentInstance.number('spend_usd', '1E-6');
    expect(emitted).toHaveBeenCalledWith({ ...original, spend_usd: '1E-6' });
    fixture.componentInstance.number('spend_usd', '1E-7');
    expect(fixture.componentInstance.valid()).toBe(false);
    expect(emitted).toHaveBeenCalledTimes(1);
  });
  it('retains invalid text across other edits and serializes zero and exact decimal values', async () => {
    const fixture = TestBed.createComponent(AgentLimits);
    fixture.componentRef.setInput('value', original);
    const emitted = vi.fn();
    fixture.componentInstance.valueChange.subscribe((value) => {
      emitted(value);
      fixture.componentRef.setInput('value', value);
    });
    await fixture.whenStable();
    const vm = fixture.componentInstance;
    vm.number('requests', '1e');
    await fixture.whenStable();
    expect(vm.valid()).toBe(false);
    expect(emitted).not.toHaveBeenCalled();
    vm.number('tool_calls', '1');
    await fixture.whenStable();
    expect(vm.text('requests')).toBe('1e');
    expect(vm.valid()).toBe(false);
    vm.number('requests', '2');
    await fixture.whenStable();
    vm.number('tool_calls', '0');
    await fixture.whenStable();
    vm.number('spend_usd', '0.000002');
    await fixture.whenStable();
    expect(vm.valid()).toBe(true);
    expect(emitted.mock.lastCall![0]).toMatchObject({
      requests: 2,
      tool_calls: 0,
      spend_usd: '0.000002',
      strict_spend: false,
    });
    expect(original.spend_usd).toBe('0.000001');
  });
  it('blocks out-of-range values and refuses readonly or disabled changes', async () => {
    const fixture = TestBed.createComponent(AgentLimits);
    fixture.componentRef.setInput('value', original);
    const emitted = vi.fn();
    fixture.componentInstance.valueChange.subscribe(emitted);
    await fixture.whenStable();
    const vm = fixture.componentInstance;
    vm.number('tool_calls', '-1');
    vm.number('spend_usd', '0.0000001');
    expect(vm.valid()).toBe(false);
    expect(emitted).not.toHaveBeenCalled();
    fixture.componentRef.setInput('disabled', true);
    await fixture.whenStable();
    vm.number('requests', '2');
    vm.strict(true);
    expect(emitted).not.toHaveBeenCalled();
    fixture.componentRef.setInput('disabled', false);
    fixture.componentRef.setInput('readonly', true);
    await fixture.whenStable();
    vm.number('requests', '2');
    vm.strict(true);
    expect(emitted).not.toHaveBeenCalled();
  });
});
