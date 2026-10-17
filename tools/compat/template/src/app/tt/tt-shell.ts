import { ChangeDetectionStrategy, Component, afterNextRender, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { filter, map } from 'rxjs';
import { AppPageComponent, AppShellComponent } from '@lifecorner/angular-ui-kit/app-shell';
import { BottomNavComponent, type BottomNavItem } from '@lifecorner/angular-ui-kit/bottom-nav';
import { FooterComponent, type FooterSection } from '@lifecorner/angular-ui-kit/footer';
import { HeaderComponent } from '@lifecorner/angular-ui-kit/header';
import type { NavigationItem } from '@lifecorner/angular-ui-kit/models';
import { SidenavComponent } from '@lifecorner/angular-ui-kit/sidenav';
import { ToastOutletComponent } from '@lifecorner/angular-ui-kit/toast';

/** The URL's path, without query and fragment. */
const pathOf = (url: string) => url.split(/[?#]/)[0] || '/';

/**
 * The F1 app shell of the `/tt` pages (3.5, request 001): only secondary-entry
 * imports. `activeRoute` follows the router URL, as life-os binds it (AS-16),
 * and the page is busy until the browser has taken over (AS-12).
 */
@Component({
  selector: 'tt-shell',
  imports: [
    AppShellComponent, AppPageComponent, HeaderComponent, SidenavComponent, BottomNavComponent, FooterComponent,
    ToastOutletComponent, RouterOutlet,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <lc-app-shell>
      <lc-header shell-header variant="transparent" [sticky]="false" title="Produkt" titleTag="span"
                 subtitle="Unser Haushalt" homeAriaLabel="Produkt – Startseite" homeHref="/tt"
                 userMenuTrigger="avatar" userAvatarColor="member-1" userName="Johanna Apfelbaum"
                 userEmail="johanna@example.org" userMenuAriaLabel="Menü für Johanna Apfelbaum"
                 profileLabel="Einstellungen" logoutLabel="Abmelden" menuSize="md"
                 [showThemeButton]="true" themeToDarkAriaLabel="Dunkel" themeToLightAriaLabel="Hell" />
      <lc-sidenav shell-nav mode="docked" [isOpen]="true" width="100%" [mobileBreakpoint]="0"
                  variant="transparent" ariaLabel="Hauptnavigation" [items]="nav" [activeRoute]="activeRoute()" />
      <lc-app-page mainId="tt-main" [busy]="busy()">
        <router-outlet />
      </lc-app-page>
      <lc-footer shell-footer [sections]="footer" [headingLevel]="2" navAriaLabel="Fußzeile" copyright="© 2026 Compat" />
      <lc-bottom-nav shell-bottom-nav variant="floating" ariaLabel="Hauptnavigation unten" [items]="bottomNav"
                     [activeRoute]="activeRoute()" />
    </lc-app-shell>
    <lc-toast-outlet />
  `,
})
export class TtShell {
  private readonly router = inject(Router);

  protected readonly nav: NavigationItem[] = [
    { id: 'today', icon: 'sun', label: 'Heute', route: '/tt', displayOrder: 1 },
    { id: 'household', icon: 'home', label: 'Haushalt', route: '/tt/household', displayOrder: 2 },
    { id: 'icons', icon: 'light-bulb', label: 'Icons', route: '/tt/icons', displayOrder: 3 },
    { id: 'fetched', icon: 'arrow-path', label: 'Geladene Icons', route: '/tt/fetched', displayOrder: 4 },
  ];
  protected readonly bottomNav: BottomNavItem[] = [
    { id: 'today', label: 'Heute', icon: 'sun', route: '/tt' },
    { id: 'start', label: 'Start', icon: 'home', route: '/' },
  ];
  protected readonly footer: FooterSection[] = [
    { title: 'Hilfe', links: [{ label: 'Sicherheit', href: '/tt/household' }] },
  ];

  protected readonly activeRoute = toSignal(
    this.router.events.pipe(
      filter((event): event is NavigationEnd => event instanceof NavigationEnd),
      map((event) => pathOf(event.urlAfterRedirects)),
    ),
    { initialValue: pathOf(this.router.url) },
  );

  /** Busy in the prerendered page (the skeleton phase); cleared once the browser has rendered. */
  protected readonly busy = signal(true);

  constructor() {
    afterNextRender(() => this.busy.set(false));
  }
}
