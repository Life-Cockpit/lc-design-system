import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Component, signal } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { By } from '@angular/platform-browser';
import { NotificationCenterComponent, Notification } from './notification-center.component';

const now = new Date();
const ago = (mins: number) => new Date(now.getTime() - mins * 60000);

@Component({
  standalone: true,
  imports: [NotificationCenterComponent],
  template: `<lc-notification-center
    [notifications]="notifications()"
    [title]="title()"
    [showFilter]="showFilter()"
    [showTimestamp]="showTimestamp()"
    [showPriority]="showPriority()"
    [emptyMessage]="emptyMessage()"
    [groupByCategory]="groupByCategory()"
    [dateLocale]="dateLocale()"
    (notificationClick)="clicked = $event"
    (notificationDismiss)="dismissed = $event"
    (notificationAction)="actioned = $event"
    (markAllRead)="markedAll = true"
    (clearAll)="clearedAll = true"
  />`,
})
class TestHost {
  notifications = signal<Notification[]>([
    { id: '1', title: 'Deploy success', message: 'v2.1 deployed', type: 'success', timestamp: ago(5), read: false, category: 'CI/CD' },
    { id: '2', title: 'Error in pipeline', type: 'error', timestamp: ago(10), read: false, priority: 'urgent', category: 'CI/CD' },
    { id: '3', title: 'New comment', message: 'Alice commented on PR #42', type: 'info', timestamp: ago(30), read: true, category: 'Code Review', actionLabel: 'View' },
    { id: '4', title: 'Disk warning', type: 'warning', timestamp: ago(120), read: true, priority: 'high' },
  ]);
  title = signal('Notifications');
  showFilter = signal(true);
  showTimestamp = signal(true);
  showPriority = signal(false);
  emptyMessage = signal('No notifications');
  groupByCategory = signal(false);
  dateLocale = signal('de-DE');
  clicked: Notification | null = null;
  dismissed: string | null = null;
  actioned: Notification | null = null;
  markedAll = false;
  clearedAll = false;
}

describe('NotificationCenterComponent', () => {
  let fixture: ComponentFixture<TestHost>;
  let host: TestHost;
  let el: HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [TestHost], providers: [provideHttpClient()] }).compileComponents();
    fixture = TestBed.createComponent(TestHost);
    host = fixture.componentInstance;
    fixture.detectChanges();
    el = fixture.nativeElement;
  });

  it('should create', () => {
    expect(el.querySelector('lc-notification-center')).toBeTruthy();
  });

  it('should show title', () => {
    expect(el.querySelector('.lc-nc__title')?.textContent?.trim()).toBe('Notifications');
  });

  it('should show unread badge', () => {
    const badge = el.querySelector('.lc-nc__badge');
    expect(badge?.textContent?.trim()).toBe('2');
  });

  it('should render notification items', () => {
    expect(el.querySelectorAll('.lc-nc__item').length).toBe(4);
  });

  it('should show notification title', () => {
    const titles = el.querySelectorAll('.lc-nc__item-title');
    // Sorted by priority (urgent first), then timestamp
    expect(titles[0].textContent?.trim()).toBe('Error in pipeline');
  });

  it('should show notification message', () => {
    const messages = el.querySelectorAll('.lc-nc__item-message');
    expect(messages.length).toBeGreaterThan(0);
  });

  it('should highlight unread notifications', () => {
    const unread = el.querySelectorAll('.lc-nc__item--unread');
    expect(unread.length).toBe(2);
  });

  it('should highlight urgent notifications', () => {
    const urgent = el.querySelectorAll('.lc-nc__item--urgent');
    expect(urgent.length).toBe(1);
  });

  it('should show type icons', () => {
    const icons = el.querySelectorAll('.lc-nc__item-icon');
    expect(icons.length).toBe(4);
    // Now uses lc-icon instead of emoji
    expect(icons[0].tagName.toLowerCase()).toBe('lc-icon');
  });

  it('should show timestamps', () => {
    const times = el.querySelectorAll('.lc-nc__item-time');
    expect(times.length).toBe(4);
    expect(times[0].textContent?.trim()).toContain('m ago');
  });

  it('should show action button', () => {
    const action = el.querySelector('.lc-nc__item-action');
    expect(action?.textContent?.trim()).toBe('View');
  });

  it('should show dismiss button on hover', () => {
    const dismiss = el.querySelectorAll('.lc-nc__item-dismiss');
    expect(dismiss.length).toBe(4);
  });

  it('should show category tag', () => {
    const cats = el.querySelectorAll('.lc-nc__item-category');
    expect(cats.length).toBeGreaterThan(0);
  });

  // -- Filters --

  it('should show filter buttons', () => {
    const filters = el.querySelectorAll('.lc-nc__filter');
    expect(filters.length).toBeGreaterThan(1); // All + type filters
  });

  it('should filter by type', () => {
    const errorFilter = Array.from(el.querySelectorAll('.lc-nc__filter')).find(
      f => f.textContent?.includes('Error')
    ) as HTMLElement;
    errorFilter.click();
    fixture.detectChanges();
    expect(el.querySelectorAll('.lc-nc__item').length).toBe(1);
  });

  it('should reset filter to all', () => {
    const errorFilter = Array.from(el.querySelectorAll('.lc-nc__filter')).find(
      f => f.textContent?.includes('Error')
    ) as HTMLElement;
    errorFilter.click();
    fixture.detectChanges();
    const allFilter = el.querySelector('.lc-nc__filter') as HTMLElement;
    allFilter.click();
    fixture.detectChanges();
    expect(el.querySelectorAll('.lc-nc__item').length).toBe(4);
  });

  it('should hide filters when disabled', () => {
    host.showFilter.set(false);
    fixture.detectChanges();
    expect(el.querySelector('.lc-nc__filters')).toBeFalsy();
  });

  // -- Search --

  it('should filter by search query', () => {
    const searchCmp = fixture.debugElement.query(By.css('lc-search-input')).componentInstance;
    searchCmp.searchChange.emit('comment');
    fixture.detectChanges();
    expect(el.querySelectorAll('.lc-nc__item').length).toBe(1);
  });

  // -- Events --

  it('should emit click event', () => {
    const item = el.querySelector('.lc-nc__item') as HTMLElement;
    item.click();
    expect(host.clicked).toBeTruthy();
  });

  it('should emit dismiss event', () => {
    const dismiss = el.querySelector('.lc-nc__item-dismiss') as HTMLElement;
    dismiss.click();
    expect(host.dismissed).toBeTruthy();
  });

  it('should emit action event', () => {
    const action = el.querySelector('.lc-nc__item-action') as HTMLElement;
    action.click();
    expect(host.actioned).toBeTruthy();
  });

  it('should emit markAllRead', () => {
    const btn = Array.from(el.querySelectorAll('.lc-nc__action-btn')).find(
      b => b.textContent?.includes('Mark all read')
    ) as HTMLElement;
    btn.click();
    expect(host.markedAll).toBe(true);
  });

  it('should emit clearAll', () => {
    const btn = Array.from(el.querySelectorAll('.lc-nc__action-btn')).find(
      b => b.textContent?.includes('Clear all')
    ) as HTMLElement;
    btn.click();
    expect(host.clearedAll).toBe(true);
  });

  // -- Empty state --

  it('should show empty state when no notifications', () => {
    host.notifications.set([]);
    fixture.detectChanges();
    expect(el.querySelector('.lc-nc__empty')).toBeTruthy();
    expect(el.querySelector('.lc-nc__empty-text')?.textContent?.trim()).toBe('No notifications');
  });

  it('should hide badge when no unread', () => {
    host.notifications.set([
      { id: '1', title: 'Read one', type: 'info', timestamp: ago(5), read: true },
    ]);
    fixture.detectChanges();
    expect(el.querySelector('.lc-nc__badge')).toBeFalsy();
  });

  // -- Priority --

  it('should show priority labels when enabled', () => {
    host.showPriority.set(true);
    fixture.detectChanges();
    const priorities = el.querySelectorAll('.lc-nc__item-priority');
    expect(priorities.length).toBeGreaterThan(0);
  });

  // -- Group by category --

  it('should group by category', () => {
    host.groupByCategory.set(true);
    fixture.detectChanges();
    const headers = el.querySelectorAll('.lc-nc__group-header');
    expect(headers.length).toBeGreaterThan(0);
  });

  // -- Sort --

  it('should sort urgent items first', () => {
    const titles = el.querySelectorAll('.lc-nc__item-title');
    expect(titles[0].textContent?.trim()).toBe('Error in pipeline'); // urgent priority
  });

  it('should not reorder the caller\'s notifications array while sorting', () => {
    const input = host.notifications();
    const idsBefore = input.map(n => n.id);
    // trigger a re-computation without a filter (the unfiltered path used to sort in place)
    host.showPriority.set(true);
    fixture.detectChanges();
    expect(input.map(n => n.id)).toEqual(idsBefore);
    expect(idsBefore).toEqual(['1', '2', '3', '4']);
  });

  it('should render a single list without group headers when not grouping', () => {
    expect(el.querySelectorAll('.lc-nc__group-header').length).toBe(0);
    expect(el.querySelectorAll('.lc-nc__item').length).toBe(4);
  });

  // -- Keyboard access --

  it('should render the title as a button that activates the row exactly once', () => {
    const title = el.querySelector('.lc-nc__item-title') as HTMLButtonElement;
    expect(title.tagName).toBe('BUTTON');
    const clicks: Notification[] = [];
    fixture.debugElement.query(By.directive(NotificationCenterComponent)).componentInstance
      .notificationClick.subscribe((n: Notification) => clicks.push(n));

    title.click(); // what Enter/Space on a focused button dispatches
    expect(clicks.length).toBe(1);
    expect(clicks[0].title).toBe('Error in pipeline');
  });

  it('should not activate the row when the dismiss or action button is used', () => {
    const clicks: Notification[] = [];
    fixture.debugElement.query(By.directive(NotificationCenterComponent)).componentInstance
      .notificationClick.subscribe((n: Notification) => clicks.push(n));

    (el.querySelector('.lc-nc__item-dismiss') as HTMLElement).click();
    (el.querySelector('.lc-nc__item-action') as HTMLElement).click();
    expect(clicks.length).toBe(0);
    expect(host.dismissed).toBe('2');
    expect(host.actioned?.id).toBe('3');
  });

  it('should label each dismiss button with its notification title', () => {
    const dismiss = el.querySelector('.lc-nc__item-dismiss') as HTMLElement;
    expect(dismiss.getAttribute('aria-label')).toBe('Dismiss notification: Error in pipeline');
  });

  it('should expose the active filter via aria-pressed', () => {
    const [all, error] = Array.from(el.querySelectorAll('.lc-nc__filter')) as HTMLElement[];
    expect(all.getAttribute('aria-pressed')).toBe('true');
    expect(error.getAttribute('aria-pressed')).toBe('false');
    error.click();
    fixture.detectChanges();
    expect(all.getAttribute('aria-pressed')).toBe('false');
    expect(error.getAttribute('aria-pressed')).toBe('true');
  });

  // -- Locale --

  it('should format old dates with the configured locale', () => {
    host.notifications.set([
      { id: 'old', title: 'Old one', type: 'info', timestamp: new Date(2024, 0, 31), read: true },
    ]);
    fixture.detectChanges();
    expect(el.querySelector('.lc-nc__item-time')?.textContent?.trim()).toBe('31.01.2024');

    host.dateLocale.set('en-US');
    fixture.detectChanges();
    expect(el.querySelector('.lc-nc__item-time')?.textContent?.trim()).toBe('01/31/2024');
  });

  // -- Search input --

  it('should show search input', () => {
    expect(el.querySelector('lc-search-input')).toBeTruthy();
  });
});
