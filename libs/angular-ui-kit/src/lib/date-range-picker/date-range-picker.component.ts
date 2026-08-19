import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  HostListener,
  afterRenderEffect,
  computed,
  forwardRef,
  inject,
  input,
  output,
  signal,
  untracked,
  viewChild,
} from '@angular/core';
import { NG_VALUE_ACCESSOR, ControlValueAccessor } from '@angular/forms';
import { IconComponent } from '../icon/icon.component';

export interface DateRange {
  start: Date | null;
  end: Date | null;
}

/** Monday..Sunday of a known week — only used to derive localised weekday names */
const REFERENCE_WEEK = Array.from({ length: 7 }, (_, i) => new Date(2024, 0, 1 + i));

@Component({
  selector: 'lc-date-range-picker',
  standalone: true,
  imports: [IconComponent],
  templateUrl: './date-range-picker.component.html',
  styleUrls: ['./date-range-picker.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => DateRangePickerComponent),
      multi: true,
    },
  ],
})
export class DateRangePickerComponent implements ControlValueAccessor {
  private static nextId = 0;

  /** Per-instance ids for label ↔ trigger ↔ panel ARIA wiring */
  readonly triggerId = `lc-drp-${++DateRangePickerComponent.nextId}`;
  readonly labelId = `${this.triggerId}-label`;
  readonly valueId = `${this.triggerId}-value`;
  readonly panelId = `${this.triggerId}-panel`;

  private readonly elRef = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly triggerEl = viewChild<ElementRef<HTMLButtonElement>>('triggerEl');
  private readonly panelEl = viewChild<ElementRef<HTMLElement>>('panelEl');

  readonly label = input('');
  readonly placeholder = input('Select date range');
  readonly disabled = input(false);
  readonly minDate = input<Date | null>(null);
  readonly maxDate = input<Date | null>(null);
  /** BCP 47 locale for the displayed dates, month title and weekday headers */
  readonly locale = input('de-DE');

  readonly rangeChange = output<DateRange>();

  protected isOpen = signal(false);
  protected range = signal<DateRange>({ start: null, end: null });
  protected selecting = signal<'start' | 'end'>('start');
  protected hoveredDate = signal<Date | null>(null);
  protected viewingMonth = signal(new Date());

  /** Disabled via `setDisabledState` (reactive forms) */
  private readonly formDisabled = signal(false);

  /** Effective disabled state: `disabled` input OR form control disabled */
  protected readonly isDisabled = computed(() => this.disabled() || this.formDisabled());

  private onChange: (val: DateRange) => void = () => { /* set by registerOnChange */ };
  private onTouched: () => void = () => { /* set by registerOnTouched */ };

  protected readonly displayValue = computed(() => {
    const r = this.range();
    if (!r.start) return '';
    const locale = this.locale();
    const fmt = (d: Date) => d.toLocaleDateString(locale, { day: '2-digit', month: '2-digit', year: 'numeric' });
    if (!r.end) return fmt(r.start) + ' – …';
    return `${fmt(r.start)} – ${fmt(r.end)}`;
  });

  protected readonly monthLabel = computed(() => {
    const d = this.viewingMonth();
    return d.toLocaleDateString(this.locale(), { month: 'long', year: 'numeric' });
  });

  /** Monday-first weekday headers in the configured locale (e.g. Mo…So / Mon…Sun) */
  protected readonly weekdays = computed(() => {
    const locale = this.locale();
    // some ICU builds abbreviate with a trailing period ("Mo.") — keep the compact form
    return REFERENCE_WEEK.map((d) => d.toLocaleDateString(locale, { weekday: 'short' }).replace(/\.$/, ''));
  });

  protected readonly calendarDays = computed(() => {
    const viewing = this.viewingMonth();
    const locale = this.locale();
    const year = viewing.getFullYear();
    const month = viewing.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    let startDow = firstDay.getDay();
    if (startDow === 0) startDow = 7; // Monday = 1
    const prefixDays = startDow - 1;

    const days: { date: Date; inMonth: boolean; disabled: boolean; ariaLabel: string }[] = [];
    const push = (date: Date, inMonth: boolean) =>
      days.push({
        date,
        inMonth,
        disabled: this.isDateDisabled(date),
        ariaLabel: date.toLocaleDateString(locale, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }),
      });

    for (let i = prefixDays; i > 0; i--) {
      push(new Date(year, month, 1 - i), false);
    }

    for (let d = 1; d <= lastDay.getDate(); d++) {
      push(new Date(year, month, d), true);
    }

    const remaining = 42 - days.length;
    for (let i = 1; i <= remaining; i++) {
      push(new Date(year, month + 1, i), false);
    }

    return days;
  });

  constructor() {
    // Move focus into the panel once it is rendered so keyboard users land on
    // the calendar instead of having to tab through the trigger's siblings.
    afterRenderEffect(() => {
      if (!this.isOpen()) return;
      untracked(() => {
        const panel = this.panelEl()?.nativeElement;
        if (!panel || panel.contains(document.activeElement)) return;
        const target =
          panel.querySelector<HTMLButtonElement>('.lc-drp__day--start:not(:disabled)') ??
          panel.querySelector<HTMLButtonElement>('.lc-drp__day--today:not(:disabled)') ??
          panel.querySelector<HTMLButtonElement>('.lc-drp__day:not(.lc-drp__day--outside):not(:disabled)');
        target?.focus();
      });
    });
  }

  writeValue(value: DateRange | null): void {
    this.range.set(value ?? { start: null, end: null });
    if (value?.start) {
      this.viewingMonth.set(new Date(value.start.getFullYear(), value.start.getMonth(), 1));
    }
  }

  registerOnChange(fn: (val: DateRange) => void): void { this.onChange = fn; }
  registerOnTouched(fn: () => void): void { this.onTouched = fn; }

  setDisabledState(isDisabled: boolean): void {
    this.formDisabled.set(isDisabled);
    if (isDisabled) this.isOpen.set(false);
  }

  protected toggle(): void {
    if (this.isDisabled()) return;
    if (this.isOpen()) {
      this.close();
      return;
    }
    this.selecting.set('start');
    this.hoveredDate.set(null);
    this.isOpen.set(true);
  }

  protected close(): void {
    if (!this.isOpen()) return;
    this.isOpen.set(false);
    this.onTouched();
    // Return focus to the trigger when it was inside the (now removed) panel
    if (this.elRef.nativeElement.contains(document.activeElement)) {
      this.triggerEl()?.nativeElement.focus();
    }
  }

  /** Escape (from the trigger or anywhere in the panel) closes the picker */
  @HostListener('keydown', ['$event'])
  protected onKeydown(event: KeyboardEvent): void {
    if (event.key === 'Escape' && this.isOpen()) {
      this.close();
      // consumed here — an enclosing modal/drawer must not close as well
      event.stopPropagation();
      event.preventDefault();
    }
  }

  @HostListener('document:click', ['$event'])
  protected onDocumentClick(event: MouseEvent): void {
    if (this.isOpen() && !this.elRef.nativeElement.contains(event.target as Node)) {
      this.close();
    }
  }

  protected prevMonth(): void {
    this.viewingMonth.update(d => new Date(d.getFullYear(), d.getMonth() - 1, 1));
  }

  protected nextMonth(): void {
    this.viewingMonth.update(d => new Date(d.getFullYear(), d.getMonth() + 1, 1));
  }

  protected selectDate(date: Date): void {
    if (this.isDateDisabled(date)) return;

    const current = this.range();
    if (this.selecting() === 'start') {
      this.range.set({ start: date, end: null });
      this.selecting.set('end');
    } else {
      if (date < current.start!) {
        this.range.set({ start: date, end: current.start });
      } else {
        this.range.set({ start: current.start, end: date });
      }
      this.selecting.set('start');
      this.emitRange();
      this.close();
    }
  }

  protected onDayHover(date: Date): void {
    if (this.selecting() === 'end') {
      this.hoveredDate.set(date);
    }
  }

  protected isStart(date: Date): boolean {
    return this.sameDay(date, this.range().start);
  }

  protected isEnd(date: Date): boolean {
    return this.sameDay(date, this.range().end);
  }

  protected isInRange(date: Date): boolean {
    const r = this.range();
    if (!r.start) return false;
    const end = r.end || this.hoveredDate();
    if (!end) return false;
    const s = Math.min(r.start.getTime(), end.getTime());
    const e = Math.max(r.start.getTime(), end.getTime());
    const t = date.getTime();
    return t > s && t < e;
  }

  protected isToday(date: Date): boolean {
    return this.sameDay(date, new Date());
  }

  protected clearRange(event: Event): void {
    event.stopPropagation();
    if (this.isDisabled()) return;
    this.range.set({ start: null, end: null });
    const r = { start: null, end: null };
    this.onChange(r);
    this.rangeChange.emit(r);
  }

  /** min/max are compared by calendar day — `minDate = new Date()` keeps today selectable */
  private isDateDisabled(date: Date): boolean {
    const min = this.minDate();
    const max = this.maxDate();
    const day = this.dayStamp(date);
    if (min && day < this.dayStamp(min)) return true;
    if (max && day > this.dayStamp(max)) return true;
    return false;
  }

  private dayStamp(d: Date): number {
    return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  }

  private sameDay(a: Date | null, b: Date | null): boolean {
    if (!a || !b) return false;
    return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
  }

  private emitRange(): void {
    const r = this.range();
    this.onChange(r);
    this.rangeChange.emit(r);
  }
}
