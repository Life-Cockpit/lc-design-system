import {
  ChangeDetectionStrategy,
  Component,
  input,
  computed,
} from '@angular/core';

export type HeroColor =
  | 'primary'
  | 'secondary'
  | 'neutral'
  | 'success'
  | 'info'
  | 'warning'
  | 'accent-orange'
  | 'accent-purple'
  | 'accent-violet';

export type HeroSize = 'sm' | 'md' | 'lg';
export type HeroVariant = 'default' | 'slim' | 'light';

/**
 * Width of the hero's content box.
 * - `full`: the content runs to the hero's own padding (default, as before 3.4)
 * - `lg`: from 1024 px the content sits on the `lc-container` `lg` page column
 *   (1024 px minus its 48 px sides, so at most 928 px), centred, while the
 *   background stays full-bleed
 */
export type HeroContentWidth = 'full' | 'lg';

/**
 * Hero component for prominent page headers with gradient backgrounds.
 *
 * Features:
 * - Color gradient variants (primary, secondary, success, warning, info, neutral, accent-orange, accent-purple, accent-violet)
 * - 3 visual variants: default (dark gradient), slim (compact banner), light (pastel gradient with dark text)
 * - Size options (sm, md, lg)
 * - Optional label text above the title
 * - Configurable border radius
 * - Content projection for body and footer sections
 * - Footer slot for metadata, stats, or CTAs
 * - Media slot (`[hero-media]`) for a visual: below the text on small screens,
 *   beside it from 1024 px, never under the body's 85 % opacity
 * - Content width `lg`: a full-bleed band whose text lines up with the page column
 *
 * @example
 * ```html
 * <lc-hero label="MY APP" title="Welcome" color="primary" variant="slim">
 *   <p>Description text</p>
 *   <div hero-footer>Status: Active</div>
 * </lc-hero>
 *
 * <lc-hero title="Everything in view" borderRadius="none" contentWidth="lg">
 *   <p>Description text</p>
 *   <lc-card hero-media variant="elevated">…</lc-card>
 * </lc-hero>
 * ```
 */
@Component({
  selector: 'lc-hero',
  standalone: true,
  templateUrl: './hero.component.html',
  styleUrls: ['./hero.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HeroComponent {
  /**
   * Small uppercase label displayed above the title.
   */
  label = input<string | undefined>(undefined);

  /**
   * Main headline text.
   */
  title = input.required<string>();

  /**
   * Color theme for the gradient background.
   * @default 'primary'
   */
  color = input<HeroColor>('primary');

  /**
   * Size variant controlling padding and font sizes.
   * @default 'md'
   */
  size = input<HeroSize>('md');

  /**
   * Border radius of the hero container.
   * @default 'lg'
   */
  borderRadius = input<'none' | 'sm' | 'md' | 'lg'>('lg');

  /**
   * Visual variant.
   * - `default`: dark gradient with white text
   * - `slim`: compact single-line banner
   * - `light`: softer pastel gradient with dark text
   * @default 'default'
   */
  variant = input<HeroVariant>('default');

  /**
   * Width of the content box. `lg` keeps the background full-bleed and, from
   * 1024 px, puts the label, title, body, media and footer on the 1024 px page
   * column (the `lc-container` `lg` content box), never closer to the edge than
   * the size padding. Use it for a full-width band (`borderRadius="none"`) whose
   * text should line up with the page content below.
   * @default 'full'
   */
  contentWidth = input<HeroContentWidth>('full');

  protected heroClasses = computed(() => {
    return [
      'hero',
      `hero--${this.color()}`,
      `hero--${this.size()}`,
      `hero--radius-${this.borderRadius()}`,
      `hero--${this.variant()}`,
      `hero--content-${this.contentWidth()}`,
    ].join(' ');
  });
}
