import { fieldLabel } from '../../../shared/domain/field-label';
import { ApiOperationId } from '../../../core/transport/api-types';
import { endpoints } from '../../../core/transport/generated/operations';
import { JsonObject } from '../../forms/domain/runtime-document';
import { FieldSpec, ResourceKey, ResourceSpec } from '../domain/authoring';
import contracts from './resource-contracts.json';
export type Contract = {
  title: string;
  list?: NonNullable<ResourceSpec['list']>;
  permission: string;
  editor: ResourceSpec['editor'];
  operations: Record<string, string>;
  schemas: Record<
    string,
    { required: string[]; properties: Record<string, JsonObject> }
  >;
};
export const specifications = contracts as unknown as Record<
  ResourceKey,
  Contract
>;
export function operation(value: string | undefined): ApiOperationId {
  if (!value || !(value in endpoints)) {
    throw Error('Unsupported authoring command');
  }
  return value as ApiOperationId;
}
export function fieldSpecs(contract: Contract, kind: string): FieldSpec[] {
  const shape = contract.schemas[kind];
  return Object.entries(shape?.properties ?? {}).map(([key, source]) => {
    const alternatives = Array.isArray(source['anyOf'])
      ? (source['anyOf'] as JsonObject[])
      : [];
    const schema =
      alternatives.find((item) => item['type'] !== 'null') ?? source;
    const type = schema['type'];
    return {
      key,
      title: fieldLabel(key, String(source['title'] ?? '')),
      type:
        type === 'boolean'
          ? 'boolean'
          : type === 'integer' || type === 'number'
            ? 'number'
            : type === 'string'
              ? 'text'
              : 'json',
      nullable: alternatives.some((item) => item['type'] === 'null'),
      required: shape.required.includes(key),
      options: Array.isArray(schema['enum']) ? schema['enum'].map(String) : [],
      initial: source['default'],
      schema,
    };
  });
}
