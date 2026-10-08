import {
  JsonObject,
  JsonValue,
  RenderNode,
  RuntimeAction,
  RuntimeCompatibility,
  RuntimeDocument,
} from '../../forms/domain/runtime-document';
import { FieldEdit } from '../../forms/domain/canonical-values';
import {
  Cartable,
  CaseKind,
  CaseRecord,
  CatalogItem,
} from '../domain/workspace-models';
export type State<T> = { (): T; set(value: T): void };
export type PagesPort = {
  readonly catalog: () => readonly CatalogItem[];
  readonly cases: () => readonly CaseRecord[];
  readonly page: () => number;
  readonly totalPages: () => number;
  readonly state: () => 'loading' | 'ready' | 'error';
  readonly error: () => string;
  load(
    kind: 'catalog' | 'request' | 'task',
    page?: number,
    cartable?: Cartable,
    abort?: AbortSignal,
  ): Promise<void>;
};
export type CreationPort = {
  readonly busy: () => boolean;
  readonly uncertain: () => boolean;
  readonly error: () => string;
  create(reference: string): Promise<CaseRecord | null>;
  reconcile(): Promise<void>;
};
export type EditorPort = {
  readonly caseKind: () => CaseKind;
  readonly item: () => CaseRecord | null;
  readonly runtime: () => RuntimeCompatibility | null;
  readonly document: () => RuntimeDocument | null;
  readonly data: () => JsonObject;
  readonly issues: () => readonly { pointer: string; message: string }[];
  readonly busy: () => boolean;
  readonly blocked: () => boolean;
  readonly dirty: () => boolean;
  readonly error: State<string>;
  readonly comment: State<string>;
  readonly overrides: () => readonly RenderNode[];
  readonly canEdit: () => boolean;
  readonly ownTask: () => boolean;
  readonly feedback: { confirm(message: string): Promise<boolean> };
  open(kind: CaseKind, reference: string, view?: string): Promise<void>;
  refresh(retain?: boolean, view?: string): Promise<void>;
  edit(change: FieldEdit): void;
  save(): Promise<boolean>;
  command<P>(
    payload: P,
    send: (
      reference: string,
      payload: P,
      key: string | null,
    ) => Promise<string>,
    replayable?: boolean,
    presentationResume?: boolean,
  ): Promise<boolean>;
  submit(): Promise<void>;
  lifecycle(action: 'claim' | 'release' | 'start'): Promise<void>;
  decide(action: RuntimeAction): Promise<void>;
  override(
    scope: string,
    operation: 'set' | 'reset',
    value: JsonValue,
    reason: string,
  ): Promise<void>;
};
