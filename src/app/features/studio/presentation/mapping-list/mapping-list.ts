import {
  ChangeDetectionStrategy,
  Component,
  inject,
  input,
  output,
} from '@angular/core';
import { ButtonDirective } from 'primeng/button';
import { LocalizePipe } from '../../../../shared/ui/localize-pipe';
import { JsonObject } from '../../../forms/domain/runtime-document';
import { Locale } from '../../../../core/localization/locale';
import { fieldLabel } from '../../../../shared/domain/field-label';
import {
  mappedTargetSchema,
  objectDestination,
} from '../../domain/object-field-mappings';
import { schemaAt } from '../../domain/mapping-fields';
import { schemaSummary } from '../../domain/mapping-schema';
import { CanvasPort } from '../../domain/workflow-authoring';
@Component({
  selector: 'app-mapping-list',
  imports: [ButtonDirective, LocalizePipe],
  templateUrl: './mapping-list.html',
  styleUrl: './mapping-list.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MappingList {
  readonly rows = input.required<readonly { id: string; edge: JsonObject }[]>();
  readonly ports = input.required<readonly CanvasPort[]>();
  readonly disabled = input(false);
  readonly inspected = input('');
  private readonly locale = inject(Locale);
  summary(schema: JsonObject): string {
    return schemaSummary(schema)
      .split(/( · | \/ )/)
      .map((part) => this.locale.text(part))
      .join('');
  }
  arrow(): string {
    return this.locale.language() === 'en' ? '←' : '→';
  }
  portLabel(value: unknown): string {
    return fieldLabel(String(value ?? ''));
  }
  sourceLabel(row: JsonObject): string {
    const labels: Record<string, string> = {
      REQUEST: 'Request data',
      CONTEXT: 'Process context',
      STEP_OUTPUT: 'Step output',
      CONSTANT: 'Constant value',
    };
    return labels[String(row['source_kind'])] ?? 'Unavailable source';
  }
  sourceSchema(row: JsonObject): JsonObject {
    if (row['source_kind'] === 'CONSTANT') {
      const value = row['constant_value'];
      return {
        type:
          value === null
            ? 'null'
            : Array.isArray(value)
              ? 'array'
              : typeof value === 'number' && Number.isInteger(value)
                ? 'integer'
                : typeof value,
      };
    }
    const root = this.schema(row['source_schema']);
    return typeof row['source_path'] === 'string'
      ? (schemaAt(root, row['source_path']) ?? root)
      : root;
  }
  readonly schema = (value: unknown): JsonObject =>
    value && typeof value === 'object' ? (value as JsonObject) : {};
  readonly destination = objectDestination;
  readonly targetSchema = mappedTargetSchema;
  readonly Number = Number;
  readonly edited = output<string>();
  readonly removed = output<string>();
  readonly moved = output<{ id: string; direction: -1 | 1 }>();
  editable(row: JsonObject): boolean {
    return this.ports().some((port) => port.key === row['target_port']);
  }
  listBinding(row: JsonObject): boolean {
    return (
      !!row['target_projection'] ||
      this.ports().some(
        (port) =>
          port.key === row['target_port'] && port.cardinality === 'LIST',
      )
    );
  }
  canMove(row: JsonObject, direction: -1 | 1): boolean {
    return this.rows().some(
      (item) =>
        item.edge['target_port'] === row['target_port'] &&
        Number(item.edge['ordinal']) === Number(row['ordinal']) + direction,
    );
  }
}
