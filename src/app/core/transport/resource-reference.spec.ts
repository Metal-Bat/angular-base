import { referenceSegment } from './resource-reference';

describe('Opaque resource references', () => {
  it('keeps slash, query, percent and Unicode inside a single segment', () => {
    expect(referenceSegment('form/v1?rev=2#% فارسی')).toBe(
      'form%2Fv1%3Frev%3D2%23%25%20%D9%81%D8%A7%D8%B1%D8%B3%DB%8C',
    );
  });

  it('rejects an empty reference instead of addressing a collection', () => {
    expect(() => referenceSegment('')).toThrow('must not be empty');
  });
});
