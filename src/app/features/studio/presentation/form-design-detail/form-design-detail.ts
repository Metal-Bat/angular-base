import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
} from '@angular/core';
import { LocalizePipe } from '../../../../shared/ui/localize-pipe';
import { JsonObject } from '../../../../shared/domain/json-value';

@Component({
  selector: 'app-form-design-detail',
  imports: [LocalizePipe],
  template: `
    <span class="detail" [attr.data-design-detail]="category()">
      @switch (category()) {
        @case ('file') {
          <span class="file-target">
            <i
              [class]="kind() === 'media' ? 'pi pi-image' : 'pi pi-paperclip'"
            ></i>
            <span>{{ 'Upload attachment' | localize }}</span>
            @if (accepted()) {
              <small>{{ accepted() }}</small>
            }
          </span>
        }
        @case ('collection') {
          <span
            class="collection-head"
            [style.--columns]="Math.max(1, childLabels().length)"
          >
            @for (child of childLabels(); track $index) {
              <span>{{ child }}</span>
            } @empty {
              <span>{{ 'Add a field.' | localize }}</span>
            }
          </span>
          <span class="collection-row"
            ><i class="pi pi-plus"></i>{{ 'Add row' | localize }}</span
          >
        }
        @case ('layout') {
          <span class="layout-kind"
            ><i class="pi pi-objects-column"></i>{{ type() | localize }}</span
          >
        }
        @case ('calculated') {
          <span class="calculation"
            ><i class="pi pi-calculator"></i
            >{{ 'Calculated value' | localize }}</span
          >
        }
        @case ('display') {
          <span>{{ label() }}</span>
        }
        @case ('action') {
          <span class="action-shape">{{ label() }}</span>
        }
      }
    </span>
  `,
  styles: `
    :host,
    .detail {
      display: block;
      min-inline-size: 0;
    }
    .file-target {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.6rem;
      padding: 1.25rem 0.75rem;
      border: 1px dashed var(--console-input-border);
      border-radius: 0.5rem;
    }
    .file-target > i {
      font-size: 1.5rem;
    }
    small {
      overflow-wrap: anywhere;
    }
    .collection-head {
      display: grid;
      grid-template-columns: repeat(var(--columns), minmax(0, 1fr));
      border: 1px solid var(--console-input-border);
      border-radius: 0.5rem 0.5rem 0 0;
    }
    .collection-head > span {
      padding: 0.65rem;
      overflow-wrap: anywhere;
    }
    .collection-row,
    .layout-kind,
    .calculation {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.75rem;
    }
    .collection-row {
      border: 1px solid var(--console-input-border);
      border-block-start: 0;
      border-radius: 0 0 0.5rem 0.5rem;
    }
    .action-shape {
      display: inline-block;
      padding: 0.65rem 1rem;
      background: var(--console-accent);
      color: var(--console-on-accent);
      border-radius: 0.5rem;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
/** Passive authoring presentation; runtime owns answers and file transfers. */
export class FormDesignDetail {
  readonly kind = input.required<string>();
  readonly label = input.required<string>();
  readonly type = input.required<string>();
  readonly options = input<JsonObject>({});
  readonly childLabels = input<readonly string[]>([]);
  readonly Math = Math;
  readonly accepted = computed(
    () =>
      (this.options()['allowed_mime_types'] as string[] | undefined)?.join(
        ', ',
      ) ?? '',
  );
  readonly category = computed(() => {
    const kind = this.kind();
    if (['attachment_collection', 'media'].includes(kind)) {
      return 'file';
    }
    if (['table', 'repeater'].includes(kind)) {
      return 'collection';
    }
    return ['vertical', 'horizontal', 'grid'].includes(kind) ? 'layout' : kind;
  });
}
