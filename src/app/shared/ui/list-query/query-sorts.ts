import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  inject,
  Injector,
  input,
  signal,
} from '@angular/core';
import { ButtonDirective } from 'primeng/button';
import { TooltipModule } from 'primeng/tooltip';
import { Locale } from '../../../core/localization/locale';
import { SortDraft } from '../../domain/list-query';
import { ControlField } from '../control-field/control-field';
import { LocalizePipe } from '../localize-pipe';
import { SelectControl } from '../select-control/select-control';
import type { ListQueryEditor } from './list-query';

type SortFieldRow = {
  id: string;
  key: string;
};
type SortRowState = {
  id: string;
  value: string;
  rows: SortFieldRow[];
};

@Component({
  selector: 'app-query-sorts',
  imports: [
    ButtonDirective,
    TooltipModule,
    ControlField,
    LocalizePipe,
    SelectControl,
  ],
  templateUrl: './query-sorts.html',
  styleUrl: './query-sorts.scss',
  // The existing query owner keeps plain drafts and errors; render with that owner.
  changeDetection: ChangeDetectionStrategy.Default,
})
export class QuerySorts {
  readonly view =
    input.required<
      Pick<
        ListQueryEditor,
        'addSort' | 'sorts' | 'sortErrors' | 'sortFieldsId' | 'fields' | 'busy'
      >
    >();
  readonly locale = inject(Locale);
  readonly message = signal('');
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly injector = inject(Injector);
  private readonly states = new WeakMap<SortDraft, SortRowState>();
  private nextId = 0;
  private newId(): string {
    return `${this.view().sortFieldsId}-row-${this.nextId++}`;
  }
  private state(sort: SortDraft): SortRowState {
    let state = this.states.get(sort);
    if (!state) {
      state = { id: this.newId(), value: '', rows: [] };
      this.states.set(sort, state);
    }
    if (state.value !== sort.fields || !state.rows.length) {
      const remaining = [...state.rows];
      state.rows = sort.fields.split(',').map((value) => {
        const key = value.trim();
        const index = remaining.findIndex((row) => row.key === key);
        return index < 0
          ? { id: this.newId(), key }
          : remaining.splice(index, 1)[0];
      });
      state.value = sort.fields;
    }
    return state;
  }
  id(sort: SortDraft): string {
    return this.state(sort).id;
  }
  rows(sort: SortDraft): SortFieldRow[] {
    return this.state(sort).rows;
  }
  names(sort: SortDraft): string[] {
    return this.rows(sort).map((row) => row.key);
  }
  known(key: string): boolean {
    return this.view()
      .fields()
      .some((field) => field.key === key);
  }
  available(sort: SortDraft): string | undefined {
    return this.view()
      .fields()
      .find((field) => !this.names(sort).includes(field.key))?.key;
  }
  private editable(sort: SortDraft): boolean {
    return !this.view().busy() && this.view().sorts.includes(sort);
  }
  private update(
    sort: SortDraft,
    fields: SortFieldRow[],
    focus?: number,
  ): void {
    if (!this.editable(sort)) {
      return;
    }
    sort.fields = fields.map((row) => row.key).join(', ');
    const state = this.state(sort);
    state.rows = fields;
    state.value = sort.fields;
    const index = this.view().sorts.indexOf(sort);
    const errors = { ...this.view().sortErrors };
    delete errors[index];
    this.view().sortErrors = errors;
    if (focus !== undefined) {
      this.focus(index, focus);
    }
  }
  setField(sort: SortDraft, index: number, key: unknown): void {
    if (typeof key !== 'string' || !this.known(key)) {
      return;
    }
    const fields = [...this.rows(sort)];
    if (
      index < 0 ||
      index >= fields.length ||
      fields.some((field, position) => field.key === key && position !== index)
    ) {
      return;
    }
    fields[index] = { ...fields[index], key };
    this.update(sort, fields);
  }
  setDirection(sort: SortDraft, value: unknown): void {
    if (this.editable(sort) && (value === 'asc' || value === 'desc')) {
      sort.operation = value;
    }
  }
  addField(sort: SortDraft): void {
    const next = this.available(sort);
    if (next) {
      this.update(
        sort,
        [...this.rows(sort), { id: this.newId(), key: next }],
        this.names(sort).length,
      );
    }
  }
  removeField(sort: SortDraft, index: number): void {
    const fields = [...this.rows(sort)];
    if (fields.length < 2 || index < 0 || index >= fields.length) {
      return;
    }
    fields.splice(index, 1);
    this.update(sort, fields, Math.min(index, fields.length - 1));
  }
  moveField(sort: SortDraft, index: number, delta: number): void {
    const fields = [...this.rows(sort)];
    const target = index + delta;
    if (
      index < 0 ||
      index >= fields.length ||
      target < 0 ||
      target >= fields.length
    ) {
      return;
    }
    [fields[index], fields[target]] = [fields[target], fields[index]];
    this.update(sort, fields, target);
    if (this.editable(sort)) {
      this.message.set('Sort draft updated.');
    }
  }
  addSort(): void {
    if (this.view().busy() || !this.view().fields().length) {
      return;
    }
    this.view().addSort();
    this.focus(this.view().sorts.length - 1, 0);
  }
  private reorder(next: SortDraft[]): void {
    const vm = this.view();
    const errors = new Map(
      vm.sorts.map((sort, index) => [sort, vm.sortErrors[index]]),
    );
    vm.sorts = next;
    vm.sortErrors = Object.fromEntries(
      next.flatMap((sort, index) =>
        errors.get(sort) ? [[index, errors.get(sort)!]] : [],
      ),
    );
  }
  removeSort(index: number): void {
    const vm = this.view();
    if (vm.busy() || index < 0 || index >= vm.sorts.length) {
      return;
    }
    this.reorder(vm.sorts.filter((_sort, position) => position !== index));
    this.focus(Math.min(index, vm.sorts.length - 1), 0);
  }
  moveSort(index: number, delta: number): void {
    const vm = this.view();
    const target = index + delta;
    if (
      vm.busy() ||
      index < 0 ||
      index >= vm.sorts.length ||
      target < 0 ||
      target >= vm.sorts.length
    ) {
      return;
    }
    const next = [...vm.sorts];
    [next[index], next[target]] = [next[target], next[index]];
    this.reorder(next);
    this.focus(target, 0);
    this.message.set('Sort draft updated.');
  }
  private focus(group: number, field: number): void {
    afterNextRender(
      () => {
        if (!this.host.nativeElement.isConnected || this.view().busy()) {
          return;
        }
        const target =
          this.host.nativeElement.querySelector<HTMLElement>(
            `[data-query-sort="${group}"] [data-sort-field-index="${field}"] [role="combobox"]`,
          ) ??
          this.host.nativeElement.querySelector<HTMLElement>('[data-add-sort]');
        target?.focus();
      },
      { injector: this.injector },
    );
  }
}
