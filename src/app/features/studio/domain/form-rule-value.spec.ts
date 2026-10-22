import { parseRuleValue } from './form-rule-value';

describe('Typed rule comparison', () => {
  it('preserves explicit string, boolean, null and integer semantics', () => {
    expect(parseRuleValue('string', '9007199254740993')).toBe(
      '9007199254740993',
    );
    expect(parseRuleValue('boolean', 'false')).toBe(false);
    expect(parseRuleValue('null', '')).toBeNull();
    expect(parseRuleValue('integer', '۱۲۰')).toBe(120);
    expect(parseRuleValue('integer', '1.5')).toBeUndefined();
  });
  it('blocks silently rounded numeric comparisons', () => {
    for (const text of [
      '9007199254740993',
      '0.10000000000000000001',
      '1e-324',
    ]) {
      expect(parseRuleValue('number', text), text).toBeUndefined();
    }
    expect(parseRuleValue('number', '۱۲٫۵')).toBe(12.5);
  });
});
