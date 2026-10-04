export function safeReturnPath(value: string | null): string | null {
  if (
    !value ||
    !/^\/(operations|studio|administration)(\/|\?|$)/.test(value) ||
    value.includes('\\') ||
    [...value].some((character) => character.charCodeAt(0) <= 32)
  ) {
    return null;
  }
  try {
    const decoded = decodeURIComponent(value);
    if (
      decoded.includes('\\') ||
      /(^|\/)\.\.?($|\/)/.test(decoded) ||
      [...decoded].some((character) => character.charCodeAt(0) < 32)
    ) {
      return null;
    }
    const url = new URL(value, 'https://workspace.invalid');
    return url.origin === 'https://workspace.invalid'
      ? url.pathname + url.search
      : null;
  } catch {
    return null;
  }
}
