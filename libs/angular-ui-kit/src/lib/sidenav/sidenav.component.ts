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
} from '@angular/core';
import { NgTemplateOutlet, NgStyle } from '@angular/common';
import { RouterModule } from '@angular/router';
import { A11yModule } from '@angular/cdk/a11y';
import { NavigationItem } from '../models/navigation-item.interface';
import { IconComponent } from '../icon/icon.component';
import { BadgeComponent } from '../badge/badge.component';
import { LogoComponent } from '../logo/logo.component';

export type SidenavPosition = 'left' | 'right';
export type SidenavMode = 'drawer' | 'docked';

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
 * - Active route highlighting (no hover color change on active items)
 * - Keyboard navigation support (Escape closes drawer)
 * - Configurable width and position (left/right)
 * - Optional backdrop overlay
 * - Theme variants: auto, light, dark (with teal accent for dark mode)
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
  imports: [NgTemplateOutlet, NgStyle, RouterModule, A11yModule, IconComponent, BadgeComponent, LogoComponent],
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

  /** Navigation items to display */
  readonly items = input<NavigationItem[]>([]);

  /** Current active route for highlighting */
  readonly activeRoute = input('');

  /** Theme variant for the sidenav */
  readonly theme = input<'light' | 'dark' | 'auto'>('auto');

  /**
   * Ids of the expanded parent items — the single source of truth for
   * `isExpanded`. Seeded with the active child's parent whenever `activeRoute`
   * changes (see constructor), so a group opens on navigation but can still
   * be collapsed by the user. (It used to be OR-ed with `hasActiveChild` at
   * read time, so toggling such a group flipped the set without ever closing
   * it — the set drifted out of sync with what was on screen.)
   */
  readonly expandedItems = signal<Set<string>>(new Set());

  /** Ids of the collapsible parents (top-level groups, section sub-groups) that contain the active route. */
  private readonly activeChildParents = computed(() => {
    const route = this.activeRoute();
    const ids: string[] = [];
    for (const item of this.items()) {
      const collapsibles = item.isSection ? (item.children ?? []) : [item];
      for (const parent of collapsibles) {
        if (parent.children?.some((child) => child.route === route)) {
          ids.push(parent.id);
        }
      }
    }
    return ids;
  });

  /**
   * Computed sorted navigation items by displayOrder
   */
  readonly sortedItems = computed(() => {
    return [...this.items()].sort((a, b) => a.displayOrder - b.displayOrder);
  });

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
   * Check if an item is active
   */
  isItemActive(item: NavigationItem): boolean {
    return this.activeRoute() === item.route;
  }

  /**
   * Check if a parent item has an active child
   */
  hasActiveChild(item: NavigationItem): boolean {
    if (!item.children?.length) return false;
    return item.children.some((child) => this.isItemActive(child));
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
