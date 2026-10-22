import {
  ChangeDetectionStrategy,
  Component,
  input,
  output,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ButtonDirective } from 'primeng/button';
import { InputText } from 'primeng/inputtext';
import { JsonObject } from '../../../forms/domain/runtime-document';
import { LocalizePipe } from '../../../../shared/ui/localize-pipe';
import { SelectControl } from '../../../../shared/ui/select-control/select-control';
@Component({
  selector: 'app-interface-outcomes',
  imports: [
    FormsModule,
    ButtonDirective,
    InputText,
    LocalizePipe,
    SelectControl,
  ],
  templateUrl: './interface-outcomes.html',
  styleUrl: './interface-outcomes.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InterfaceOutcomes {
  readonly rows = input.required<readonly { name: string; step: string }[]>();
  readonly finishes = input.required<readonly JsonObject[]>();
  readonly disabled = input(false);
  readonly edited = output<{
    index: number;
    key: 'name' | 'step';
    value: string;
  }>();
  readonly added = output<void>();
  readonly removed = output<number>();
  isFinish(key: string): (step: JsonObject) => boolean {
    return (step) => step['key'] === key;
  }
}
