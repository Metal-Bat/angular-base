import {
  ChangeDetectionStrategy,
  Component,
  input,
  output,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { ControlField } from '../../../../shared/ui/control-field/control-field';
import { LocalizePipe } from '../../../../shared/ui/localize-pipe';
import { JsonObject } from '../../../forms/domain/runtime-document';

@Component({
  selector: 'app-agent-instructions',
  imports: [
    FormsModule,
    InputTextModule,
    TextareaModule,
    ControlField,
    LocalizePipe,
  ],
  templateUrl: './agent-instructions.html',
  styleUrl: './agent-instructions.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AgentInstructions {
  readonly value = input.required<JsonObject>();
  readonly disabled = input(false);
  readonly readonly = input(false);
  readonly errors = input<Record<string, string>>({});
  readonly fieldChange = output<{ key: string; value: string }>();
  change(key: string, value: string): void {
    if (!this.disabled() && !this.readonly()) {
      this.fieldChange.emit({ key, value });
    }
  }
}
