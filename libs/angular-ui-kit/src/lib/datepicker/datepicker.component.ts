import {
  Component,
  input,
  output,
  signal,
  computed,
  linkedSignal,
  ChangeDetectionStrategy,
  forwardRef,
  ElementRef,
  viewChild,
  inject,
  DOCUMENT,
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { OverlayModule } from '@angular/cdk/overlay';

export type DateValue = Date | string | null;

/**
 * Datepicker component for date selection with calendar overlay.
 *
 * Features:
 * - Calendar popup with month and year navigation
 * - Manual date entry in the configured format
 * - Min/max date constraints
 * - Disabled specific dates and weekends
 * - Configurable date format string
 * - Variant styles (outline, filled)
 * - Size presets (xs, sm, md, lg)
 * - Disabled and readonly states
 * - ControlValueAccessor integration for reactive forms
 *
 * @example
 * ```html
 * <lc-datepicker placeholder="Select date" [(ngModel)]="selectedDate" />
 * ```
 */
@Component({
  selector: 'lc-datepicker',
  standalone: true,
  imports: [OverlayModule],
  templateUrl: './datepicker.component.html',
  styleUrl: './datepicker.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => DatepickerComponent),
      multi: true,
    },
  ],
})
export class DatepickerComponent implements ControlValueAccessor {
  private static nextId = 0;

  /** Per-instance id for the input; helper/error text ids derive from it. */
  readonly inputId = `lc-datepicker-${++DatepickerComponent.nextId}`;

  private readonly datepickerInput = viewChild<ElementRef<HTMLInputElement>>('datepickerInput');
  private readonly calendarPanel = viewChild<ElementRef<HTMLElement>>('calendarPanel');

  /**
   * Visual variant of the datepicker
   */
  readonly variant = input<'outline' | 'filled'>('outline');

  /**
   * Size of the datepicker
   */
  readonly size = input<'xs' | 'sm' | 'md' | 'lg'>('md');

  /**
   * Whether the datepicker is disabled
   */
  readonly disabled = input<boolean>(false);

  /**
   * Whether the datepicker is in error state
   */
  readonly error = input<boolean>(false);

  /**
   * Whether the datepicker is required
   */
  readonly required = input<boolean>(false);

  /**
   * Whether the datepicker is readonly
   */
  readonly readonly = input<boolean>(false);

  /**
   * Placeholder text
   */
  readonly placeholder = input<string>('Select a date');

  /**
   * Helper text displayed below the datepicker
   */
  readonly helperText = input<string>('');

  /**
   * Error message displayed when error is true
   */
  readonly errorMessage = input<string>('');

  /**
   * ARIA label for accessibility
   */
  readonly ariaLabel = input<string | undefined>(undefined);

  /**
   * Date format string (e.g., 'YYYY-MM-DD', 'MM/DD/YYYY')
   */
  readonly format = input<string>('YYYY-MM-DD');

  /**
   * Minimum selectable date (compared by calendar day, time of day is ignored)
   */
  readonly minDate = input<Date | undefined>(undefined);

  /**
   * Maximum selectable date (compared by calendar day, time of day is ignored)
   */
  readonly maxDate = input<Date | undefined>(undefined);

  /**
   * Array of disabled dates
   */
  readonly disabledDates = input<Date[]>([]);

  /**
   * Whether to disable weekends
   */
  readonly disableWeekends = input<boolean>(false);

  /**
   * Emitted when date selection changes
   */
  readonly dateChange = output<Date | null>();

  /**
   * Emitted when calendar opens
   */
  readonly opened = output<void>();

  /**
   * Emitted when calendar closes
   */
  readonly closed = output<void>();

  // Internal state
  readonly selectedDate = signal<Date | null>(null);
  readonly isOpen = signal<boolean>(false);
  readonly currentMonth = signal<number>(new Date().getMonth());
  readonly currentYear = signal<number>(new Date().getFullYear());

  /** Disabled state pushed in by the forms API (setDisabledState). */
  private readonly formDisabled = signal<boolean>(false);

  /** Effective disabled state: the `disabled` input OR the form control's disabled state. */
  readonly isDisabled = computed(() => this.disabled() || this.formDisabled());

  // Computed values
  readonly formattedDate = computed(() => {
    const date = this.selectedDate();
    if (!date) return '';
    return this.formatDate(date, this.format());
  });

  /**
   * Text currently shown in the input. Follows the selected date, but the user
   * can type freely; only a complete, valid date is committed to the model.
   */
  readonly inputValue = linkedSignal(() => this.formattedDate());

  weekDays = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

  monthNames = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
  ];

  readonly currentMonthName = computed(() => {
    return this.monthNames[this.currentMonth()];
  });

  /** id of the helper/error text the input is described by (aria-describedby) */
  readonly describedBy = computed(() => {
    if (this.error() && this.errorMessage()) {
      return `${this.inputId}-error`;
    }
    return this.helperText() ? `${this.inputId}-helper` : null;
  });

  /**
   * Computed classes for the datepicker input element
   */
  readonly datepickerClasses = computed(() => {
    const classes = [
      'lc-datepicker',
      `lc-datepicker--${this.variant()}`,
      `lc-datepicker--${this.size()}`,
    ];

    if (this.isDisabled()) {
      classes.push('lc-datepicker--disabled');
    }

    if (this.error()) {
      classes.push('lc-datepicker--error');
    }

    if (this.readonly()) {
      classes.push('lc-datepicker--readonly');
    }

    if (this.isOpen()) {
      classes.push('lc-datepicker--open');
    }

    return classes.join(' ');
  });

  // Private properties
  private readonly document = inject(DOCUMENT);
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  private onChange: (value: Date | null) => void = () => {};
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  private onTouched: () => void = () => {};

  // Public methods
  /**
   * Toggle calendar open/closed
   */
  toggle(): void {
    if (this.isDisabled() || this.readonly()) {
      return;
    }
    if (this.isOpen()) {
      this.close();
    } else {
      this.open();
    }
  }

  /**
   * Open calendar
   */
  open(): void {
    if (this.isDisabled() || this.readonly() || this.isOpen()) {
      return;
    }
    this.isOpen.set(true);

    // Set calendar to selected date's month/year or current
    const date = this.selectedDate();
    if (date) {
      this.showMonthOf(date);
    }

    this.opened.emit();
  }

  /**
   * Close calendar. Idempotent: the overlay's `detach` re-enters here after
   * `isOpen` flips, and that second call must not emit `closed` again.
   */
  close(): void {
    if (!this.isOpen()) {
      return;
    }
    // A day button inside the panel may hold focus; it is about to be removed,
    // so hand focus back to the input instead of letting it drop to <body>.
    this.restoreFocusFromPanel();
    this.isOpen.set(false);
    this.closed.emit();
  }

  /**
   * Select a date
   */
  selectDate(date: Date): void {
    if (this.isDisabled() || this.readonly() || this.isDateDisabled(date)) {
      return;
    }

    this.commitDate(date);
    this.close();
  }

  /**
   * Clear selected date
   */
  clear(): void {
    this.selectedDate.set(null);
    this.inputValue.set('');
    this.onChange(null);
    this.dateChange.emit(null);
  }

  /**
   * Check if a date is disabled
   */
  isDateDisabled(date: Date): boolean {
    // min/max are compared by calendar day: consumers typically pass `new Date()`
    // (which carries the current time) while calendar cells sit at midnight.
    const day = this.startOfDay(date);

    const min = this.minDate();
    if (min && day < this.startOfDay(min)) {
      return true;
    }

    const max = this.maxDate();
    if (max && day > this.startOfDay(max)) {
      return true;
    }

    // Check disabled dates
    if (this.disabledDates().some((d) => this.isSameDate(d, date))) {
      return true;
    }

    // Check weekends
    if (this.disableWeekends()) {
      const weekday = date.getDay();
      if (weekday === 0 || weekday === 6) {
        return true;
      }
    }

    return false;
  }

  /**
   * Check if date is today
   */
  isToday(date: Date): boolean {
    const today = new Date();
    return this.isSameDate(date, today);
  }

  /**
   * Check if date is selected
   */
  isSelectedDate(date: Date): boolean {
    const selected = this.selectedDate();
    return selected ? this.isSameDate(date, selected) : false;
  }

  /**
   * Generate calendar days for current month
   */
  generateCalendarDays(): Date[] {
    const year = this.currentYear();
    const month = this.currentMonth();

    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    const days: Date[] = [];

    // Add previous month's days
    const firstDayOfWeek = firstDay.getDay();
    for (let i = firstDayOfWeek - 1; i >= 0; i--) {
      const date = new Date(year, month, -i);
      days.push(date);
    }

    // Add current month's days
    for (let i = 1; i <= lastDay.getDate(); i++) {
      days.push(new Date(year, month, i));
    }

    // Add next month's days to complete the grid
    const remainingDays = 42 - days.length; // 6 weeks * 7 days
    for (let i = 1; i <= remainingDays; i++) {
      days.push(new Date(year, month + 1, i));
    }

    return days.slice(0, 42); // Ensure exactly 42 days (6 weeks)
  }

  /**
   * Navigate to next month
   */
  nextMonth(): void {
    if (this.currentMonth() === 11) {
      this.currentMonth.set(0);
      this.currentYear.set(this.currentYear() + 1);
    } else {
      this.currentMonth.set(this.currentMonth() + 1);
    }
  }

  /**
   * Navigate to previous month
   */
  previousMonth(): void {
    if (this.currentMonth() === 0) {
      this.currentMonth.set(11);
      this.currentYear.set(this.currentYear() - 1);
    } else {
      this.currentMonth.set(this.currentMonth() - 1);
    }
  }

  /**
   * Navigate to today
   */
  goToToday(): void {
    this.showMonthOf(new Date());
  }

  /**
   * Handle input change (manual date entry). Partial input is kept as text
   * only; the model changes once the text is a complete, valid, selectable date.
   */
  onInputChange(value: string): void {
    this.inputValue.set(value);

    if (value.trim() === '') {
      if (this.selectedDate() !== null) {
        this.clear();
      }
      return;
    }

    const date = this.parseDate(value, this.format());
    if (date && !this.isDateDisabled(date) && !this.isSelectedDate(date)) {
      this.commitDate(date);
      this.showMonthOf(date);
    }
  }

  /**
   * Handle keyboard navigation
   */
  onKeyDown(event: KeyboardEvent): void {
    if (this.isDisabled() || this.readonly()) {
      return;
    }

    if (
      !this.isOpen() &&
      (event.key === 'ArrowDown' || event.key === 'Enter' || event.key === ' ')
    ) {
      this.open();
      event.preventDefault();
      return;
    }

    if (!this.isOpen()) return;

    // While the text differs from the model the user is mid-edit: arrows must
    // move the caret, not the calendar selection.
    const editing = this.inputValue() !== this.formattedDate();
    const currentDate = this.selectedDate() || new Date();
    let newDate: Date | null = null;

    switch (event.key) {
      case 'Escape':
        this.close();
        event.preventDefault();
        // Only this datepicker should react; keep the key from reaching enclosing overlays.
        event.stopPropagation();
        break;

      case 'ArrowRight':
        if (editing) break;
        newDate = new Date(currentDate);
        newDate.setDate(currentDate.getDate() + 1);
        event.preventDefault();
        break;

      case 'ArrowLeft':
        if (editing) break;
        newDate = new Date(currentDate);
        newDate.setDate(currentDate.getDate() - 1);
        event.preventDefault();
        break;

      case 'ArrowDown':
        if (editing) break;
        newDate = new Date(currentDate);
        newDate.setDate(currentDate.getDate() + 7);
        event.preventDefault();
        break;

      case 'ArrowUp':
        if (editing) break;
        newDate = new Date(currentDate);
        newDate.setDate(currentDate.getDate() - 7);
        event.preventDefault();
        break;

      case 'Enter': {
        const selected = this.selectedDate();
        if (selected) {
          this.selectDate(selected);
        }
        event.preventDefault();
        break;
      }
    }

    if (newDate && !this.isDateDisabled(newDate)) {
      this.selectedDate.set(newDate);
      this.showMonthOf(newDate);
    }
  }

  /**
   * Handle blur event: mark touched and drop any partial text that never became a date.
   */
  onBlur(): void {
    this.onTouched();
    this.inputValue.set(this.formattedDate());
  }

  /**
   * Handle click outside
   */
  onClickOutside(): void {
    this.close();
  }

  // ControlValueAccessor implementation
  writeValue(value: DateValue): void {
    let date: Date | null = null;
    if (value instanceof Date) {
      date = isNaN(value.getTime()) ? null : value;
    } else if (typeof value === 'string') {
      date = this.parseDate(value, this.format());
    }
    this.selectedDate.set(date);
    this.inputValue.set(this.formattedDate());
  }

  registerOnChange(fn: (value: Date | null) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.formDisabled.set(isDisabled);
  }

  /**
   * Check if date is in current month
   */
  isCurrentMonth(date: Date): boolean {
    return date.getMonth() === this.currentMonth() && date.getFullYear() === this.currentYear();
  }

  // Private helper methods
  private commitDate(date: Date): void {
    this.selectedDate.set(date);
    this.inputValue.set(this.formatDate(date, this.format()));
    this.onChange(date);
    this.dateChange.emit(date);
  }

  private showMonthOf(date: Date): void {
    this.currentMonth.set(date.getMonth());
    this.currentYear.set(date.getFullYear());
  }

  private restoreFocusFromPanel(): void {
    const panel = this.calendarPanel()?.nativeElement;
    const active = this.document.activeElement;
    if (panel && active && panel.contains(active)) {
      this.datepickerInput()?.nativeElement.focus();
    }
  }

  private startOfDay(date: Date): number {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
  }

  /**
   * Check if two dates are the same day
   */
  private isSameDate(date1: Date, date2: Date): boolean {
    return (
      date1.getFullYear() === date2.getFullYear() &&
      date1.getMonth() === date2.getMonth() &&
      date1.getDate() === date2.getDate()
    );
  }

  private formatDate(date: Date, format: string): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    return format.replace('YYYY', String(year)).replace('MM', month).replace('DD', day);
  }

  /**
   * Strict parse: the text must match the format's length, carry digits at the
   * YYYY/MM/DD positions and round-trip through formatDate (which rejects
   * things like month 13 or Feb 31 that `new Date` would silently roll over).
   * Returns null for partial or invalid input.
   */
  private parseDate(value: string, format: string): Date | null {
    if (value.length !== format.length) {
      return null;
    }

    const yearIndex = format.indexOf('YYYY');
    const monthIndex = format.indexOf('MM');
    const dayIndex = format.indexOf('DD');
    if (yearIndex < 0 || monthIndex < 0 || dayIndex < 0) {
      return null;
    }

    const yearText = value.substring(yearIndex, yearIndex + 4);
    const monthText = value.substring(monthIndex, monthIndex + 2);
    const dayText = value.substring(dayIndex, dayIndex + 2);
    if (!/^\d{4}$/.test(yearText) || !/^\d{2}$/.test(monthText) || !/^\d{2}$/.test(dayText)) {
      return null;
    }

    const date = new Date(Number(yearText), Number(monthText) - 1, Number(dayText));
    return this.formatDate(date, format) === value ? date : null;
  }

  protected getInputValue(event: Event): string {
    return (event.target as HTMLInputElement).value;
  }
}
