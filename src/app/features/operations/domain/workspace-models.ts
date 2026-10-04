export type CaseKind = 'request' | 'task';
export type Cartable =
  'available' | 'claimed' | 'completed' | 'watching' | 'submitted' | 'unread';
export const cartables: readonly Cartable[] = [
  'available',
  'claimed',
  'completed',
  'watching',
  'submitted',
  'unread',
];
export type CatalogItem = {
  readonly ref: string;
  readonly name: string;
  readonly code: string;
  readonly form: string;
  readonly workflow: string;
};
export type CaseRecord = {
  readonly ref: string;
  readonly status: string;
  readonly kind: 'HUMAN_TASK' | 'AI_APPROVAL' | 'UNSUPPORTED';
  readonly claimant: string | null;
  readonly process: string | null;
  readonly form: string | null;
  readonly workflow: string | null;
  readonly runtime: unknown;
};
