import { Component, input, computed, ChangeDetectionStrategy } from '@angular/core';

export type SpacerSize = 'auto' | 'xs' | 'sm' | 'md' | 'lg' | 'xl';

/**
 * Spacer component for adding vertical or flexible spacing.
 *
 * Features:
 * - Fixed, density-aware spacing sizes (xs, sm, md, lg, xl)
 * - Auto (flex-grow) mode for filling available space
 * - Host class binding for layout integration
 *
 * @example
 * ```html
 * <lc-spacer size="lg" />
 * ```
 */
@Component({
  selector: 'lc-spacer',
  standalone: true,
  imports: [],
  templateUrl: './spacer.component.html',
  styleUrls: ['./spacer.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class]': 'classes()',
    // Purely presentational — never announced, never focusable.
    'aria-hidden': 'true',
  },
})
export class SpacerComponent {
  readonly size = input<SpacerSize>('auto');

  readonly classes = computed(() => {
    const classes: string[] = [];

    // Semantic size class — the matching `:host(.spacer-*)` rules live in
    // spacer.component.scss (plain class rules would be scoped away by the
    // emulated encapsulation and never match the host).
    classes.push(`spacer-${this.size()}`);

    if (this.size() === 'auto') {
      classes.push('spacer-grow');
    }

    return classes.join(' ');
  });
}
