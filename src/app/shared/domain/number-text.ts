import { latinDigits } from './calendar-value';

/** Accept decimal text only when its JSON serialization preserves that value. */
export function parseNumberText(text: string): number | undefined {
  const normalized = latinDigits(text.trim()).replaceAll('٫', '.');
  if (!/^-?(?:0|[1-9]\d*)(?:\.\d+)?(?:[eE][+-]?\d+)?$/.test(normalized)) {
    return undefined;
  }
  const value = Number(normalized);
  return Number.isFinite(value) &&
    decimalIdentity(normalized) === decimalIdentity(String(value))
    ? value
    : undefined;
}

function decimalIdentity(text: string): string {
  const [mantissa, exponent = '0'] = text.toLowerCase().split('e');
  const [integer, fraction = ''] = mantissa.split('.');
  const digits = (integer + fraction).replace('-', '').replace(/^0+/, '');
  if (!digits) {
    return '0';
  }
  const coefficient = digits.replace(/0+$/, '');
  const power =
    Number(exponent) - fraction.length + digits.length - coefficient.length;
  return (text.startsWith('-') ? '-' : '') + coefficient + 'e' + power;
}
