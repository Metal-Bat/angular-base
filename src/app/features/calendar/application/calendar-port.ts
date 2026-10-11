import { CalendarEvent } from '../domain/calendar-events';
export type CalendarSchedule =
  | { kind: 'timed'; timezone: string; start_at: string; end_at: string }
  | { kind: 'all_day'; timezone: string; start_date: string; end_date: string }
  | { kind: 'deadline'; timezone: string; due_at: string };
export type CalendarItem = {
  ref_id: string;
  title: string;
  editable: boolean;
  source_kind: 'manual' | 'work_item';
  route_key: 'calendar_events' | 'work_items';
  schedule: CalendarSchedule;
  work_group_ref_id?: string | null;
};
export type CalendarInput = {
  title: string;
  command_key: string;
  schedule: Exclude<CalendarSchedule, { kind: 'deadline' }>;
  work_group_ref_id?: string | null;
  reminder_offsets?: number[];
};
export type CalendarQuery = {
  start_date: string;
  end_date: string;
  timezone: string;
  include_work_deadlines: boolean;
  page: number;
  size: number;
};
export type Reminder = {
  ref_id: string;
  due_at: string;
  status: 'PENDING' | 'SENT' | 'CANCELLED' | 'EXPIRED';
};
export type CalendarPort = {
  search(body: CalendarQuery): Promise<{
    items: readonly { item: CalendarItem; event: CalendarEvent }[];
    totalPages: number;
  }>;
  detail(ref: string): Promise<CalendarItem>;
  save(body: CalendarInput, ref?: string): Promise<CalendarItem>;
  remove(ref: string): Promise<void>;
  reminders(item: CalendarItem): Promise<Reminder[]>;
  work(ref: string): Promise<{ ref_id: string; due_at: string | null }>;
  configure(
    ref: string,
    body: { offsets: number[]; command_key: string },
  ): Promise<Reminder[]>;
  cancel(ref: string): Promise<void>;
};
