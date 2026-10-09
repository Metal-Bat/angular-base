import { JsonObject } from '../../forms/domain/runtime-document';
import {
  dateMillis,
  validateZone,
  zonedDate,
} from '../../calendar/domain/calendar-dates';
import catalog from './metric-catalog.json';
export const metricCatalog = catalog;
export type MetricBucket = {
  date: string;
  value: number | null;
  population_count: number;
  sample_count: number;
  unknown_count: number;
};
export type MetricProjection = {
  metric_key: string;
  unit: 'count' | 'seconds';
  availability: 'available' | 'unavailable';
  version: 1;
  generated_at: string;
  as_of: string;
  timezone: string;
  total_value: number | null;
  population_count: number | null;
  sample_count: number | null;
  unknown_count: number | null;
  series: readonly { key: string; buckets: readonly MetricBucket[] }[];
  drilldown: { route_key: 'requests' | 'work_items'; query: JsonObject } | null;
};
const object = (value: unknown): Record<string, unknown> => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw Error('Invalid metric response');
  }
  return value as Record<string, unknown>;
};
function numeric(value: unknown, count = false): number | null {
  if (value === null || value === undefined) {
    return null;
  }
  if (
    typeof value !== 'number' ||
    !Number.isFinite(value) ||
    value < 0 ||
    (count && !Number.isSafeInteger(value))
  ) {
    throw Error('Invalid metric value');
  }
  return value;
}
export function metricWindow(
  start: string,
  end: string,
  timezone: string,
): void {
  validateZone(timezone);
  const days = (dateMillis(end) - dateMillis(start)) / 86400000;
  if (days < 1 || days > 366) {
    throw Error('Metric range must be between one and 366 days');
  }
}
/** Projects only frozen C10 fields; no SQL, arbitrary href or computed page totals. */
export function readMetric(input: unknown): MetricProjection {
  const row = object(input);
  const definition = metricCatalog.find(
    (metric) => metric.metric_key === row['metric_key'],
  );
  if (
    !definition ||
    row['version'] !== 1 ||
    row['unit'] !== definition.unit ||
    !['available', 'unavailable'].includes(String(row['availability']))
  ) {
    throw Error('Unsupported metric response');
  }
  const zone = String(row['timezone']);
  for (const key of ['generated_at', 'as_of']) {
    zonedDate(String(row[key]), zone);
  }
  const series = row['series'] ?? [];
  if (!Array.isArray(series) || series.length > 8) {
    throw Error('Invalid metric series');
  }
  const projected = series.map((entry) => {
    const serie = object(entry);
    const buckets = serie['buckets'];
    if (
      typeof serie['key'] !== 'string' ||
      !Array.isArray(buckets) ||
      buckets.length > 366
    ) {
      throw Error('Invalid metric buckets');
    }
    const dates = new Set<string>();
    return {
      key: serie['key'],
      buckets: buckets.map((rawBucket) => {
        const bucket = object(rawBucket);
        const date = String(bucket['date']);
        dateMillis(date);
        if (dates.has(date)) {
          throw Error('Duplicate metric bucket');
        }
        dates.add(date);
        const count = (key: string): number => {
          const value = numeric(bucket[key], true);
          if (value === null) {
            throw Error('Missing metric count');
          }
          return value;
        };
        return {
          date,
          value: numeric(bucket['value'], definition.unit === 'count'),
          population_count: count('population_count'),
          sample_count: count('sample_count'),
          unknown_count: count('unknown_count'),
        };
      }),
    };
  });
  let drilldown: MetricProjection['drilldown'] = null;
  if (row['drilldown']) {
    const descriptor = object(row['drilldown']);
    const route = descriptor['route_key'];
    if (route !== 'requests' && route !== 'work_items') {
      throw Error('Unsupported metric destination');
    }
    const query = object(descriptor['query']);
    if (JSON.stringify(query).length > 32768) {
      throw Error('Metric query is too large');
    }
    drilldown = {
      route_key: route,
      query: structuredClone(query) as JsonObject,
    };
  }
  return {
    metric_key: definition.metric_key,
    version: 1,
    unit: definition.unit as 'count' | 'seconds',
    availability: row['availability'] as 'available' | 'unavailable',
    timezone: zone,
    generated_at: String(row['generated_at']),
    as_of: String(row['as_of']),
    total_value: numeric(row['total_value'], definition.unit === 'count'),
    population_count: numeric(row['population_count'], true),
    sample_count: numeric(row['sample_count'], true),
    unknown_count: numeric(row['unknown_count'], true),
    series: projected,
    drilldown,
  };
}
