import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { RouterModule } from '@angular/router';
import { IconComponent, ɵprovideKitIcons } from '@lifecorner/angular-ui-kit/icon';
import { ICON_DOTS } from '@lifecorner/angular-ui-kit/icons';
import { BadgeComponent } from '@lifecorner/angular-ui-kit/badge';

/**
 * A destination in the bottom navigation bar. A subset of `NavigationItem`, so
 * the side navigation's items can be passed as they are (sections and children
 * are ignored).
 */
export interface BottomNavItem {
  /** Unique id. */
  id: string;
  /** Visible label, always shown below the icon. */
  label: string;
  /** Icon name (`lc-icon`), drawn at 24 px. */
  icon: string;
  /** Router path the item links to (`routerLink`). */
  route: string;
  /** Sort order; items without one keep their array order. */
  displayOrder?: number;
  /** Count or status shown on the icon; read out through `badgeAriaLabel`. */
  badge?: {
    /** Text or number inside the badge. */
    value: string | number;
    /** Badge colour (`lc-badge` variant). */
    variant?: 'default' | 'primary' | 'success' | 'warning' | 'error' | 'info';
  };
}

/** Surface of the bar: `docked` spans the bottom edge, `floating` is an inset pill. */
export type BottomNavVariant = 'docked' | 'floating';

/** One rendered entry: a destination or the overflow entry ("More"). */
interface BottomNavEntry {
  item: BottomNavItem;
  current: boolean;
  more: boolean;
}

/**
 * Bottom navigation bar for phones and tablets: the app's main destinations as
 * links in the thumb zone.
 *
 * - Renders `<nav aria-label><ul><li><a routerLink>` — links, not tabs — with
 *   `aria-current="page"` on the current destination.
 * - Items are at least 48 px high and 64 px wide: a 24 px icon over a 12 px
 *   label that is always visible and wraps at large text sizes.
 * - The current item sits on a 56 × 32 px pill in `--color-surface-selected`,
 *   its icon drawn heavier and its label bold in `--color-on-surface-selected`.
 * - The current item follows `activeRoute` by its first path segment, so a
 *   sub-page (`/household/members`) keeps its destination current; `/` only
 *   matches itself. Query and fragment are ignored.
 * - More than `maxItems` destinations: the first `maxItems − 1` stay, the
 *   rest move behind a "More" entry (`moreLabel`, `moreIcon`, `moreRoute`);
 *   without `moreRoute` the entry is a button that emits `moreClick`.
 * - Tapping the current item emits `reselect` (scroll the page to the top).
 * - `variant="floating"`: an inset pill 16 px from the sides and 16 px above
 *   the safe-area inset, radius 28 px, elevated. `docked` (default) spans the
 *   bottom edge with a top border and pads the safe-area inset.
 * - Fixed to the viewport by default (`fixed`), below menus and dialogs
 *   (`z-index` 900). Reserve space for it at the end of the page (see
 *   `lc-app-shell`, which does that for you).
 * - Light and dark from the semantic tokens; no hover-only information;
 *   transitions are off under `prefers-reduced-motion`.
 *
 * @example
 * ```html
 * <lc-bottom-nav
 *   variant="floating"
 *   ariaLabel="Hauptnavigation"
 *   [items]="[
 *     { id: 'today', label: 'Heute', icon: 'sun', route: '/' },
 *     { id: 'household', label: 'Haushalt', icon: 'home', route: '/household' }
 *   ]"
 *   [activeRoute]="router.url"
 *   (reselect)="scrollToTop()"
 * />
 * ```
 */
@Component({
  selector: 'lc-bottom-nav',
  standalone: true,
  imports: [NgTemplateOutlet, RouterModule, IconComponent, BadgeComponent],
  // The default "more" glyph (moreIcon); the items' glyphs are the app's.
  viewProviders: [ɵprovideKitIcons([ICON_DOTS])],
  templateUrl: './bottom-nav.component.html',
  styleUrl: './bottom-nav.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'lc-bottom-nav-host',
  },
})
export class BottomNavComponent {
  /** Destinations, left to right (sorted by `displayOrder` when given). */
  readonly items = input<readonly BottomNavItem[]>([]);

  /**
   * The current URL (e.g. `router.url`). The item whose route matches its
   * first path segment is current; `/` matches only itself.
   */
  readonly activeRoute = input('');

  /** Accessible name of the `<nav>` landmark. */
  readonly ariaLabel = input('Main navigation');

  /** `docked` spans the bottom edge; `floating` is the inset, elevated pill (LK-5). */
  readonly variant = input<BottomNavVariant>('docked');

  /**
   * Pin the bar to the bottom of the viewport. Turn off to render it in the
   * document flow (previews, tests, a custom container).
   */
  readonly fixed = input(true);

  /**
   * Most entries the bar shows. With more destinations the first
   * `maxItems − 1` stay and the rest go behind the "More" entry.
   */
  readonly maxItems = input(5);

  /** Label of the overflow entry. */
  readonly moreLabel = input('More');

  /** Icon of the overflow entry. */
  readonly moreIcon = input('dots');

  /**
   * Route of the overflow entry (a page that lists the remaining
   * destinations). Empty renders the entry as a button that emits `moreClick`.
   */
  readonly moreRoute = input('');

  /**
   * Text read after an item's label when it has a badge; `{value}` is
   * replaced with the badge value (e.g. "3 new").
   */
  readonly badgeAriaLabel = input('{value} new');

  /** The current item was tapped again (e.g. scroll the page to the top). */
  readonly reselect = output<BottomNavItem>();

  /** The overflow entry was tapped while it has no `moreRoute`. */
  readonly moreClick = output<void>();

  /** Destinations in display order. */
  private readonly sortedItems = computed(() =>
    [...this.items()].sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0)),
  );

  /** Path of `activeRoute` without query and fragment. */
  private readonly activePath = computed(() => this.activeRoute().split(/[?#]/)[0] || '/');

  /** Entries as rendered: destinations plus, on overflow, the "More" entry. */
  protected readonly entries = computed<BottomNavEntry[]>(() => {
    const items = this.sortedItems();
    const max = Math.max(1, Math.floor(this.maxItems()));
    if (items.length <= max) {
      return items.map((item) => ({ item, current: this.matches(item.route), more: false }));
    }
    const visible = items.slice(0, max - 1);
    const hidden = items.slice(max - 1);
    const moreRoute = this.moreRoute();
    const moreItem: BottomNavItem = {
      id: '__more',
      label: this.moreLabel(),
      icon: this.moreIcon(),
      route: moreRoute,
    };
    const moreCurrent =
      (moreRoute !== '' && this.matches(moreRoute)) || hidden.some((item) => this.matches(item.route));
    return [
      ...visible.map((item) => ({ item, current: this.matches(item.route), more: false })),
      { item: moreItem, current: moreCurrent, more: true },
    ];
  });

  protected readonly navClasses = computed(() => {
    const classes = ['lc-bottom-nav', `lc-bottom-nav--${this.variant()}`];
    if (this.fixed()) classes.push('lc-bottom-nav--fixed');
    return classes.join(' ');
  });

  /** Visually hidden badge text for screen readers. */
  protected badgeText(item: BottomNavItem): string {
    return item.badge ? this.badgeAriaLabel().replace('{value}', String(item.badge.value)) : '';
  }

  protected onItemClick(entry: BottomNavEntry): void {
    if (entry.current && !entry.more) {
      this.reselect.emit(entry.item);
    }
  }

  protected onMoreButtonClick(): void {
    this.moreClick.emit();
  }

  /** First-segment match: `/household/members` keeps `/household` current. */
  private matches(route: string): boolean {
    const path = this.activePath();
    const target = route.split(/[?#]/)[0] || '/';
    if (target === '/') return path === '/';
    const normalized = target.endsWith('/') ? target.slice(0, -1) : target;
    return path === normalized || path.startsWith(`${normalized}/`);
  }
}
