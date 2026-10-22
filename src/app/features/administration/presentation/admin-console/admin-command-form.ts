import {
  actorReferenceLabels,
  rememberReference,
} from '../../../../shared/ui/reference-labels';
import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import type { AdminConsole } from './admin-console';
import { SchemaInput } from '../../../../shared/ui/schema-input/schema-input';
import { ReferencePicker } from '../reference-picker/reference-picker';
import { ButtonDirective } from 'primeng/button';
import { FormsModule } from '@angular/forms';
import { LocalizePipe } from '../../../../shared/ui/localize-pipe';

@Component({
  selector: 'app-admin-command-form',
  imports: [
    SchemaInput,
    ReferencePicker,
    ButtonDirective,
    FormsModule,
    LocalizePipe,
  ],
  templateUrl: './admin-command-form.html',
  styleUrl: './admin-command-form.scss',
  host: { style: 'display: contents' },
  changeDetection: ChangeDetectionStrategy.Default,
})
export class AdminCommandForm {
  readonly view =
    input.required<
      Pick<
        AdminConsole,
        | 'busy'
        | 'changeTyped'
        | 'execute'
        | 'input'
        | 'invalid'
        | 'locationLabels'
        | 'locations'
        | 'selected'
      >
    >();
  readonly labels = actorReferenceLabels();
  errors(): Record<string, string> {
    return Object.fromEntries(
      this.view()
        .invalid()
        .map((key) => [key, 'Invalid value']),
    );
  }
  pick(path: string, value: string, label: string): void {
    rememberReference(this.labels, path, value, label);
    const [location, key] = path.split('.');
    if (!this.view().locations.includes(location as 'body')) {
      return;
    }
    const field = this.view()
      .selected()
      ?.fields[location as 'body'].find((candidate) => candidate.key === key);
    if (field) {
      this.view().changeTyped(field, location as 'body', value);
    }
  }
}
