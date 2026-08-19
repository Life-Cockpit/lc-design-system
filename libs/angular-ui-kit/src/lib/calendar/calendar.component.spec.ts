import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Component, signal } from '@angular/core';
import { CalendarComponent, CalendarView } from './calendar.component';

describe('CalendarComponent', () => {
  let fixture: ComponentFixture<CalendarComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [CalendarComponent] }).compileComponents();
    fixture = TestBed.createComponent(CalendarComponent);
  });

  it('should create', () => {
    fixture.detectChanges();
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should render month view by default', () => {
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.lc-calendar__month')).toBeTruthy();
  });

  it('should render 7 weekday headers', () => {
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelectorAll('.lc-calendar__weekday').length).toBe(7);
  });

  it('should render 6 week rows', () => {
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelectorAll('.lc-calendar__week-row').length).toBe(6);
  });

  it('should render week view', () => {
    fixture.componentRef.setInput('view', 'week');
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.lc-calendar__time-grid')).toBeTruthy();
    expect(fixture.nativeElement.querySelectorAll('.lc-calendar__time-col-header').length).toBe(7);
  });

  it('should render day view', () => {
    fixture.componentRef.setInput('view', 'day');
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.lc-calendar__time-grid--day')).toBeTruthy();
  });

  it('should display events in month view', () => {
    const today = new Date();
    fixture.componentRef.setInput('events', [
      { id: '1', title: 'Test Event', start: today, end: today },
    ]);
    fixture.detectChanges();
    const dots = fixture.nativeElement.querySelectorAll('.lc-calendar__event-dot');
    expect(dots.length).toBeGreaterThanOrEqual(1);
  });

  it('should display view toggle buttons', () => {
    fixture.detectChanges();
    const buttons = fixture.nativeElement.querySelectorAll('.lc-calendar__view-toggle button');
    expect(buttons.length).toBe(3);
  });

  it('should navigate and update header title', () => {
    fixture.detectChanges();
    const title1 = fixture.nativeElement.querySelector('.lc-calendar__title').textContent;
    const nextBtn = fixture.nativeElement.querySelectorAll('.lc-calendar__nav-btn')[1];
    nextBtn.click();
    fixture.detectChanges();
    const title2 = fixture.nativeElement.querySelector('.lc-calendar__title').textContent;
    expect(title1).not.toBe(title2);
  });
});

describe('CalendarComponent accessibility', () => {
  let fixture: ComponentFixture<CalendarComponent>;

  const today = new Date();
  const at = (h: number, m = 0) => new Date(today.getFullYear(), today.getMonth(), today.getDate(), h, m);

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [CalendarComponent] }).compileComponents();
    fixture = TestBed.createComponent(CalendarComponent);
    fixture.componentRef.setInput('events', [
      { id: '1', title: 'Placeholder event', start: at(9), end: at(10), color: 'info' },
    ]);
  });

  it('should render month day cells as keyboard-activatable buttons with accessible names', () => {
    const dateClick = jest.fn();
    fixture.componentInstance.dateClick.subscribe(dateClick);
    fixture.detectChanges();

    const dayButtons = fixture.nativeElement.querySelectorAll('button.lc-calendar__day-number');
    expect(dayButtons.length).toBe(42);
    dayButtons.forEach((b: HTMLButtonElement) => {
      expect(b.getAttribute('type')).toBe('button');
      expect(b.getAttribute('aria-label')).toBeTruthy();
    });

    // Buttons are activated by Enter/Space through the native click; a click must emit exactly once
    // (the surrounding cell also listens for clicks).
    (dayButtons[10] as HTMLButtonElement).click();
    expect(dateClick).toHaveBeenCalledTimes(1);
    expect(dateClick.mock.calls[0][0]).toBeInstanceOf(Date);
  });

  it('should mark today with aria-current', () => {
    fixture.detectChanges();
    const current = fixture.nativeElement.querySelectorAll('button.lc-calendar__day-number[aria-current="date"]');
    expect(current.length).toBe(1);
  });

  it('should render events as buttons named after the event and emit eventClick only', () => {
    const dateClick = jest.fn();
    const eventClick = jest.fn();
    fixture.componentInstance.dateClick.subscribe(dateClick);
    fixture.componentInstance.eventClick.subscribe(eventClick);
    fixture.detectChanges();

    const evt = fixture.nativeElement.querySelector('button.lc-calendar__event-dot') as HTMLButtonElement;
    expect(evt).toBeTruthy();
    expect(evt.getAttribute('aria-label')).toContain('Placeholder event');
    evt.click();
    expect(eventClick).toHaveBeenCalledTimes(1);
    expect(eventClick.mock.calls[0][0].id).toBe('1');
    expect(dateClick).not.toHaveBeenCalled();
  });

  it('should render week/day view events and week column headers as buttons', () => {
    fixture.componentRef.setInput('view', 'week');
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelectorAll('button.lc-calendar__time-col-header').length).toBe(7);
    expect(fixture.nativeElement.querySelector('button.lc-calendar__time-event')).toBeTruthy();

    fixture.componentRef.setInput('view', 'day');
    fixture.detectChanges();
    const evt = fixture.nativeElement.querySelector('button.lc-calendar__time-event') as HTMLButtonElement;
    expect(evt).toBeTruthy();
    expect(evt.getAttribute('aria-label')).toContain('Placeholder event');
  });

  it('should label the navigation buttons and allow overriding UI strings', () => {
    fixture.detectChanges();
    const nav = fixture.nativeElement.querySelectorAll('.lc-calendar__nav-btn');
    expect(nav[0].getAttribute('aria-label')).toBe('Zurück');
    expect(nav[1].getAttribute('aria-label')).toBe('Weiter');
    expect(fixture.nativeElement.querySelector('.lc-calendar__today-btn').textContent.trim()).toBe('Heute');

    fixture.componentRef.setInput('labels', { previous: 'Previous', next: 'Next', today: 'Today', month: 'Month' });
    fixture.detectChanges();
    expect(nav[0].getAttribute('aria-label')).toBe('Previous');
    expect(nav[1].getAttribute('aria-label')).toBe('Next');
    expect(fixture.nativeElement.querySelector('.lc-calendar__today-btn').textContent.trim()).toBe('Today');
    const toggles = fixture.nativeElement.querySelectorAll('.lc-calendar__view-toggle button');
    expect(toggles[2].textContent.trim()).toBe('Month');
    expect(toggles[0].textContent.trim()).toBe('Tag'); // untouched keys keep their default
  });

  it('should switch the view from the toggle and emit viewChange', () => {
    const viewChange = jest.fn();
    // `view` is a model(): its change notifications back the (viewChange) output.
    fixture.componentInstance.view.subscribe(viewChange);
    fixture.detectChanges();

    const toggles = fixture.nativeElement.querySelectorAll('.lc-calendar__view-toggle button');
    expect(toggles[2].getAttribute('aria-pressed')).toBe('true');
    (toggles[1] as HTMLButtonElement).click();
    fixture.detectChanges();

    expect(viewChange).toHaveBeenCalledWith('week');
    expect(fixture.componentInstance.view()).toBe('week');
    expect(toggles[1].getAttribute('aria-pressed')).toBe('true');
    expect(fixture.nativeElement.querySelector('.lc-calendar__time-grid')).toBeTruthy();
  });

  it('should format the accessible day name in the given locale', () => {
    fixture.componentRef.setInput('locale', 'en-US');
    fixture.detectChanges();
    const first = fixture.nativeElement.querySelector('button.lc-calendar__day-number') as HTMLButtonElement;
    expect(first.getAttribute('aria-label')).toMatch(/^(Sunday|Monday|Tuesday|Wednesday|Thursday|Friday|Saturday), /);
  });
});

@Component({
  standalone: true,
  imports: [CalendarComponent],
  template: `<lc-calendar [(view)]="view" (viewChange)="changes.push($event)" [labels]="{ today: 'Today' }" />`,
})
class CalendarHostComponent {
  readonly view = signal<CalendarView>('month');
  readonly changes: CalendarView[] = [];
}

describe('CalendarComponent view binding', () => {
  it('should support [(view)] and (viewChange) from a host', async () => {
    await TestBed.configureTestingModule({ imports: [CalendarHostComponent] }).compileComponents();
    const fixture = TestBed.createComponent(CalendarHostComponent);
    fixture.detectChanges();

    const toggles = fixture.nativeElement.querySelectorAll('.lc-calendar__view-toggle button');
    (toggles[0] as HTMLButtonElement).click();
    fixture.detectChanges();

    expect(fixture.componentInstance.view()).toBe('day');
    expect(fixture.componentInstance.changes).toEqual(['day']);
    expect(fixture.nativeElement.querySelector('.lc-calendar__time-grid--day')).toBeTruthy();

    // Host-driven change flows back into the calendar.
    fixture.componentInstance.view.set('week');
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelectorAll('.lc-calendar__time-col-header').length).toBe(7);
  });
});
