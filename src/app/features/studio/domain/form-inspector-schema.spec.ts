import { JsonObject } from '../../../shared/domain/json-value';
import { constraintSchemaFor } from './form-inspector-schema';

describe('Applicable field constraints', () => {
  it('offers applicable bounds without changing canonical metadata', () => {
    const field = {
      type: ['number', 'null'],
      minimum: 0,
      default: false,
      retained: 'original',
    };
    const before = structuredClone(field);
    expect(
      Object.keys(constraintSchemaFor(field)['properties'] as JsonObject),
    ).toEqual(['minimum', 'maximum']);
    expect(
      Object.keys(
        constraintSchemaFor({ type: 'string' })['properties'] as JsonObject,
      ),
    ).toEqual(['minLength', 'maxLength', 'pattern']);
    expect(
      Object.keys(
        constraintSchemaFor({ type: 'array' })['properties'] as JsonObject,
      ),
    ).toEqual(['minItems', 'maxItems']);
    expect(constraintSchemaFor({ type: 'boolean' })['properties']).toEqual({});
    expect(field).toEqual(before);
  });
});
