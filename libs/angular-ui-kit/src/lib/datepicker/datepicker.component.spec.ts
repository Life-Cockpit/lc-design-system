import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { Component, signal } from '@angular/core';
import { By } from '@angular/platform-browser';
import { DatepickerComponent } from './datepicker.component';

/** The calendar is rendered through the CDK overlay, i.e. outside the fixture's host element. */
function calendarPanel(): HTMLElement | null {
  return document.querySelector('.lc-datepicker-calendar');
}

describe('DatepickerComponent', () => {
  let component: DatepickerComponent;
  let fixture: ComponentFixture<DatepickerComponent>;

  const setInput = (name: string, value: unknown) => {
    fixture.componentRef.setInput(name, value);
    fixture.detectChanges();
  };

  const inputEl = (): HTMLInputElement => fixture.nativeElement.querySelector('input');

  /** Simulates the user typing `text` into the input. */
  const type = (text: string) => {
    const el = inputEl();
    el.value = text;
    el.dispatchEvent(new Event('input'));
    fixture.detectChanges();
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DatepickerComponent, ReactiveFormsModule],
    }).compileComponents();

    fixture = TestBed.createComponent(DatepickerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => fixture.destroy());

  describe('Component Creation', () => {
    it('should create', () => {
      expect(component).toBeTruthy();
    });

    it('should have default variant "outline"', () => {
      expect(component.variant()).toBe('outline');
    });

    it('should have default size "md"', () => {
      expect(component.size()).toBe('md');
    });

    it('should not be disabled by default', () => {
      expect(component.disabled()).toBe(false);
      expect(component.isDisabled()).toBe(false);
    });

    it('should not have error state by default', () => {
      expect(component.error()).toBe(false);
    });

    it('should not be required by default', () => {
      expect(component.required()).toBe(false);
    });

    it('should not be readonly by default', () => {
      expect(component.readonly()).toBe(false);
    });
  });

  describe('Date Selection', () => {
    it('should select a date', () => {
      const date = new Date(2024, 0, 15);
      component.selectDate(date);

      expect(component.selectedDate()).toEqual(date);
    });

    it('should format selected date', () => {
      const date = new Date(2024, 0, 15);
      component.selectDate(date);

      expect(component.formattedDate()).toBe('2024-01-15');
      expect(component.inputValue()).toBe('2024-01-15');
    });

    it('should clear selected date', () => {
      const date = new Date(2024, 0, 15);
      component.selectDate(date);
      component.clear();

      expect(component.selectedDate()).toBeNull();
      expect(component.inputValue()).toBe('');
    });

    it('should not select date when disabled', () => {
      setInput('disabled', true);
      const date = new Date(2024, 0, 15);
      component.selectDate(date);

      expect(component.selectedDate()).toBeNull();
    });

    it('should not select date when readonly', () => {
      setInput('readonly', true);
      const date = new Date(2024, 0, 15);
      component.selectDate(date);

      expect(component.selectedDate()).toBeNull();
    });

    it('should select a date by clicking a day button in the overlay', () => {
      const dateChange = jest.fn();
      component.dateChange.subscribe(dateChange);
      component.currentMonth.set(0);
      component.currentYear.set(2024);
      component.open();
      fixture.detectChanges();

      const day = Array.from(calendarPanel()!.querySelectorAll<HTMLButtonElement>('.lc-datepicker-day')).find(
        (b) => !b.classList.contains('lc-datepicker-day--other-month') && b.textContent?.trim() === '15',
      )!;
      day.click();
      fixture.detectChanges();

      expect(component.selectedDate()).toEqual(new Date(2024, 0, 15));
      expect(dateChange).toHaveBeenCalledTimes(1);
      expect(component.isOpen()).toBe(false);
      expect(inputEl().value).toBe('2024-01-15');
    });
  });

  describe('Calendar Display', () => {
    it('should generate days for current month', () => {
      const days = component.generateCalendarDays();
      expect(days.length).toBeGreaterThan(28);
      expect(days.length).toBeLessThanOrEqual(42); // Max 6 weeks
    });

    it('should navigate to next month', () => {
      const currentMonth = component.currentMonth();
      component.nextMonth();

      expect(component.currentMonth()).toBe(currentMonth === 11 ? 0 : currentMonth + 1);
    });

    it('should navigate to previous month', () => {
      const currentMonth = component.currentMonth();
      component.previousMonth();

      expect(component.currentMonth()).toBe(currentMonth === 0 ? 11 : currentMonth - 1);
    });

    it('should navigate to today', () => {
      component.goToToday();
      const today = new Date();

      expect(component.currentMonth()).toBe(today.getMonth());
      expect(component.currentYear()).toBe(today.getFullYear());
    });
  });

  describe('Date Constraints', () => {
    it('should respect minDate constraint', () => {
      const minDate = new Date(2024, 0, 10);
      const invalidDate = new Date(2024, 0, 5);

      setInput('minDate', minDate);

      expect(component.isDateDisabled(invalidDate)).toBe(true);
      expect(component.isDateDisabled(new Date(2024, 0, 15))).toBe(false);
    });

    it('should respect maxDate constraint', () => {
      const maxDate = new Date(2024, 0, 20);
      const invalidDate = new Date(2024, 0, 25);

      setInput('maxDate', maxDate);

      expect(component.isDateDisabled(invalidDate)).toBe(true);
      expect(component.isDateDisabled(new Date(2024, 0, 15))).toBe(false);
    });

    it('should compare min/max by calendar day, ignoring the time of day', () => {
      // Regression: `minDate = new Date()` (now, e.g. 14:37) disabled today's
      // midnight cell because the comparison included the time.
      const now = new Date();
      now.setHours(14, 37, 12, 345);
      const todayCell = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const yesterdayCell = new Date(todayCell);
      yesterdayCell.setDate(todayCell.getDate() - 1);
      const tomorrowCell = new Date(todayCell);
      tomorrowCell.setDate(todayCell.getDate() + 1);

      setInput('minDate', now);
      expect(component.isDateDisabled(todayCell)).toBe(false);
      expect(component.isDateDisabled(yesterdayCell)).toBe(true);

      setInput('minDate', undefined);
      setInput('maxDate', new Date(todayCell.getFullYear(), todayCell.getMonth(), todayCell.getDate(), 0, 0, 1));
      expect(component.isDateDisabled(new Date(todayCell.getFullYear(), todayCell.getMonth(), todayCell.getDate(), 23, 59))).toBe(false);
      expect(component.isDateDisabled(tomorrowCell)).toBe(true);
    });

    it('should disable specific dates', () => {
      const disabledDates = [new Date(2024, 0, 10), new Date(2024, 0, 15)];
      setInput('disabledDates', disabledDates);

      expect(component.isDateDisabled(new Date(2024, 0, 10))).toBe(true);
      expect(component.isDateDisabled(new Date(2024, 0, 15))).toBe(true);
      expect(component.isDateDisabled(new Date(2024, 0, 12))).toBe(false);
    });

    it('should disable weekends when specified', () => {
      setInput('disableWeekends', true);

      const saturday = new Date(2024, 0, 6); // Jan 6, 2024 is Saturday
      const sunday = new Date(2024, 0, 7); // Jan 7, 2024 is Sunday
      const monday = new Date(2024, 0, 8);

      expect(component.isDateDisabled(saturday)).toBe(true);
      expect(component.isDateDisabled(sunday)).toBe(true);
      expect(component.isDateDisabled(monday)).toBe(false);
    });
  });

  describe('Variant Styles', () => {
    it.each(['outline', 'filled'] as const)('should apply %s variant class', (variant) => {
      setInput('variant', variant);
      expect(inputEl().classList.contains(`lc-datepicker--${variant}`)).toBe(true);
    });
  });

  describe('Size Styles', () => {
    it.each(['xs', 'sm', 'md', 'lg'] as const)('should apply %s size class', (size) => {
      setInput('size', size);
      expect(inputEl().classList.contains(`lc-datepicker--${size}`)).toBe(true);
    });
  });

  describe('State Management', () => {
    it('should apply disabled state', () => {
      setInput('disabled', true);
      expect(inputEl().classList.contains('lc-datepicker--disabled')).toBe(true);
      expect(inputEl().disabled).toBe(true);
    });

    it('should apply error state', () => {
      setInput('error', true);
      expect(inputEl().classList.contains('lc-datepicker--error')).toBe(true);
    });

    it('should apply readonly state', () => {
      setInput('readonly', true);
      expect(inputEl().classList.contains('lc-datepicker--readonly')).toBe(true);
      expect(inputEl().readOnly).toBe(true);
    });

    it('should not be readonly when readonly is false', () => {
      // Regression: [attr.readonly]="false" rendered readonly="false", which the
      // browser treats as read-only — manual entry was impossible.
      expect(inputEl().readOnly).toBe(false);
      expect(inputEl().hasAttribute('readonly')).toBe(false);
    });

    it('should not open calendar when disabled', () => {
      setInput('disabled', true);
      component.toggle();
      expect(component.isOpen()).toBe(false);
    });

    it('should not open calendar when readonly', () => {
      setInput('readonly', true);
      component.toggle();
      expect(component.isOpen()).toBe(false);
    });
  });

  describe('Calendar Toggle', () => {
    it('should toggle calendar open/closed', () => {
      expect(component.isOpen()).toBe(false);
      component.toggle();
      expect(component.isOpen()).toBe(true);
      component.toggle();
      expect(component.isOpen()).toBe(false);
    });

    it('should open calendar', () => {
      component.open();
      expect(component.isOpen()).toBe(true);
    });

    it('should close calendar', () => {
      component.open();
      component.close();
      expect(component.isOpen()).toBe(false);
    });

    it('should close calendar on outside click', () => {
      component.open();
      component.onClickOutside();
      expect(component.isOpen()).toBe(false);
    });

    it('should emit closed exactly once when the overlay detaches', () => {
      // Regression: close() flipped isOpen, the CDK overlay detached and its
      // (detach) handler called close() a second time -> two `closed` emissions.
      const opened = jest.fn();
      const closed = jest.fn();
      component.opened.subscribe(opened);
      component.closed.subscribe(closed);

      component.open();
      fixture.detectChanges();
      expect(calendarPanel()).toBeTruthy();
      expect(opened).toHaveBeenCalledTimes(1);

      component.close();
      fixture.detectChanges();
      expect(calendarPanel()).toBeFalsy();
      expect(closed).toHaveBeenCalledTimes(1);

      component.close(); // idempotent
      expect(closed).toHaveBeenCalledTimes(1);
    });
  });

  describe('ControlValueAccessor', () => {
    it('should write Date value', () => {
      const date = new Date(2024, 0, 15);
      component.writeValue(date);
      expect(component.selectedDate()).toEqual(date);
      expect(component.inputValue()).toBe('2024-01-15');
    });

    it('should write string value', () => {
      component.writeValue('2024-01-15');
      expect(component.selectedDate()?.getFullYear()).toBe(2024);
      expect(component.selectedDate()?.getMonth()).toBe(0);
      expect(component.selectedDate()?.getDate()).toBe(15);
    });

    it('should write null value', () => {
      component.selectDate(new Date(2024, 0, 15));
      component.writeValue(null);
      expect(component.selectedDate()).toBeNull();
      expect(component.inputValue()).toBe('');
    });

    it('should clear the selection when an unparsable string is written', () => {
      component.selectDate(new Date(2024, 0, 15));
      component.writeValue('not a date');
      expect(component.selectedDate()).toBeNull();
    });

    it('should register onChange callback', () => {
      const onChange = jest.fn();
      component.registerOnChange(onChange);

      const date = new Date(2024, 0, 15);
      component.selectDate(date);
      expect(onChange).toHaveBeenCalledWith(date);
    });

    it('should register onTouched callback', () => {
      const onTouched = jest.fn();
      component.registerOnTouched(onTouched);

      component.onBlur();
      expect(onTouched).toHaveBeenCalled();
    });

    it('should set disabled state without touching the disabled input', () => {
      component.setDisabledState(true);
      expect(component.isDisabled()).toBe(true);
      expect(component.disabled()).toBe(false);

      component.setDisabledState(false);
      expect(component.isDisabled()).toBe(false);
    });

    it('should OR the form disabled state with the disabled input', () => {
      setInput('disabled', true);
      component.setDisabledState(false);
      expect(component.isDisabled()).toBe(true);
    });
  });

  describe('Reactive Forms Integration', () => {
    it('should work with FormControl', () => {
      const date = new Date(2024, 0, 15);
      const control = new FormControl(date);
      component.writeValue(control.value);

      expect(component.selectedDate()).toEqual(date);
    });

    it('should update FormControl on selection', () => {
      const control = new FormControl<Date | null>(null);
      let capturedValue: Date | null = null;

      component.registerOnChange((value) => {
        capturedValue = value;
        control.setValue(value);
      });

      const date = new Date(2024, 0, 15);
      component.selectDate(date);

      expect(capturedValue).toEqual(date);
      expect(control.value).toEqual(date);
    });

    it('should mark as touched on blur', () => {
      const control = new FormControl(null);

      component.registerOnTouched(() => {
        control.markAsTouched();
      });

      component.onBlur();

      expect(control.touched).toBe(true);
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA role', () => {
      expect(inputEl().getAttribute('role')).toBe('combobox');
      expect(inputEl().getAttribute('aria-haspopup')).toBe('dialog');
    });

    it('should have aria-expanded attribute and aria-controls when open', () => {
      expect(inputEl().getAttribute('aria-expanded')).toBe('false');
      expect(inputEl().getAttribute('aria-controls')).toBeNull();

      component.open();
      fixture.detectChanges();
      expect(inputEl().getAttribute('aria-expanded')).toBe('true');
      const controls = inputEl().getAttribute('aria-controls')!;
      expect(document.getElementById(controls)?.getAttribute('role')).toBe('dialog');
    });

    it('should have aria-label when provided', () => {
      setInput('ariaLabel', 'Choose a date');
      expect(inputEl().getAttribute('aria-label')).toBe('Choose a date');
    });

    it('should have aria-required when required', () => {
      setInput('required', true);
      expect(inputEl().getAttribute('aria-required')).toBe('true');
    });

    it('should have aria-disabled when disabled', () => {
      setInput('disabled', true);
      expect(inputEl().getAttribute('aria-disabled')).toBe('true');
    });

    it('should have aria-invalid when error', () => {
      setInput('error', true);
      expect(inputEl().getAttribute('aria-invalid')).toBe('true');
    });

    it('should link helper and error text via aria-describedby', () => {
      expect(inputEl().getAttribute('aria-describedby')).toBeNull();

      setInput('helperText', 'Pick a day');
      const helperId = inputEl().getAttribute('aria-describedby')!;
      expect(document.getElementById(helperId)?.textContent).toContain('Pick a day');

      setInput('error', true);
      setInput('errorMessage', 'Required');
      const errorId = inputEl().getAttribute('aria-describedby')!;
      expect(errorId).not.toBe(helperId);
      expect(document.getElementById(errorId)?.textContent).toContain('Required');
    });

    it('should give day buttons an accessible name and mark today', () => {
      component.currentMonth.set(0);
      component.currentYear.set(2024);
      component.open();
      fixture.detectChanges();

      const buttons = calendarPanel()!.querySelectorAll<HTMLButtonElement>('.lc-datepicker-day');
      expect(buttons.length).toBe(42);
      buttons.forEach((b) => expect(b.getAttribute('aria-label')).toBeTruthy());
      expect(calendarPanel()!.querySelector('[aria-label="Previous month"]')).toBeTruthy();
      expect(calendarPanel()!.querySelector('[aria-label="Next month"]')).toBeTruthy();
    });

    it('should return focus to the input when a day button had focus on close', () => {
      component.open();
      fixture.detectChanges();
      const day = calendarPanel()!.querySelector<HTMLButtonElement>('.lc-datepicker-day:not([disabled])')!;
      day.focus();
      expect(document.activeElement).toBe(day);

      component.close();
      fixture.detectChanges();
      expect(document.activeElement).toBe(inputEl());
    });
  });

  describe('Keyboard Navigation', () => {
    beforeEach(() => {
      // Set initial date without closing the calendar
      component.selectedDate.set(new Date(2024, 0, 15));
      component.open();
    });

    it('should close calendar on Escape and stop propagation', () => {
      const event = new KeyboardEvent('keydown', { key: 'Escape', cancelable: true });
      const stop = jest.spyOn(event, 'stopPropagation');
      component.onKeyDown(event);
      expect(component.isOpen()).toBe(false);
      expect(stop).toHaveBeenCalled();
      expect(event.defaultPrevented).toBe(true);
    });

    it('should not stop Escape propagation while closed', () => {
      component.close();
      const event = new KeyboardEvent('keydown', { key: 'Escape' });
      const stop = jest.spyOn(event, 'stopPropagation');
      component.onKeyDown(event);
      expect(stop).not.toHaveBeenCalled();
    });

    it('should navigate to next day with ArrowRight', () => {
      const event = new KeyboardEvent('keydown', { key: 'ArrowRight' });
      component.onKeyDown(event);

      const date = component.selectedDate();
      expect(date?.getDate()).toBe(16);
    });

    it('should navigate to previous day with ArrowLeft', () => {
      const event = new KeyboardEvent('keydown', { key: 'ArrowLeft' });
      component.onKeyDown(event);

      const date = component.selectedDate();
      expect(date?.getDate()).toBe(14);
    });

    it('should navigate to next week with ArrowDown', () => {
      const event = new KeyboardEvent('keydown', { key: 'ArrowDown' });
      component.onKeyDown(event);

      const date = component.selectedDate();
      expect(date?.getDate()).toBe(22);
    });

    it('should navigate to previous week with ArrowUp', () => {
      const event = new KeyboardEvent('keydown', { key: 'ArrowUp' });
      component.onKeyDown(event);

      const date = component.selectedDate();
      expect(date?.getDate()).toBe(8);
    });

    it('should select date on Enter', () => {
      const onChange = jest.fn();
      component.registerOnChange(onChange);

      const event = new KeyboardEvent('keydown', { key: 'Enter' });
      component.onKeyDown(event);

      expect(onChange).toHaveBeenCalled();
      expect(component.isOpen()).toBe(false);
    });

    it('should leave the arrow keys to the caret while the user is mid-edit', () => {
      component.inputValue.set('2024-01-1');
      const event = new KeyboardEvent('keydown', { key: 'ArrowRight', cancelable: true });
      component.onKeyDown(event);

      expect(component.selectedDate()?.getDate()).toBe(15);
      expect(event.defaultPrevented).toBe(false);
    });

    it('should open on ArrowDown when closed', () => {
      component.close();
      component.onKeyDown(new KeyboardEvent('keydown', { key: 'ArrowDown' }));
      expect(component.isOpen()).toBe(true);
    });
  });

  describe('Helper Text', () => {
    it('should display helper text', () => {
      setInput('helperText', 'Select a date');
      const helper = fixture.nativeElement.querySelector('.lc-datepicker__helper');
      expect(helper?.textContent).toContain('Select a date');
    });

    it('should display error message when in error state', () => {
      setInput('error', true);
      setInput('errorMessage', 'Invalid date');
      const error = fixture.nativeElement.querySelector('.lc-datepicker__error');
      expect(error?.textContent).toContain('Invalid date');
    });

    it('should prioritize error message over helper text', () => {
      setInput('helperText', 'Select a date');
      setInput('error', true);
      setInput('errorMessage', 'Invalid date');

      const error = fixture.nativeElement.querySelector('.lc-datepicker__error');
      const helper = fixture.nativeElement.querySelector('.lc-datepicker__helper');

      expect(error).toBeTruthy();
      expect(helper).toBeFalsy();
    });
  });

  describe('Date Formatting', () => {
    it('should format date according to format string', () => {
      setInput('format', 'MM/DD/YYYY');
      const date = new Date(2024, 0, 15);
      component.selectDate(date);
      fixture.detectChanges();

      expect(component.formattedDate()).toBe('01/15/2024');
      expect(inputEl().value).toBe('01/15/2024');
    });

    it('should re-format the shown text when the format input changes', () => {
      component.selectDate(new Date(2024, 0, 15));
      fixture.detectChanges();
      expect(inputEl().value).toBe('2024-01-15');
      setInput('format', 'DD.MM.YYYY');
      expect(inputEl().value).toBe('15.01.2024');
    });

    it('should parse input date string', () => {
      setInput('format', 'MM/DD/YYYY');
      component.onInputChange('01/15/2024');

      const date = component.selectedDate();
      expect(date?.getFullYear()).toBe(2024);
      expect(date?.getMonth()).toBe(0);
      expect(date?.getDate()).toBe(15);
    });
  });

  describe('Manual entry', () => {
    it('should commit a fully typed date and emit once', () => {
      const dateChange = jest.fn();
      const onChange = jest.fn();
      component.dateChange.subscribe(dateChange);
      component.registerOnChange(onChange);

      type('2024-01-15');

      expect(component.selectedDate()).toEqual(new Date(2024, 0, 15));
      expect(dateChange).toHaveBeenCalledTimes(1);
      expect(onChange).toHaveBeenCalledWith(new Date(2024, 0, 15));
      expect(inputEl().value).toBe('2024-01-15');
      expect(component.currentMonth()).toBe(0);
      expect(component.currentYear()).toBe(2024);
    });

    it('should keep partial input as text without committing a date', () => {
      // Regression: '2024-01-0' was parsed as new Date(2024, 0, 0) = 31 Dec 2023
      // and committed, and the [value] binding then overwrote the text mid-typing.
      const dateChange = jest.fn();
      component.dateChange.subscribe(dateChange);

      type('2024-01-0');

      expect(component.selectedDate()).toBeNull();
      expect(dateChange).not.toHaveBeenCalled();
      expect(inputEl().value).toBe('2024-01-0');
      expect(component.inputValue()).toBe('2024-01-0');
    });

    it('should not commit an impossible date such as Feb 31', () => {
      type('2024-02-31');
      expect(component.selectedDate()).toBeNull();
      expect(inputEl().value).toBe('2024-02-31');
    });

    it('should not commit a typed date that is disabled', () => {
      setInput('disableWeekends', true);
      type('2024-01-06'); // Saturday
      expect(component.selectedDate()).toBeNull();
    });

    it('should not overwrite the text while the user is still typing over an existing date', () => {
      component.writeValue(new Date(2024, 0, 15));
      fixture.detectChanges();
      expect(inputEl().value).toBe('2024-01-15');

      type('2024-01-1');
      expect(inputEl().value).toBe('2024-01-1');
      expect(component.selectedDate()).toEqual(new Date(2024, 0, 15));
    });

    it('should revert partial text to the selected date on blur', () => {
      component.writeValue(new Date(2024, 0, 15));
      type('2024-01-1');

      inputEl().dispatchEvent(new Event('blur'));
      fixture.detectChanges();

      expect(inputEl().value).toBe('2024-01-15');
      expect(component.selectedDate()).toEqual(new Date(2024, 0, 15));
    });

    it('should clear the model when the text is emptied', () => {
      const dateChange = jest.fn();
      component.dateChange.subscribe(dateChange);
      component.writeValue(new Date(2024, 0, 15));

      type('');

      expect(component.selectedDate()).toBeNull();
      expect(dateChange).toHaveBeenCalledWith(null);
    });

    it('should not re-emit when the typed text equals the current selection', () => {
      const dateChange = jest.fn();
      component.dateChange.subscribe(dateChange);
      component.writeValue(new Date(2024, 0, 15));

      type('2024-01-15');

      expect(dateChange).not.toHaveBeenCalled();
    });
  });

  describe('Placeholder', () => {
    it('should display placeholder when no date selected', () => {
      setInput('placeholder', 'Select a date');
      expect(inputEl().getAttribute('placeholder')).toBe('Select a date');
    });

    it('should reflect a placeholder change after init', () => {
      setInput('placeholder', 'First');
      expect(inputEl().placeholder).toBe('First');
      setInput('placeholder', 'Second');
      expect(inputEl().placeholder).toBe('Second');
    });
  });

  describe('Date Comparison', () => {
    it('should check if date is today', () => {
      const today = new Date();
      expect(component.isToday(today)).toBe(true);

      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      expect(component.isToday(yesterday)).toBe(false);
    });

    it('should check if date is selected', () => {
      const date = new Date(2024, 0, 15);
      component.selectDate(date);

      expect(component.isSelectedDate(date)).toBe(true);
      expect(component.isSelectedDate(new Date(2024, 0, 16))).toBe(false);
    });
  });
});

@Component({
  standalone: true,
  imports: [DatepickerComponent, ReactiveFormsModule],
  template: `
    <lc-datepicker [formControl]="control" [readonly]="readonly()" ariaLabel="Host date" />
  `,
})
class HostComponent {
  readonly control = new FormControl<Date | null>(null);
  readonly readonly = signal(false);
}

describe('DatepickerComponent in a reactive form', () => {
  let fixture: ComponentFixture<HostComponent>;
  let host: HostComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [HostComponent] }).compileComponents();
    fixture = TestBed.createComponent(HostComponent);
    host = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => fixture.destroy());

  const inputEl = (): HTMLInputElement => fixture.nativeElement.querySelector('input');
  const picker = (): DatepickerComponent =>
    fixture.debugElement.query(By.directive(DatepickerComponent)).componentInstance;

  it('should disable the input when the control is disabled', () => {
    expect(inputEl().disabled).toBe(false);

    host.control.disable();
    fixture.detectChanges();
    expect(inputEl().disabled).toBe(true);
    expect(inputEl().getAttribute('aria-disabled')).toBe('true');
    picker().toggle();
    expect(picker().isOpen()).toBe(false);

    host.control.enable();
    fixture.detectChanges();
    expect(inputEl().disabled).toBe(false);
  });

  it('should push typed dates into the control and control values into the input', () => {
    inputEl().value = '2024-03-05';
    inputEl().dispatchEvent(new Event('input'));
    fixture.detectChanges();
    expect(host.control.value).toEqual(new Date(2024, 2, 5));

    host.control.setValue(new Date(2025, 11, 24));
    fixture.detectChanges();
    expect(inputEl().value).toBe('2025-12-24');
  });

  it('should toggle the readonly property from the host binding', () => {
    expect(inputEl().readOnly).toBe(false);
    host.readonly.set(true);
    fixture.detectChanges();
    expect(inputEl().readOnly).toBe(true);
    host.readonly.set(false);
    fixture.detectChanges();
    expect(inputEl().readOnly).toBe(false);
  });
});
