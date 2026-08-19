import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Component, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { DateRangePickerComponent, DateRange } from './date-range-picker.component';

@Component({
  standalone: true,
  imports: [DateRangePickerComponent],
  template: `<lc-date-range-picker
    [label]="label()"
    [placeholder]="placeholder()"
    [disabled]="disabled()"
    [minDate]="minDate()"
    [maxDate]="maxDate()"
    [locale]="locale()"
    (rangeChange)="lastRange = $event"
  />`,
})
class TestHost {
  label = signal('');
  placeholder = signal('Select date range');
  disabled = signal(false);
  minDate = signal<Date | null>(null);
  maxDate = signal<Date | null>(null);
  locale = signal('de-DE');
  lastRange: DateRange | null = null;
}

@Component({
  standalone: true,
  imports: [DateRangePickerComponent, ReactiveFormsModule],
  template: `<lc-date-range-picker label="Period" [formControl]="control" />`,
})
class FormHost {
  control = new FormControl<DateRange | null>(null);
}

describe('DateRangePickerComponent', () => {
  let fixture: ComponentFixture<TestHost>;
  let host: TestHost;
  let el: HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [TestHost] }).compileComponents();
    fixture = TestBed.createComponent(TestHost);
    host = fixture.componentInstance;
    fixture.detectChanges();
    el = fixture.nativeElement;
  });

  it('should create', () => {
    expect(el.querySelector('lc-date-range-picker')).toBeTruthy();
  });

  it('should show placeholder', () => {
    expect(el.querySelector('.lc-drp__value')?.textContent?.trim()).toBe('Select date range');
  });

  it('should open calendar on click', () => {
    expect(el.querySelector('.lc-drp__dropdown')).toBeFalsy();
    (el.querySelector('.lc-drp__trigger') as HTMLElement).click();
    fixture.detectChanges();
    expect(el.querySelector('.lc-drp__dropdown')).toBeTruthy();
  });

  it('should render weekday headers', () => {
    (el.querySelector('.lc-drp__trigger') as HTMLElement).click();
    fixture.detectChanges();
    const weekdays = el.querySelectorAll('.lc-drp__weekday');
    expect(weekdays.length).toBe(7);
    expect(weekdays[0].textContent?.trim()).toBe('Mo');
  });

  it('should render 42 calendar days', () => {
    (el.querySelector('.lc-drp__trigger') as HTMLElement).click();
    fixture.detectChanges();
    expect(el.querySelectorAll('.lc-drp__day').length).toBe(42);
  });

  it('should navigate months', () => {
    (el.querySelector('.lc-drp__trigger') as HTMLElement).click();
    fixture.detectChanges();
    const label = el.querySelector('.lc-drp__month')?.textContent?.trim();
    const nextBtn = el.querySelectorAll('.lc-drp__nav')[1] as HTMLElement;
    nextBtn.click();
    fixture.detectChanges();
    const newLabel = el.querySelector('.lc-drp__month')?.textContent?.trim();
    expect(newLabel).not.toBe(label);
  });

  it('should select start date', () => {
    (el.querySelector('.lc-drp__trigger') as HTMLElement).click();
    fixture.detectChanges();
    const inMonthDays = el.querySelectorAll('.lc-drp__day:not(.lc-drp__day--outside)');
    (inMonthDays[0] as HTMLElement).click();
    fixture.detectChanges();
    expect(el.querySelector('.lc-drp__day--start')).toBeTruthy();
  });

  it('should select full range', () => {
    (el.querySelector('.lc-drp__trigger') as HTMLElement).click();
    fixture.detectChanges();
    const inMonthDays = el.querySelectorAll('.lc-drp__day:not(.lc-drp__day--outside)');
    (inMonthDays[4] as HTMLElement).click();
    fixture.detectChanges();
    (inMonthDays[10] as HTMLElement).click();
    fixture.detectChanges();
    expect(host.lastRange).toBeTruthy();
    expect(host.lastRange!.start).toBeTruthy();
    expect(host.lastRange!.end).toBeTruthy();
  });

  it('should close after selecting end date', () => {
    (el.querySelector('.lc-drp__trigger') as HTMLElement).click();
    fixture.detectChanges();
    const inMonthDays = el.querySelectorAll('.lc-drp__day:not(.lc-drp__day--outside)');
    (inMonthDays[0] as HTMLElement).click();
    fixture.detectChanges();
    (inMonthDays[5] as HTMLElement).click();
    fixture.detectChanges();
    expect(el.querySelector('.lc-drp__dropdown')).toBeFalsy();
  });

  it('should show label when provided', () => {
    host.label.set('Period');
    fixture.detectChanges();
    expect(el.querySelector('.lc-drp__label')?.textContent?.trim()).toBe('Period');
  });

  it('should be disabled', () => {
    host.disabled.set(true);
    fixture.detectChanges();
    expect(el.querySelector('.lc-drp__trigger--disabled')).toBeTruthy();
  });

  it('should clear range', () => {
    (el.querySelector('.lc-drp__trigger') as HTMLElement).click();
    fixture.detectChanges();
    const inMonthDays = el.querySelectorAll('.lc-drp__day:not(.lc-drp__day--outside)');
    (inMonthDays[0] as HTMLElement).click();
    fixture.detectChanges();
    (inMonthDays[5] as HTMLElement).click();
    fixture.detectChanges();
    expect(el.querySelector('.lc-drp__clear')).toBeTruthy();
    (el.querySelector('.lc-drp__clear') as HTMLElement).click();
    fixture.detectChanges();
    expect(el.querySelector('.lc-drp__value--placeholder')).toBeTruthy();
  });

  it('should swap dates if end is before start', () => {
    (el.querySelector('.lc-drp__trigger') as HTMLElement).click();
    fixture.detectChanges();
    const inMonthDays = el.querySelectorAll('.lc-drp__day:not(.lc-drp__day--outside)');
    (inMonthDays[10] as HTMLElement).click();
    fixture.detectChanges();
    (inMonthDays[2] as HTMLElement).click();
    fixture.detectChanges();
    expect(host.lastRange!.start!.getTime()).toBeLessThan(host.lastRange!.end!.getTime());
  });

  it('should show hint for selecting', () => {
    (el.querySelector('.lc-drp__trigger') as HTMLElement).click();
    fixture.detectChanges();
    expect(el.querySelector('.lc-drp__hint')?.textContent?.trim()).toContain('start');
  });

  describe('min/max by calendar day', () => {
    const todayCell = (): HTMLButtonElement | null =>
      el.querySelector('.lc-drp__day--today:not(.lc-drp__day--outside)');

    it('should keep today enabled when minDate is `new Date()` (with time of day)', () => {
      host.minDate.set(new Date());
      fixture.detectChanges();
      (el.querySelector('.lc-drp__trigger') as HTMLElement).click();
      fixture.detectChanges();
      const today = todayCell();
      expect(today).toBeTruthy();
      expect(today!.disabled).toBe(false);
      expect(today!.classList.contains('lc-drp__day--disabled')).toBe(false);
      // yesterday is still disabled
      const cells = Array.from(el.querySelectorAll<HTMLButtonElement>('.lc-drp__day'));
      const idx = cells.indexOf(today!);
      if (idx > 0) expect(cells[idx - 1].disabled).toBe(true);
    });

    it('should keep today enabled when maxDate is midnight today', () => {
      const now = new Date();
      host.maxDate.set(new Date(now.getFullYear(), now.getMonth(), now.getDate()));
      fixture.detectChanges();
      (el.querySelector('.lc-drp__trigger') as HTMLElement).click();
      fixture.detectChanges();
      const today = todayCell();
      expect(today!.disabled).toBe(false);
      const cells = Array.from(el.querySelectorAll<HTMLButtonElement>('.lc-drp__day'));
      const idx = cells.indexOf(today!);
      if (idx < cells.length - 1) expect(cells[idx + 1].disabled).toBe(true);
    });
  });

  describe('trigger, keyboard and ARIA', () => {
    it('should render the trigger as a real button with popup semantics', () => {
      host.label.set('Period');
      fixture.detectChanges();
      const trigger = el.querySelector('.lc-drp__trigger') as HTMLButtonElement;
      expect(trigger.tagName).toBe('BUTTON');
      expect(trigger.type).toBe('button');
      expect(trigger.getAttribute('aria-haspopup')).toBe('dialog');
      expect(trigger.getAttribute('aria-expanded')).toBe('false');
      const label = el.querySelector('label') as HTMLLabelElement;
      expect(label.htmlFor).toBe(trigger.id);
      expect(trigger.getAttribute('aria-labelledby')).toContain(label.id);

      trigger.focus();
      trigger.click();
      fixture.detectChanges();
      expect(trigger.getAttribute('aria-expanded')).toBe('true');
      const panel = el.querySelector('.lc-drp__dropdown') as HTMLElement;
      expect(panel.getAttribute('role')).toBe('dialog');
      expect(trigger.getAttribute('aria-controls')).toBe(panel.id);
      // clear button is a sibling of the trigger, never nested inside it
      expect(trigger.querySelector('button')).toBeNull();
      // focus moves onto a day cell (today) and returns to the trigger on close
      expect((document.activeElement as HTMLElement).classList.contains('lc-drp__day--today')).toBe(true);
      document.activeElement!.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
      fixture.detectChanges();
      expect(document.activeElement).toBe(trigger);
    });

    it('should label the month navigation buttons', () => {
      (el.querySelector('.lc-drp__trigger') as HTMLElement).click();
      fixture.detectChanges();
      const navs = el.querySelectorAll('.lc-drp__nav');
      expect(navs[0].getAttribute('aria-label')).toBe('Previous month');
      expect(navs[1].getAttribute('aria-label')).toBe('Next month');
    });

    it('should close on Escape and stop propagation, and only when open', () => {
      const outer = jest.fn();
      document.addEventListener('keydown', outer);
      const trigger = el.querySelector('.lc-drp__trigger') as HTMLElement;

      trigger.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true }));
      expect(outer).toHaveBeenCalledTimes(1); // closed: not consumed

      trigger.click();
      fixture.detectChanges();
      expect(el.querySelector('.lc-drp__dropdown')).toBeTruthy();
      const nav = el.querySelector('.lc-drp__nav') as HTMLElement;
      nav.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true }));
      fixture.detectChanges();
      expect(el.querySelector('.lc-drp__dropdown')).toBeFalsy();
      expect(outer).toHaveBeenCalledTimes(1); // open: consumed
      document.removeEventListener('keydown', outer);
    });

    it('should close on outside click but not on inside click', () => {
      (el.querySelector('.lc-drp__trigger') as HTMLElement).click();
      fixture.detectChanges();
      (el.querySelector('.lc-drp__month') as HTMLElement).click();
      fixture.detectChanges();
      expect(el.querySelector('.lc-drp__dropdown')).toBeTruthy();

      document.body.click();
      fixture.detectChanges();
      expect(el.querySelector('.lc-drp__dropdown')).toBeFalsy();
    });

    it('should format weekdays and month title in the given locale', () => {
      host.locale.set('en-US');
      fixture.detectChanges();
      (el.querySelector('.lc-drp__trigger') as HTMLElement).click();
      fixture.detectChanges();
      const weekdays = el.querySelectorAll('.lc-drp__weekday');
      expect(weekdays[0].textContent?.trim()).toBe('Mon');
      expect(weekdays[6].textContent?.trim()).toBe('Sun');
      const monthLabel = el.querySelector('.lc-drp__month')?.textContent?.trim() ?? '';
      expect(monthLabel).toBe(new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' }));
    });
  });
});

describe('DateRangePickerComponent with FormControl', () => {
  let fixture: ComponentFixture<FormHost>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [FormHost] }).compileComponents();
    fixture = TestBed.createComponent(FormHost);
    fixture.detectChanges();
  });

  it('should implement setDisabledState (control.disable() disables the trigger)', () => {
    const el: HTMLElement = fixture.nativeElement;
    const trigger = el.querySelector('.lc-drp__trigger') as HTMLButtonElement;
    expect(trigger.disabled).toBe(false);

    fixture.componentInstance.control.disable();
    fixture.detectChanges();
    expect(trigger.disabled).toBe(true);
    expect(el.querySelector('.lc-drp__field--disabled')).toBeTruthy();
    trigger.click();
    fixture.detectChanges();
    expect(el.querySelector('.lc-drp__dropdown')).toBeFalsy();

    fixture.componentInstance.control.enable();
    fixture.detectChanges();
    expect(trigger.disabled).toBe(false);
  });

  it('should write the control value into the trigger and propagate a picked range', () => {
    const el: HTMLElement = fixture.nativeElement;
    const { control } = fixture.componentInstance;
    control.setValue({ start: new Date(2024, 0, 3), end: new Date(2024, 0, 9) });
    fixture.detectChanges();
    expect(el.querySelector('.lc-drp__value')?.textContent).toContain('03.01.2024');

    (el.querySelector('.lc-drp__trigger') as HTMLElement).click();
    fixture.detectChanges();
    const days = el.querySelectorAll<HTMLButtonElement>('.lc-drp__day:not(.lc-drp__day--outside)');
    days[0].click();
    fixture.detectChanges();
    days[4].click();
    fixture.detectChanges();
    expect(control.value?.start?.getDate()).toBe(1);
    expect(control.value?.end?.getDate()).toBe(5);
  });
});
