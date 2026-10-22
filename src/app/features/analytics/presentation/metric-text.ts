import type { Locale } from '../../../core/localization/locale';
import type { MetricProjection } from '../domain/metrics';

/** Human presentation only; the time element retains the authoritative instant. */
export function metricTimestamp(
  locale: Pick<Locale, 'language' | 'calendar' | 'numbering'>,
  metric: Pick<MetricProjection, 'as_of' | 'timezone'>,
): string {
  return new Intl.DateTimeFormat(locale.language(), {
    calendar: locale.calendar(),
    numberingSystem: locale.numbering(),
    timeZone: metric.timezone,
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(new Date(metric.as_of));
}

/** Only reviewed public catalog reasons become business-facing explanations. */
export function metricUnavailableReason(
  reason: string | null | undefined,
): string {
  const reasons: Readonly<Record<string, string>> = {
    receipt_metric_not_configured:
      'Integration outcome receipts are not configured.',
    business_outcome_mapping_not_configured:
      'Business outcome mapping is not configured.',
  };
  return reason ? (reasons[reason] ?? '') : '';
}

/** Exact decoded numeric representation; changing digits never rounds a duration. */
export function metricNumber(
  locale: Pick<Locale, 'number'>,
  value: number,
  unit: MetricProjection['unit'],
): string {
  return unit === 'count'
    ? locale.number(value)
    : String(value).replace(/\d/g, (digit) => locale.number(Number(digit)));
}

/** A bucket is a civil date, not an instant in the selected event timezone. */
export function metricDate(
  locale: Pick<Locale, 'language' | 'calendar' | 'numbering'>,
  value: string,
): string {
  return new Intl.DateTimeFormat(locale.language(), {
    calendar: locale.calendar(),
    numberingSystem: locale.numbering(),
    timeZone: 'UTC',
    dateStyle: 'medium',
  }).format(new Date(value + 'T12:00:00Z'));
}
