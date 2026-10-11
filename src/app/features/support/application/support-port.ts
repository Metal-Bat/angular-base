export type Incident = {
  ref_id: string;
  support_ref: string;
  category:
    | 'technical'
    | 'database'
    | 'cache'
    | 'storage'
    | 'broker'
    | 'client'
    | 'notification';
  error_code: number;
  operation: string;
  state: 'OPEN' | 'ACKNOWLEDGED' | 'RESOLVED';
  occurrence_count: number;
  first_seen_at: string;
  last_seen_at: string;
  expires_at: string;
};
export type IncidentHistory = { operation: string; changed_at: string };
export type SupportPort = {
  search(
    page: number,
  ): Promise<{ items: readonly Incident[]; page: number; totalPages: number }>;
  detail(ref: string): Promise<Incident>;
  history(ref: string): Promise<readonly IncidentHistory[]>;
  act(ref: string, resolve: boolean): Promise<Incident>;
};
