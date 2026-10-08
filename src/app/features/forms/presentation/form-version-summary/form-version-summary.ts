import { ChangeDetectionStrategy, Component, input } from '@angular/core';

import { FormVersion } from '../../domain/form-version';

// Shared identity primitive for authoring preview and future authorized runtime views.
@Component({
  host: { class: 'console-fragment' },
  selector: 'app-form-version-summary',
  templateUrl: './form-version-summary.html',
  styleUrl: './form-version-summary.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FormVersionSummary {
  readonly version = input.required<FormVersion>();
}
