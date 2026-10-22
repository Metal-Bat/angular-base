import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  output,
} from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { LocalizePipe } from '../../../../shared/ui/localize-pipe';
import { JsonObject } from '../../../forms/domain/runtime-document';
import { authoredNode, OutlineItem } from '../../domain/form-authoring';
import { renderOf } from '../../domain/form-editing';
@Component({
  selector: 'app-form-rule-overview',
  imports: [ButtonModule, LocalizePipe],
  templateUrl: './form-rule-overview.html',
  styleUrl: './form-rule-overview.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FormRuleOverview {
  readonly documents = input.required<JsonObject>();
  readonly items = input.required<readonly OutlineItem[]>();
  readonly disabled = input(false);
  readonly selected = input.required<readonly number[]>();
  readonly selectedChange = output<readonly number[]>();
  readonly rows = computed(() =>
    this.items().map((item) => {
      const node = authoredNode(renderOf(this.documents()), item.path);
      const rules = node['rules'];
      return {
        ...item,
        count: Array.isArray(rules) ? rules.length : 0,
        active: item.path.join('.') === this.selected().join('.'),
      };
    }),
  );
}
