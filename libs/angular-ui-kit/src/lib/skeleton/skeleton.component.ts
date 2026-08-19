import { Component, ChangeDetectionStrategy, input, computed } from '@angular/core';

export type SkeletonVariant = 'line' | 'circle' | 'rect';

/**
 * Skeleton loader component for placeholder loading states.
 *
 * Features:
 * - Variant shapes (text, rect, circle)
 * - Shimmer animation effect
 * - Custom width, height, and border radius
 * - Composable for building complex loading layouts
 * - Dark mode compatible
 *
 * @example
 * ```html
 * <lc-skeleton />
 * <lc-skeleton variant="circle" width="40px" height="40px" />
 * <lc-skeleton variant="rect" width="100%" height="400px" />
 * ```
 */
@Component({
  selector: 'lc-skeleton',
  standalone: true,
  templateUrl: './skeleton.component.html',
  styleUrl: './skeleton.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    // The host mirrors the box width so the skeleton sizes correctly inside
    // flex layouts, and never shrinks below it.
    '[style.width]': 'hostWidth()',
    '[style.flex-shrink]': '"0"',
  },
})
export class SkeletonComponent {
  /** Shape variant. */
  readonly variant = input<SkeletonVariant>('line');

  /** Width (CSS value). Defaults to '100%' for line/rect, '40px' for circle. */
  readonly width = input<string>();

  /** Height (CSS value). Defaults to '0.875rem' for line, '40px' for circle, '100px' for rect. */
  readonly height = input<string>();

  /** Border radius override (CSS value). */
  readonly borderRadius = input<string>();

  protected readonly variantClass = computed(() => `lc-skeleton--${this.variant()}`);

  protected readonly styles = computed(() => {
    const v = this.variant();
    const defaults: Record<SkeletonVariant, { w: string; h: string; r: string }> = {
      line: { w: '100%', h: '0.875rem', r: '0.25rem' },
      circle: { w: '40px', h: '40px', r: '50%' },
      rect: { w: '100%', h: '100px', r: '0.5rem' },
    };
    const d = defaults[v];
    return {
      width: this.width() ?? d.w,
      height: this.height() ?? d.h,
      'border-radius': this.borderRadius() ?? d.r,
    };
  });

  protected readonly hostWidth = computed(() => this.styles().width);
}
