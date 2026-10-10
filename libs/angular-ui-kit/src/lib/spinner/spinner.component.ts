import { Component, ChangeDetectionStrategy, input, computed } from '@angular/core';

export type SpinnerSize = 'sm' | 'md' | 'lg';

/**
 * Spinner component for loading state indication.
 *
 * Features:
 * - Animated spinning indicator
 * - Size variants (sm, md, lg)
 * - Optional message text below spinner
 * - Design system color token integration
 * - Accessible with ARIA status role
 *
 * @example
 * ```html
 * <lc-spinner />
 * <lc-spinner size="lg" message="Loading data..." />
 * ```
 */
@Component({
  selector: 'lc-spinner',
  standalone: true,
  templateUrl: './spinner.component.html',
  styleUrl: './spinner.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SpinnerComponent {
  /**
   * Size of the spinner
   * @default 'md'
   */
  readonly size = input<SpinnerSize>('md');

  /**
   * Optional loading message displayed below the spinner
   */
  readonly message = input<string>();

  /** Screen-reader text while no visible `message` is set. */
  readonly loadingLabel = input('Loading');

  protected readonly hostClasses = computed(() => `spinner spinner--${this.size()}`);
}
