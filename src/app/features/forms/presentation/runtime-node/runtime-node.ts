import { RuntimeCollection } from '../runtime-collection/runtime-collection';
import { RuntimeField } from './runtime-field';
import { parseNumberText } from '../../../../shared/domain/number-text';
import { nodeDescription } from '../../domain/node-description';
import { nodeLabel } from '../../domain/node-label';
import { AttachmentControl } from '../attachment-control/attachment-control';
import { FORM_COLLECTIONS, FORM_RESOURCES } from '../../bindings';
import type { FormCollectionEditor } from '../../application/form-resources';
import {
  fieldSchema,
  keysAt,
  rowPointer,
  rowValue,
  writableScope,
} from '../../domain/row-values';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  forwardRef,
  inject,
  input,
  output,
} from '@angular/core';
import { Locale } from '../../../../core/localization/locale';
import {
  JsonObject,
  JsonValue,
  RenderNode,
  RuntimeDocument,
} from '../../domain/runtime-document';
import {
  displayValue,
  FieldEdit,
  MISSING,
} from '../../domain/canonical-values';
import { isLayout } from '../../domain/primitive-registry';
import { placementInstance } from '../../domain/placement-instance';
import { gridPlacement } from '../../domain/grid-placement';
import { layoutColumns } from '../../domain/layout-columns';
@Component({
  host: {
    class: 'console-fragment',
    '[attr.data-field-pointer]': 'node().scope ? pointer() : null',
    '[style.display]': 'state()["visible"] === false ? "none" : null',
  },
  selector: 'app-runtime-node',
  imports: [
    RuntimeField,
    RuntimeCollection,
    forwardRef(() => RuntimeNode),
    AttachmentControl,
  ],
  templateUrl: './runtime-node.html',
  styleUrl: './runtime-node.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RuntimeNode {
  readonly node = input.required<RenderNode>();
  readonly document = input.required<RuntimeDocument>();
  readonly data = input.required<JsonObject>();
  readonly path = input('/root');
  readonly renderRoot = input<RenderNode | null>(null);
  readonly instance = computed(() =>
    placementInstance(
      this.renderRoot() ?? this.document().render,
      this.node(),
      this.path(),
    ),
  );
  readonly indices = input<readonly number[]>([]);
  readonly resources = inject(FORM_RESOURCES, { optional: true });
  readonly collections: FormCollectionEditor | null =
    inject(FORM_COLLECTIONS, { optional: true }) ??
    (this.resources
      ? {
          collection: (
            ...args: Parameters<FormCollectionEditor['collection']>
          ) => this.resources!.collection(...args),
        }
      : null);
  readonly collectionBusy = computed(() => this.collections?.busy?.() === true);
  readonly fieldControl = computed(
    () => this.node().component !== 'action' && !!this.node().scope,
  );
  readonly attachmentsControl = computed(() =>
    ['attachment_collection', 'media'].includes(this.node().component),
  );
  readonly collection = computed(() =>
    ['repeater', 'table'].includes(this.node().component),
  );
  readonly rows = computed(() => {
    const value = this.value();
    return Array.isArray(value) ? value : [];
  });
  readonly rowKeys = computed(() =>
    this.node().scope
      ? (this.document().rowIdentity[
          rowPointer(this.node().scope!, this.indices())
        ] ?? [])
      : [],
  );
  readonly validRows = computed(
    () =>
      this.rows().length === this.rowKeys().length &&
      new Set(this.rowKeys()).size === this.rowKeys().length,
  );
  readonly minimumRows = computed(() =>
    typeof this.schema()['minItems'] === 'number'
      ? (this.schema()['minItems'] as number)
      : 0,
  );
  readonly maximumRows = computed(() =>
    typeof this.schema()['maxItems'] === 'number'
      ? Math.min(256, this.schema()['maxItems'] as number)
      : 256,
  );
  readonly canAddRow = computed(
    () =>
      !this.collectionBusy() &&
      this.validRows() &&
      this.rows().length < this.maximumRows(),
  );
  readonly canRemoveRow = computed(
    () =>
      !this.collectionBusy() &&
      this.validRows() &&
      this.rows().length > this.minimumRows(),
  );
  readonly tableRows = computed(() => [...this.rowKeys()]);
  childVisible(child: RenderNode): boolean {
    return (
      (child.display['runtime_state'] as JsonObject | undefined)?.[
        'visible'
      ] !== false
    );
  }
  childIndices(index: number): readonly number[] {
    return [...this.indices(), index];
  }
  async rowCommand(
    operation: 'add' | 'remove' | 'reorder' | 'duplicate',
    key?: string,
    index?: number,
  ): Promise<void> {
    const schema = this.schema();
    const minimum =
      typeof schema['minItems'] === 'number' ? schema['minItems'] : 0;
    const maximum =
      typeof schema['maxItems'] === 'number'
        ? Math.min(256, schema['maxItems'])
        : 256;
    if (
      (operation === 'remove' && this.rows().length <= minimum) ||
      (['add', 'duplicate'].includes(operation) &&
        this.rows().length >= maximum)
    ) {
      return;
    }
    if (
      this.writable() &&
      !this.collectionBusy() &&
      this.validRows() &&
      this.node().scope
    ) {
      await this.collections?.collection(
        this.node().scope!,
        this.pointer(),
        operation,
        key,
        index,
      );
    }
  }
  readonly attachmentRows = computed(() =>
    this.node().scope
      ? keysAt(this.document(), this.node().scope!, this.indices())
      : [],
  );
  readonly busy = input(false);
  readonly issues = input<readonly { pointer: string; message: string }[]>([]);
  readonly edit = output<FieldEdit>();
  readonly locale = inject(Locale);
  readonly layout = computed(() => isLayout(this.node().component));
  readonly columns = computed(() => layoutColumns(this.node()));
  placement(child: RenderNode): { column: string; row: string } {
    return this.node().component === 'grid'
      ? gridPlacement(child, this.columns())
      : { column: 'auto', row: 'auto' };
  }
  readonly accessibility = computed(
    () => (this.node().display['accessibility'] ?? {}) as JsonObject,
  );
  readonly accessibleLabel = computed(() => nodeLabel(this.node()));
  childLabel(child: RenderNode): string {
    return nodeLabel(child);
  }
  readonly description = computed(() => nodeDescription(this.node()));
  readonly choice = computed(() =>
    ['choice', 'user', 'group'].includes(this.node().component),
  );
  readonly pointer = computed(() =>
    this.node().scope ? rowPointer(this.node().scope!, this.indices()) : '',
  );
  readonly value = computed(() =>
    this.node().scope
      ? rowValue(this.data(), this.node().scope!, this.indices())
      : MISSING,
  );
  readonly text = computed(() =>
    this.value() === MISSING || this.value() === null
      ? ''
      : displayValue(this.value()),
  );
  readonly schema = computed(() =>
    this.node().scope ? fieldSchema(this.document(), this.node().scope!) : {},
  );
  readonly state = computed(
    () => (this.node().display['runtime_state'] ?? {}) as JsonObject,
  );
  readonly writable = computed(() => !this.busy() && this.canWrite());
  readonly canWrite = computed(
    () =>
      ['edit', 'correction'].includes(this.document().purpose) &&
      writableScope(
        this.document(),
        this.node().scope ?? '/properties/invalid',
      ) &&
      this.state()['enabled'] !== false &&
      this.node().component !== 'calculated' &&
      (this.node().display['options'] as JsonObject | undefined)?.[
        'read_only'
      ] !== true,
  );
  readonly errors = computed(() =>
    this.issues()
      .filter((issue) => issue.pointer === this.pointer())
      .map((issue) => this.locale.text(issue.message)),
  );
  readonly nullable = computed(() =>
    JSON.stringify(
      this.schema()['type'] ?? this.schema()['anyOf'] ?? '',
    ).includes('"null"'),
  );
  set(value: JsonValue | typeof MISSING, error?: string): void {
    if (this.writable() && this.node().scope) {
      this.edit.emit({
        scope: this.node().scope!,
        value,
        error,
        ...(this.indices().length
          ? {
              indices: this.indices(),
              rowKeys: keysAt(
                this.document(),
                this.node().scope!,
                this.indices(),
              ),
            }
          : {}),
      });
    }
  }
  inputValue(raw: string): void {
    if (
      ['date', 'datetime'].includes(this.node().component) &&
      raw.startsWith('invalid:')
    ) {
      this.set(
        this.value() === MISSING ? MISSING : (this.value() as JsonValue),
        'Enter a valid date or time.',
      );
      return;
    }

    if (['integer', 'number'].includes(this.node().component)) {
      const value = parseNumberText(raw);
      const valid =
        value !== undefined &&
        (this.node().component !== 'integer' || Number.isSafeInteger(value));
      this.set(
        valid
          ? value
          : this.value() === MISSING
            ? MISSING
            : (this.value() as JsonValue),
        valid ? undefined : 'Enter a valid number',
      );
    } else {
      this.set(raw);
    }
  }
  clear(): void {
    this.set(MISSING);
  }
  bool(raw: string): void {
    this.set(raw === '' ? MISSING : raw === 'true');
  }
}
