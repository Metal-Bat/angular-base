import { MISSING } from '../domain/canonical-values';
import { JsonObject, JsonValue } from '../domain/runtime-document';
export type Attachment = {
  ref: string;
  kind: 'file' | 'image' | 'unknown';
  path: string;
  caption: string;
  contentType: string;
  size: number;
  position: number;
};
export type PendingAttachment = {
  path: string;
  fieldLabel: string;
  name: string;
  size: number;
  caption: string | null;
  phase: 'needs-check' | 'checking' | 'ready' | 'linking' | 'target-changed';
  message: string;
  presentInForm: boolean;
  canCheck: boolean;
  canRetry: boolean;
};
export type Approval = {
  reference: string;
  status: string;
  tool: string;
  version: string;
  arguments: JsonObject | null;
  expires: string;
};
export type CaseFeedback = {
  key: string;
  scope: string;
  item: string | null;
  message: string;
  status: string;
  current: JsonValue | typeof MISSING;
  prior: JsonValue | typeof MISSING;
};
export type FormResources = {
  /** Local owner remains stable across rotating current resource references. */
  readonly ownerKey: () => string;
  attachmentContent(reference: string, abort?: AbortSignal): Promise<Blob>;
  readonly pendingAttachment: () => PendingAttachment | null;
  checkPendingAttachment(): Promise<void>;
  retryPendingAttachment(): Promise<void>;
  discardPendingAttachment(): void;
  collection(
    scope: string,
    path: string,
    operation: 'add' | 'remove' | 'reorder' | 'duplicate',
    key?: string,
    index?: number,
  ): Promise<void>;
  attachments(): Promise<readonly Attachment[]>;
  upload(
    path: string,
    file: File,
    image: boolean,
    caption: string,
    abort?: AbortSignal,
  ): Promise<void>;
  replaceAttachment(
    reference: string,
    file: File,
    image: boolean,
    caption: string,
    abort?: AbortSignal,
  ): Promise<void>;
  removeAttachment(reference: string): Promise<void>;
  reorderAttachments(
    path: string,
    references: readonly string[],
  ): Promise<void>;
  downloadAttachment(reference: string): Promise<void>;
  cancelTransfer(): void;
  readonly transferBusy: () => boolean;
  readonly progress: () => number | null;
  view(): Promise<readonly CaseFeedback[]>;
  resolveFeedback(key: string): Promise<void>;
  personal(
    action: 'read' | 'pin' | 'archive' | 'watch',
    value: boolean,
  ): Promise<void>;
  comment(value: string): Promise<boolean>;
  forward(
    users: readonly string[],
    groups: readonly string[],
    reason: string,
  ): Promise<boolean>;
  approval(): Promise<Approval>;
  decideApproval(approved: boolean): Promise<void>;
  cancelRequest(): Promise<void>;
  requestReport(): Promise<readonly { reference: string; status: string }[]>;
  administrative(action: 'cancel' | 'expire'): Promise<void>;
  poll(abort: AbortSignal): Promise<void>;
  resume(): Promise<void>;
};
export type FormCollectionEditor = Pick<FormResources, 'collection'> & {
  readonly busy?: () => boolean;
};
