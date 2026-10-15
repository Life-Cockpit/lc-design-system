import {
  ChangeDetectionStrategy,
  Component,
  input,
  output,
  HostListener,
  computed,
} from '@angular/core';
import { IconComponent } from '../icon/icon.component';

/** Visual variant of `lc-card`. */
export type CardVariant = 'elevated' | 'outlined' | 'flat' | 'raised' | 'dashed';

/** Heading level of `lc-card`'s built-in title. */
export type CardHeadingLevel = 2 | 3 | 4 | 5 | 6;

/**
 * Card component for content grouping and visual hierarchy.
 *
 * Features:
 * - Variant styles (elevated, outlined, flat, raised, dashed)
 * - Configurable padding (none, xs, sm, md, lg)
 * - Border radius options (none, sm, md, lg, xl, full)
 * - Optional title display, with an optional leading icon tile
 * - Content projection for flexible body content
 *
 * @example
 * ```html
 * <lc-card title="Card Title" variant="elevated" padding="md">
 *   <p>Card body content</p>
 * </lc-card>
 *
 * <!-- With a leading brand-tile icon in the header -->
 * <lc-card title="Repository" subtitle="Checkout &amp; profile" icon="git-branch">
 *   ...
 * </lc-card>
 * ```
 */
@Component({
  selector: 'lc-card',
  standalone: true,
  imports: [IconComponent],
  templateUrl: './card.component.html',
  styleUrls: ['./card.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CardComponent {
  /**
   * Optional title rendered as a styled header.
   * For complex headers (e.g. title + action button), use content projection instead.
   */
  title = input<string | undefined>(undefined);

  /**
   * Optional subtitle rendered below the title.
   */
  subtitle = input<string | undefined>(undefined);

  /**
   * Optional leading icon (Tabler icon name) rendered as a teal brand tile to
   * the left of the title. Only shown when `title` is set.
   */
  icon = input<string | undefined>(undefined);

  /**
   * Visual treatment of the leading icon tile.
   * - brand: gradient teal tile with light ink (default)
   * - subtle: translucent surface tile with brand-teal ink
   * @default 'brand'
   */
  iconVariant = input<'brand' | 'subtle'>('brand');

  /**
   * Size of the leading icon tile.
   * - md: 2.25rem tile (default)
   * - sm: compact ~1.75rem chip for dense card headers
   * @default 'md'
   */
  iconSize = input<'sm' | 'md'>('md');

  /**
   * Optional badge text/count shown next to the title (e.g. item count).
   * For a richer status badge (e.g. a leading status dot), project an
   * `lc-badge` into the `card-badge` slot instead — the slot takes precedence.
   */
  badge = input<string | undefined>(undefined);

  /**
   * Badge color variant.
   * @default 'default'
   */
  badgeVariant = input<'default' | 'primary' | 'success' | 'warning' | 'error'>('default');

  /**
   * Visual variant of the card
   * - elevated: Box shadow (default)
   * - outlined: Border only (the hairline `--color-border`, no shadow) — the
   *   content card on the "Weite" sky with `borderRadius="xl"`
   * - flat: No shadow or border
   * - raised: plain surface, hairline border and the long, soft
   *   `--shadow-auth-card`, no accent line — the sign-in card
   * - dashed: the muted "coming soon" tile — `--color-muted-tile` fill, 1 px
   *   dashed `--color-muted-tile-border`, secondary ink, icons in
   *   `--color-muted-tile-icon`. Never clickable: `clickable` is ignored
   * @default 'elevated'
   */
  variant = input<CardVariant>('elevated');

  /**
   * Padding inside the card
   * @default 'md'
   */
  padding = input<'none' | 'xs' | 'sm' | 'md' | 'lg'>('md');

  /**
   * Whether the card is clickable (hover effects, cursor pointer)
   * @default false
   */
  clickable = input<boolean>(false);

  /**
   * Whether the card is selected (if clickable)
   * @default false
   */
  selected = input<boolean>(false);

  /**
   * Border radius size: `none`, `sm`, `md`, `lg` (18 px), `xl` (24 px, the
   * "Weite" content card) or `full`.
   * @default 'md'
   */
  borderRadius = input<'none' | 'sm' | 'md' | 'lg' | 'xl' | 'full'>('md');

  /**
   * Heading level of the built-in `title` (`h2`–`h6`), so the card fits the
   * page's outline. Semantics only, the look stays the same.
   * @default 3
   */
  headingLevel = input<CardHeadingLevel>(3);

  /**
   * ARIA label for accessibility
   */
  ariaLabel = input<string | undefined>(undefined);

  /**
   * Emitted when card is clicked (if clickable)
   */
  readonly cardClick = output<MouseEvent>();

  /**
   * Whether the card acts as a button: `clickable`, except for the dashed
   * "coming soon" tile, which is never interactive.
   */
  protected isClickable = computed(() => this.clickable() && this.variant() !== 'dashed');

  /**
   * Compute card CSS classes based on inputs
   */
  protected cardClasses = computed(() => {
    const classes = [
      'card',
      `card-${this.variant()}`,
      `card-padding-${this.padding()}`,
      `card-radius-${this.borderRadius()}`,
    ];

    if (this.isClickable()) {
      classes.push('card-clickable');
    }

    // The dashed tile is never interactive, so it is never selected either.
    if (this.selected() && this.variant() !== 'dashed') {
      classes.push('card-selected');
    }

    return classes.join(' ');
  });

  /**
   * Compute ARIA role based on clickable state
   */
  protected role = computed(() => (this.isClickable() ? 'button' : 'article'));

  /**
   * Handle card click events
   */
  protected handleClick(event: MouseEvent): void {
    if (this.isClickable()) {
      this.cardClick.emit(event);
    }
  }

  /**
   * Handle keyboard events for accessibility
   */
  @HostListener('keydown', ['$event'])
  protected handleKeydown(event: KeyboardEvent): void {
    if (this.isClickable() && (event.key === 'Enter' || event.key === ' ')) {
      event.preventDefault();
      const mouseEvent = new MouseEvent('click', {
        bubbles: true,
        cancelable: true,
      });
      this.cardClick.emit(mouseEvent);
    }
  }
}
