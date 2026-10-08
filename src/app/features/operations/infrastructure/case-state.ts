import { writablePatch } from '../../forms/domain/writable-patch';
import {
  indicesFor,
  replaceRow,
  rowPointer,
  writableScope,
} from '../../forms/domain/row-values';
import {
  computed,
  DestroyRef,
  inject,
  Injectable,
  signal,
} from '@angular/core';
import { ActorState } from '../../../core/auth/actor-state';
import { AuthSession } from '../../../core/auth/auth-session';
import { Feedback } from '../../../core/feedback/feedback';
import { ApiFailure } from '../../../core/transport/api-failure';
import { MutationQueues } from '../../../core/transport/mutation-queues';
import { MutationCoordinator } from '../../../core/transport/mutation-coordinator';
import {
  JsonObject,
  RuntimeCompatibility,
  RuntimeDocument,
} from '../../forms/domain/runtime-document';
import {
  FieldEdit,
  fieldValue,
  MISSING,
  replaceField,
} from '../../forms/domain/canonical-values';
import { overrideFields } from '../../forms/domain/resolved-behavior';
import { unsupportedNodes } from '../../forms/domain/primitive-registry';
import { validateRuntime } from '../../forms/domain/runtime-validation';
import { RuntimeReader } from '../../forms/infrastructure/runtime-reader';
import { RuntimePin } from '../../forms/infrastructure/runtime-document-adapter';
import { CaseKind, CaseRecord } from '../domain/workspace-models';
import { WorkspaceApi } from './workspace-api';
@Injectable()
export class CaseState {
  protected readonly api = inject(WorkspaceApi);
  protected readonly reader = inject(RuntimeReader);
  protected readonly actor = inject(ActorState);
  protected readonly auth = inject(AuthSession);
  readonly feedback = inject(Feedback);
  protected readonly queues = inject(MutationQueues);
  readonly item = signal<CaseRecord | null>(null);
  readonly runtime = signal<RuntimeCompatibility | null>(null);
  readonly document = computed(() => {
    const result = this.runtime();
    return result?.status === 'ready' ? result.document : null;
  });
  readonly data = signal<JsonObject>({});
  readonly issues = signal<readonly { pointer: string; message: string }[]>([]);
  readonly busy = signal(false);
  readonly error = signal('');
  readonly dirty = signal(false);
  readonly blocked = signal(false);
  readonly comment = signal('');
  readonly overrides = computed(() =>
    this.document() ? overrideFields(this.document()!) : [],
  );
  readonly documentReady = computed(
    () =>
      !!this.document() && !unsupportedNodes(this.document()!.render).length,
  );
  readonly ownTask = computed(
    () =>
      this.kind === 'task' &&
      this.item()?.claimant === this.auth.profile()?.ref &&
      ['CLAIMED', 'IN_PROGRESS'].includes(this.item()?.status ?? ''),
  );
  readonly canEdit = computed(
    () =>
      this.documentReady() &&
      ['edit', 'correction'].includes(this.document()!.purpose) &&
      !this.busy() &&
      !this.blocked(),
  );
  protected kind: CaseKind = 'request';
  readonly caseKind = (): CaseKind => this.kind;
  protected reference = '';
  protected generation = 0;
  protected alive = true;
  protected pin: RuntimePin | undefined;
  protected queue: MutationCoordinator | null = null;
  protected readonly deleted = new Set<string>();
  protected readonly rawErrors = new Map<string, string>();
  protected readonly rowEdits = new Map<string, FieldEdit>();
  protected readonly editedScopes = new Set<string>();
  constructor() {
    const unregister = this.actor.register((): void => {
      this.generation++;
      this.item.set(null);
      this.runtime.set(null);
      this.data.set({});
      this.dirty.set(false);
      this.issues.set([]);
      this.deleted.clear();
      this.rawErrors.clear();
      this.editedScopes.clear();
      this.rowEdits.clear();
      this.pin = undefined;
      this.queue = null;
      this.comment.set('');
      this.blocked.set(true);
    });
    inject(DestroyRef).onDestroy((): void => {
      this.alive = false;
      this.generation++;
      unregister();
    });
  }
  protected accept(document: RuntimeDocument, retain: boolean): void {
    this.pin ??= document.identity;
    if (!retain) {
      this.data.set(document.canonical);
      this.dirty.set(false);
      this.deleted.clear();
      this.rawErrors.clear();
      this.editedScopes.clear();
      this.rowEdits.clear();
    }
    // Retained edits are kept for an explicit comparison/reconciliation. Never overlay them silently onto newly readonly fields.
    else {
      let merged = document.canonical;
      const errors = new Map(this.rawErrors);
      this.rawErrors.clear();
      this.deleted.clear();
      for (const scope of this.editedScopes) {
        if (
          document.policy.writable.includes(scope) &&
          !scope.includes('/items')
        ) {
          const value = fieldValue(this.data(), scope);
          const pointer = rowPointer(scope);
          if (errors.has(pointer)) {
            this.rawErrors.set(pointer, errors.get(pointer)!);
          } else {
            merged = replaceField(merged, scope, value);
          }
          if (value === MISSING) {
            this.deleted.add(pointer);
          }
        }
      }
      for (const change of this.rowEdits.values()) {
        const indices = indicesFor(
          document,
          change.scope,
          change.rowKeys ?? [],
        );
        if (indices && writableScope(document, change.scope)) {
          const pointer = rowPointer(change.scope, indices);
          if (change.error) {
            this.rawErrors.set(pointer, change.error);
          } else {
            merged = replaceRow(merged, change.scope, indices, change.value);
          }
          if (!change.error && change.value === MISSING) {
            this.deleted.add(pointer);
          }
        }
      }
      this.data.set(merged);
      this.issues.set([]);
    }
  }
  edit(change: FieldEdit): void {
    const document = this.document();
    if (
      !this.canEdit() ||
      !document ||
      !writableScope(document, change.scope)
    ) {
      return;
    }
    if (change.indices?.length) {
      const indices = indicesFor(document, change.scope, change.rowKeys ?? []);
      if (
        !indices ||
        JSON.stringify(indices) !== JSON.stringify(change.indices)
      ) {
        this.error.set('Row changed. Check current state.');
        return;
      }
      this.rowEdits.set(JSON.stringify([change.scope, change.rowKeys]), change);
    } else {
      this.editedScopes.add(change.scope);
    }
    const pointer = rowPointer(change.scope, change.indices);
    if (change.error) {
      this.rawErrors.set(pointer, change.error);
    } else {
      this.rawErrors.delete(pointer);
      this.data.set(
        replaceRow(
          this.data(),
          change.scope,
          change.indices ?? [],
          change.value,
        ),
      );
      if (change.value === MISSING) {
        this.deleted.add(pointer);
      } else {
        this.deleted.delete(pointer);
      }
    }
    this.dirty.set(true);
    this.issues.set(
      [...this.rawErrors].map(([location, message]) => ({
        pointer: location,
        message,
      })),
    );
  }
  protected patch(): JsonObject {
    const document = this.document()!;
    if (this.kind === 'request') {
      return this.data();
    }
    return writablePatch(document, this.data());
  }

  validate(required: readonly string[] = []): boolean {
    const document = this.document();
    if (!document) {
      return false;
    }
    const issues = [
      ...validateRuntime(document, this.data(), required),
      ...[...this.rawErrors].map(([pointer, message]) => ({
        pointer,
        message,
      })),
    ];
    this.issues.set(issues);
    if (issues.length) {
      this.feedback.show({
        kind: 'error',
        message: 'Review these fields',
        issues: issues.map((issue) => ({ ...issue, label: issue.pointer })),
      });
    }
    return !issues.length;
  }
  protected report(error: unknown): void {
    this.error.set(
      error instanceof ApiFailure
        ? error.message
        : 'The service is unavailable.',
    );
    if (error instanceof ApiFailure && error.issues.length) {
      const issues = error.issues.map((issue) => ({
        pointer: issue.pointer.replace(/^\/data(?=\/|$)/, ''),
        message: 'The server rejected this value',
      }));
      this.issues.set(issues);
      this.feedback.show({
        kind: 'error',
        message: 'Review these fields',
        issues: issues.map((issue) => ({
          ...issue,
          label: issue.pointer || 'Form',
        })),
      });
    }
  }
}
