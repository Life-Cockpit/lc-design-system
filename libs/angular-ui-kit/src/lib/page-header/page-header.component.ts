import {
  ChangeDetectionStrategy,
  Component,
  ViewEncapsulation,
  computed,
  input,
} from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { IconComponent } from '../icon/icon.component';

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
   * Heading level for the title — affects semantics, not size.
   * @default 1
   */
  level = input<1 | 2 | 3>(1);

  /**
   * Visual size of the page header.
   * - `compact`     — dense data-tool pages
   * - `default`     — standard app pages
   * - `comfortable` — landing-page hero feel
   */
  size = input<'compact' | 'default' | 'comfortable'>('default');

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

  protected hostClasses = computed(() =>
    [
      'lc-page-header',
      `lc-page-header--size-${this.size()}`,
      this.showDivider() ? 'lc-page-header--divided' : null,
      this.noPaddingX() ? 'lc-page-header--flush-x' : null,
    ]
      .filter(Boolean)
      .join(' '),
  );
}
