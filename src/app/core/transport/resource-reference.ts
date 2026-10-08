// References are opaque: encode the entire value as one route segment.
export function referenceSegment(reference: string): string {
  if (reference.length === 0) {
    throw new Error('A resource reference must not be empty.');
  }
  return encodeURIComponent(reference);
}
