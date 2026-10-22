import { TestBed } from '@angular/core/testing';
import { ActorState } from '../../../../core/auth/actor-state';
import { AgentDecision } from './agent-decision';
describe('Agent decision authoring', () => {
  it('fences duplicate or malformed deliberate identities without rewriting saved keys', async () => {
    const fixture = TestBed.createComponent(AgentDecision);
    fixture.componentRef.setInput('value', {
      question: 'Choose',
      options: [
        { key: 'accept', labels: { en: 'Accept' }, description: 'Review' },
        { key: 'return', labels: { en: 'Return' }, description: 'Review' },
      ],
    });
    fixture.componentInstance.valueChange.subscribe((value) =>
      fixture.componentRef.setInput('value', value),
    );
    await fixture.whenStable();
    const vm = fixture.componentInstance;
    vm.updateChoice(1, 'key', 'accept');
    await fixture.whenStable();
    expect(vm.valid()).toBe(false);
    expect(vm.keyErrors().every(Boolean)).toBe(true);
    expect(vm.choices()[0]['key']).toBe('accept');
    vm.updateChoice(1, 'key', '1 invalid');
    await fixture.whenStable();
    expect(vm.valid()).toBe(false);
    vm.updateChoice(1, 'key', 'return');
    await fixture.whenStable();
    expect(vm.valid()).toBe(true);
  });
  it('keeps invalid review confidence through question and choice edits until repaired', async () => {
    const fixture = TestBed.createComponent(AgentDecision);
    fixture.componentRef.setInput('value', {
      question: 'Choose',
      review_below: 0.8,
      options: [],
    });
    fixture.componentInstance.valueChange.subscribe((value) =>
      fixture.componentRef.setInput('value', value),
    );
    await fixture.whenStable();
    const vm = fixture.componentInstance;
    vm.number('1e');
    vm.set('question', 'A changed question');
    await fixture.whenStable();
    vm.add();
    await fixture.whenStable();
    expect(vm.reviewText()).toBe('1e');
    expect(vm.valid()).toBe(false);
    expect(vm.value()['review_below']).toBe(0.8);
    vm.number('0');
    await fixture.whenStable();
    expect(vm.valid()).toBe(true);
    expect(vm.value()['review_below']).toBe(0);
  });
  it('generates a stable unique key for a new choice without changing existing choices', async () => {
    const fixture = TestBed.createComponent(AgentDecision);
    const original = {
      key: 'choice_1',
      labels: { en: 'Existing' },
      description: 'Keep',
    };
    fixture.componentRef.setInput('value', {
      question: 'Choose',
      options: [original],
    });
    fixture.componentInstance.valueChange.subscribe((value) =>
      fixture.componentRef.setInput('value', value),
    );
    await fixture.whenStable();
    fixture.componentInstance.add();
    await fixture.whenStable();
    const choices = fixture.componentInstance.choices();
    expect(choices[0]).toEqual(original);
    expect(choices[1]['key']).toMatch(/^[A-Za-z][A-Za-z0-9_.-]+$/);
    expect(choices[1]['key']).not.toBe(original.key);
    fixture.componentInstance.label(1, 'New display name');
    await fixture.whenStable();
    expect(fixture.componentInstance.choices()[1]['key']).toBe(
      choices[1]['key'],
    );
  });
  it('retains both choice variants, shared question edits and exact zero without losing labels', async () => {
    const fixture = TestBed.createComponent(AgentDecision);
    const original = {
      question: 'Question',
      review_below: 0,
      options: [
        {
          key: 'accept',
          labels: { en: 'Accept', fa: 'پذیرفتن' },
          description: 'Owned',
        },
      ],
    };
    fixture.componentRef.setInput('value', original);
    const changes = vi.fn();
    fixture.componentInstance.valueChange.subscribe((value) => {
      changes(value);
      fixture.componentRef.setInput('value', value);
    });
    await fixture.whenStable();
    const vm = fixture.componentInstance;
    vm.changeMode('input');
    await fixture.whenStable();
    vm.set('question', 'Shared new question');
    await fixture.whenStable();
    vm.set('options_input_key', 'available_choices');
    await fixture.whenStable();
    vm.changeMode('static');
    await fixture.whenStable();
    expect(vm.value()['question']).toBe('Shared new question');
    expect(vm.value()['options']).toEqual(original.options);
    expect(vm.value()['review_below']).toBe(0);
    vm.number(0);
    expect(changes.mock.lastCall![0].review_below).toBe(0);
    TestBed.inject(ActorState).reset();
    fixture.componentRef.setInput('value', {
      question: 'New actor',
      options_input_key: 'new_choices',
    });
    await fixture.whenStable();
    vm.changeMode('static');
    expect(changes.mock.lastCall![0].options).toEqual([]);
  });
});
