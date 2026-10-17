import { ChangeDetectionStrategy, Component, computed, inject, input, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs';
import type { NavigationItem } from '@lifecorner/angular-ui-kit/models';
// Types only: a value import would load lc-sidenav eagerly (AS-18).
import type { SidenavPosition, SidenavVariant } from '@lifecorner/angular-ui-kit/sidenav';
import {
  currentItemParents,
  currentNavigationItem,
  navigationLinks,
  navigationPath,
  sortNavigationItems,
} from '@lifecorner/angular-ui-kit/internal/navigation';

/** Label bar widths, cycled per row (design 002 §3). */
const LABEL_WIDTHS = ['64%', '48%', '72%', '56%'] as const;

/**
 * Stand-in for a docked `lc-sidenav` while it loads (3.6, AS-18): an inert
 * skeleton of the rail with exactly the sidenav's boxes — the same container,
 * width, logo block, rows, sections and expanded groups, built from the same
 * classes and the same box rules — so swapping it for the sidenav moves
 * nothing (CLS 0). Give it the sidenav's bindings.
 *
 * Use it as the `@placeholder` of a `@defer (on viewport)` block. In the app
 * shell the navigation column is hidden below 1024 px, so on a phone the
 * trigger never fires and the sidenav's JavaScript never loads:
 *
 * @example
 * ```html
 * <div shell-nav>
 *   @defer (on viewport) {
 *     <lc-sidenav mode="docked" [isOpen]="true" width="100%" [mobileBreakpoint]="0"
 *                 variant="transparent" ariaLabel="Hauptnavigation" [items]="nav" [activeRoute]="url()" />
 *   } @placeholder {
 *     <lc-sidenav-placeholder [isOpen]="true" width="100%" variant="transparent" [items]="nav" [activeRoute]="url()" />
 *   }
 * </div>
 * ```
 * Import `SidenavComponent` from `@lifecorner/angular-ui-kit/sidenav` and use
 * it only inside the `@defer` block; any other use of it in the same
 * component makes Angular load it eagerly. With a percentage `width`, give
 * the block a container of definite width (the app shell's column is one):
 * in a shrink-to-fit container the sidenav's width follows its label text.
 *
 * Accessibility: the whole placeholder is `aria-hidden="true"` and `inert` —
 * no landmark, no tab stop, nothing announced, so focus can never be inside
 * it when it is swapped. The navigation landmark, the current item
 * (`aria-current`) and the tab order arrive with `lc-sidenav`. Static, no
 * shimmer. The skeleton shapes are filled with
 * `--lc-sidenav-placeholder-fill`; the `--lc-sidenav-*` hooks apply as on
 * `lc-sidenav` (set them on an ancestor of both).
 */
@Component({
  selector: 'lc-sidenav-placeholder',
  standalone: true,
  templateUrl: './sidenav-placeholder.component.html',
  styleUrl: './sidenav-placeholder.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'lc-sidenav-container lc-sidenav-container--docked',
    '[class.lc-sidenav-container--open]': 'isOpen()',
    'aria-hidden': 'true',
    inert: '',
  },
})
export class SidenavPlaceholderComponent {
  private readonly router = inject(Router, { optional: true });
  /** The router's URL, as on `lc-sidenav`; read only when `activeRoute` is empty. */
  private readonly routerUrl = signal(this.router?.url ?? '/');

  /**
   * Navigation items, the same value as on `lc-sidenav`: they give the number
   * of rows, the sections and the groups that start expanded.
   * @default []
   */
  readonly items = input<NavigationItem[]>([]);

  /**
   * The current route, as on `lc-sidenav`. It decides which group starts
   * expanded; when empty, the router's URL does (3.5 rules).
   * @default ''
   */
  readonly activeRoute = input('');

  /**
   * The 56 px icon rail. One-way here (a `model` on `lc-sidenav`).
   * @default false
   */
  readonly collapsed = input(false);

  /**
   * Whether the docked rail is open; a closed one is 0 px wide, as on `lc-sidenav`.
   * @default false
   */
  readonly isOpen = input(false);

  /**
   * Width of the rail, as on `lc-sidenav`.
   * @default '320px'
   */
  readonly width = input('320px');

  /**
   * Surface, as on `lc-sidenav`: `default` (the rail) or `transparent` (the
   * side navigation on the page, 48 px pills).
   * @default 'default'
   */
  readonly variant = input<SidenavVariant>('default');

  /**
   * Theme, as on `lc-sidenav`.
   * @default 'auto'
   */
  readonly theme = input<'light' | 'dark' | 'auto'>('auto');

  /**
   * Position, as on `lc-sidenav`.
   * @default 'left'
   */
  readonly position = input<SidenavPosition>('left');

  /**
   * Reserves the logo block, as `showLogo` on `lc-sidenav`.
   * @default false
   */
  readonly showLogo = input(false);

  /**
   * Height of the logo block, as on `lc-sidenav`.
   * @default 'md'
   */
  readonly logoSize = input<'xs' | 'sm' | 'md' | 'lg' | 'xl'>('md');

  /** The items in display order. @internal */
  protected readonly sortedItems = computed(() => sortNavigationItems(this.items()));

  /** The groups `lc-sidenav` opens on load: the parents of the current item. @internal */
  private readonly expanded = computed(() => {
    const active = this.activeRoute();
    const path = active === '' && this.router ? navigationPath(this.router, this.routerUrl()) : '';
    const current = currentNavigationItem(navigationLinks(this.sortedItems()), active, path);
    return new Set(currentItemParents(this.items(), current));
  });

  /** The rail's classes, in `lc-sidenav`'s order, always docked. @internal */
  protected readonly railClasses = computed(() => {
    const classes = ['lc-sidenav', `lc-sidenav--${this.position()}`, 'lc-sidenav--docked'];
    if (this.isOpen()) classes.push('lc-sidenav--open');
    if (this.collapsed()) classes.push('lc-sidenav--collapsed');
    if (this.theme() !== 'auto') classes.push(`lc-sidenav--${this.theme()}`);
    if (this.variant() === 'transparent') classes.push('lc-sidenav--transparent');
    return classes.join(' ');
  });

  /** The rail's width, as `lc-sidenav` sets it. @internal */
  protected readonly railWidth = computed(() => (this.collapsed() ? '56px' : this.width()));

  constructor() {
    this.router?.events
      .pipe(
        filter((event): event is NavigationEnd => event instanceof NavigationEnd),
        takeUntilDestroyed(),
      )
      .subscribe(() => this.routerUrl.set(this.router?.url ?? '/'));
  }

  /** Whether a group starts expanded. @internal */
  protected isExpanded(item: NavigationItem): boolean {
    return this.expanded().has(item.id);
  }

  /** The label bar's width for the row at `index`. @internal */
  protected labelWidth(index: number): string {
    return LABEL_WIDTHS[index % LABEL_WIDTHS.length];
  }
}
