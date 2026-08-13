import {
  Component,
  input,
  output,
  ContentChildren,
  QueryList,
  AfterContentInit,
  signal,
  computed,
  effect,
  ChangeDetectionStrategy,
  ViewEncapsulation,
  ViewChild,
  TemplateRef,
} from '@angular/core';
import { NgClass, NgTemplateOutlet } from '@angular/common';
import { BadgeComponent, BadgeVariant } from '../badge/badge.component';

let nextUniqueId = 0;

export type TabOrientation = 'horizontal' | 'vertical';

/**
 * Individual tab component
 */
@Component({
  selector: 'lc-tab',
  standalone: true,
  imports: [],
  template: `
    <ng-template>
      <ng-content></ng-content>
    </ng-template>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TabComponent {
  /**
   * Tab label displayed in tab button
   */
  readonly label = input('');

  /**
   * Whether the tab is disabled
   * @default false
   */
  readonly disabled = input(false);

  /**
   * Optional icon name (Tabler Icons)
   */
  readonly icon = input<string | undefined>();

  /**
   * Optional badge content shown after the label (e.g. a count or "New").
   * `0` is rendered; `undefined`, `null`, and `''` hide the badge.
   */
  readonly badge = input<string | number | undefined | null>();

  /**
   * Badge color variant
   * @default 'default'
   */
  readonly badgeVariant = input<BadgeVariant>('default');

  /**
   * Whether the badge should be rendered
   */
  readonly hasBadge = computed(() => {
    const badge = this.badge();
    return badge !== undefined && badge !== null && badge !== '';
  });

  /**
   * Unique ID for accessibility
   */
  readonly id = `lc-tab-${nextUniqueId++}`;

  /**
   * Unique ID for the panel
   */
  readonly panelId = `lc-tabpanel-${this.id}`;

  /**
   * Template reference for tab content
   */
  @ViewChild(TemplateRef, { static: true }) template!: TemplateRef<unknown>;
}

/**
 * Tabs component for organizing content into switchable views.
 *
 * Features:
 * - Dynamic tab registration via content projection
 * - Active tab tracking with two-way binding
 * - Accessible with ARIA tablist/tab/tabpanel roles
 * - Keyboard navigation between tabs
 * - Lazy content rendering per tab
 * - Optional badge per tab (counts or status labels)
 *
 * @example
 * ```html
 * <lc-tabs>
 *   <lc-tab label="Account">Account settings</lc-tab>
 *   <lc-tab label="Inbox" [badge]="12" badgeVariant="primary">Messages</lc-tab>
 *   <lc-tab label="Security">Security settings</lc-tab>
 * </lc-tabs>
 * ```
 */
@Component({
  selector: 'lc-tabs',
  standalone: true,
  imports: [NgClass, NgTemplateOutlet, BadgeComponent],
  templateUrl: './tabs.component.html',
  styleUrl: './tabs.component.scss',
  // eslint-disable-next-line @angular-eslint/use-component-view-encapsulation
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'lc-tabs',
  },
})
export class TabsComponent implements AfterContentInit {
  /**
   * Orientation of tabs
   * @default 'horizontal'
   */
  readonly orientation = input<TabOrientation>('horizontal');

  /**
   * Currently selected tab index (external input)
   * @default 0
   */
  readonly selectedIndexInput = input(0);

  /**
   * Currently selected tab index (internal writable signal)
   */
  readonly selectedIndex = signal(0);

  /**
   * Emitted when selected tab changes
   */
  readonly selectedIndexChange = output<number>();

  /**
   * Tab components
   */
  @ContentChildren(TabComponent) tabs!: QueryList<TabComponent>;

  /**
   * Tab list for template access
   */
  readonly tabList = computed(() => this.tabs?.toArray() || []);

  /**
   * CSS classes for tab list
   */
  readonly tabListClasses = computed(() => ({
    'lc-tabs__list': true,
    'lc-tabs--horizontal': this.orientation() === 'horizontal',
    'lc-tabs--vertical': this.orientation() === 'vertical',
  }));

  /**
   * Track tab registration
   */
  private registeredTabs: Array<{ label: string; disabled: boolean }> = [];

  constructor() {
    // Sync external selectedIndexInput to internal selectedIndex
    effect(() => {
      this.selectedIndex.set(this.selectedIndexInput());
    });
    // Emit when selection changes
    effect(() => {
      const index = this.selectedIndex();
      this.selectedIndexChange.emit(index);
    });
  }

  ngAfterContentInit(): void {
    // Register all tabs
    this.tabs.forEach((tab) => {
      this.registerTab({ label: tab.label(), disabled: tab.disabled() });
    });

    // Listen for tab changes
    this.tabs.changes.subscribe(() => {
      this.registeredTabs = [];
      this.tabs.forEach((tab) => {
        this.registerTab({ label: tab.label(), disabled: tab.disabled() });
      });
    });
  }

  /**
   * Register a tab
   */
  registerTab(tab: { label: string; disabled: boolean }): void {
    this.registeredTabs.push(tab);
  }

  /**
   * Select a tab by index
   */
  selectTab(index: number): void {
    const tabs = this.tabList();
    const tab = tabs[index];
    if (index >= 0 && index < tabs.length && tab && !tab.disabled()) {
      this.selectedIndex.set(index);
    }
  }

  /**
   * Check if tab is selected
   */
  isSelected(index: number): boolean {
    return this.selectedIndex() === index;
  }

  /**
   * Handle keyboard navigation
   */
  handleKeyDown(event: KeyboardEvent): void {
    const currentIndex = this.selectedIndex();
    let nextIndex = currentIndex;

    const isHorizontal = this.orientation() === 'horizontal';
    const nextKey = isHorizontal ? 'ArrowRight' : 'ArrowDown';
    const prevKey = isHorizontal ? 'ArrowLeft' : 'ArrowUp';

    switch (event.key) {
      case nextKey:
        event.preventDefault();
        nextIndex = this.getNextEnabledTab(currentIndex);
        break;

      case prevKey:
        event.preventDefault();
        nextIndex = this.getPreviousEnabledTab(currentIndex);
        break;

      case 'Home':
        event.preventDefault();
        nextIndex = this.getFirstEnabledTab();
        break;

      case 'End':
        event.preventDefault();
        nextIndex = this.getLastEnabledTab();
        break;

      default:
        return;
    }

    if (nextIndex !== currentIndex) {
      this.selectTab(nextIndex);
    }
  }

  /**
   * Get tabindex for tab button
   */
  getTabIndex(index: number): number {
    return this.isSelected(index) ? 0 : -1;
  }

  /**
   * Get next enabled tab index (with wrapping)
   */
  private getNextEnabledTab(currentIndex: number): number {
    const tabs = this.tabList();
    let nextIndex = (currentIndex + 1) % tabs.length;
    const startIndex = nextIndex;

    while (tabs[nextIndex]?.disabled()) {
      nextIndex = (nextIndex + 1) % tabs.length;
      if (nextIndex === startIndex) {
        return currentIndex; // No enabled tabs found
      }
    }

    return nextIndex;
  }

  /**
   * Get previous enabled tab index (with wrapping)
   */
  private getPreviousEnabledTab(currentIndex: number): number {
    const tabs = this.tabList();
    let prevIndex = currentIndex - 1;
    if (prevIndex < 0) {
      prevIndex = tabs.length - 1;
    }
    const startIndex = prevIndex;

    while (tabs[prevIndex]?.disabled()) {
      prevIndex = prevIndex - 1;
      if (prevIndex < 0) {
        prevIndex = tabs.length - 1;
      }
      if (prevIndex === startIndex) {
        return currentIndex; // No enabled tabs found
      }
    }

    return prevIndex;
  }

  /**
   * Get first enabled tab index
   */
  private getFirstEnabledTab(): number {
    const tabs = this.tabList();
    for (let i = 0; i < tabs.length; i++) {
      const tab = tabs[i];
      if (tab && !tab.disabled()) {
        return i;
      }
    }
    return 0;
  }

  /**
   * Get last enabled tab index
   */
  private getLastEnabledTab(): number {
    const tabs = this.tabList();
    for (let i = tabs.length - 1; i >= 0; i--) {
      const tab = tabs[i];
      if (tab && !tab.disabled()) {
        return i;
      }
    }
    return tabs.length - 1;
  }
}
