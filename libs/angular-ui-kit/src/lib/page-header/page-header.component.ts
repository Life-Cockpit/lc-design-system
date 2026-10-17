import {
  ChangeDetectionStrategy,
  Component,
  ViewEncapsulation,
  computed,
  input,
} from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { IconComponent } from '@lifecorner/angular-ui-kit/icon';

/**
 * Visual size of the page header.
 * - `compact`     — dense data-tool pages and section headings (18 px)
 * - `default`     — standard app pages (24 px)
 * - `comfortable` — landing-page hero feel (30 px)
 * - `title`       — the "Weite" page title: 32 px on phones, 40 / 44 / 48 px
 *                   from 1024 / 1440 / 1920 px (`--font-size-title`)
 * - `display`     — the display greeting: 40 px on phones, 52 / 56 / 60 / 72 px
 *                   from 1024 / 1280 / 1440 / 1920 px (`--font-size-display`)
 * - `auth`        — the sign-in and registration `<h1>`: 30 px, 34 px from
 *                   1024 px (`--font-size-auth-title`)
 */
export type PageHeaderSize = 'compact' | 'default' | 'comfortable' | 'title' | 'display' | 'auth';

/**
 * Page header — top-of-page title block with optional subtitle,
 * breadcrumbs, badge, description and an actions area.
 *
 * Density-aware, slot-based, no Tailwind. Drop it at the top of any route
 * to get consistent rhythm between title, metadata and content below.
 *
 * Slots:
 *  - `[slot="breadcrumbs"]`   — rendered above the title (e.g. `<lc-breadcrumbs>`)
 *  - `[slot="title-suffix"]`  — inline beside the title, after the optional `badge`
 *                               (for one or more status chips/badges)
 *  - `[slot="actions"]`       — right-aligned actions (buttons, menus)
 *  - `[slot="meta"]`          — secondary metadata under the title row (chips, tags)
 *  - default                  — short header-internal description text
 *
 * `overline` renders a short uppercase label (a date, a section) **above** the
 * title but **after** it in the DOM, so a screen reader that lands on the
 * heading reads the title first and the overline next.
 *
 * Full-blown navigation primitives like `lc-tabs` — which render both the tab
 * strip **and** their panel content — belong **below** the page header, never
 * inside it. The header stays focused on page identity.
 *
 * @example
 * ```html
 * <lc-page-header
 *   title="Reports"
 *   subtitle="Compare period-over-period metrics"
 *   [showDivider]="true"
 * >
 *   <lc-breadcrumbs slot="breadcrumbs" [items]="crumbs" />
 *   <lc-chip slot="title-suffix" size="sm">Beta</lc-chip>
 *   <lc-chip slot="title-suffix" size="sm" variant="success">Ready</lc-chip>
 *   <lc-button slot="actions" variant="primary">New report</lc-button>
 *   <lc-chip slot="meta">12 active</lc-chip>
 * </lc-page-header>
 * ```
 */
@Component({
  selector: 'lc-page-header',
  standalone: true,
  imports: [IconComponent, NgTemplateOutlet],
  templateUrl: './page-header.component.html',
  styleUrl: './page-header.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: {
    '[class]': 'hostClasses()',
  },
})
export class PageHeaderComponent {
  /** Main heading text. */
  title = input<string | undefined>(undefined);

  /**
   * Optional leading icon (Tabler icon name) rendered as a brand tile to the
   * left of the title block, mirroring `lc-card`'s header icon. Purely additive.
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
   * @default 'md'
   */
  iconSize = input<'sm' | 'md'>('md');

  /** Short supporting line below the title. */
  subtitle = input<string | undefined>(undefined);

  /**
   * Short label shown above the title (e.g. the date on a daily view, a
   * section name): uppercase through CSS (write it in sentence case), bold,
   * letter spacing 0.12 em, in `--color-overline`; 13 px on phones, 14 / 15 /
   * 16 px from 1024 / 1440 / 1920 px. Rendered right after the heading in the
   * DOM, so the heading is read first.
   */
  overline = input<string | undefined>(undefined);

  /**
   * Heading level for the title — affects semantics, not size.
   * @default 1
   */
  level = input<1 | 2 | 3>(1);

  /**
   * Visual size of the page header.
   * - `compact`     — dense data-tool pages and section headings (18 px)
   * - `default`     — standard app pages (24 px)
   * - `comfortable` — landing-page hero feel (30 px)
   * - `title`       — page title on the responsive title scale, 32–48 px
   * - `display`     — the display greeting, 40–72 px, weight 700
   * - `auth`        — the sign-in and registration `<h1>`, 30 / 34 px
   * @default 'default'
   */
  size = input<PageHeaderSize>('default');

  /**
   * Whether to render a divider line below the header.
   * @default false
   */
  showDivider = input<boolean>(false);

  /** Optional badge text next to the title (e.g. `Beta`). */
  badge = input<string | undefined>(undefined);

  /**
   * Remove the header's own horizontal padding so its content sits flush with
   * the container edge. Use when the header is already inside a padded wrapper
   * (e.g. `<lc-container>`) and you'd otherwise get a double inset. The divider,
   * when shown, always spans the full width regardless of this setting.
   * @default false
   */
  noPaddingX = input<boolean>(false);

  /**
   * Classes of the heading: the global type-scale class (`lc-title`,
   * `lc-display`, `lc-auth-title`) joins the component class for the 3.3 sizes.
   */
  protected titleClasses = computed(() => {
    const scale: Partial<Record<PageHeaderSize, string>> = {
      title: 'lc-title',
      display: 'lc-display',
      auth: 'lc-auth-title',
    };
    return ['lc-page-header__title', scale[this.size()]].filter(Boolean).join(' ');
  });

  protected hostClasses = computed(() =>
    [
      'lc-page-header',
      `lc-page-header--size-${this.size()}`,
      this.showDivider() ? 'lc-page-header--divided' : null,
      this.overline() ? 'lc-page-header--has-overline' : null,
      this.noPaddingX() ? 'lc-page-header--flush-x' : null,
    ]
      .filter(Boolean)
      .join(' '),
  );
}
