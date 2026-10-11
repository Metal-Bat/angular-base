import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  signal,
} from '@angular/core';
import { SelectControl } from '../../../../shared/ui/select-control/select-control';
import { RouterLink } from '@angular/router';
import { LocalizePipe } from '../../../../shared/ui/localize-pipe';
import { ProcessSnapshot } from '../../domain/process-tracking';

@Component({
  selector: 'app-execution-path',
  imports: [LocalizePipe, RouterLink, SelectControl],
  templateUrl: './execution-path.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ExecutionPath {
  readonly process = input.required<ProcessSnapshot>();
  private readonly selection = signal({ process: '', workflow: '', key: '' });
  readonly selectedStep = computed(() => {
    const selection = this.selection();
    const process = this.process();
    return selection.process === process.reference &&
      selection.workflow === process.workflow &&
      process.steps.some((step) => step.key === selection.key)
      ? selection.key
      : '';
  });
  readonly steps = computed(() =>
    this.process().steps.filter(
      (step) => !this.selectedStep() || step.key === this.selectedStep(),
    ),
  );
  selectStep(value: unknown): void {
    if (
      typeof value !== 'string' ||
      (value && !this.process().steps.some((step) => step.key === value))
    ) {
      return;
    }
    this.selection.set({
      process: this.process().reference,
      workflow: this.process().workflow,
      key: value,
    });
  }
}
