import {
  ChangeDetectionStrategy,
  Component,
  input,
  model,
  output,
  computed,
  signal,
} from '@angular/core';
import { SlicePipe } from '@angular/common';

export type CalendarView = 'day' | 'week' | 'month';

/** UI strings of the calendar chrome; override individual keys via the `labels` input. */
export interface CalendarLabels {
  today: string;
  day: string;
  week: string;
  month: string;
  previous: string;
  next: string;
}

const DEFAULT_LABELS: CalendarLabels = {
  today: 'Heute',
  day: 'Tag',
  week: 'Woche',
  month: 'Monat',
  previous: 'Zurück',
  next: 'Weiter',
};

export interface CalendarEvent {
  id: string;
  title: string;
  start: Date | string;
  end: Date | string;
  color?: 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'info';
  allDay?: boolean;
}

interface DayCell {
  date: Date;
  isToday: boolean;
  isCurrentMonth: boolean;
  events: CalendarEvent[];
}

interface HourSlot {
  hour: number;
  label: string;
}

@Component({
  selector: 'lc-calendar',
  standalone: true,
  imports: [SlicePipe],
  templateUrl: './calendar.component.html',
  styleUrls: ['./calendar.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
/**
 * Calendar component for date-based event display and navigation.
 *
 * Features:
 * - Day, week, and month view modes
 * - Event display with six color variants
 * - Navigation controls for previous/next/today
 * - Configurable first day of week and locale
 * - Time grid for day and week views with hourly slots
 * - Click handlers for events and date cells
 *
 * @example
 * ```html
 * <lc-calendar [events]="events" view="month" [firstDayOfWeek]="1" />
 * ```
 */
export class CalendarComponent {
  /** Current view mode. Two-way bindable; the view toggle writes it and emits `viewChange`. */
  view = model<CalendarView>('month');

  /** Events to display. */
  events = input<CalendarEvent[]>([]);

  /** First day of week (0=Sunday, 1=Monday). */
  firstDayOfWeek = input<number>(1);

  /** Locale for date formatting. */
  locale = input<string>('de-DE');

  /** Overrides for the built-in UI strings (defaults are German, matching the default locale). */
  labels = input<Partial<CalendarLabels>>({});

  /** Start hour for day/week view. */
  startHour = input<number>(6);

  /** End hour for day/week view. */
  endHour = input<number>(22);

  /** Emits when an event is clicked. */
  eventClick = output<CalendarEvent>();

  /** Emits when a date cell is clicked. */
  dateClick = output<Date>();

  protected readonly currentDate = signal(new Date());

  protected readonly text = computed<CalendarLabels>(() => ({ ...DEFAULT_LABELS, ...this.labels() }));

  protected readonly headerTitle = computed(() => {
    const d = this.currentDate();
    const loc = this.locale();
    const v = this.view();
    if (v === 'month') {
      return d.toLocaleDateString(loc, { month: 'long', year: 'numeric' });
    }
    if (v === 'week') {
      const start = this.weekStart(d);
      const end = new Date(start);
      end.setDate(end.getDate() + 6);
      return `${start.toLocaleDateString(loc, { day: 'numeric', month: 'short' })} – ${end.toLocaleDateString(loc, { day: 'numeric', month: 'short', year: 'numeric' })}`;
    }
    return d.toLocaleDateString(loc, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  });

  protected readonly weekDayNames = computed(() => {
    const loc = this.locale();
    const fdow = this.firstDayOfWeek();
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(2024, 0, fdow + i); // Jan 2024 starts on Monday
      return d.toLocaleDateString(loc, { weekday: 'short' });
    });
  });

  protected readonly monthGrid = computed(() => {
    const d = this.currentDate();
    const evts = this.normalizedEvents();
    const fdow = this.firstDayOfWeek();
    const year = d.getFullYear();
    const month = d.getMonth();
    const today = new Date();

    const firstOfMonth = new Date(year, month, 1);
    let startOffset = firstOfMonth.getDay() - fdow;
    if (startOffset < 0) startOffset += 7;

    const startDate = new Date(year, month, 1 - startOffset);
    const weeks: DayCell[][] = [];

    for (let w = 0; w < 6; w++) {
      const week: DayCell[] = [];
      for (let wd = 0; wd < 7; wd++) {
        const cellDate = new Date(startDate);
        cellDate.setDate(startDate.getDate() + w * 7 + wd);
        week.push({
          date: cellDate,
          isToday: this.isSameDay(cellDate, today),
          isCurrentMonth: cellDate.getMonth() === month,
          events: evts.filter(e => this.isEventOnDate(e, cellDate)),
        });
      }
      weeks.push(week);
    }
    return weeks;
  });

  protected readonly hourSlots = computed((): HourSlot[] => {
    const start = this.startHour();
    const end = this.endHour();
    return Array.from({ length: end - start }, (_, i) => ({
      hour: start + i,
      label: `${String(start + i).padStart(2, '0')}:00`,
    }));
  });

  protected readonly weekDays = computed(() => {
    const d = this.currentDate();
    const start = this.weekStart(d);
    const loc = this.locale();
    const today = new Date();
    const evts = this.normalizedEvents();

    return Array.from({ length: 7 }, (_, i) => {
      const day = new Date(start);
      day.setDate(start.getDate() + i);
      return {
        date: day,
        label: day.toLocaleDateString(loc, { weekday: 'short', day: 'numeric' }),
        isToday: this.isSameDay(day, today),
        events: evts.filter(e => this.isEventOnDate(e, day)),
      };
    });
  });

  protected readonly dayEvents = computed(() => {
    const d = this.currentDate();
    const evts = this.normalizedEvents();
    return evts.filter(e => this.isEventOnDate(e, d));
  });

  private readonly normalizedEvents = computed(() =>
    this.events().map(e => ({
      ...e,
      start: e.start instanceof Date ? e.start : new Date(e.start),
      end: e.end instanceof Date ? e.end : new Date(e.end),
    }))
  );

  protected navigatePrev(): void {
    this.navigate(-1);
  }

  protected navigateNext(): void {
    this.navigate(1);
  }

  protected navigateToday(): void {
    this.currentDate.set(new Date());
  }

  protected setView(v: CalendarView): void {
    this.view.set(v);
  }

  protected onEventClick(event: CalendarEvent, e: Event): void {
    // The event button sits inside a clickable cell/column; don't let it count as a date click too.
    e.stopPropagation();
    this.eventClick.emit(event);
  }

  protected onDateClick(date: Date, e?: Event): void {
    e?.stopPropagation();
    this.dateClick.emit(date);
  }

  /** Full, localized accessible name for a day button (e.g. "Montag, 15. Januar 2024"). */
  protected dateLabel(date: Date): string {
    return date.toLocaleDateString(this.locale(), {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  }

  /** Accessible name for an event button: title plus its time range (or "all day"). */
  protected eventLabel(event: CalendarEvent): string {
    const start = event.start instanceof Date ? event.start : new Date(event.start);
    const end = event.end instanceof Date ? event.end : new Date(event.end);
    const loc = this.locale();
    const opts: Intl.DateTimeFormatOptions = { hour: '2-digit', minute: '2-digit' };
    return event.allDay
      ? event.title
      : `${event.title}, ${start.toLocaleTimeString(loc, opts)} – ${end.toLocaleTimeString(loc, opts)}`;
  }

  protected eventTop(event: CalendarEvent): number {
    const start = event.start instanceof Date ? event.start : new Date(event.start);
    const h = start.getHours() - this.startHour();
    const m = start.getMinutes();
    return (h * 60 + m);
  }

  protected eventHeight(event: CalendarEvent): number {
    const start = event.start instanceof Date ? event.start : new Date(event.start);
    const end = event.end instanceof Date ? event.end : new Date(event.end);
    const diff = (end.getTime() - start.getTime()) / 60000;
    return Math.max(diff, 15);
  }

  private navigate(direction: number): void {
    const d = new Date(this.currentDate());
    const v = this.view();
    if (v === 'month') {
      d.setMonth(d.getMonth() + direction);
    } else if (v === 'week') {
      d.setDate(d.getDate() + direction * 7);
    } else {
      d.setDate(d.getDate() + direction);
    }
    this.currentDate.set(d);
  }

  private weekStart(d: Date): Date {
    const start = new Date(d);
    const fdow = this.firstDayOfWeek();
    let diff = start.getDay() - fdow;
    if (diff < 0) diff += 7;
    start.setDate(start.getDate() - diff);
    return start;
  }

  private isSameDay(a: Date, b: Date): boolean {
    return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
  }

  private isEventOnDate(event: { start: Date; end: Date }, date: Date): boolean {
    const startOfDay = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const endOfDay = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59);
    return event.start <= endOfDay && event.end >= startOfDay;
  }
}
