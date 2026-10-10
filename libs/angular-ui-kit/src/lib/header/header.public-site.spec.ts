import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withXhr } from '@angular/common/http';
import { HeaderComponent, type HeaderNavItem, type HeaderTitleTag } from './header.component';
import { ThemeService } from '../theme/theme.service';

/**
 * lc-header as the frame of a public, prerendered site (G-2): plain links
 * instead of router links, a labelled main navigation, translatable labels,
 * an end slot, no forced <h1> and no ThemeService (localStorage) unless the
 * theme button is actually shown.
 */
@Component({
  imports: [HeaderComponent],
  changeDetection: ChangeDetectionStrategy.Eager,
  template: `
    <lc-header
      [showUserMenu]="false"
      homeHref="/de/"
      homeAriaLabel="Produkt – Startseite"
      navAriaLabel="Hauptnavigation"
      [navItems]="navItems()"
      size="sm"
      [sticky]="false"
    >
      <a slot="end" class="lang-link" href="/en/security" hreflang="en" lang="en">English</a>
    </lc-header>
  `,
})
class PublicSiteHostComponent {
  readonly navItems = signal<readonly HeaderNavItem[]>([
    { label: 'Sicherheit', href: '/de/sicherheit', current: true },
    { label: 'So bauen wir', href: '/de/so-bauen-wir' },
    { label: 'Roadmap', href: '/de/roadmap' },
  ]);
}

describe('HeaderComponent — public site (G-2)', () => {
  const themeFactory = jest.fn(() => ({
    isDark: signal(false),
    toggleTheme: jest.fn(),
  }));

  beforeEach(() => {
    themeFactory.mockClear();
  });

  describe('without a router and without the theme button', () => {
    function render() {
      TestBed.configureTestingModule({
        imports: [PublicSiteHostComponent],
        // No provideRouter(): a static site may not have one. HttpClient is for lc-icon.
        providers: [provideHttpClient(withXhr()), { provide: ThemeService, useFactory: themeFactory }],
      });
      const fixture = TestBed.createComponent(PublicSiteHostComponent);
      fixture.detectChanges();
      return { fixture, el: fixture.nativeElement as HTMLElement };
    }

    it('renders the home link as a plain href, so no Router is needed', () => {
      const { el } = render();
      const home = el.querySelector<HTMLAnchorElement>('a.lc-header__logo');
      expect(home?.getAttribute('href')).toBe('/de/');
      expect(home?.getAttribute('aria-label')).toBe('Produkt – Startseite');
    });

    it('does not create the ThemeService (it persists to localStorage) unless the theme button is shown', () => {
      render();
      expect(themeFactory).not.toHaveBeenCalled();
    });

    it('renders navItems as <nav aria-label><ul><li><a>, marking only the current page', () => {
      const { el } = render();
      const nav = el.querySelector('nav.lc-header__nav');
      expect(nav?.getAttribute('aria-label')).toBe('Hauptnavigation');
      const links = [...el.querySelectorAll<HTMLAnchorElement>('nav ul > li > a')];
      expect(links.map((a) => [a.textContent?.trim(), a.getAttribute('href')])).toEqual([
        ['Sicherheit', '/de/sicherheit'],
        ['So bauen wir', '/de/so-bauen-wir'],
        ['Roadmap', '/de/roadmap'],
      ]);
      expect(links.map((a) => a.getAttribute('aria-current'))).toEqual(['page', null, null]);
    });

    it('follows navItems changes', () => {
      const { fixture, el } = render();
      fixture.componentInstance.navItems.set([{ label: 'Roadmap', href: '/de/roadmap', current: true }]);
      fixture.detectChanges();
      const links = el.querySelectorAll('nav a');
      expect(links.length).toBe(1);
      expect(links[0].getAttribute('aria-current')).toBe('page');
    });

    it('marks the header for the two-row layout when it has a nav', () => {
      const { fixture, el } = render();
      expect(el.querySelector('header')?.classList).toContain('lc-header--has-nav');
      fixture.componentInstance.navItems.set([]);
      fixture.detectChanges();
      expect(el.querySelector('header')?.classList).not.toContain('lc-header--has-nav');
      expect(el.querySelector('nav')).toBeNull();
    });

    it('projects [slot=end] content into the header row, after the nav', () => {
      const { el } = render();
      const lang = el.querySelector('header a.lang-link');
      const nav = el.querySelector('header nav');
      if (!lang || !nav) throw new Error('language link or nav not rendered');
      expect(lang.getAttribute('hreflang')).toBe('en');
      // DOM order (and so focus order): brand → nav → end slot.
      expect(nav.compareDocumentPosition(lang) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    });

    it('can hide the user menu entirely', () => {
      const { el } = render();
      expect(el.querySelector('.lc-header__profile-trigger')).toBeNull();
      expect(el.querySelector('lc-menu')).toBeNull();
    });

    it('can opt out of the sticky position', () => {
      const { el } = render();
      expect(el.querySelector('header')?.classList).toContain('lc-header--static');
    });
  });

  describe('labels, title tag and the theme button', () => {
    function create(inputs: Record<string, unknown> = {}) {
      TestBed.configureTestingModule({
        imports: [HeaderComponent],
        providers: [provideRouter([]), provideHttpClient(withXhr()), { provide: ThemeService, useFactory: themeFactory }],
      });
      const fixture = TestBed.createComponent(HeaderComponent);
      for (const [key, value] of Object.entries(inputs)) fixture.componentRef.setInput(key, value);
      fixture.detectChanges();
      return { fixture, el: fixture.nativeElement as HTMLElement };
    }

    it('keeps the English defaults', () => {
      const { el, fixture } = create({ showHamburger: true, showThemeButton: true });
      expect(el.querySelector('a.lc-header__logo')?.getAttribute('aria-label')).toBe('Go to home');
      expect(el.querySelector('.lc-header__hamburger button')?.getAttribute('aria-label')).toBe('Toggle sidebar menu');
      expect(el.querySelector('.lc-header__profile-trigger')?.getAttribute('aria-label')).toBe('Open user menu');
      expect(el.querySelector('.lc-header__theme-toggle button')?.getAttribute('aria-label')).toBe('Switch to dark mode');
      const labels = fixture.componentInstance['menuItems']().map((i) => i.label);
      expect(labels).toEqual(['Profile', 'Logout']);
    });

    it('translates every built-in label', () => {
      const { el, fixture } = create({
        showHamburger: true,
        showThemeButton: true,
        contextName: 'Familie F.',
        homeAriaLabel: 'Zur Startseite',
        hamburgerAriaLabel: 'Seitenleiste umschalten',
        userMenuAriaLabel: 'Benutzermenü öffnen',
        themeToDarkAriaLabel: 'Dunkles Design',
        themeToLightAriaLabel: 'Helles Design',
        contextAriaLabel: 'Haushalt',
        profileLabel: 'Profil',
        logoutLabel: 'Abmelden',
      });
      expect(el.querySelector('a.lc-header__logo')?.getAttribute('aria-label')).toBe('Zur Startseite');
      expect(el.querySelector('.lc-header__hamburger button')?.getAttribute('aria-label')).toBe('Seitenleiste umschalten');
      expect(el.querySelector('.lc-header__profile-trigger')?.getAttribute('aria-label')).toBe('Benutzermenü öffnen');
      expect(el.querySelector('.lc-header__theme-toggle button')?.getAttribute('aria-label')).toBe('Dunkles Design');
      expect(el.querySelector('.lc-header__context-info')?.getAttribute('aria-label')).toBe('Haushalt');
      expect(fixture.componentInstance['menuItems']().map((i) => i.label)).toEqual(['Profil', 'Abmelden']);
    });

    it('creates the ThemeService only once the theme button is shown', () => {
      const { fixture } = create();
      expect(themeFactory).not.toHaveBeenCalled();
      fixture.componentRef.setInput('showThemeButton', true);
      fixture.detectChanges();
      expect(themeFactory).toHaveBeenCalledTimes(1);
    });

    it.each<[HeaderTitleTag, string]>([
      ['h1', 'H1'],
      ['h2', 'H2'],
      ['p', 'P'],
      ['span', 'SPAN'],
      ['div', 'DIV'],
    ])('renders the title as <%s> via titleTag', (tag, tagName) => {
      const { el } = create({ title: 'Produkt', titleTag: tag });
      const title = el.querySelector('.lc-header__title');
      expect(title?.tagName).toBe(tagName);
      expect(title?.textContent?.trim()).toBe('Produkt');
      if (tag !== 'h1') expect(el.querySelector('h1')).toBeNull();
    });

    it('still renders an <h1> title by default', () => {
      const { el } = create({ title: 'Life-Cockpit' });
      expect(el.querySelector('h1.lc-header__title')?.textContent?.trim()).toBe('Life-Cockpit');
    });

    it('keeps the router home link when no homeHref is given', () => {
      const { el } = create();
      // routerLink="/" renders href="/" through the Router.
      expect(el.querySelector('a.lc-header__logo')?.getAttribute('href')).toBe('/');
    });
  });
});
