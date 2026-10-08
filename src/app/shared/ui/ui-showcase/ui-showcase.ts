import { FieldWrapper } from '../field-wrapper/field-wrapper';
import {
  ChangeDetectionStrategy,
  Component,
  inject,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { TableModule } from 'primeng/table';
import { Feedback } from '../../../core/feedback/feedback';
import { LocalizePipe } from '../localize-pipe';
@Component({
  selector: 'app-ui-showcase',
  imports: [
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    ButtonModule,
    DialogModule,
    InputTextModule,
    TableModule,
    LocalizePipe,
    FieldWrapper,
  ],
  templateUrl: './ui-showcase.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UiShowcase {
  readonly feedback = inject(Feedback);
  readonly name = signal('');
  readonly department = signal('');
  readonly preview = signal(false);
  readonly rows = [{ name: 'Example', status: 'Ready' }];
  async confirm(): Promise<void> {
    const approved = await this.feedback.confirm(
      'Unsaved changes will be lost. Continue?',
    );
    if (approved) {
      this.name.set('');
      this.department.set('');
    }
  }
}
