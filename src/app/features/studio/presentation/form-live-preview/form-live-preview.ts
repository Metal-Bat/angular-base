import { FormPreviewContext } from '../form-preview-context/form-preview-context';
import {
  ChangeDetectionStrategy,
  Component,
  inject,
  input,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ControlField } from '../../../../shared/ui/control-field/control-field';
import { HelpPopover } from '../../../../shared/ui/help-popover/help-popover';
import { ButtonDirective } from 'primeng/button';
import { Locale } from '../../../../core/localization/locale';
import { LocalizePipe } from '../../../../shared/ui/localize-pipe';
import { SelectControl } from '../../../../shared/ui/select-control/select-control';
import { RuntimeForm } from '../../../forms/presentation/runtime-form/runtime-form';
import type { FormBuilder } from '../form-builder/form-builder';
@Component({
  selector: 'app-form-live-preview',
  imports: [
    FormPreviewContext,
    ControlField,
    HelpPopover,
    FormsModule,
    ButtonDirective,
    LocalizePipe,
    SelectControl,
    RuntimeForm,
  ],
  templateUrl: './form-live-preview.html',
  styleUrl: './form-live-preview.scss',
  host: {
    role: 'region',
    '[attr.aria-label]': 'uiLocale.text("Simulated runtime preview")',
  },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FormLivePreview {
  readonly uiLocale = inject(Locale);
  readonly view =
    input.required<
      Pick<
        FormBuilder,
        | 'previewFreshness'
        | 'previewDevice'
        | 'runtime'
        | 'pending'
        | 'queuePreview'
        | 'previewBusy'
        | 'previewError'
        | 'workspaceTab'
        | 'previewMode'
        | 'renderPreview'
        | 'data'
        | 'editSample'
        | 'purpose'
        | 'locale'
        | 'documents'
        | 'outline'
        | 'contextEpoch'
        | 'previewContextJson'
      >
    >();
}
