import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { SessionContext } from '../../../core/auth/session-context';
import { hasPermissions } from '../../../core/permissions/area-access';
import { LocalizePipe } from '../localize-pipe';
@Component({
  selector: 'app-repair-return',
  imports: [RouterLink, LocalizePipe],
  templateUrl: './repair-return.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RepairReturn {
  private readonly route = inject(ActivatedRoute, { optional: true });
  private readonly query = this.route
    ? toSignal(this.route.queryParamMap, {
        initialValue: this.route.snapshot.queryParamMap,
      })
    : (): null => null;
  private readonly session = inject(SessionContext);
  readonly context = computed(() => {
    const actor = this.session.snapshot();
    const query = this.query();
    const ref = query?.get('repair_definition');
    return actor.status === 'authenticated' &&
      hasPermissions(actor.permissions, ['workflows.manage']) &&
      ref &&
      ref.length <= 512
      ? {
          selected: ref,
          repair_node: query?.get('repair_node')?.slice(0, 256) ?? '',
          client_release: query?.get('repair_client')?.slice(0, 512) ?? '',
        }
      : null;
  });
}
