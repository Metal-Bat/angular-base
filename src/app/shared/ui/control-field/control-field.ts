import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { LocalizePipe } from '../localize-pipe';

@Component({
  selector: 'app-control-field',
  imports: [LocalizePipe],
  host: {
    class: 'ui-field',
    '[class.ui-field-compact]': 'compact()',
    '[class.ui-field-inline]': 'inline()',
  },
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './control-field.html',
  styleUrl: './control-field.scss',
})
export class ControlField {
  readonly controlId = input.required<string>();
  readonly label = input.required<string>();
  readonly required = input(false);
  readonly compact = input(false);
  readonly inline = input(false);
  readonly error = input('');
  readonly hint = input('');
}
