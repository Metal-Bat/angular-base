import { MISSING } from '../domain/canonical-values';
import { JsonObject, JsonValue } from '../domain/runtime-document';
export type Attachment = {
  ref: string;
  path: string;
  caption: string;
  contentType: string;
  size: number;
  position: number;
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
  ): Promise<void>;
  replaceAttachment(
    reference: string,
    file: File,
    image: boolean,
    caption: string,
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
  comment(value: string): Promise<void>;
  forward(
    users: readonly string[],
    groups: readonly string[],
    reason: string,
  ): Promise<void>;
  approval(): Promise<Approval>;
  decideApproval(approved: boolean): Promise<void>;
  cancelRequest(): Promise<void>;
  requestReport(): Promise<readonly { reference: string; status: string }[]>;
  administrative(action: 'cancel' | 'expire'): Promise<void>;
  poll(abort: AbortSignal): Promise<void>;
  resume(): Promise<void>;
};
