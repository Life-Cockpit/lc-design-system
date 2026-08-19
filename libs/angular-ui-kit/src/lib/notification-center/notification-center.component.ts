import {
  ChangeDetectionStrategy,
  Component,
  input,
  signal,
  computed,
  output,
} from '@angular/core';
import { IconComponent } from '../icon/icon.component';
import { SearchInputComponent } from '../search-input/search-input.component';

export type NotificationType = 'info' | 'success' | 'warning' | 'error';
export type NotificationPriority = 'low' | 'normal' | 'high' | 'urgent';

export interface Notification {
  id: string;
  title: string;
  message?: string;
  type?: NotificationType;
  priority?: NotificationPriority;
  timestamp: Date;
  read?: boolean;
  icon?: string;
  category?: string;
  actionLabel?: string;
  actionUrl?: string;
}

const TYPE_ICONS: Record<NotificationType, string> = {
  info: 'information-circle',
  success: 'check-circle',
  warning: 'exclamation-triangle',
  error: 'x-circle',
};

const PRIORITY_LABELS: Record<NotificationPriority, string> = {
  low: 'Low',
  normal: 'Normal',
  high: 'High',
  urgent: 'Urgent',
};

@Component({
  selector: 'lc-notification-center',
  standalone: true,
  imports: [IconComponent, SearchInputComponent],
  templateUrl: './notification-center.component.html',
  styleUrls: ['./notification-center.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NotificationCenterComponent {
  readonly notifications = input.required<Notification[]>();
  readonly title = input('Notifications');
  readonly showFilter = input(true);
  readonly showTimestamp = input(true);
  readonly showPriority = input(false);
  readonly emptyMessage = input('No notifications');
  readonly maxHeight = input('480px');
  readonly groupByCategory = input(false);
  /** Locale used for absolute dates (older than a week). */
  readonly dateLocale = input('de-DE');

  readonly notificationClick = output<Notification>();
  readonly notificationDismiss = output<string>();
  readonly notificationAction = output<Notification>();
  readonly markAllRead = output<void>();
  readonly clearAll = output<void>();

  protected activeFilter = signal<NotificationType | 'all'>('all');
  protected searchQuery = signal('');

  protected readonly unreadCount = computed(() =>
    this.notifications().filter(n => !n.read).length
  );

  protected readonly filteredNotifications = computed(() => {
    let items = this.notifications();
    const filter = this.activeFilter();
    const query = this.searchQuery().toLowerCase().trim();

    if (filter !== 'all') {
      items = items.filter(n => n.type === filter);
    }

    if (query) {
      items = items.filter(
        n =>
          n.title.toLowerCase().includes(query) ||
          n.message?.toLowerCase().includes(query) ||
          n.category?.toLowerCase().includes(query)
      );
    }

    // Copy before sorting: without a filter `items` is the caller's array and
    // `sort` would reorder it in place
    return [...items].sort((a, b) => {
      const prio = this.priorityWeight(b.priority) - this.priorityWeight(a.priority);
      if (prio !== 0) return prio;
      return b.timestamp.getTime() - a.timestamp.getTime();
    });
  });

  /**
   * The list as rendered: one group per category, or a single group without a
   * category (`null`, no header) when grouping is off.
   */
  protected readonly groupedNotifications = computed((): { category: string | null; items: Notification[] }[] => {
    const items = this.filteredNotifications();
    if (!this.groupByCategory()) return [{ category: null, items }];
    const map = new Map<string, Notification[]>();
    for (const n of items) {
      const cat = n.category || 'Other';
      if (!map.has(cat)) map.set(cat, []);
      map.get(cat)!.push(n);
    }
    return Array.from(map.entries()).map(([category, items]) => ({ category, items }));
  });

  protected readonly filterCounts = computed(() => {
    const items = this.notifications();
    return {
      all: items.length,
      info: items.filter(n => n.type === 'info').length,
      success: items.filter(n => n.type === 'success').length,
      warning: items.filter(n => n.type === 'warning').length,
      error: items.filter(n => n.type === 'error').length,
    };
  });

  protected readonly hasNotifications = computed(() => this.filteredNotifications().length > 0);

  protected getTypeIcon(type?: NotificationType): string {
    return type ? TYPE_ICONS[type] : 'information-circle';
  }

  protected getPriorityLabel(priority?: NotificationPriority): string {
    return priority ? PRIORITY_LABELS[priority] : '';
  }

  protected formatTime(date: Date): string {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString(this.dateLocale(), { day: '2-digit', month: '2-digit', year: 'numeric' });
  }

  protected setFilter(filter: NotificationType | 'all'): void {
    this.activeFilter.set(filter);
  }

  protected onSearch(query: string): void {
    this.searchQuery.set(query);
  }

  protected onClick(notification: Notification): void {
    this.notificationClick.emit(notification);
  }

  protected onDismiss(id: string, event: Event): void {
    event.stopPropagation();
    this.notificationDismiss.emit(id);
  }

  protected onAction(notification: Notification, event: Event): void {
    event.stopPropagation();
    this.notificationAction.emit(notification);
  }

  protected onMarkAllRead(): void {
    this.markAllRead.emit();
  }

  protected onClearAll(): void {
    this.clearAll.emit();
  }

  private priorityWeight(p?: NotificationPriority): number {
    switch (p) {
      case 'urgent': return 4;
      case 'high': return 3;
      case 'normal': return 2;
      case 'low': return 1;
      default: return 2;
    }
  }
}
