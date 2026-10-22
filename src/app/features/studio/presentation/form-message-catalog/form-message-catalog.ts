import {
  ChangeDetectionStrategy,
  Component,
  input,
  output,
} from '@angular/core';
import { TableModule } from 'primeng/table';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { MessageSummary } from '../../domain/form-message-summary';
import { LocalizePipe } from '../../../../shared/ui/localize-pipe';

@Component({
  selector: 'app-form-message-catalog',
  imports: [TableModule, CardModule, ButtonModule, LocalizePipe],
  templateUrl: './form-message-catalog.html',
  styleUrl: './form-message-catalog.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FormMessageCatalog {
  readonly messages = input.required<MessageSummary[]>();
  readonly disabled = input(false);
  readonly messageSelected = output<string>();
  readonly names: Readonly<Record<string, string>> = {
    en: 'English',
    fa: 'فارسی',
    ar: 'العربية',
  };
}
