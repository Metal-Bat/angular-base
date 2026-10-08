export const processStatuses = [
  'RUNNING',
  'WAITING',
  'PAUSED',
  'COMPLETED',
  'FAILED',
  'CANCELLED',
  'COMPENSATING',
  'COMPENSATION_FAILED',
  'COMPENSATED',
] as const;
export type ProcessSnapshot = {
  readonly reference: string;
  readonly request: string;
  readonly workflow: string;
  readonly status: (typeof processStatuses)[number];
  readonly positions: readonly {
    step: string;
    status: string;
    wait: string | null;
  }[];
  readonly steps: readonly { key: string; status: string }[];
  readonly children: readonly { reference: string; status: string }[];
  readonly events: readonly {
    sequence: number;
    kind: string;
    occurred: string;
    task: string | null;
  }[];
  readonly page: number;
  readonly totalPages: number;
  readonly coverage: string | null;
};
export type ProcessReader = (
  reference: string,
  page?: number,
  report?: boolean,
  abort?: AbortSignal,
) => Promise<ProcessSnapshot>;
