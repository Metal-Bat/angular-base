import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  effect,
  ElementRef,
  inject,
  Injector,
  input,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ButtonDirective } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { SelectControl } from '../../../../shared/ui/select-control/select-control';
import { LocalizePipe } from '../../../../shared/ui/localize-pipe';
import type { FormBuilder } from '../form-builder/form-builder';
@Component({
  selector: 'app-form-palette',
  imports: [
    FormsModule,
    ButtonDirective,
    InputTextModule,
    SelectControl,
    LocalizePipe,
  ],
  templateUrl: './form-palette.html',
  styleUrl: './form-palette.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FormPalette {
  constructor() {
    const host = inject<ElementRef<HTMLElement>>(ElementRef);
    const injector = inject(Injector);
    effect(() => {
      const view = this.view();
      if (view.toolsOpen() && view.toolsTab() === 'components') {
        afterNextRender(
          () => {
            if (
              view.toolsOpen() &&
              view.toolsTab() === 'components' &&
              !view.readonly()
            ) {
              host.nativeElement
                .querySelector<HTMLElement>(
                  '.field-type-buttons button:not(:disabled)',
                )
                ?.focus({ preventScroll: true });
            }
          },
          { injector },
        );
      }
    });
  }
  readonly view =
    input.required<
      Pick<
        FormBuilder,
        | 'quickFieldTypes'
        | 'readonly'
        | 'toolsOpen'
        | 'toolsTab'
        | 'pending'
        | 'componentLabels'
        | 'dragPalette'
        | 'cancelDrag'
        | 'quickAdd'
        | 'paletteSearch'
        | 'paletteCategory'
        | 'categories'
        | 'filteredPalette'
      >
    >();
}
