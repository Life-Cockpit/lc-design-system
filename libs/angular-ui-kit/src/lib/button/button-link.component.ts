import {
  ChangeDetectionStrategy,
  Component,
  ViewEncapsulation,
  computed,
  input,
} from '@angular/core';
import type { ButtonSize, ButtonVariant } from './button.component';

/**
 * `lc-button` styling on a native link: `<a lcButton href="…">`.
 *
 * Use it for navigation that looks like a button — calls to action, "read
 * more" links, a language switch. The host *is* the anchor, so every native
 * link attribute (`href`, `hreflang`, `lang`, `rel`, `target`, `download`,
 * `title`, `aria-*`) passes through untouched, and the component adds no event
 * listeners: after server-side rendering or prerendering the markup is a plain
 * `<a class="btn btn-primary btn-md" href="…">` that works without JavaScript.
 * `routerLink` can sit on the same anchor for in-app navigation.
 *
 * Same variants, sizes and modifiers as `lc-button` (it shares its stylesheet).
 * Use `size="lg"` (48.5 px) where the link must meet the 44 px touch target. A link
 * cannot be disabled or busy — render plain text or an `lc-button` for those
 * states. An `iconOnly` link needs an `aria-label`.
 *
 * @example
 * ```html
 * <a lcButton variant="primary" size="lg" href="/de/neuigkeiten">Schau uns beim Bauen zu</a>
 * <a lcButton variant="ghost" href="/en/security" hreflang="en" lang="en">English</a>
 * <a lcButton variant="outline" href="https://www.linkedin.com/in/…" rel="me">
 *   <lc-icon slot="icon-before" name="external-link" size="sm" [decorative]="true" />
 *   LinkedIn
 * </a>
 * ```
 */
@Component({
  // An attribute selector on purpose: the anchor must stay the element in the
  // DOM so native link behaviour and attributes are untouched.
  selector: 'a[lcButton]',
  template: `<ng-content select="[slot='icon-before']" /><ng-content /><ng-content
      select="[slot='icon-after']"
    />`,
  // The same stylesheet as lc-button: identical style text is registered once,
  // whichever of the two renders first.
  styleUrl: './button.component.scss',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class]': 'hostClasses()',
  },
})
export class ButtonLinkComponent {
  /** Visual variant, as on `lc-button`. */
  readonly variant = input<ButtonVariant>('primary');
  /** Size, as on `lc-button`. `lg` (48.5 px high) meets the 44 px touch target. */
  readonly size = input<ButtonSize>('md');
  /** Stretch the link to the full width of its container. */
  readonly fullWidth = input(false);
  /** Square icon-only link. Give the anchor an `aria-label`. */
  readonly iconOnly = input(false);
  /**
   * Flow with the surrounding text instead of forming a pill (inherits font
   * size, weight and line-height). Pair with `variant="link"`.
   */
  readonly inline = input(false);

  /** Classes on the anchor; merged with the consumer's own `class`. */
  protected readonly hostClasses = computed(() => {
    const classes = ['btn', `btn-${this.variant()}`, `btn-${this.size()}`];
    if (this.iconOnly()) classes.push('btn-icon-only');
    if (this.fullWidth()) classes.push('btn-full-width');
    if (this.inline()) classes.push('btn-inline');
    return classes.join(' ');
  });
}
