import {
  ChangeDetectionStrategy,
  Component,
  input,
  computed,
} from '@angular/core';
import { IconComponent } from '../icon/icon.component';

export interface FooterLink {
  /** Display label */
  label: string;
  /** URL or route */
  href: string;
  /**
   * Opens in a new tab (`target="_blank"`). Screen readers hear the
   * `externalLinkHint` after the label; `rel` defaults to
   * `noopener noreferrer`.
   */
  external?: boolean;
  /** Marks the page the visitor is on (`aria-current="page"`). */
  current?: boolean;
  /**
   * `rel` attribute, e.g. `me` for your own social profiles. Replaces the
   * `noopener noreferrer` default of external links.
   */
  rel?: string;
}

export interface FooterSection {
  /** Section heading */
  title: string;
  /** Links in this section */
  links: FooterLink[];
}

export type FooterVariant = 'default' | 'primary' | 'dark' | 'neutral';

/** Heading level of the section titles (`headingLevel`). */
export type FooterHeadingLevel = 2 | 3 | 4 | 5 | 6;

@Component({
  selector: 'lc-footer',
  standalone: true,
  imports: [IconComponent],
  templateUrl: './footer.component.html',
  styleUrls: ['./footer.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
/**
 * Footer component for application-wide bottom navigation.
 *
 * Features:
 * - Multi-section navigation with link groups, inside a labelled `<nav>`
 *   (`navAriaLabel`)
 * - Section titles at a configurable heading level (`headingLevel`, default 4)
 * - Links: `current` page (`aria-current`), `rel`, `external` (new tab, with a
 *   text hint for screen readers — `externalLinkHint`); 44 px touch targets
 * - Copyright text display
 * - Compact single-row layout option
 * - Color variants (default, primary, dark, neutral)
 * - Optional top border
 *
 * @example
 * ```html
 * <lc-footer [sections]="navSections" copyright="© 2026 Company" />
 * ```
 */
export class FooterComponent {
  /** Footer navigation sections */
  sections = input<FooterSection[]>([]);

  /** Copyright text */
  copyright = input<string>();

  /** Whether to show a top border */
  showBorder = input<boolean>(true);

  /** Compact layout (single row) */
  compact = input<boolean>(false);

  /** Color variant */
  variant = input<FooterVariant>('default');

  /**
   * Heading level of the section titles. Pick the level that continues the
   * page's outline (a page with `h1` + `h2` sections usually wants `2`).
   */
  headingLevel = input<FooterHeadingLevel>(4);

  /** Accessible name of the `<nav>` around the sections. */
  navAriaLabel = input<string>('Footer');

  /** Visually hidden text read after the label of an `external` link. */
  externalLinkHint = input<string>('(opens in a new tab)');

  protected footerClasses = computed(() => {
    const classes = ['footer', `footer--${this.variant()}`];
    if (this.showBorder()) classes.push('footer--bordered');
    if (this.compact()) classes.push('footer--compact');
    return classes.join(' ');
  });

  /** `rel` of a link: its own value, else `noopener noreferrer` for external links. */
  protected linkRel(link: FooterLink): string | null {
    return link.rel ?? (link.external ? 'noopener noreferrer' : null);
  }

  protected currentYear = new Date().getFullYear();
}
