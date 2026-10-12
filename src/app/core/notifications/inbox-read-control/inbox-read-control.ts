import {
  ChangeDetectionStrategy,
  Component,
  inject,
  input,
  output,
} from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { LocalizePipe } from '../../../shared/ui/localize-pipe';
import { InboxReadAll } from '../inbox-read-all';

@Component({
  selector: 'app-inbox-read-control',
  imports: [ButtonModule, LocalizePipe],
  templateUrl: './inbox-read-control.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InboxReadControl {
  readonly action = inject(InboxReadAll);
  readonly disabled = input(false);
  readonly started = output<void>();
  async run(): Promise<void> {
    if (this.disabled() || this.action.busy()) {
      return;
    }
    this.started.emit();
    await this.action.run();
  }
}
