import { parseNumberText } from './number-text';

describe('Lossless decimal input', () => {
  it('accepts equivalent decimal notation and localized digits', () => {
    expect(parseNumberText('1.2500e2')).toBe(125);
    expect(parseNumberText(' ۱۲٫۵۰ ')).toBe(12.5);
    expect(parseNumberText('-0')).toBe(-0);
    expect(parseNumberText('0e9999999999')).toBe(0);
    expect(parseNumberText('1e-7')).toBe(0.0000001);
    expect(parseNumberText('9007199254740991')).toBe(9007199254740991);
  });
  it('rejects rounding, overflow, underflow and incomplete values', () => {
    for (const text of [
      '9007199254740993',
      '0.10000000000000000001',
      '1e-324',
      '1e999',
      '',
      '-',
      '1e',
      '01',
      'Infinity',
      'NaN',
    ]) {
      expect(parseNumberText(text), text).toBeUndefined();
    }
  });
});
