import { ButtonDirective } from 'primeng/button';
import {
  ChangeDetectionStrategy,
  Component,
  inject,
  input,
  signal,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { EditorPort } from '../../application/workspace-ports';
import { FORM_RESOURCES } from '../../../forms/bindings';
import { LocalizePipe } from '../../../../shared/ui/localize-pipe';
@Component({
  host: { class: 'console-fragment' },
  selector: 'app-request-actions',
  imports: [ButtonDirective, RouterLink, LocalizePipe],
  templateUrl: './request-actions.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RequestActions {
  readonly editor = input.required<EditorPort>();
  readonly resources = inject(FORM_RESOURCES);
  readonly reports = signal<readonly { reference: string; status: string }[]>(
    [],
  );
  async report(): Promise<void> {
    this.reports.set(await this.resources.requestReport());
  }
}
