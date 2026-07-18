import { Component, input, output, computed, ChangeDetectionStrategy } from '@angular/core';
import { NgClass } from '@angular/common';
import { RouterModule } from '@angular/router';

export interface BreadcrumbItem {
  label: string;
  url?: string;
  /** Optional stable identifier, useful when handling `itemClick`. */
  id?: string;
}

export type BreadcrumbSize = 'sm' | 'md' | 'lg';

@Component({
  selector: 'lc-breadcrumbs',
  imports: [NgClass, RouterModule],
  templateUrl: './breadcrumbs.component.html',
  styleUrls: ['./breadcrumbs.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
/**
 * Breadcrumbs component for hierarchical navigation.
 *
 * Features:
 * - Configurable separator character
 * - Ellipsis collapse for long paths with maxItems
 * - Multiple size variants (sm, md, lg)
 * - Router link support for navigation items
 * - Items without `url` render as buttons and emit `itemClick` (for in-memory
 *   state navigation instead of routing)
 * - Accessible with ARIA breadcrumb landmark
 *
 * @example
 * ```html
 * <lc-breadcrumbs [items]="[{label: 'Home', url: '/'}, {label: 'Settings'}]" />
 *
 * <!-- state-based navigation without routes -->
 * <lc-breadcrumbs
 *   [items]="[{label: 'Root', id: 'root'}, {label: 'Child', id: 'c1'}]"
 *   (itemClick)="activate($event)"
 * />
 * ```
 */
export class BreadcrumbsComponent {
  readonly items = input<BreadcrumbItem[]>([]);
  readonly separator = input('/');
  readonly maxItems = input(0);
  readonly size = input<BreadcrumbSize>('md');
  readonly ariaLabel = input('Breadcrumbs');

  /**
   * Emitted when an item without `url` is activated. Items with `url` keep
   * their link navigation and do not emit.
   */
  readonly itemClick = output<BreadcrumbItem>();

  // Computed CSS classes
  breadcrumbClasses = computed(() => {
    const classes = ['lc-breadcrumbs'];
    classes.push(`lc-breadcrumbs--${this.size()}`);
    return classes.join(' ');
  });

  // Computed visible items with ellipsis support
  visibleItems = computed(() => {
    const allItems = this.items();
    const max = this.maxItems();

    // If maxItems is 0 or items fit, show all
    if (max === 0 || allItems.length <= max) {
      return allItems;
    }

    // Show first item + ellipsis + last item(s)
    const result: BreadcrumbItem[] = [];
    const lastIndex = allItems.length - 1;

    // Always show first item
    result.push(allItems[0]!);

    // Add ellipsis
    result.push({ label: '...' });

    // Always show last item
    result.push(allItems[lastIndex]!);

    return result;
  });

  // Helper to check if item is last
  isLastItem(index: number): boolean {
    return index === this.visibleItems().length - 1;
  }

  // Helper to check if item is ellipsis
  isEllipsis(item: BreadcrumbItem): boolean {
    return item.label === '...';
  }

  // Handle activation of an item without url
  onItemClick(item: BreadcrumbItem): void {
    this.itemClick.emit(item);
  }
}
