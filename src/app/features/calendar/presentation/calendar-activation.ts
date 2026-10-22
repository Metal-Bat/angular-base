import { CalendarEvent } from '../domain/calendar-events';
/** Presentation-only anchor; DOM nodes never enter calendar DTOs or commands. */
export type CalendarActivation = { event: CalendarEvent; trigger: HTMLElement };
