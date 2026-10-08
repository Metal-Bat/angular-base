import { fieldLabel } from '../../domain/field-label';
import {
  fieldChanges,
  presentedFields,
} from '../../domain/record-presentation';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
} from '@angular/core';
import { Locale } from '../../../core/localization/locale';
import { LocalizePipe } from '../localize-pipe';

@Component({
  selector: 'app-record-summary',
  imports: [LocalizePipe, TableModule, TagModule],
  templateUrl: './record-summary.html',
  styleUrl: './record-summary.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RecordSummary {
  private readonly locale = inject(Locale);
  readonly record = input.required<Readonly<Record<string, unknown>>>();
  readonly title = input.required<string>();
  readonly icon = input('pi pi-file');
  readonly caption = input('Record overview');
  readonly displayTitle = computed(() => {
    if (this.isHistory()) {
      const operation = String(this.record()['operation'] ?? '').toLowerCase();
      const titles: Readonly<Record<string, string>> = {
        restore: 'Record restored',
        update: 'Record updated',
        create: 'Record created',
        delete: 'Record deleted',
        soft_delete: 'Record deleted',
      };
      return this.locale.text(
        titles[operation] ?? fieldLabel(operation || 'History'),
      );
    }
    return this.record()['number'] !== undefined &&
      this.title() === String(this.record()['number'])
      ? this.locale.text('Version') + ' ' + this.record()['number']
      : this.title();
  });
  readonly status = computed(() => {
    const row = this.record();
    return row['deleted_at']
      ? 'Deleted'
      : row['status']
        ? String(row['status'])
        : typeof row['is_active'] === 'boolean'
          ? row['is_active']
            ? 'Active'
            : 'Inactive'
          : '';
  });
  readonly subtitle = computed(() => {
    const row = this.record();
    return String(
      this.isHistory()
        ? row['reason'] || ''
        : row['description'] || row['email'] || row['code'] || '',
    );
  });
  readonly isHistory = computed(
    () =>
      Object.hasOwn(this.record(), 'from_values') ||
      Object.hasOwn(this.record(), 'to_values'),
  );
  readonly overview = computed(() =>
    presentedFields(
      Object.fromEntries(
        Object.entries(this.record()).filter(
          ([key]) =>
            !['from_values', 'to_values'].includes(key) && !key.endsWith('_at'),
        ),
      ),
    ).map((entry) => ({
      ...entry,
      label: this.pathLabel(entry.path),
      empty: entry.value === null,
      value: this.value(entry.value),
    })),
  );
  readonly activity = computed(() =>
    Object.entries(this.record())
      .filter(([key]) => key.endsWith('_at'))
      .map(([key, value]) => ({
        key,
        label: fieldLabel(key),
        empty: value === null,
        value: this.value(value, true),
      })),
  );
  readonly sections = computed(() => [
    { title: 'Overview', entries: this.overview() },
    { title: 'Activity', entries: this.activity() },
  ]);
  readonly changes = computed(() =>
    fieldChanges(this.record()['from_values'], this.record()['to_values']).map(
      (change) => ({
        ...change,
        label: this.pathLabel(change.path),
        beforeText: change.beforePresent
          ? this.value(change.before)
          : this.locale.text('Not present'),
        afterText: change.afterPresent
          ? this.value(change.after)
          : this.locale.text('Not present'),
        kind: !change.beforePresent
          ? 'Added'
          : !change.afterPresent
            ? 'Removed'
            : 'Changed',
      }),
    ),
  );
  private pathLabel(path: readonly string[]): string {
    return path
      .map((key) =>
        /^\d+$/.test(key)
          ? '#' + (Number(key) + 1)
          : this.locale.text(fieldLabel(key)),
      )
      .join(' · ');
  }
  value(value: unknown, date = false): string {
    if (date && typeof value === 'string') {
      const instant = new Date(value);
      if (Number.isFinite(instant.getTime())) {
        return (
          new Intl.DateTimeFormat(this.locale.language(), {
            dateStyle: 'medium',
            timeStyle: 'short',
            timeZone: 'UTC',
            calendar: 'gregory',
          }).format(instant) + ' UTC'
        );
      }
    }
    if (typeof value === 'boolean') {
      return this.locale.text(value ? 'Yes' : 'No');
    }
    if (Array.isArray(value)) {
      return value.length
        ? value.map((item) => this.value(item)).join(', ')
        : this.locale.text('Empty list');
    }
    if (value === null) {
      return this.locale.text('No value');
    }
    if (value === '') {
      return this.locale.text('Empty text');
    }
    return typeof value === 'object'
      ? this.locale.text('Empty object')
      : String(value ?? '—');
  }
}
