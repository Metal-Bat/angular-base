import {
  ChangeDetectionStrategy,
  Component,
  computed,
  ElementRef,
  inject,
  input,
} from '@angular/core';
import { ButtonDirective } from 'primeng/button';
import { MenuModule } from 'primeng/menu';
import { LocalizePipe } from '../localize-pipe';
export type CommandMenuItem = {
  label: string;
  command: () => void;
  disabled?: boolean;
};
/** Public presentation seam. The caller owns authorization and every command. */
@Component({
  selector: 'app-menu-button',
  imports: [ButtonDirective, MenuModule, LocalizePipe],
  templateUrl: './menu-button.html',
  styleUrl: './menu-button.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MenuButton {
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  focus(): void {
    const trigger =
      this.host.nativeElement.querySelector<HTMLButtonElement>('button');
    if (trigger?.isConnected && !trigger.disabled) {
      trigger.focus();
    }
  }
  readonly label = input.required<string>();
  readonly disabled = input(false);
  readonly items = input.required<readonly CommandMenuItem[]>();
  readonly model = computed(() => [...this.items()]);
}
