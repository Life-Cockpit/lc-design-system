import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient, withXhr } from '@angular/common/http';
import { NavigationEnd, Router, provideRouter } from '@angular/router';
import { InteractivityChecker } from '@angular/cdk/a11y';
import { filter } from 'rxjs';
import { SidenavComponent, SidenavMode } from './sidenav.component';
import { NavigationItem } from '../models/navigation-item.interface';

/**
 * The current item under a real router (3.5, AS-16; AC-22 and AC-23 of request
 * 001). In 3.4 each link carried `routerLinkActive` next to the kit's own
 * `aria-current` binding; Angular's RouterLinkActive removes `aria-current` a
 * microtask after every NavigationEnd, and the kit's binding only rewrote it
 * when its value changed — so the start page (`/`) lost it for good. These
 * tests navigate for real and look after the router has settled.
 */

// jsdom has no matchMedia; the sidenav asks for it to switch docked → drawer.
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

@Component({ template: '', changeDetection: ChangeDetectionStrategy.OnPush })
class PageComponent {}

const ROUTES = [
  { path: '', component: PageComponent },
  { path: 'household', component: PageComponent },
  { path: 'household/members', component: PageComponent },
  { path: 'settings', component: PageComponent },
];

const TODAY: NavigationItem = { id: 'today', icon: 'sun', label: 'Heute', route: '/', displayOrder: 1 };
const HOUSEHOLD: NavigationItem = { id: 'household', icon: 'home', label: 'Haushalt', route: '/household', displayOrder: 2 };
const MEMBERS: NavigationItem = { id: 'members', icon: 'users', label: 'Mitglieder', route: '/household/members', displayOrder: 3 };
const SETTINGS: NavigationItem = { id: 'settings', icon: 'settings', label: 'Einstellungen', route: '/settings', displayOrder: 4 };

/** The four link templates of the sidenav, each with Today `/` and Household `/household` as links. */
const SHAPES: Record<string, NavigationItem[]> = {
  'simple items': [TODAY, HOUSEHOLD],
  'group children': [
    TODAY,
    { id: 'group', icon: 'folder', label: 'Bereiche', route: '', displayOrder: 2, children: [{ ...HOUSEHOLD, id: 'g-household' }] },
  ],
  'section children': [
    { id: 'section', icon: '', label: 'Navigation', route: '', displayOrder: 1, isSection: true, children: [{ ...TODAY, id: 's-today' }, { ...HOUSEHOLD, id: 's-household' }] },
  ],
  'section grandchildren': [
    {
      id: 'section', icon: '', label: 'Navigation', route: '', displayOrder: 1, isSection: true,
      children: [
        { id: 'sub', icon: 'folder', label: 'Bereiche', route: '', displayOrder: 1, children: [{ ...TODAY, id: 'gc-today' }, { ...HOUSEHOLD, id: 'gc-household' }] },
      ],
    },
  ],
};

@Component({
  imports: [SidenavComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <lc-sidenav
      [isOpen]="true"
      [mode]="mode()"
      [mobileBreakpoint]="0"
      [items]="items()"
      [activeRoute]="followUrl() ? url() : activeRoute()"
      ariaLabel="Hauptnavigation"
    />
  `,
})
class HostComponent {
  private readonly router = inject(Router);
  readonly mode = signal<SidenavMode>('docked');
  readonly items = signal<NavigationItem[]>(SHAPES['simple items']);
  /** Bind `activeRoute` to the router's URL, as life-os does. */
  readonly followUrl = signal(true);
  readonly activeRoute = signal('');
  /** The router's URL path, as life-os binds it: `/` before the first navigation, then each NavigationEnd's. */
  readonly url = signal(this.router.url);

  constructor() {
    this.router.events
      .pipe(filter((e): e is NavigationEnd => e instanceof NavigationEnd))
      .subscribe((e) => this.url.set(e.urlAfterRedirects.split(/[?#]/)[0]));
  }
}

describe('SidenavComponent current item with a real router (AS-16)', () => {
  let fixture: ComponentFixture<HostComponent>;
  let router: Router;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HostComponent],
      providers: [
        provideRouter(ROUTES),
        provideHttpClient(withXhr()),
        { provide: InteractivityChecker, useValue: { isFocusable: () => true, isTabbable: () => true, isVisible: () => true, isDisabled: () => false } },
      ],
    }).compileComponents();
    router = TestBed.inject(Router);
  });

  function create(setup?: (host: HostComponent) => void): void {
    fixture = TestBed.createComponent(HostComponent);
    setup?.(fixture.componentInstance);
    fixture.detectChanges();
  }

  /** Navigates and waits until the router, the microtasks after NavigationEnd and change detection have settled. */
  async function go(url: string): Promise<void> {
    await router.navigateByUrl(url);
    await fixture.whenStable();
    await new Promise<void>((r) => setTimeout(r));
    fixture.detectChanges();
    await fixture.whenStable();
  }

  const links = () => Array.from((fixture.nativeElement as HTMLElement).querySelectorAll<HTMLAnchorElement>('nav a'));
  const current = () => links().filter((a) => a.hasAttribute('aria-current'));

  /** Exactly one link is current, it is `label`, and every link looks current iff it is announced (AC-22, AC-23). */
  function expectCurrent(label: string | null): void {
    const announced = current();
    expect(announced.map((a) => a.textContent?.trim())).toEqual(label ? [label] : []);
    for (const a of announced) expect(a.getAttribute('aria-current')).toBe('page');
    for (const a of links()) {
      expect({ label: a.textContent?.trim(), looks: a.classList.contains('lc-sidenav__nav-item--active') }).toEqual({
        label: a.textContent?.trim(),
        looks: a.hasAttribute('aria-current'),
      });
    }
  }

  describe.each(['docked', 'drawer'] as const)('AC-22: activeRoute bound to the URL, %s', (mode) => {
    describe.each(Object.keys(SHAPES))('%s', (shape) => {
      beforeEach(() => create((host) => {
        host.mode.set(mode);
        host.items.set(SHAPES[shape]);
      }));

      it('after the first navigation to /', async () => {
        await go('/');
        expectCurrent('Heute');
      });

      it('after / → /household', async () => {
        await go('/');
        await go('/household');
        expectCurrent('Haushalt');
      });

      it('after /household → /', async () => {
        await go('/household');
        await go('/');
        expectCurrent('Heute');
      });

      it('after a first navigation straight to /household', async () => {
        await go('/household');
        expectCurrent('Haushalt');
      });
    });
  });

  describe('AC-23: activeRoute decides when set', () => {
    it('paints and announces only the activeRoute link while the router is on another one', async () => {
      create((host) => {
        host.followUrl.set(false);
        host.activeRoute.set('/household');
      });
      await go('/');
      expectCurrent('Haushalt');
    });

    it('has no current link when activeRoute names no link', async () => {
      create((host) => {
        host.followUrl.set(false);
        host.activeRoute.set('/nowhere');
      });
      await go('/');
      expectCurrent(null);
    });

    it('takes the first of two links with the same route', async () => {
      create((host) => host.items.set([TODAY, HOUSEHOLD, { ...HOUSEHOLD, id: 'dup', label: 'Zweiter Haushalt', displayOrder: 3 }]));
      await go('/household');
      expectCurrent('Haushalt');
    });
  });

  describe('AC-23: activeRoute empty, the router decides', () => {
    beforeEach(() => create((host) => {
      host.followUrl.set(false);
      host.items.set([TODAY, HOUSEHOLD, MEMBERS, SETTINGS]);
    }));

    it('marks the start page current on / (3.4 painted it without aria-current)', async () => {
      await go('/');
      expectCurrent('Heute');
    });

    it('marks only the deepest match on /household/members (3.4 painted both)', async () => {
      await go('/household/members');
      expectCurrent('Mitglieder');
    });

    it('ignores the query and the fragment', async () => {
      await go('/settings?tab=2#top');
      expectCurrent('Einstellungen');
    });

    it('falls back to the longest prefix when the path has no link of its own', async () => {
      fixture.componentInstance.items.set([TODAY, HOUSEHOLD, SETTINGS]);
      await go('/household/members');
      expectCurrent('Haushalt');
    });

    it('never lets / match another path by prefix', async () => {
      fixture.componentInstance.items.set([TODAY, SETTINGS]);
      await go('/household');
      expectCurrent(null);
    });

    it('opens the group that holds the router-matched link', async () => {
      fixture.componentInstance.items.set(SHAPES['group children']);
      await go('/household');
      expectCurrent('Haushalt');
      const group = (fixture.nativeElement as HTMLElement).querySelector('.lc-sidenav__nav-item--parent') as HTMLElement;
      expect(group.classList).toContain('lc-sidenav__nav-item--has-active-child');
      expect(group.getAttribute('aria-expanded')).toBe('true');
    });
  });

  it('keeps routerLink on every link and no routerLinkActive anywhere', async () => {
    create((host) => host.items.set([TODAY, HOUSEHOLD]));
    await go('/household');
    expect(links().map((a) => a.getAttribute('href'))).toEqual(['/', '/household']);
  });
});
