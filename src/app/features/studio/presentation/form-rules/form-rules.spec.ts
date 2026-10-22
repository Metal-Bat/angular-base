import { TestBed } from '@angular/core/testing';
import { ActorState } from '../../../../core/auth/actor-state';
import { JsonObject } from '../../../forms/domain/runtime-document';
import { presentationOutline } from '../form-selection-label';
import { FormRules } from './form-rules';

const documents: JsonObject = {
  data_schema: {
    type: 'object',
    properties: {
      amount: { type: 'integer' },
      active: { type: 'boolean' },
      code: { type: 'string' },
      owner: { type: 'string' },
      decision: { type: ['string', 'number', 'boolean'] },
    },
  },
  render_schema: {
    root: {
      component: 'vertical',
      children: [
        {
          node_key: 'amount',
          component: 'integer',
          scope: '/properties/amount',
          label: 'Amount',
        },
        {
          node_key: 'active',
          component: 'boolean',
          scope: '/properties/active',
          label: 'Active',
        },
        {
          node_key: 'code',
          component: 'text',
          scope: '/properties/code',
          label: 'Code',
        },
        {
          node_key: 'owner',
          component: 'user',
          scope: '/properties/owner',
          label: 'Owner',
        },
        {
          node_key: 'decision',
          component: 'choice',
          scope: '/properties/decision',
          label: 'Decision',
          source: {
            kind: 'custom',
            items: [
              { key: 0, value: 'Zero' },
              { key: false, value: 'No' },
              { key: '0', value: 'Text zero' },
            ],
          },
        },
      ],
    },
  },
};
async function setup(): Promise<
  ReturnType<typeof TestBed.createComponent<FormRules>>
> {
  const fixture = TestBed.createComponent(FormRules);
  fixture.componentRef.setInput('documents', documents);
  fixture.componentRef.setInput(
    'fields',
    presentationOutline(documents['render_schema'] as JsonObject, null).filter(
      (field) => field.scope,
    ),
  );
  fixture.componentRef.setInput('identity', 'selected');
  fixture.componentRef.setInput('targetLabel', 'Reason');
  await fixture.whenStable();
  return fixture;
}
describe('Buffered form rules', () => {
  it('requires a current resource choice and follows the canonical field nullability', async () => {
    const fixture = await setup();
    const vm = fixture.componentInstance;
    vm.update('scope', '/properties/owner');
    vm.update('operator', 'eq');
    vm.update('text', 'copied-ref');
    expect(vm.canAdd()).toBe(false);
    vm.resourcePicked({ value: 'selected-ref', label: 'Reviewer' });
    expect(vm.parsed()).toBe('selected-ref');
    fixture.componentRef.setInput('data', { changed: true });
    expect(vm.canAdd()).toBe(false);
    vm.update('scope', '/properties/amount');
    vm.update('type', 'null');
    expect(vm.parsed()).toBeUndefined();
    expect(vm.canAdd()).toBe(false);
  });
  it('guards field references and sixteen-rule bounds with typed zero, false and text values', async () => {
    const fixture = await setup();
    const vm = fixture.componentInstance;
    const emitted = vi.fn();
    vm.rulesChanged.subscribe(emitted);
    vm.update('scope', '/properties/missing');
    vm.add();
    expect(emitted).not.toHaveBeenCalled();
    for (const [field, text, value] of [
      ['amount', '۰', 0],
      ['active', 'false', false],
      ['code', '0', '0'],
    ] as const) {
      vm.update('scope', '/properties/' + field);
      vm.update('text', text);
      vm.add();
      expect(emitted.mock.lastCall?.[0][0]).toEqual({
        scope: '/properties/' + field,
        operator: 'eq',
        effect: 'show',
        value,
      });
    }
    fixture.componentRef.setInput(
      'rules',
      Array.from({ length: 16 }, () => ({
        scope: '/properties/active',
        operator: 'eq',
        effect: 'show',
        value: false,
      })),
    );
    await fixture.whenStable();
    vm.update('scope', '/properties/active');
    vm.add();
    expect(emitted).toHaveBeenCalledTimes(3);
    expect(documents['data_schema']).toEqual({
      type: 'object',
      properties: {
        amount: { type: 'integer' },
        active: { type: 'boolean' },
        code: { type: 'string' },
        owner: { type: 'string' },
        decision: { type: ['string', 'number', 'boolean'] },
      },
    });
  });
  it('retains invalid numeric text until correction or explicit discard and prevents disabled writes', async () => {
    const fixture = await setup();
    const vm = fixture.componentInstance;
    const emitted = vi.fn();
    vm.rulesChanged.subscribe(emitted);
    vm.update('scope', '/properties/amount');
    vm.update('text', '1e');
    vm.add();
    expect(vm.parsed()).toBeUndefined();
    expect(vm.draft().text).toBe('1e');
    expect(vm.pending()).toBe(true);
    expect(emitted).not.toHaveBeenCalled();
    vm.update('text', '1.5');
    expect(vm.canAdd()).toBe(false);
    fixture.componentRef.setInput('disabled', true);
    await fixture.whenStable();
    vm.update('text', '2');
    vm.discard();
    vm.add();
    expect(vm.draft().text).toBe('1.5');
    expect(emitted).not.toHaveBeenCalled();
    fixture.componentRef.setInput('disabled', false);
    await fixture.whenStable();
    vm.update('text', '٢');
    vm.add();
    expect(emitted.mock.lastCall?.[0][0].value).toBe(2);
    expect(vm.pending()).toBe(false);
    vm.update('scope', '/properties/amount');
    vm.update('text', '-');
    vm.discard();
    expect(vm.draft().scope).toBe('');
    expect(vm.pending()).toBe(false);
  });
  it('preserves exact mixed choice keys and makes presence independent of a value', async () => {
    const fixture = await setup();
    const vm = fixture.componentInstance;
    const emitted = vi.fn();
    vm.rulesChanged.subscribe(emitted);
    for (const value of [0, false, '0']) {
      vm.update('scope', '/properties/decision');
      vm.update('text', JSON.stringify(value));
      vm.add();
      expect(emitted.mock.lastCall?.[0][0].value).toBe(value);
    }
    vm.update('scope', '/properties/owner');
    expect(vm.presenceOnly()).toBe(false);
    expect(vm.draft().operator).toBe('present');
    vm.add();
    expect(emitted.mock.lastCall?.[0][0]).toMatchObject({
      scope: '/properties/owner',
      operator: 'present',
      value: null,
    });
    vm.update('scope', '/properties/owner');
    vm.update('operator', 'eq');
    vm.update('text', 'copied-ref');
    vm.add();
    expect(emitted).toHaveBeenCalledTimes(4);
  });
  it('shows readable rule ownership while preserving existing structured and unavailable rules', async () => {
    const fixture = await setup();
    const vm = fixture.componentInstance;
    const rules = [
      {
        scope: '/properties/amount',
        operator: 'ne',
        effect: 'require',
        value: 0,
      },
      {
        scope: '/properties/owner',
        operator: 'eq',
        effect: 'show',
        value: 'private-ref',
      },
      {
        scope: '/properties/missing',
        operator: 'eq',
        effect: 'hide',
        value: { retained: true },
      },
    ];
    fixture.componentRef.setInput('rules', rules);
    await fixture.whenStable();
    expect(fixture.nativeElement.textContent).toContain('Amount');
    expect(fixture.nativeElement.textContent).toContain('Reason');
    expect(fixture.nativeElement.textContent).not.toContain('/properties/');
    expect(fixture.nativeElement.textContent).not.toContain('private-ref');
    const emitted = vi.fn();
    vm.rulesChanged.subscribe(emitted);
    vm.remove(0);
    expect(emitted.mock.lastCall?.[0]).toEqual(rules.slice(1));
    expect(rules[2].value).toEqual({ retained: true });
    vm.update('scope', '/properties/code');
    vm.update('text', 'private draft');
    TestBed.inject(ActorState).reset();
    expect(vm.draft().text).toBe('');
    expect(vm.pending()).toBe(false);
  });
});
