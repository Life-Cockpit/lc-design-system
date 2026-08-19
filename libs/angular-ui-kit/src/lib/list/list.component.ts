import {
  Component,
  ChangeDetectionStrategy,
  input,
  computed,
  contentChild,
  output,
} from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { IconComponent } from '../icon/icon.component';
import { ButtonComponent } from '../button/button.component';
import { ListItemTemplateDirective } from './list-item-template.directive';

/**
 * List orientation type
 */
export type ListOrientation = 'vertical' | 'horizontal';

/**
 * List visual variant
 *  - default: flat rows (original)
 *  - card: each item rendered as a mini-card with border, radius and shadow on hover
 */
export type ListVariant = 'default' | 'card';

/**
 * List item interface
 */
export interface ListItem {
  /** Item label text (primary line) */
  label: string;
  /** Secondary text shown below the label */
  subtitle?: string;
  /** Description text shown below subtitle (third line) */
  description?: string;
  /** Optional icon identifier */
  icon?: string;
  /** Avatar URL or initials (renders a circular avatar instead of icon) */
  avatar?: string;
  /** Badge text (e.g. count, status label) shown on the trailing side */
  badge?: string;
  /** Badge color variant */
  badgeVariant?: 'default' | 'primary' | 'success' | 'warning' | 'error';
  /** Metadata text shown on the trailing side (e.g. date, size) */
  metadata?: string;
  /** Optional action label */
  action?: string;
  /** Item identifier */
  id?: string;
  /** Whether the item is disabled */
  disabled?: boolean;
  /** Whether the item is selected / highlighted */
  selected?: boolean;
  /** Any additional data */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any;
}

/**
 * List item size
 */
export type ListSize = 'sm' | 'md' | 'lg';

/**
 * List component for displaying structured item collections.
 *
 * Features:
 * - Vertical and horizontal layout orientations
 * - Variant styles (default, bordered, card)
 * - Optional dividers between items
 * - Icon and avatar support per item
 * - Action buttons with click events
 * - Accessible with ARIA list role; `clickable` rows are keyboard-operable
 *
 * @example
 * ```html
 * <lc-list
 *   [items]="listItems"
 *   orientation="vertical"
 *   [showDividers]="true"
 *   (itemClick)="handleItemClick($event)"
 * />
 * ```
 */
@Component({
  selector: 'lc-list',
  standalone: true,
  imports: [NgTemplateOutlet, IconComponent, ButtonComponent],
  templateUrl: './list.component.html',
  styleUrl: './list.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ListComponent {
  /** Custom item template provided via lcListItem directive */
  readonly itemTemplate = contentChild(ListItemTemplateDirective);

  /** Array of list items to display */
  items = input<ListItem[]>([]);

  /** Orientation of the list */
  orientation = input<ListOrientation>('vertical');

  /** Visual variant */
  variant = input<ListVariant>('default');

  /** Size of list items */
  size = input<ListSize>('md');

  /** Whether to show dividers between items */
  showDividers = input<boolean>(false);

  /**
   * Whether rows are interactive. When set, each row is rendered as a
   * focusable button (Enter / Space emit `itemClick`) so `itemClick` is
   * reachable from the keyboard. Set this whenever you handle `itemClick`.
   */
  clickable = input<boolean>(false);

  /** Event emitted when an item is clicked */
  readonly itemClick = output<ListItem>();

  /** Event emitted when an action button is clicked */
  readonly actionClick = output<ListItem>();

  /**
   * Computed CSS classes for the list
   */
  listClasses = computed(() => {
    const classes = ['lc-list'];

    classes.push(`lc-list--${this.orientation()}`);
    classes.push(`lc-list--${this.variant()}`);
    classes.push(`lc-list--${this.size()}`);

    if (this.showDividers()) {
      classes.push('lc-list--with-dividers');
    }

    return classes.join(' ');
  });

  /**
   * Get CSS classes for a list item
   */
  getItemClasses(item: ListItem): string {
    const classes = ['lc-list__item'];

    if (item.disabled) {
      classes.push('lc-list__item--disabled');
    }

    if (item.selected) {
      classes.push('lc-list__item--selected');
    }

    return classes.join(' ');
  }

  /**
   * Handle item click
   */
  onItemClick(item: ListItem): void {
    if (!item.disabled) {
      this.itemClick.emit(item);
    }
  }

  /**
   * Keyboard activation of a clickable row. Only reacts to keys on the row
   * itself: a nested control (e.g. the action button) handles its own Enter.
   */
  onItemKeydown(event: KeyboardEvent, item: ListItem): void {
    if (event.target !== event.currentTarget) return;
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      this.onItemClick(item);
    }
  }

  /**
   * Handle action button click
   */
  onActionClick(item: ListItem): void {
    this.actionClick.emit(item);
  }
}
