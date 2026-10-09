import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
} from '@angular/core';
import { ReadinessPanel } from '../../../readiness/presentation/readiness-panel/readiness-panel';
import { ReadinessCheck } from '../../../readiness/domain/readiness';
import { LocalizePipe } from '../../../../shared/ui/localize-pipe';
import type { WorkflowBoard } from './workflow-board';
import { RouterLink } from '@angular/router';
import { ButtonDirective } from 'primeng/button';

@Component({
  selector: 'app-workflow-diagnostics',
  imports: [ReadinessPanel, LocalizePipe, ButtonDirective, RouterLink],
  templateUrl: './workflow-diagnostics.html',
  styleUrl: './workflow-board.scss',
  host: { style: 'display: contents' },
  // Render with the owning OnPush view so shared state stays in sync.
  changeDetection: ChangeDetectionStrategy.Default,
})
export class WorkflowDiagnostics {
  readonly view =
    input.required<
      Pick<
        WorkflowBoard,
        'diagnostics' | 'issues' | 'select' | 'validate' | 'busy' | 'dirty'
      >
    >();
  readonly message = computed(() => {
    const value = this.view().diagnostics();
    return [
      'Workspace saved. This is not an executable graph.',
      'Promoted. Publication is a separate explicit action.',
      'Published immutable workflow version',
      'Duplicated steps require validation of external dependencies.',
    ].includes(value)
      ? value
      : '';
  });
  readonly checks = computed<readonly ReadinessCheck[]>(() => {
    const view = this.view();
    let valid: boolean | null = null;
    try {
      const result = JSON.parse(view.diagnostics()) as { valid?: unknown };
      valid = typeof result.valid === 'boolean' ? result.valid : null;
    } catch {
      /* No graph validation result was received. */
    }
    const blocked = valid === false || view.issues().length > 0;
    return [
      {
        key: 'graph.structure',
        label: 'Graph structure',
        category: 'definition',
        required: true,
        status: blocked ? 'blocked' : valid === true ? 'ready' : 'unknown',
        reason: blocked
          ? 'Resolve the reported graph issues and validate again.'
          : valid === true
            ? 'Graph validation passed.'
            : 'Readiness has not been checked.',
      },
    ];
  });
}
