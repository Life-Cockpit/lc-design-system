import {
  Component,
  input,
  model,
  contentChildren,
  viewChild,
  viewChildren,
  computed,
  effect,
  untracked,
  ChangeDetectionStrategy,
  ViewEncapsulation,
  TemplateRef,
  ElementRef,
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
  readonly template = viewChild.required(TemplateRef);
}

/**
 * Tabs component for organizing content into switchable views.
 *
 * Features:
 * - Dynamic tab registration via content projection (tabs added or removed
 *   after init are picked up automatically)
 * - Active tab tracking with two-way binding (`[(selectedIndex)]`)
 * - Accessible with ARIA tablist/tab/tabpanel roles
 * - Keyboard navigation between tabs (arrow keys, Home, End) moves both the
 *   selection and DOM focus
 * - Lazy content rendering per tab
 * - Optional badge per tab (counts or status labels)
 *
 * @example
 * ```html
 * <lc-tabs [(selectedIndex)]="active">
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
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'lc-tabs',
  },
})
export class TabsComponent {
  /**
   * Orientation of tabs
   * @default 'horizontal'
   */
  readonly orientation = input<TabOrientation>('horizontal');

  /**
   * Currently selected tab index. Two-way bindable via `[(selectedIndex)]`;
   * `selectedIndexChange` emits only when the selection actually changes
   * (never during initialisation).
   * @default 0
   */
  readonly selectedIndex = model(0);

  /**
   * Legacy one-way input for the selected index.
   * @deprecated Bind `[selectedIndex]` / `[(selectedIndex)]` instead.
   */
  readonly selectedIndexInput = input<number | undefined>(undefined);

  /**
   * Projected tab components (signal query — updates when tabs are added or
   * removed after init).
   */
  readonly tabs = contentChildren(TabComponent);

  /**
   * Tab list for template access
   */
  readonly tabList = computed(() => this.tabs());

  /**
   * Rendered tab buttons — used to move DOM focus on keyboard navigation.
   */
  private readonly tabButtons = viewChildren<ElementRef<HTMLButtonElement>>('tabButton');

  /**
   * CSS classes for tab list
   */
  readonly tabListClasses = computed(() => ({
    'lc-tabs__list': true,
    'lc-tabs--horizontal': this.orientation() === 'horizontal',
    'lc-tabs--vertical': this.orientation() === 'vertical',
  }));

  constructor() {
    // Mirror the deprecated one-way input into the model. `model.set` is a
    // no-op (no emit) when the value is unchanged, so binding the same index
    // does not fire `selectedIndexChange`.
    effect(() => {
      const legacy = this.selectedIndexInput();
      if (legacy !== undefined) {
        untracked(() => this.selectedIndex.set(legacy));
      }
    });

    // Keep the selection valid when tabs are removed at runtime: falling off
    // the end would leave no panel visible and no tab reachable via Tab.
    effect(() => {
      const count = this.tabs().length;
      const index = untracked(() => this.selectedIndex());
      if (count > 0 && index >= count) {
        untracked(() => this.selectTab(this.getLastEnabledTab()));
      }
    });
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
   * Handle keyboard navigation (automatic activation: focus and selection
   * move together).
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
      this.focusTab(nextIndex);
    }
  }

  /**
   * Get tabindex for tab button
   */
  getTabIndex(index: number): number {
    return this.isSelected(index) ? 0 : -1;
  }

  /**
   * Move DOM focus to the tab button at `index` (roving tabindex).
   */
  private focusTab(index: number): void {
    this.tabButtons()[index]?.nativeElement.focus();
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
