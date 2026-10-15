import { Component, ChangeDetectionStrategy, input, computed } from '@angular/core';
import { IconComponent } from '../icon/icon.component';

export type EmptyStateSize = 'sm' | 'md' | 'lg';

/** Heading level of `lc-empty-state`'s heading (3.3, G-9). */
export type EmptyStateHeadingLevel = 2 | 3 | 4 | 5 | 6;

/**
 * Empty state component for "no data" placeholder displays.
 *
 * Features:
 * - Compact (sm) and page-level (md, lg) size modes
 * - Optional icon from Tabler Icons library
 * - Heading and description text
 * - Action slot for projected CTA buttons
 * - Centered layout with visual hierarchy
 *
 * @example
 * ```html
 * <lc-empty-state
 *   icon="chart-bar"
 *   heading="No Data"
 *   message="No items found.">
 *   <lc-button variant="primary">Get Started</lc-button>
 * </lc-empty-state>
 * ```
 */
@Component({
  selector: 'lc-empty-state',
  standalone: true,
  imports: [IconComponent],
  templateUrl: './empty-state.component.html',
  styleUrl: './empty-state.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EmptyStateComponent {
  /**
   * Size variant
   * - `sm`: compact inline (inside cards), no padding
   * - `md`: standard centered block (default)
   * - `lg`: large page-level with extra padding
   * @default 'md'
   */
  readonly size = input<EmptyStateSize>('md');

  /**
    * Tabler icon name to display above the heading
   */
  readonly icon = input<string>();

  /**
   * Bold heading text
   */
  readonly heading = input<string>();

  /**
   * Heading level of `heading` (`h2`–`h6`), so the empty state fits the
   * page's outline. Semantics only, the look stays the same.
   * @default 3
   */
  readonly headingLevel = input<EmptyStateHeadingLevel>(3);

  /**
   * Description text
   */
  readonly message = input<string>();

  protected readonly hostClasses = computed(() => `empty-state empty-state--${this.size()}`);
}
