import {
  ChangeDetectionStrategy,
  Component,
  input,
  output,
} from '@angular/core';
import { SchemaInput } from '../../../../shared/ui/schema-input/schema-input';
import { LocalizePipe } from '../../../../shared/ui/localize-pipe';
import { JsonObject, JsonValue } from '../../../forms/domain/runtime-document';
@Component({
  selector: 'app-form-geometry',
  imports: [SchemaInput, LocalizePipe],
  templateUrl: './form-geometry.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FormGeometry {
  readonly node = input.required<JsonObject>();
  readonly disabled = input(false);
  readonly patch = output<{ key: string; value: JsonValue | undefined }>();
  readonly gridSchema: JsonObject = {
    type: 'object',
    additionalProperties: false,
    properties: {
      column: { type: 'integer', minimum: 1, maximum: 12, default: 1 },
      span: { type: 'integer', minimum: 1, maximum: 12, default: 12 },
      row: { type: 'integer', minimum: 1, maximum: 256, default: 1 },
    },
  };
  readonly accessibilitySchema: JsonObject = {
    type: 'object',
    additionalProperties: false,
    required: ['label'],
    properties: {
      label: { type: 'string', minLength: 1, maxLength: 255 },
      description: { type: 'string', maxLength: 1024 },
    },
  };
}
