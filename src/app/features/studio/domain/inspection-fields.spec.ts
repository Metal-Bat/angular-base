import { inspectionFields, inspectionLabel } from './inspection-fields';

describe('Readable form inspection results', () => {
  it('reports explicit validation outcomes without inferring success from an empty issue list', () => {
    expect(inspectionLabel('{"valid":true}')).toBe('Validation passed');
    expect(inspectionLabel('{"valid":false}')).toBe('Validation needs changes');
    expect(inspectionLabel('{"issues":[]}')).toBe('Inspection complete');
    expect(inspectionLabel('Saved')).toBe('Saved');
  });
  it('presents nested named values and exact primitive meaning without serialized JSON', () => {
    expect(
      inspectionFields(
        JSON.stringify({
          fields: [
            {
              label: 'Title',
              maximum: 0,
              required: false,
              default_value: null,
            },
          ],
          issues: [{ code: 'hidden' }],
        }),
      ),
    ).toEqual([
      { label: 'Fields › 1 › Label', value: 'Title' },
      { label: 'Fields › 1 › Maximum', value: '0' },
      { label: 'Fields › 1 › Required', value: 'No' },
      { label: 'Fields › 1 › Default Value', value: 'No value' },
    ]);
  });
});
