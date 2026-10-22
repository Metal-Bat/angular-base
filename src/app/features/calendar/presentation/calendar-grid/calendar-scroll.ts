/** Move only the grid's own scroller; selecting a view must not scroll the page. */
export function revealCalendarDay(scroll: HTMLElement, day: string): void {
  const lane = scroll.querySelector<HTMLElement>(
    '[data-calendar-day="' + day + '"]',
  );
  const axis = scroll.querySelector<HTMLElement>('.time-axis');
  if (!lane) {
    return;
  }
  const frame = scroll.getBoundingClientRect();
  const cell = lane.getBoundingClientRect();
  const width = axis?.getBoundingClientRect().width ?? 0;
  const rtl = getComputedStyle(scroll).direction === 'rtl';
  const start = frame.left + (rtl ? 0 : width) + scroll.clientLeft;
  const end = frame.right - (rtl ? width : 0) - scroll.clientLeft;
  if (cell.left < start) {
    scroll.scrollLeft += cell.left - start;
  } else if (cell.right > end) {
    scroll.scrollLeft += cell.right - end;
  }
}
