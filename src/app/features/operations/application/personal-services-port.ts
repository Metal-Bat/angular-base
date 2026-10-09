export type NotificationOptions = {
  read: 'all' | 'unread' | 'read';
  search: string;
};
export type ServiceKind = 'notifications' | 'reports';
export type ServiceItem = {
  ref: string;
  title: string;
  status: string;
  request: string | null;
  process: string | null;
  content: string;
  read: boolean;
  password: string | null;
  createdAt?: string | null;
};
export type ServicePage<T> = {
  items: readonly T[];
  page: number;
  totalPages: number;
  total?: number;
};
export type HistoryItem = { revision: string; date: string; action: string };
export type PersonalServicesPort = {
  list(
    kind: ServiceKind,
    page?: number,
    report?: boolean,
    signal?: AbortSignal,
    options?: NotificationOptions,
  ): Promise<ServicePage<ServiceItem>>;
  detail(
    kind: ServiceKind,
    ref: string,
    signal?: AbortSignal,
  ): Promise<ServiceItem>;
  read(ref: string): Promise<ServiceItem>;
  remove(ref: string): Promise<void>;
  history(
    kind: 'request' | 'task' | 'report',
    ref: string,
    page: number,
  ): Promise<ServicePage<HistoryItem>>;
};
