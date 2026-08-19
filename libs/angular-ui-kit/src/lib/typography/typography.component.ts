import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  ViewEncapsulation,
} from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';

/**
 * Typography component for consistent text styling.
 *
 * Features:
 * - Semantic variants (h1–h6, body1, body2, caption, overline)
 * - Automatic HTML element mapping per variant
 * - Text alignment options (left, center, right, justify)
 * - Color variants (primary, secondary, success, warning, error, info)
 * - Font weight overrides (regular, medium, semibold, bold)
 * - Text transform (uppercase, lowercase, capitalize)
 * - Line clamping for text truncation
 * - Gutter bottom margin option
 *
 * @example
 * ```html
 * <lc-typography variant="h1" color="primary">Heading</lc-typography>
 * <lc-typography variant="body1" [lineClamp]="2">Truncated text...</lc-typography>
 * ```
 */
@Component({
  selector: 'lc-typography',
  templateUrl: './typography.component.html',
  styleUrl: './typography.component.scss',
  standalone: true,
  imports: [NgTemplateOutlet],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None, // Required for global typography utilities
})
export class TypographyComponent {
  /**
   * Typography variant determining the HTML element and default styles
   * - h1-h6: Heading elements with corresponding sizes
   * - body1: Default paragraph text (16px)
   * - body2: Smaller body text (14px)
   * - subtitle1: Larger subtitle (18px)
   * - subtitle2: Smaller subtitle (14px)
   * - caption: Small helper text (12px)
   * - overline: Uppercase accent text (10px)
   * @default 'body1'
   */
  variant = input<
    | 'h1'
    | 'h2'
    | 'h3'
    | 'h4'
    | 'h5'
    | 'h6'
    | 'body1'
    | 'body2'
    | 'subtitle1'
    | 'subtitle2'
    | 'caption'
    | 'overline'
  >('body1');

  /**
   * Text alignment
   * @default 'left'
   */
  align = input<'left' | 'center' | 'right' | 'justify'>('left');

  /**
   * Text color using semantic color tokens
   * @default 'primary'
   */
  color = input<'primary' | 'secondary' | 'disabled' | 'error' | 'success' | 'warning' | 'info'>(
    'primary',
  );

  /**
   * Font weight override. When unset, the variant's own weight applies
   * (e.g. h1 is bold, body1 is regular); setting it wins over the variant.
   * @default undefined
   */
  weight = input<'regular' | 'medium' | 'semibold' | 'bold' | undefined>(undefined);

  /**
   * Text transform
   * @default 'none'
   */
  transform = input<'none' | 'uppercase' | 'lowercase' | 'capitalize'>('none');

  /**
   * Prevent text wrapping (applies ellipsis on overflow)
   * @default false
   */
  noWrap = input<boolean>(false);

  /**
   * Limit text to a specific number of lines (1-6)
   * Uses CSS line-clamp for multi-line truncation
   * @default undefined
   */
  lineClamp = input<number | undefined>(undefined);

  /**
   * Add bottom margin (1rem) for spacing between elements
   * @default false
   */
  gutterBottom = input<boolean>(false);

  /**
   * Compute the HTML element tag based on variant
   */
  readonly elementTag = computed<string>(() => {
    const variantValue = this.variant();
    if (variantValue.startsWith('h')) {
      return variantValue; // h1, h2, h3, h4, h5, h6
    }
    if (variantValue === 'caption' || variantValue === 'overline') {
      return 'span';
    }
    return 'p'; // body1, body2, subtitle1, subtitle2
  });

  /**
   * Compute all CSS classes based on inputs.
   *
   * Modifier classes are prefixed (`lc-typography--…`): the component renders
   * with `ViewEncapsulation.None`, so unprefixed names such as `.uppercase` or
   * `.mb-4` would become app-global rules that shadow Tailwind utilities.
   */
  readonly typographyClasses = computed<string>(() => {
    const classes: string[] = ['typography'];

    // Variant class
    classes.push(`typography-${this.variant()}`);

    // Alignment
    classes.push(`lc-typography--align-${this.align()}`);

    // Color
    classes.push(`lc-typography--color-${this.color()}`);

    // Weight (only when explicitly set — otherwise the variant's weight applies)
    const weightValue = this.weight();
    if (weightValue) {
      classes.push(`lc-typography--weight-${weightValue}`);
    }

    // Transform
    const transformValue = this.transform();
    if (transformValue !== 'none') {
      classes.push(`lc-typography--${transformValue}`);
    }

    // No wrap
    if (this.noWrap()) {
      classes.push('lc-typography--nowrap');
    }

    // Line clamp
    const lineClampValue = this.lineClamp();
    if (lineClampValue !== undefined && lineClampValue >= 1 && lineClampValue <= 6) {
      classes.push(`lc-typography--clamp-${lineClampValue}`);
    }

    // Gutter bottom
    if (this.gutterBottom()) {
      classes.push('lc-typography--gutter-bottom');
    }

    return classes.join(' ');
  });
}
