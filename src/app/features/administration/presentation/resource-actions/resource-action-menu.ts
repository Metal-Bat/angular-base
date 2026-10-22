import type { MenuItem } from 'primeng/api';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  output,
} from '@angular/core';
import { MenuModule } from 'primeng/menu';
import { ButtonDirective } from 'primeng/button';
import { Locale } from '../../../../core/localization/locale';
import { LocalizePipe } from '../../../../shared/ui/localize-pipe';
import type { AdminCommand } from '../../domain/admin-command';
@Component({
  selector: 'app-resource-action-menu',
  imports: [MenuModule, ButtonDirective, LocalizePipe],
  templateUrl: './resource-action-menu.html',
  host: { style: 'display: contents' },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ResourceActionMenu {
  readonly actions = input.required<readonly AdminCommand[]>();
  readonly additional = input<readonly MenuItem[]>([]);
  readonly tools = input(false);
  readonly disabled = input(false);
  readonly chosen = output<AdminCommand>();
  private readonly locale = inject(Locale);
  readonly items = computed(() => {
    this.locale.language();
    return [
      ...this.actions().map((action) => ({
        label: this.locale.text(action.title),
        icon: action.mutation ? 'pi pi-bolt' : 'pi pi-eye',
        command: (): void => {
          if (!this.disabled()) {
            this.chosen.emit(action);
          }
        },
      })),
      ...this.additional(),
    ];
  });
}
