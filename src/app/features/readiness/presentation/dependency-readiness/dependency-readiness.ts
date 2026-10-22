import { LocalizedDateTimePipe } from '../../../../shared/ui/localized-datetime-pipe';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  effect,
  inject,
  input,
  signal,
  untracked,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { ButtonDirective } from 'primeng/button';
import { ActorState } from '../../../../core/auth/actor-state';
import { SessionContext } from '../../../../core/auth/session-context';
import { hasPermissions } from '../../../../core/permissions/area-access';
import { LocalizePipe } from '../../../../shared/ui/localize-pipe';
import { DependencyReport } from '../../domain/dependencies';
const repairs: Record<string, { route: string; permission: string }> = {
  users: { route: '/users', permission: 'admin.users.manage' },
  forms: { route: '/studio/forms', permission: 'forms.manage' },
  step_types: {
    route: '/administration/step-types',
    permission: 'workflows.manage',
  },
  workflow_versions: {
    route: '/studio/workflow-versions',
    permission: 'workflows.manage',
  },
  form_versions: { route: '/studio/form-versions', permission: 'forms.manage' },
  connections: {
    route: '/administration/integrations',
    permission: 'integrations.manage',
  },
  agent_versions: {
    route: '/administration/agents',
    permission: 'workflows.manage',
  },
  work_groups: {
    route: '/administration/groups',
    permission: 'admin.work_groups.manage',
  },
  clients: { route: '/studio/clients', permission: 'forms.manage' },
};
@Component({
  selector: 'app-dependency-readiness',
  imports: [LocalizedDateTimePipe, RouterLink, ButtonDirective, LocalizePipe],
  templateUrl: './dependency-readiness.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DependencyReadiness {
  readonly clientRelease = input('');
  readonly contextNode = input('');
  readonly reference = input.required<string>();
  readonly inspect =
    input.required<
      (ref: string, client?: string) => Promise<DependencyReport>
    >();
  readonly result = signal<DependencyReport | null>(null);
  readonly busy = signal(false);
  readonly stale = signal(true);
  readonly error = signal('');
  private readonly session = inject(SessionContext);
  private generation = 0;
  private timer?: ReturnType<typeof setTimeout>;
  constructor() {
    const release = inject(ActorState).register(() => {
      this.generation++;
      clearTimeout(this.timer);
      this.busy.set(false);
      this.stale.set(true);
      this.result.set(null);
      this.error.set('Access changed. Reload this page.');
    });
    inject(DestroyRef).onDestroy(() => {
      this.generation++;
      clearTimeout(this.timer);
      release();
    });
    effect(() => {
      this.reference();
      this.clientRelease();
      untracked(() => {
        this.generation++;
        clearTimeout(this.timer);
        this.busy.set(false);
        this.result.set(null);
        this.stale.set(true);
      });
    });
  }
  private repairKey(key: string, code: string): string {
    // Current C06 groups user-target errors under work_groups; retain its DTO and
    // use the actual stable error code to reach the existing authorized user UI.
    if (code === 'human.form.not_published') {
      return 'forms';
    }
    if (code === 'human.user.unknown') {
      return 'users';
    }
    if (code === 'human.work_group.inactive') {
      return 'work_groups';
    }
    return key;
  }
  reason(key: string, code = ''): string {
    key = this.repairKey(key, code);
    const labels: Record<string, string> = {
      forms: 'Review the form’s active state and published versions.',
      users: 'Review the current user and assignment eligibility.',
      step_types: 'Review the deployed step handler and its pinned version.',
      form_versions: 'Review the form version and task contract.',
      connections: 'Review the connection configuration and verification.',
      agent_versions: 'Review the agent version and approval policy.',
      work_groups: 'Review the current assignment and group eligibility.',
      clients: 'Review the client release and renderer capabilities.',
    };
    return (
      labels[key] ??
      'Review the workflow definition and publication requirements.'
    );
  }
  repair(key: string, code = ''): string | null {
    const target = repairs[this.repairKey(key, code)];
    const actor = this.session.snapshot();
    return target &&
      actor.status === 'authenticated' &&
      hasPermissions(actor.permissions, [target.permission])
      ? target.route
      : null;
  }
  async load(): Promise<void> {
    const generation = ++this.generation;
    this.busy.set(true);
    this.error.set('');
    this.stale.set(true);
    this.result.set(null);
    try {
      const result = await this.inspect()(
        this.reference(),
        this.clientRelease(),
      );
      if (generation !== this.generation) {
        return;
      }
      this.result.set(result);
      this.stale.set(false);
      clearTimeout(this.timer);
      this.timer = setTimeout(() => this.stale.set(true), 30000);
    } catch {
      if (generation === this.generation) {
        this.error.set('This resource is unavailable.');
      }
    } finally {
      if (generation === this.generation) {
        this.busy.set(false);
      }
    }
  }
}
