export type EvidencePage<T> = {
  readonly items: readonly T[];
  readonly page: number;
  readonly totalPages: number;
  readonly total: number;
};
export type OrderEvidence = {
  readonly operation: string;
  readonly execution: string;
  readonly state: 'PREPARED' | 'DISPATCHING' | 'UNKNOWN' | 'CONFIRMED';
  readonly receipt: {
    readonly identity: string;
    readonly state: 'CREATED' | 'CANCELLED';
    readonly payloadHash: string;
  } | null;
};
export type AIEvidence = {
  readonly execution: string;
  readonly attempt: number;
  readonly status: string;
  readonly agent: string | null;
  readonly agentAvailable: boolean;
  readonly model: string | null;
  readonly fields: readonly string[];
  readonly recommendation: {
    readonly choice: string;
    readonly confidence: number;
    readonly needsReview: boolean;
  } | null;
  readonly budget: {
    readonly currency: string;
    readonly priceVersion: string;
    readonly unknown: boolean;
    readonly used: string;
    readonly reserved: string;
    readonly remaining: string;
  } | null;
};
export type ProcessEvidenceSnapshot = {
  readonly orders: EvidencePage<OrderEvidence>;
  readonly ai: EvidencePage<AIEvidence>;
};
export type ProcessEvidenceReader = {
  read(
    reference: string,
    ordersPage: number,
    aiPage: number,
    abort: AbortSignal,
  ): Promise<ProcessEvidenceSnapshot>;
};
