import { Pipe, PipeTransform } from '@angular/core';
import { JsonValue } from '../domain/runtime-document';
import { displayValue, MISSING } from '../domain/canonical-values';
@Pipe({ name: 'valueText' })
export class ValueTextPipe implements PipeTransform {
  transform(value: JsonValue | typeof MISSING): string {
    return displayValue(value);
  }
}
