import {
  arabicFieldTranslations,
  fieldLabel,
  fieldTranslations,
} from '../../../shared/domain/field-label';
import records from '../../records/infrastructure/record-contracts.json';
import catalogs from './resource-contracts.json';
import { Contract, fieldSpecs } from './resource-specifications';
describe('Contract field presentation', () => {
  it('uses readable labels and preserves schema titles for unknown fields', () => {
    expect(fieldLabel('is_active', 'Is Active')).toBe('Active');
    expect(fieldLabel('number', 'Number')).toBe('Version Number');
    expect(fieldLabel('api_version', 'Api Version')).toBe('API Version');
    expect(fieldLabel('custom_url', 'Custom URL')).toBe('Custom URL');
    expect(fieldLabel('request_id')).toBe('Request ID');
  });
  it('covers generated CRUD form, query and column labels with Persian translations', () => {
    for (const resource of Object.values(records)) {
      for (const field of [
        ...resource.fields,
        ...resource.createFields,
        ...resource.queryFields,
        ...resource.columns,
      ]) {
        expect(fieldTranslations[field.label], field.label).toBeTruthy();
        expect(arabicFieldTranslations[field.label], field.label).toBeTruthy();
      }
    }
    for (const resource of Object.values(catalogs)) {
      for (const field of [
        ...resource.list.queryFields,
        ...resource.list.columns,
      ]) {
        expect(fieldTranslations[field.label], field.label).toBeTruthy();
        expect(arabicFieldTranslations[field.label], field.label).toBeTruthy();
      }
      const contract = resource as unknown as Contract;
      for (const kind of ['create', 'update']) {
        for (const field of fieldSpecs(contract, kind)) {
          expect(fieldTranslations[field.title], field.title).toBeTruthy();
          expect(
            arabicFieldTranslations[field.title],
            field.title,
          ).toBeTruthy();
          expect(field.required).toBe(
            contract.schemas[kind].required.includes(field.key),
          );
          expect(contract.schemas[kind].properties[field.key]).toBeDefined();
        }
      }
    }
  });
  it('keeps canonical enum values and false defaults intact', () => {
    const schema: Contract = {
      title: 'Example',
      permission: '',
      editor: null,
      operations: {},
      schemas: {
        create: {
          required: ['is_active', 'access_mode'],
          properties: {
            is_active: { type: 'boolean', default: false, title: 'Is Active' },
            access_mode: {
              type: 'string',
              enum: ['PUBLIC', 'PRIVATE'],
              title: 'Access Mode',
            },
          },
        },
      },
    };
    const fields = fieldSpecs(schema, 'create');
    expect(fields[0].key).toBe('is_active');
    expect(fields[0].initial).toBe(false);
    expect(fields[1].options).toEqual(['PUBLIC', 'PRIVATE']);
    expect(schema.schemas['create'].properties['is_active']['title']).toBe(
      'Is Active',
    );
  });
});
