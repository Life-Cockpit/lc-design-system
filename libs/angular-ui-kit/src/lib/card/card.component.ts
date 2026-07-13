import {
  ChangeDetectionStrategy,
  Component,
  input,
  output,
  HostListener,
  computed,
} from '@angular/core';
import { IconComponent } from '../icon/icon.component';

/**
 * Card component for content grouping and visual hierarchy.
 *
 * Features:
 * - Variant styles (elevated, outlined, filled)
 * - Configurable padding (none, sm, md, lg)
 * - Border radius options (none, sm, md, lg, xl)
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
   * - outlined: Border only
   * - flat: No shadow or border
   * @default 'elevated'
   */
  variant = input<'elevated' | 'outlined' | 'flat'>('elevated');

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
   * Border radius size
   * @default 'md'
   */
  borderRadius = input<'none' | 'sm' | 'md' | 'lg' | 'full'>('md');

  /**
   * ARIA label for accessibility
   */
  ariaLabel = input<string | undefined>(undefined);

  /**
   * Emitted when card is clicked (if clickable)
   */
  readonly cardClick = output<MouseEvent>();

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

    if (this.clickable()) {
      classes.push('card-clickable');
    }

    if (this.selected()) {
      classes.push('card-selected');
    }

    return classes.join(' ');
  });

  /**
   * Compute ARIA role based on clickable state
   */
  protected role = computed(() => (this.clickable() ? 'button' : 'article'));

  /**
   * Handle card click events
   */
  protected handleClick(event: MouseEvent): void {
    if (this.clickable()) {
      this.cardClick.emit(event);
    }
  }

  /**
   * Handle keyboard events for accessibility
   */
  @HostListener('keydown', ['$event'])
  protected handleKeydown(event: KeyboardEvent): void {
    if (this.clickable() && (event.key === 'Enter' || event.key === ' ')) {
      event.preventDefault();
      const mouseEvent = new MouseEvent('click', {
        bubbles: true,
        cancelable: true,
      });
      this.cardClick.emit(mouseEvent);
    }
  }
}
