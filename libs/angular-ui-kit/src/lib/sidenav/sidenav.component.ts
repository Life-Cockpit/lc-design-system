import {
  Component,
  ChangeDetectionStrategy,
  signal,
  computed,
  input,
  output,
  model,
  effect,
  untracked,
  HostListener,
  OnDestroy,
  inject,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NgTemplateOutlet, NgStyle } from '@angular/common';
import { NavigationEnd, Router, RouterLink } from '@angular/router';
import { filter } from 'rxjs';
import { A11yModule } from '@angular/cdk/a11y';
import { NavigationItem } from '@lifecorner/angular-ui-kit/models';
import {
  currentItemParents,
  currentNavigationItem,
  navigationLinks,
  navigationPath,
  sortNavigationItems,
} from '@lifecorner/angular-ui-kit/internal/navigation';
import { IconComponent, ɵprovideKitIcons } from '@lifecorner/angular-ui-kit/icon';
import { ICON_CHEVRON_DOWN, ICON_CHEVRON_LEFT, ICON_CHEVRON_RIGHT } from '@lifecorner/angular-ui-kit/icons';
import { BadgeComponent } from '@lifecorner/angular-ui-kit/badge';
import { LogoComponent } from '@lifecorner/angular-ui-kit/logo';

export type SidenavPosition = 'left' | 'right';
export type SidenavMode = 'drawer' | 'docked';

/**
 * Surface of the docked sidenav: `default` is the rail on `--color-sidebar`
 * with a border; `transparent` has no background and no border and draws the
 * items as 48 px pills (the side navigation on the page, "Weite"). A drawer
 * keeps its surface in both.
 */
export type SidenavVariant = 'default' | 'transparent';

/**
 * Sidenav component for application navigation sidebar.
 *
 * Features:
 * - Drawer (overlay) and docked (persistent) modes
 * - Responsive mobile mode — docked automatically switches to drawer below a configurable breakpoint
 * - Collapsed icon-rail mode (narrow 56px sidebar with icons only and hover tooltips)
 * - Integrated logo area with collapse-toggle (sidebar-first layouts)
 * - Hierarchical navigation with collapsible groups (up to 3 levels)
 * - Section headlines for item grouping with optional action buttons
 * - Action buttons on any item (hover-reveal)
 * - Badge support on items (count / status indicator)
 * - One current item, announced and painted alike: the link for `activeRoute`
 *   (or, without it, the one the router's URL matches) gets
 *   `aria-current="page"` and the current look, every other link neither
 *   (AS-16). No hover color change on the current item
 * - Keyboard navigation support (Escape closes drawer)
 * - Configurable width and position (left/right)
 * - Optional backdrop overlay
 * - Theme variants: auto, light, dark (with teal accent for dark mode)
 * - `variant="transparent"`: no rail background or border, items as 48 px
 *   pills with 16 px labels, the current one on `--color-surface-selected`
 * - Items are at least 44 px high in every density; the current item's ink is
 *   `--color-on-surface-selected` (AA on the selected tint)
 * - Accessible: the inner `<nav>` is the navigation landmark; in drawer mode
 *   the panel is a modal dialog (`role="dialog"`, focus moved to the close
 *   button on open, trapped while open, restored on close)
 *
 * @example
 * ```html
 * <lc-sidenav
 *   [isOpen]="isOpen"
 *   mode="docked"
 *   [(collapsed)]="isCollapsed"
 *   [showLogo]="true"
 *   logoSize="md"
 *   [mobileBreakpoint]="768"
 *   [items]="navItems"
 *   activeRoute="/dashboard"
 *   theme="dark"
 *   (closed)="isOpen = false"
 *   (itemClicked)="navigate($event)"
 *   (itemAction)="onAction($event)" />
 * ```
 */
@Component({
  selector: 'lc-sidenav',
  standalone: true,
  imports: [NgTemplateOutlet, NgStyle, RouterLink, A11yModule, IconComponent, BadgeComponent, LogoComponent],
  viewProviders: [ɵprovideKitIcons([ICON_CHEVRON_DOWN, ICON_CHEVRON_LEFT, ICON_CHEVRON_RIGHT])],
  templateUrl: './sidenav.component.html',
  styleUrl: './sidenav.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class.lc-sidenav-container]': 'true',
    '[class.lc-sidenav-container--docked]': "effectiveMode() === 'docked'",
    '[class.lc-sidenav-container--open]': 'isOpen()',
  },
})
export class SidenavComponent implements OnDestroy {
  private readonly router = inject(Router);

  /**
   * The router's URL, updated on every `NavigationEnd`. Before the first
   * navigation it is the router's initial URL (`/`). Read only when
   * `activeRoute` is empty.
   */
  private readonly routerUrl = signal(this.router.url);

  /** Whether the sidenav is collapsed to icon-only rail (two-way bindable) */
  readonly collapsed = model(false);

  /** Whether to show the logo at the top of the sidenav */
  readonly showLogo = input(false);

  /** Custom URL for the full brand logo (forwarded to inner `<lc-logo>`). */
  readonly logoSrc = input('');
  /** Custom URL for the emblem-only brand logo. */
  readonly logoEmblemSrc = input('');
  /** Optional dark-theme URL for the full brand logo. */
  readonly logoDarkSrc = input('');
  /** Optional dark-theme URL for the emblem-only brand logo. */
  readonly logoDarkEmblemSrc = input('');
  /** Alt text for the brand logo. */
  readonly logoAlt = input('');

  /** Size of the brand logo (forwarded to inner `<lc-logo>`). Defaults to `md` for a prominent brand block aligned with `<lc-header size="md">` (both 64px). */
  readonly logoSize = input<'xs' | 'sm' | 'md' | 'lg' | 'xl'>('md');

  /** Whether the sidenav is open */
  readonly isOpen = input(false);

  /** Display mode: 'drawer' (overlay) or 'docked' (persistent sidebar) */
  readonly mode = input<SidenavMode>('drawer');

  /** Mobile breakpoint in pixels. Below this width, docked mode switches to drawer. */
  readonly mobileBreakpoint = input(768);

  /** Whether the viewport is below the mobile breakpoint */
  readonly isMobile = signal(false);

  /** Effective mode: switches docked → drawer on mobile */
  readonly effectiveMode = computed(() => {
    if (this.isMobile() && this.mode() === 'docked') {
      return 'drawer' as SidenavMode;
    }
    return this.mode();
  });

  private mediaQuery: MediaQueryList | null = null;
  private mediaHandler = (e: MediaQueryListEvent) => this.isMobile.set(e.matches);

  /** Position of the sidenav (left or right) */
  readonly position = input<SidenavPosition>('left');

  /** Width of the sidenav drawer */
  readonly width = input('320px');

  /**
   * ARIA label of the navigation landmark (the inner `<nav>`) and, in drawer
   * mode, of the dialog panel.
   */
  readonly ariaLabel = input('Side navigation');

  /** Whether to show the overlay backdrop */
  readonly hasOverlay = input(true);

  /**
   * Navigation items (`NavigationItem[]`): `id`, `icon`, `label`, `route`,
   * `displayOrder` (sort order, 1 = first); optional `children`
   * (`NavigationItem[]`, a collapsible group, up to 3 levels), `isSection`
   * (renders `label` as a section headline over its `children`), `badge`
   * (`{ value: string | number; variant?: 'default' | 'primary' | 'success' |
   * 'warning' | 'error' | 'info' }`), `action` (`{ icon: string; ariaLabel?:
   * string }`, a button that emits `itemAction`), `requiredRole` (for the
   * app's own filtering; not evaluated here). Items link with `routerLink`;
   * exactly one link, the current item (see `activeRoute`), gets
   * `aria-current="page"`.
   * @default []
   */
  readonly items = input<NavigationItem[]>([]);

  /**
   * The current route. When set, the first link (in display order) whose
   * `route` equals it is the current item: it alone gets `aria-current="page"`
   * and the current look, whatever the router matches. When empty, the
   * sidenav follows the router: the link whose route equals the URL's path is
   * current, otherwise the one with the longest route the path starts with
   * (`/household` on `/household/members`; `/` only on `/`). Routes are
   * compared as written, so give them as absolute paths (`'/household'`).
   * @default ''
   */
  readonly activeRoute = input('');

  /** Theme variant for the sidenav */
  readonly theme = input<'light' | 'dark' | 'auto'>('auto');

  /**
   * Surface of the docked sidenav: `default` (the rail with background and
   * border) or `transparent` (no background, no border, items as 48 px pills
   * with radius full and 16 px labels; the current one on
   * `--color-surface-selected`). A drawer keeps its surface.
   */
  readonly variant = input<SidenavVariant>('default');

  /** Accessible name of the logo button that collapses/expands the sidebar. */
  readonly toggleAriaLabel = input('Toggle sidebar');

  /** Accessible name of the collapse button. Empty: "Collapse navigation to the left/right" by `position`. */
  readonly collapseAriaLabel = input('');

  /** Tooltip of the collapse button. */
  readonly collapseTitle = input('Collapse sidebar');

  /** Accessible name of the close button (drawer mode). */
  readonly closeAriaLabel = input('Close navigation');

  /**
   * Ids of the expanded parent items — the single source of truth for
   * `isExpanded`. Seeded with the current item's parent whenever it changes
   * (see constructor), so a group opens on navigation but can still
   * be collapsed by the user. (It used to be OR-ed with `hasActiveChild` at
   * read time, so toggling such a group flipped the set without ever closing
   * it — the set drifted out of sync with what was on screen.)
   */
  readonly expandedItems = signal<Set<string>>(new Set());

  /** Ids of the collapsible parents (top-level groups, section sub-groups) that contain the current item. */
  private readonly activeChildParents = computed(() => currentItemParents(this.items(), this.currentItem()));

  /**
   * Computed sorted navigation items by displayOrder
   */
  readonly sortedItems = computed(() => sortNavigationItems(this.items()));

  /**
   * Every item rendered as a link, in display order (depth first): simple
   * items, the children of a group, the children of a section, and the
   * children of a section's sub-group.
   */
  private readonly linkItems = computed(() => navigationLinks(this.sortedItems()));

  /** The router URL's path: primary outlet only, no query, fragment or matrix parameters. */
  private readonly routerPath = computed(() => navigationPath(this.router, this.routerUrl()));

  /**
   * The one current link (or none). The single source of both the current
   * look (`lc-sidenav__nav-item--active`) and `aria-current="page"` (AS-16).
   * With `activeRoute` set: the first link whose route equals it. Without:
   * the router's path — the exact match wins, otherwise the longest link
   * route the path continues with a `/` (`/` matches only `/`); ties go to
   * the first link in display order. The rules live in
   * `internal/navigation` since 3.6, shared with `lc-sidenav-placeholder`.
   */
  private readonly currentItem = computed<NavigationItem | null>(() =>
    currentNavigationItem(this.linkItems(), this.activeRoute(), this.activeRoute() === '' ? this.routerPath() : ''),
  );

  /**
   * Event emitted when the sidenav should close
   */
  readonly closed = output<void>();

  /**
   * Event emitted when a navigation item is clicked
   */
  readonly itemClicked = output<NavigationItem>();

  /**
   * Event emitted when an item's action button is clicked
   */
  readonly itemAction = output<NavigationItem>();

  constructor() {
    this.router.events
      .pipe(
        filter((event): event is NavigationEnd => event instanceof NavigationEnd),
        takeUntilDestroyed(),
      )
      .subscribe(() => this.routerUrl.set(this.router.url));

    // React to mobileBreakpoint changes
    effect(() => {
      this.mobileBreakpoint(); // track dependency
      this.setupMediaQuery();
    });

    // Navigating into a group opens it: add the active child's parent(s) to
    // the expanded set. Only additive — the user's own collapses/expands of
    // other groups survive a route change.
    effect(() => {
      const parents = this.activeChildParents();
      if (parents.length === 0) return;
      const expanded = untracked(this.expandedItems);
      if (parents.every((id) => expanded.has(id))) return;
      this.expandedItems.set(new Set([...expanded, ...parents]));
    });
  }

  ngOnDestroy(): void {
    this.teardownMediaQuery();
  }

  private setupMediaQuery(): void {
    if (typeof window === 'undefined') return;
    this.teardownMediaQuery();
    this.mediaQuery = window.matchMedia(`(max-width: ${this.mobileBreakpoint()}px)`);
    this.isMobile.set(this.mediaQuery.matches);
    this.mediaQuery.addEventListener('change', this.mediaHandler);
  }

  private teardownMediaQuery(): void {
    this.mediaQuery?.removeEventListener('change', this.mediaHandler);
    this.mediaQuery = null;
  }

  /**
   * Computed CSS classes for the sidenav
   */
  sidenavClasses = computed(() => {
    const classes = ['lc-sidenav'];
    classes.push(`lc-sidenav--${this.position()}`);
    classes.push(`lc-sidenav--${this.effectiveMode()}`);
    if (this.isOpen()) {
      classes.push('lc-sidenav--open');
    }
    if (this.collapsed() && !this.isMobile()) {
      classes.push('lc-sidenav--collapsed');
    }
    if (this.theme() !== 'auto') {
      classes.push(`lc-sidenav--${this.theme()}`);
    }
    if (this.variant() === 'transparent') {
      classes.push('lc-sidenav--transparent');
    }
    return classes.join(' ');
  });

  /**
   * Computed inline styles for the sidenav
   */
  sidenavStyles = computed(() => ({
    width: this.isMobile() ? this.width() : (this.collapsed() ? '56px' : this.width()),
  }));

  /**
   * Toggle collapsed state
   */
  toggleCollapsed(): void {
    this.collapsed.set(!this.collapsed());
  }

  /**
   * Handle close action
   */
  handleClose(): void {
    this.closed.emit();
  }

  /**
   * Handle navigation item click
   */
  handleItemClick(item: NavigationItem): void {
    this.itemClicked.emit(item);
    // Auto-close drawer on mobile after navigation
    if (this.isMobile()) {
      this.handleClose();
    }
  }

  /**
   * Handle action button click on a navigation item
   */
  handleItemAction(event: Event, item: NavigationItem): void {
    event.stopPropagation();
    this.itemAction.emit(item);
  }

  /**
   * Whether the item is the current link (see `currentItem`): it alone is
   * painted current and carries `aria-current="page"`.
   */
  isItemActive(item: NavigationItem): boolean {
    return this.currentItem() === item;
  }

  /**
   * Check if a parent item contains the current link
   */
  hasActiveChild(item: NavigationItem): boolean {
    const current = this.currentItem();
    return !!current && !!item.children?.includes(current);
  }

  /**
   * Toggle expansion of a parent item.
   * If the sidenav is collapsed, expand it first.
   */
  toggleExpanded(item: NavigationItem): void {
    if (this.collapsed()) {
      this.collapsed.set(false);
      // Expand the clicked item after uncollapsing
      const expanded = new Set(this.expandedItems());
      expanded.add(item.id);
      this.expandedItems.set(expanded);
      return;
    }
    const expanded = new Set(this.expandedItems());
    if (expanded.has(item.id)) {
      expanded.delete(item.id);
    } else {
      expanded.add(item.id);
    }
    this.expandedItems.set(expanded);
  }

  /**
   * Check if an item is expanded
   */
  isExpanded(item: NavigationItem): boolean {
    return this.expandedItems().has(item.id);
  }

  /**
   * Handle keyboard navigation. Keyed on the EFFECTIVE mode: a docked sidenav
   * that has become a drawer below the mobile breakpoint must close on Escape
   * like any drawer.
   */
  @HostListener('document:keydown', ['$event'])
  handleKeydown(event: KeyboardEvent): void {
    if (event.key === 'Escape' && this.isOpen() && this.effectiveMode() === 'drawer') {
      this.handleClose();
    }
  }
}
