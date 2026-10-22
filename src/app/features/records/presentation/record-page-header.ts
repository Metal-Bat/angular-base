import { MenuModule } from 'primeng/menu';
import type { MenuItem } from 'primeng/api';
import { Locale } from '../../../core/localization/locale';
import { WorkspaceNavigationService } from '../../../core/layout/workspace-navigation.service';
import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  effect,
  ElementRef,
  inject,
  Injector,
  input,
  untracked,
} from '@angular/core';
import { recordReference } from '../domain/records';
import { RouterLink } from '@angular/router';
import type { ResourcePage } from './resource-page';
import { ButtonDirective } from 'primeng/button';
import { LocalizePipe } from '../../../shared/ui/localize-pipe';

@Component({
  selector: 'app-record-page-header',
  imports: [MenuModule, RouterLink, ButtonDirective, LocalizePipe],
  templateUrl: './record-page-header.html',
  styleUrl: './resource-page.scss',
  host: { style: 'display: contents' },
  // Render with the owning OnPush view so shared state stays in sync.
  changeDetection: ChangeDetectionStrategy.Default,
})
export class RecordPageHeader {
  readonly view =
    input.required<
      Pick<
        ResourcePage,
        | 'backToList'
        | 'assignRole'
        | 'closeForm'
        | 'deleted'
        | 'download'
        | 'immutable'
        | 'remove'
        | 'resetPassword'
        | 'restore'
        | 'roleAllowed'
        | 'transfer'
        | 'actionBusy'
        | 'allowed'
        | 'busy'
        | 'canEditRow'
        | 'create'
        | 'definition'
        | 'detail'
        | 'edit'
        | 'history'
        | 'mode'
        | 'page'
        | 'report'
        | 'user'
      >
    >();
  private readonly locale = inject(Locale);
  private readonly navigation = inject(WorkspaceNavigationService);
  readonly objectTitle = computed(() => {
    const vm = this.view();
    const row = vm.detail();
    if (!row) {
      return this.locale.text(vm.definition.title);
    }
    const name = vm.user
      ? [row['first_name'], row['last_name']].filter(Boolean).join(' ')
      : (row['name'] ??
        row['file_name'] ??
        row['task_name'] ??
        row['event_type']);
    return String(
      name || row['username'] || this.locale.text(vm.definition.title),
    );
  });
  readonly status = computed(() => {
    const row = this.view().detail();
    return row?.['deleted_at']
      ? 'Deleted'
      : row?.['status']
        ? String(row['status'])
        : typeof row?.['is_active'] === 'boolean'
          ? row['is_active']
            ? 'Active'
            : 'Inactive'
          : '';
  });
  readonly extraActions = computed<MenuItem[]>(() => {
    this.locale.language();
    const vm = this.view();
    const items: MenuItem[] = [];
    if (!vm.detail()) {
      return items;
    }
    const add = (
      label: string,
      command: () => void,
      disabled: boolean,
    ): void => {
      items.push({ label: this.locale.text(label), command, disabled });
    };
    if (vm.user && !vm.deleted()) {
      if (vm.roleAllowed()) {
        add(
          'Assign role',
          () => {
            void vm.assignRole();
          },
          vm.actionBusy(),
        );
      }
      add('Reset password', () => vm.resetPassword(), vm.actionBusy());
    }
    if (vm.definition.operations.delete && !vm.deleted() && !vm.immutable()) {
      if (items.length) {
        items.push({ separator: true });
      }
      add(
        'Delete',
        () => {
          void vm.remove();
        },
        vm.actionBusy() || !vm.allowed(),
      );
    }
    if (vm.definition.operations.restore && vm.deleted()) {
      add(
        'Restore User',
        () => {
          void vm.restore();
        },
        vm.actionBusy() || !vm.allowed(),
      );
    }
    return items;
  });
  constructor() {
    const host = inject<ElementRef<HTMLElement>>(ElementRef);
    const injector = inject(Injector);
    let selected = '';
    effect(() => {
      const vm = this.view();
      const row = vm.detail();
      const reference = recordReference(row ?? {});
      const editing = vm.mode();
      if (reference && reference !== selected && !editing) {
        afterNextRender(
          () => {
            if (row === vm.detail() && !vm.mode()) {
              host.nativeElement.querySelector<HTMLElement>('h1')?.focus();
            }
          },
          { injector },
        );
      }
      selected = reference;
    });
    let release = (): void => {
      /* No identity before the authorized record loads. */
    };
    effect(() => {
      const vm = this.view();
      const row = vm.detail();
      const title = this.objectTitle();
      untracked(() => {
        release();
        release = this.navigation.present(
          row
            ? {
                title,
                collection: vm.definition.title,
                path: this.navigation.collectionPath(),
                back: async (): Promise<void> => {
                  if (vm.mode()) {
                    await vm.closeForm();
                  }
                  if (!vm.mode()) {
                    await vm.backToList();
                  }
                },
              }
            : null,
        );
      });
    });
    inject(DestroyRef).onDestroy(() => release());
  }
}
