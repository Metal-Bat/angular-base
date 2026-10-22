import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  input,
  viewChild,
} from '@angular/core';
import type { ResourcePage } from './resource-page';
import { RecordSummary } from '../../../shared/ui/record-summary/record-summary';
import { DialogModule } from 'primeng/dialog';
import { ListQueryEditor } from '../../../shared/ui/list-query/list-query';
import { RecordTable } from '../../../shared/ui/record-table/record-table';
import { LocalizePipe } from '../../../shared/ui/localize-pipe';

@Component({
  selector: 'app-record-history-dialog',
  imports: [
    RecordSummary,
    DialogModule,
    ListQueryEditor,
    RecordTable,
    LocalizePipe,
  ],
  templateUrl: './record-history-dialog.html',
  styleUrl: './resource-page.scss',
  host: { style: 'display: contents' },
  // Render with the owning OnPush view so shared state stays in sync.
  changeDetection: ChangeDetectionStrategy.Default,
})
export class RecordHistoryDialog {
  private readonly content = viewChild<ElementRef<HTMLElement>>('historyBody');
  focusContents(): void {
    const content = this.content()?.nativeElement;
    if (
      content &&
      !content
        .closest('[role="dialog"]')
        ?.contains(content.ownerDocument.activeElement)
    ) {
      content
        .querySelector<HTMLElement>(
          'button:not(:disabled), [tabindex="0"], input:not(:disabled)',
        )
        ?.focus();
    }
  }
  readonly view =
    input.required<
      Pick<
        ResourcePage,
        | 'actionBusy'
        | 'closeHistory'
        | 'historyDefinition'
        | 'historyDetail'
        | 'historyModal'
        | 'historyPage'
        | 'historyPageTo'
        | 'historyQuery'
        | 'loadHistory'
        | 'modalError'
      >
    >();
}
