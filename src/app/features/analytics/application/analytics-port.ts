import { MetricProjection } from '../domain/metrics';
export type MetricKey =
  | 'submitted_requests'
  | 'active_requests'
  | 'available_work'
  | 'claimed_work'
  | 'overdue_work'
  | 'terminal_duration'
  | 'correction_frequency'
  | 'integration_outcomes'
  | 'business_outcomes';
export type MetricQuery = {
  metric_key: MetricKey;
  start_date: string;
  end_date: string;
  timezone: string;
  dimension: 'none' | 'status';
  granularity: 'day';
};
export type MetricDefinition = {
  metric_key: MetricKey;
  population: string;
  unit: 'count' | 'seconds';
  availability: 'available' | 'unavailable';
  reason?: string | null;
  timestamp: string | null;
  version: 1;
};
export type AnalyticsPort = {
  catalog(): Promise<MetricDefinition[]>;
  query(body: MetricQuery): Promise<MetricProjection>;
};
