export type QueryValue = string | number | boolean | null | QueryValue[];
export type QueryField = {
  key: string;
  label: string;
  type: 'text' | 'number' | 'boolean' | 'date' | 'datetime' | 'uuid';
  nullable?: boolean;
};
export type FilterOperation =
  | 'equal'
  | 'notEqual'
  | 'contains'
  | 'notContains'
  | 'startWith'
  | 'endsWith'
  | 'between'
  | 'isNull'
  | 'isNotNull'
  | 'gt'
  | 'gte'
  | 'lt'
  | 'lte'
  | 'in'
  | 'nin';
export type Filter = {
  field_name: string;
  operation: FilterOperation;
  value: QueryValue;
};
export type Sort = {
  field_name?: string;
  multi_field?: string[];
  operation: 'asc' | 'desc';
};
export type ListQuery = {
  page: number;
  size: number;
  filters: Filter[];
  sort_orders: Sort[];
  extras: Record<string, QueryValue>;
};
export type FilterDraft = {
  field: string;
  operation: FilterOperation;
  value: string;
  end: string;
};
export type SortDraft = { fields: string; operation: 'asc' | 'desc' };
export const emptyQuery = (): ListQuery => ({
  page: 1,
  size: 20,
  filters: [],
  sort_orders: [],
  extras: {},
});
export function operationsFor(field: QueryField): FilterOperation[] {
  const operations: FilterOperation[] = ['equal', 'notEqual', 'in', 'nin'];
  if (field.type === 'text') {
    operations.push('contains', 'notContains', 'startWith', 'endsWith');
  }
  if (['number', 'date', 'datetime'].includes(field.type)) {
    operations.push('gt', 'gte', 'lt', 'lte', 'between');
  }
  if (field.nullable) {
    operations.push('isNull', 'isNotNull');
  }
  return operations;
}
function parseValue(field: QueryField, value: string): QueryValue {
  value = String(value ?? '');
  if (!value.length) {
    throw Error('Enter a filter value.');
  }
  if (field.type === 'boolean') {
    if (!['true', 'false'].includes(value)) {
      throw Error('Choose true or false.');
    }
    return value === 'true';
  }
  if (field.type === 'number') {
    const number = Number(value);
    if (!Number.isFinite(number)) {
      throw Error('Enter a valid number.');
    }
    return number;
  }
  if (field.type === 'date' && !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    throw Error('Enter a valid date.');
  }
  if (
    field.type === 'datetime' &&
    !/^\d{4}-\d{2}-\d{2}T.*(?:Z|[+-]\d{2}:\d{2})$/.test(value)
  ) {
    throw Error('Use a datetime with a timezone.');
  }
  if (
    ['date', 'datetime'].includes(field.type) &&
    !Number.isFinite(Date.parse(value))
  ) {
    throw Error('Enter a valid date.');
  }
  if (
    field.type === 'uuid' &&
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      value,
    )
  ) {
    throw Error('Enter a valid UUID.');
  }
  return value;
}
export function compileQuery(
  fields: readonly QueryField[],
  filters: readonly FilterDraft[],
  sorts: readonly SortDraft[],
  size: number,
  extras: Record<string, QueryValue>,
  allowedExtras: readonly string[],
): ListQuery {
  if (!Number.isInteger(size) || size < 1 || size > 100) {
    throw Error('Page size must be between 1 and 100.');
  }
  if (Object.keys(extras).some((key) => !allowedExtras.includes(key))) {
    throw Error('Unsupported list option.');
  }
  const lookup = (key: string): QueryField => {
    const field = fields.find((f) => f.key === key);
    if (!field) {
      throw Error('Choose an available field.');
    }
    return field;
  };
  return {
    page: 1,
    size,
    extras: structuredClone(extras),
    filters: filters.map((draft) => {
      const field = lookup(draft.field);
      if (!operationsFor(field).includes(draft.operation)) {
        throw Error('Choose a supported filter operation.');
      }
      let value: QueryValue;
      if (['isNull', 'isNotNull'].includes(draft.operation)) {
        value = null;
      } else if (['in', 'nin'].includes(draft.operation)) {
        const values = String(draft.value)
          .split('\n')
          .filter((v) => v.length);
        if (!values.length) {
          throw Error('Enter at least one value.');
        }
        value = values.map((v) => parseValue(field, v));
      } else if (draft.operation === 'between') {
        value = [parseValue(field, draft.value), parseValue(field, draft.end)];
      } else {
        value = parseValue(field, draft.value);
      }
      return { field_name: draft.field, operation: draft.operation, value };
    }),
    sort_orders: sorts.map((draft) => {
      const names = draft.fields.split(',').map((name) => name.trim());
      names.forEach(lookup);
      if (new Set(names).size !== names.length) {
        throw Error('Sort fields must be unique.');
      }
      return names.length === 1
        ? { field_name: names[0], operation: draft.operation }
        : { multi_field: names, operation: draft.operation };
    }),
  };
}
export function queryBody(
  query: ListQuery,
  fixed: readonly Filter[] = [],
  allowedExtras: readonly string[] = [],
): Record<string, unknown> {
  if (Object.keys(query.extras).some((key) => !allowedExtras.includes(key))) {
    throw Error('Unsupported list option.');
  }
  return structuredClone({
    page: query.page,
    size: query.size,
    filters: [...fixed, ...query.filters],
    sort_orders: query.sort_orders,
    ...query.extras,
  });
}
