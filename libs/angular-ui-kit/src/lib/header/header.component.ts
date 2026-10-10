import {
  Component,
  ElementRef,
  Injector,
  input,
  output,
  signal,
  computed,
  inject,
  viewChild,
  afterRenderEffect,
  ChangeDetectionStrategy,
  ViewEncapsulation,
} from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ButtonComponent } from '../button/button.component';
import { LogoComponent } from '../logo/logo.component';
import { IconComponent } from '../icon/icon.component';
import { AvatarComponent } from '../avatar/avatar.component';
import { MenuComponent, MenuItem } from '../menu/menu.component';
import { ThemeService } from '../theme/theme.service';

/** A link in the header's main navigation (`navItems`). */
export interface HeaderNavItem {
  /** Visible link text. */
  label: string;
  /** Plain URL — rendered as a native `href`, no router involved. */
  href: string;
  /** Marks the page the visitor is on (`aria-current="page"` + underline). */
  current?: boolean;
}

/** Element used for the header title (`titleTag`). */
export type HeaderTitleTag = 'h1' | 'h2' | 'h3' | 'p' | 'span' | 'div';

/**
 * AppHeaderComponent - Global application header for Life-Cockpit shell
 *
 * Features:
 * - Clickable logo for home navigation
 * - Optional title and subtitle display
 * - User profile dropdown with avatar, name, email, optional Profile link, and Logout
 * - Optional theme toggle button in header. By default the button toggles the
 *   `ThemeService` itself and additionally emits `themeToggleClick`, so the
 *   handler must NOT toggle again (that would undo the switch). To own the
 *   toggling in the app, set `[autoToggleTheme]="false"` and toggle in the
 *   handler.
 * - Hamburger menu toggle for mobile sidebar; bind `sidenavOpen` (and
 *   `sidenavId`) so the toggle exposes `aria-expanded` / `aria-controls`.
 * - OnPush change detection for performance
 *
 * Public, prerendered sites (no router, no JavaScript needed):
 * - `homeHref` makes the brand a plain link (instead of `routerLink="/"`).
 * - `navItems` render a labelled main navigation (`<nav aria-label><ul>` with
 *   `aria-current="page"` on the current item); below 1024 px it moves to a
 *   second row and wraps.
 * - `[slot='end']` takes content at the end of the first row (e.g. a language
 *   link), `showUserMenu` hides the account menu, `titleTag` picks the title
 *   element (the page keeps its own `<h1>`), `sticky` can be switched off.
 * - Every built-in label is an input (`homeAriaLabel`, `hamburgerAriaLabel`,
 *   `userMenuAriaLabel`, `navAriaLabel`, `profileLabel`, `logoutLabel`,
 *   `themeToDarkAriaLabel`, `themeToLightAriaLabel`, `contextAriaLabel`);
 *   the defaults stay English.
 * - The `ThemeService` (which persists to localStorage) is only created when
 *   the theme button is shown.
 *
 * @example
 * ```html
 * <lc-header
 *   [logo]="'/assets/logo.svg'"
 *   [title]="'Life-Cockpit'"
 *   [subtitle]="'User Profile'"
 *   [userName]="'John Doe'"
 *   [userEmail]="'user@example.com'"
 *   [showHamburger]="true"
 *   [sidenavOpen]="sidenavOpen"
 *   sidenavId="app-sidenav"
 *   [showThemeButton]="true"
 *   [showProfileMenuItem]="true"
 *   (hamburgerClick)="toggleSidebar()"
 *   (themeToggleClick)="trackThemeToggle()"
 *   (profileClick)="navigateToProfile()"
 *   (logoutClick)="handleLogout()"
 * />
 *
 * <!-- App-controlled theme: the header only reports the click -->
 * <lc-header
 *   [showThemeButton]="true"
 *   [autoToggleTheme]="false"
 *   (themeToggleClick)="toggleTheme()"
 * />
 *
 * <!-- Public site: plain links, labelled nav, language link at the end -->
 * <lc-header
 *   size="sm"
 *   [sticky]="false"
 *   [showUserMenu]="false"
 *   homeHref="/de/"
 *   homeAriaLabel="Produkt – Startseite"
 *   navAriaLabel="Hauptnavigation"
 *   [navItems]="[
 *     { label: 'Sicherheit', href: '/de/sicherheit', current: true },
 *     { label: 'Roadmap', href: '/de/roadmap' }
 *   ]"
 * >
 *   <a slot="end" lcButton variant="ghost" href="/en/security" hreflang="en" lang="en">English</a>
 * </lc-header>
 * ```
 */
@Component({
  selector: 'lc-header',
  standalone: true,
  imports: [
    NgTemplateOutlet,
    RouterModule,
    ButtonComponent,
    LogoComponent,
    IconComponent,
    AvatarComponent,
    MenuComponent,
  ],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'lc-header-host',
  },
})
export class HeaderComponent {
  readonly theme = input<'light' | 'dark' | 'auto'>('auto');
  readonly logo = input('');
  /**
   * Render the brand block. On its own this shows the emblem; with `logo` set
   * it shows the full lockup. (It used to additionally require `logo` or
   * `title`, so `showLogo` alone rendered an empty 0px-wide brand area with no
   * error — an app could end up with no branding at all and no clue why.)
   */
  readonly showLogo = input(true);
  /** Custom URL for the full brand logo (forwarded to inner `<lc-logo>`). */
  readonly logoSrc = input('');
  /** Custom URL for the emblem-only brand logo. */
  readonly logoEmblemSrc = input('');
  /** Optional dark-theme URL for the full brand logo. */
  readonly logoDarkSrc = input('');
  /** Optional dark-theme URL for the emblem-only brand logo. */
  readonly logoDarkEmblemSrc = input('');
  /** Alt text for the brand logo (forwarded to inner `<lc-logo>`). */
  readonly logoAlt = input('');
  /** Size of the brand logo (forwarded to inner `<lc-logo>`). Defaults to `md`. */
  readonly logoSize = input<'xs' | 'sm' | 'md' | 'lg' | 'xl'>('md');
  /**
   * Overall header height. Useful to align the header with a sidebar brand block.
   * Maps to the same `min-height` scale the sidenav logo area uses:
   * `sm` 56px · `md` 64px (default) · `lg` 80px · `xl` 112px.
   */
  readonly size = input<'sm' | 'md' | 'lg' | 'xl'>('md');
  readonly title = input('');
  /**
   * Element for the title. `h1` keeps the app-shell behaviour; on a site whose
   * pages carry their own `<h1>`, use `span` (or `p`/`div`).
   */
  readonly titleTag = input<HeaderTitleTag>('h1');
  readonly subtitle = input('');
  readonly userEmail = input('');
  readonly userName = input('');
  readonly showHamburger = input(false);
  /**
   * Open state of the sidenav the hamburger controls. When bound, the toggle
   * announces it via `aria-expanded`; leave `undefined` when the header does
   * not know (the attribute is then omitted rather than lying).
   */
  readonly sidenavOpen = input<boolean | undefined>(undefined);
  /** DOM id of the sidenav the hamburger controls (`aria-controls`). */
  readonly sidenavId = input('');
  readonly showThemeButton = input(false);
  /**
   * Whether the theme button toggles the `ThemeService` itself before emitting
   * `themeToggleClick`. Set to `false` when the app owns the theme switch and
   * toggles in the `(themeToggleClick)` handler — otherwise both would toggle
   * and the click would be a no-op.
   */
  readonly autoToggleTheme = input(true);
  readonly contextName = input('');
  readonly contextLabel = input('');
  readonly menuSize = input<'sm' | 'md' | 'lg'>('sm');
  readonly showProfileMenuItem = input(true);
  /** Render the account menu (avatar trigger with Profile/Logout). */
  readonly showUserMenu = input(true);
  /**
   * Plain URL for the brand link. When set, the brand is a native
   * `<a href>` — no router needed (static or prerendered sites). Empty keeps
   * `routerLink="/"`.
   */
  readonly homeHref = input('');
  /**
   * Main navigation links, rendered as `<nav><ul><li><a href>` with
   * `aria-current="page"` on the current one. On screens below 1024 px the
   * navigation takes a second row and wraps.
   */
  readonly navItems = input<readonly HeaderNavItem[]>([]);
  /** Keep the header at the top while scrolling (`position: sticky`). */
  readonly sticky = input(true);

  // Labels (defaults are English; translate them in the app).
  /** Accessible name of the brand link. */
  readonly homeAriaLabel = input('Go to home');
  /** Accessible name of the hamburger button. */
  readonly hamburgerAriaLabel = input('Toggle sidebar menu');
  /** Accessible name of the account menu trigger. */
  readonly userMenuAriaLabel = input('Open user menu');
  /** Accessible name of the `<nav>` around `navItems`. */
  readonly navAriaLabel = input('Main navigation');
  /** Label of the theme button while the light theme is active. */
  readonly themeToDarkAriaLabel = input('Switch to dark mode');
  /** Label of the theme button while the dark theme is active. */
  readonly themeToLightAriaLabel = input('Switch to light mode');
  /** Accessible name of the context button (`contextName`). */
  readonly contextAriaLabel = input('Context info');
  /** Label of the Profile entry in the account menu. */
  readonly profileLabel = input('Profile');
  /** Label of the Logout entry in the account menu. */
  readonly logoutLabel = input('Logout');

  readonly hamburgerClick = output<void>();
  readonly themeToggleClick = output<void>();
  readonly logoutClick = output<void>();
  readonly profileClick = output<void>();
  readonly contextClick = output<void>();

  private readonly injector = inject(Injector);
  private themeServiceInstance: ThemeService | null = null;

  /**
   * Resolved on first use, i.e. only when the theme button is shown: creating
   * the ThemeService reads and writes the theme class and localStorage, which a
   * site without a theme switch must not do.
   */
  protected get themeService(): ThemeService {
    return (this.themeServiceInstance ??= this.injector.get(ThemeService));
  }

  private readonly hamburger = viewChild('hamburger', { read: ElementRef<HTMLElement> });

  constructor() {
    // The hamburger is an <lc-button>; the ARIA state belongs on its native
    // <button> (the element that has the button role), not on the custom
    // element host — so it is reflected after render rather than bound in the
    // template.
    afterRenderEffect(() => {
      const button = this.hamburger()?.nativeElement.querySelector('button');
      if (!button) return;
      const open = this.sidenavOpen();
      const controls = this.sidenavId();
      if (open === undefined) {
        button.removeAttribute('aria-expanded');
      } else {
        button.setAttribute('aria-expanded', String(open));
      }
      if (controls) {
        button.setAttribute('aria-controls', controls);
      } else {
        button.removeAttribute('aria-controls');
      }
    });
  }

  /**
   * Get menu items for profile dropdown
   */
  protected readonly menuItems = computed<MenuItem[]>(() => {
    const items: MenuItem[] = [];

    // Add profile link if enabled
    if (this.showProfileMenuItem()) {
      items.push({
        id: 'profile',
        label: this.profileLabel(),
        icon: 'user',
        dividerAfter: true,
      });
    }

    // Add logout
    items.push({
      id: 'logout',
      label: this.logoutLabel(),
      icon: 'arrow-right-start-on-rectangle',
      variant: 'danger',
    });

    return items;
  });

  /**
   * Dropdown open state (using Angular signals)
   */
  private readonly dropdownOpen = signal<boolean>(false);

  /**
   * Get dropdown open state
   */
  isDropdownOpen(): boolean {
    return this.dropdownOpen();
  }

  /**
   * Toggle profile dropdown visibility
   */
  toggleDropdown(): void {
    this.dropdownOpen.set(!this.dropdownOpen());
  }

  /**
   * Close profile dropdown
   */
  closeDropdown(): void {
    this.dropdownOpen.set(false);
  }

  /**
   * Handle hamburger click
   */
  onHamburgerClick(): void {
    this.hamburgerClick.emit();
  }

  /**
   * Handle theme button click (separate button, not in menu). Toggles the
   * theme unless the app opted out via `autoToggleTheme`, then emits.
   */
  onThemeButtonClick(): void {
    if (this.autoToggleTheme()) {
      this.themeService.toggleTheme();
    }
    this.themeToggleClick.emit();
  }

  /**
   * Handle logout click
   */
  onLogoutClick(): void {
    this.logoutClick.emit();
    this.closeDropdown();
  }

  /**
   * Handle profile click
   */
  onProfileClick(): void {
    this.profileClick.emit();
    this.closeDropdown();
  }

  /**
   * Handle menu item click
   */
  onMenuItemClick(item: MenuItem): void {
    if (item.id === 'logout') {
      this.onLogoutClick();
    } else if (item.id === 'profile') {
      this.onProfileClick();
    }
  }
}
