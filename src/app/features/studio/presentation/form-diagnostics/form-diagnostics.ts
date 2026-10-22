import {
  inspectionFields,
  inspectionLabel,
} from '../../domain/inspection-fields';
import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  computed,
  ElementRef,
  inject,
  Injector,
  input,
} from '@angular/core';
import { ButtonDirective } from 'primeng/button';
import { LocalizePipe } from '../../../../shared/ui/localize-pipe';
import { FormInteractionPreview } from '../form-interaction-preview/form-interaction-preview';
import type { FormBuilder } from '../form-builder/form-builder';
import { FormIssue, formIssues } from '../../domain/form-issues';
import { Locale } from '../../../../core/localization/locale';
@Component({
  selector: 'app-form-diagnostics',
  imports: [ButtonDirective, LocalizePipe, FormInteractionPreview],
  templateUrl: './form-diagnostics.html',
  styleUrl: './form-diagnostics.scss',
  // This existing view seam includes parent-owned plain text buffers.
  changeDetection: ChangeDetectionStrategy.Default,
})
export class FormDiagnostics {
  readonly locale = inject(Locale);
  readonly view =
    input.required<
      Pick<
        FormBuilder,
        | 'readonly'
        | 'busy'
        | 'inspect'
        | 'diagnostics'
        | 'issues'
        | 'select'
        | 'data'
        | 'selectedLabel'
        | 'pending'
        | 'documents'
        | 'outline'
        | 'workspaceTab'
        | 'previewMode'
        | 'toolsTab'
        | 'toolsOpen'
        | 'selected'
      >
    >();
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly injector = inject(Injector);
  readonly rows = computed(() => {
    const view = this.view();
    return formIssues(view.diagnostics(), view.documents(), view.outline());
  });
  readonly inspection = computed(() =>
    inspectionFields(this.view().diagnostics()),
  );
  readonly resultLabel = computed(() =>
    inspectionLabel(this.view().diagnostics()),
  );
  readonly errors = computed(
    () => this.rows().filter((row) => row.severity === 'Error').length,
  );
  readonly warnings = computed(
    () => this.rows().filter((row) => row.severity === 'Warning').length,
  );
  goToIssue(issue: FormIssue): void {
    const view = this.view();
    if (issue.path && !view.select(issue.path)) {
      return;
    }
    view.workspaceTab.set(issue.mode);
    view.previewMode.set(false);
    if (issue.path) {
      view.toolsTab.set('properties');
      view.toolsOpen.set(true);
    }
    afterNextRender(
      () => {
        if (view.workspaceTab() !== issue.mode) {
          return;
        }
        const page = this.host.nativeElement.closest('app-form-builder');
        page
          ?.querySelector<HTMLElement>('.field-card-selected')
          ?.scrollIntoView?.({ block: 'nearest' });
        const selector = issue.path
          ? '#field-label:not(:disabled)'
          : issue.mode === 'languages'
            ? '#form-translations-title'
            : '#form-settings-title';
        const target =
          page?.querySelector<HTMLElement>(selector) ??
          page?.querySelector<HTMLElement>('.form-properties h2');
        target?.focus({ preventScroll: true });
        target?.scrollIntoView?.({ block: 'nearest' });
      },
      { injector: this.injector },
    );
  }
}
