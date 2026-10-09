import {
  ListQuery,
  operationsFor,
  QueryField,
  QueryValue,
} from '../../../shared/domain/list-query';

/** Frontend query model only. C04 persistence/wire binding awaits APP-BE-009. */
export type ListViewScope = {
  key: string;
  schemaVersion: number;
  fields: readonly QueryField[];
  columns: readonly string[];
  extras: readonly string[];
};
export type SavedListView = {
  name: string;
  resourceKey: string;
  schemaVersion: number;
  columns: readonly string[];
  query: Omit<ListQuery, 'page'>;
};
export class ViewRepairRequired extends Error {
  constructor(
    readonly reason: string,
    readonly field = '',
  ) {
    super('The saved view needs repair.');
  }
}
function fieldFor(scope: ListViewScope, key: string): QueryField {
  const field = scope.fields.find((candidate) => candidate.key === key);
  if (!field) {
    throw new ViewRepairRequired('field-unavailable', key);
  }
  if (/(^|_)ref(_id)?s?$/.test(key)) {
    throw new ViewRepairRequired('resource-reference-needs-resolution', key);
  }
  return field;
}
function validValue(field: QueryField, value: QueryValue): boolean {
  if (value === null || Array.isArray(value)) {
    return false;
  }
  if (field.type === 'number') {
    return typeof value === 'number' && Number.isFinite(value);
  }
  if (field.type === 'boolean') {
    return typeof value === 'boolean';
  }
  if (typeof value !== 'string' || !value.length) {
    return false;
  }
  if (field.type === 'uuid') {
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      value,
    );
  }
  if (field.type === 'date' || field.type === 'datetime') {
    return (
      Number.isFinite(Date.parse(value)) &&
      (field.type === 'date'
        ? /^\d{4}-\d{2}-\d{2}$/.test(value)
        : /^\d{4}-\d{2}-\d{2}T.*(?:Z|[+-]\d{2}:\d{2})$/.test(value))
    );
  }
  return true;
}
function validateFilters(
  filters: ListQuery['filters'],
  scope: ListViewScope,
): void {
  for (const filter of filters) {
    const field = fieldFor(scope, filter.field_name);
    if (!operationsFor(field).includes(filter.operation)) {
      throw new ViewRepairRequired('operator-unavailable', field.key);
    }
    const nullCheck =
      filter.operation === 'isNull' || filter.operation === 'isNotNull';
    const list = ['in', 'nin', 'between'].includes(filter.operation);
    const values =
      list && Array.isArray(filter.value) ? filter.value : [filter.value];
    const invalid = nullCheck
      ? filter.value !== null
      : (list &&
          (!Array.isArray(filter.value) ||
            !values.length ||
            (filter.operation === 'between' && values.length !== 2))) ||
        values.some((value) => !validValue(field, value));
    if (invalid) {
      throw new ViewRepairRequired('invalid-filter', field.key);
    }
  }
}
function validate(view: SavedListView, scope: ListViewScope): void {
  if (
    view.resourceKey !== scope.key ||
    view.schemaVersion !== scope.schemaVersion
  ) {
    throw new ViewRepairRequired('schema-changed');
  }
  if (
    !view.name.trim() ||
    view.name.length > 120 ||
    !Number.isInteger(view.query.size) ||
    view.query.size < 1 ||
    view.query.size > 100
  ) {
    throw new ViewRepairRequired('invalid-view');
  }
  if (
    new Set(view.columns).size !== view.columns.length ||
    view.columns.some((column) => !scope.columns.includes(column))
  ) {
    throw new ViewRepairRequired('column-unavailable');
  }
  validateFilters(view.query.filters, scope);
  for (const sort of view.query.sort_orders) {
    const keys = sort.multi_field ?? (sort.field_name ? [sort.field_name] : []);
    if (
      !keys.length ||
      (sort.multi_field && sort.field_name) ||
      new Set(keys).size !== keys.length ||
      !['asc', 'desc'].includes(sort.operation)
    ) {
      throw new ViewRepairRequired('invalid-sort');
    }
    keys.forEach((key) => fieldFor(scope, key));
  }
  if (
    Object.keys(view.query.extras).some(
      (key) =>
        !scope.extras.includes(key) ||
        /ref|token|password|secret|response|^page$/.test(key),
    )
  ) {
    throw new ViewRepairRequired('option-unavailable');
  }
}
export function captureListView(
  name: string,
  applied: ListQuery,
  columns: readonly string[],
  scope: ListViewScope,
): SavedListView {
  const query = {
    size: applied.size,
    filters: applied.filters,
    sort_orders: applied.sort_orders,
    extras: applied.extras,
  };
  const view = structuredClone({
    name: name.trim(),
    resourceKey: scope.key,
    schemaVersion: scope.schemaVersion,
    columns,
    query,
  });
  validate(view, scope);
  return view;
}
export function applyListView(
  view: SavedListView,
  scope: ListViewScope,
): ListQuery {
  validate(view, scope);
  return structuredClone({ ...view.query, page: 1 });
}
