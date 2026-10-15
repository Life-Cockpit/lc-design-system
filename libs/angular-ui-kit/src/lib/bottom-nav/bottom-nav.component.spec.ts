import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withXhr } from '@angular/common/http';
import { readFileSync } from 'fs';
import { resolve } from 'path';
import { BottomNavComponent, BottomNavItem } from './bottom-nav.component';

const today: BottomNavItem = { id: 'today', label: 'Heute', icon: 'sun', route: '/' };
const household: BottomNavItem = { id: 'household', label: 'Haushalt', icon: 'home', route: '/household' };

function areas(count: number): BottomNavItem[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `area-${i + 1}`,
    label: `Area ${i + 1}`,
    icon: 'folder',
    route: `/area-${i + 1}`,
  }));
}

describe('BottomNavComponent', () => {
  let fixture: ComponentFixture<BottomNavComponent>;
  let el: HTMLElement;

  function set(inputs: Record<string, unknown>): void {
    for (const [name, value] of Object.entries(inputs)) fixture.componentRef.setInput(name, value);
    fixture.detectChanges();
  }

  const links = () => Array.from(el.querySelectorAll<HTMLAnchorElement>('a.lc-bottom-nav__item'));
  const labels = () => Array.from(el.querySelectorAll('.lc-bottom-nav__label')).map((n) => n.textContent?.trim());

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BottomNavComponent],
      providers: [provideRouter([]), provideHttpClient(withXhr())],
    }).compileComponents();

    fixture = TestBed.createComponent(BottomNavComponent);
    el = fixture.nativeElement;
  });

  describe('structure (AS-1)', () => {
    beforeEach(() => set({ items: [today, household], activeRoute: '/' }));

    it('renders a labelled nav with a list of links', () => {
      const nav = el.querySelector('nav');
      expect(nav?.getAttribute('aria-label')).toBe('Main navigation');
      expect(nav?.querySelector('ul > li > a')).toBeTruthy();
      expect(el.querySelectorAll('li')).toHaveLength(2);
      expect(el.querySelector('[role="tablist"], [role="tab"]')).toBeNull();
    });

    it('takes a translated landmark label', () => {
      set({ ariaLabel: 'Hauptnavigation' });
      expect(el.querySelector('nav')?.getAttribute('aria-label')).toBe('Hauptnavigation');
    });

    it('links each item to its route', () => {
      expect(links().map((a) => a.getAttribute('href'))).toEqual(['/', '/household']);
    });

    it('always shows the label next to a decorative icon', () => {
      expect(labels()).toEqual(['Heute', 'Haushalt']);
      expect(el.querySelector('lc-icon')?.closest('[aria-hidden="true"]')).toBeTruthy();
    });

    it('sorts by displayOrder when given and keeps array order otherwise', () => {
      set({ items: [{ ...household, displayOrder: 2 }, { ...today, displayOrder: 1 }] });
      expect(labels()).toEqual(['Heute', 'Haushalt']);
    });
  });

  describe('current item', () => {
    it('marks exactly one item with aria-current="page"', () => {
      set({ items: [today, household], activeRoute: '/household' });
      const current = el.querySelectorAll('[aria-current="page"]');
      expect(current).toHaveLength(1);
      expect(current[0].textContent).toContain('Haushalt');
      expect(current[0].classList).toContain('lc-bottom-nav__item--current');
    });

    it('follows the first path segment, ignoring query and fragment', () => {
      set({ items: [today, household], activeRoute: '/household/members?x=1#invitation' });
      expect(el.querySelector('[aria-current="page"]')?.textContent).toContain('Haushalt');
    });

    it('matches "/" only on the start page', () => {
      set({ items: [today, household], activeRoute: '/settings' });
      expect(el.querySelector('[aria-current="page"]')).toBeNull();
      set({ activeRoute: '/' });
      expect(el.querySelector('[aria-current="page"]')?.textContent).toContain('Heute');
    });

    it('does not match a route that only shares a prefix', () => {
      set({ items: [household], activeRoute: '/households' });
      expect(el.querySelector('[aria-current="page"]')).toBeNull();
    });

    it('emits reselect when the current item is tapped again', () => {
      set({ items: [today, household], activeRoute: '/' });
      const spy = jest.fn();
      fixture.componentInstance.reselect.subscribe(spy);
      links()[1].click();
      expect(spy).not.toHaveBeenCalled();
      links()[0].click();
      expect(spy).toHaveBeenCalledWith(today);
    });
  });

  describe('overflow ("More")', () => {
    it('shows all items up to maxItems', () => {
      set({ items: [today, ...areas(3), household] });
      expect(labels()).toEqual(['Heute', 'Area 1', 'Area 2', 'Area 3', 'Haushalt']);
    });

    it('keeps maxItems − 1 items and adds "More" from the sixth destination on', () => {
      set({ items: [today, ...areas(4), household], moreRoute: '/more', moreLabel: 'Mehr' });
      expect(labels()).toEqual(['Heute', 'Area 1', 'Area 2', 'Area 3', 'Mehr']);
      expect(links()[4].getAttribute('href')).toBe('/more');
    });

    it('marks "More" current on the more page and on any hidden destination', () => {
      set({ items: [today, ...areas(4), household], moreRoute: '/more', activeRoute: '/household' });
      expect(el.querySelector('[aria-current="page"]')?.textContent).toContain('More');
      set({ activeRoute: '/more' });
      expect(el.querySelector('[aria-current="page"]')?.textContent).toContain('More');
    });

    it('renders "More" as a button that emits moreClick without a moreRoute', () => {
      set({ items: [today, ...areas(4), household], maxItems: 5 });
      const button = el.querySelector<HTMLButtonElement>('button.lc-bottom-nav__item');
      expect(button?.getAttribute('type')).toBe('button');
      const spy = jest.fn();
      fixture.componentInstance.moreClick.subscribe(spy);
      button?.click();
      expect(spy).toHaveBeenCalled();
    });

    it('honours a smaller maxItems', () => {
      set({ items: [today, ...areas(2), household], maxItems: 3, moreRoute: '/more' });
      expect(labels()).toEqual(['Heute', 'Area 1', 'More']);
    });
  });

  describe('badges', () => {
    it('shows the badge visually and reads it through badgeAriaLabel', () => {
      set({
        items: [{ ...household, badge: { value: 3, variant: 'primary' } }],
        badgeAriaLabel: '{value} neu',
      });
      const badge = el.querySelector('.lc-bottom-nav__badge');
      expect(badge?.closest('[aria-hidden="true"]')).toBeTruthy();
      expect(badge?.textContent?.trim()).toBe('3');
      expect(el.querySelector('.lc-bottom-nav__sr-only')?.textContent?.trim()).toBe('3 neu');
    });

    it('renders no badge text without a badge', () => {
      set({ items: [household] });
      expect(el.querySelector('.lc-bottom-nav__badge')).toBeNull();
      expect(el.querySelector('.lc-bottom-nav__sr-only')).toBeNull();
    });
  });

  describe('variants and position', () => {
    it('is docked and fixed by default', () => {
      set({ items: [today] });
      const nav = el.querySelector('nav');
      expect(nav?.classList).toContain('lc-bottom-nav--docked');
      expect(nav?.classList).toContain('lc-bottom-nav--fixed');
    });

    it('renders the floating variant (LK-5)', () => {
      set({ items: [today], variant: 'floating' });
      expect(el.querySelector('nav')?.classList).toContain('lc-bottom-nav--floating');
    });

    it('renders in flow when fixed is off', () => {
      set({ items: [today], fixed: false });
      expect(el.querySelector('nav')?.classList).not.toContain('lc-bottom-nav--fixed');
    });
  });

  describe('styles (source contract)', () => {
    const scss = readFileSync(resolve(__dirname, 'bottom-nav.component.scss'), 'utf-8');

    it('gives items 64 × 64 px where the bar has room (AS-1: ≥ 48 × 64)', () => {
      expect(scss).toMatch(/\.lc-bottom-nav__item \{[^}]*min-width: min\(64px, 100%\);[^}]*min-height: 64px;/s);
    });

    it('draws the 56 × 32 px pill', () => {
      expect(scss).toMatch(/\.lc-bottom-nav__pill \{[^}]*width: 56px;[^}]*height: 32px;/s);
    });

    it('pads the safe-area inset (docked) and floats 16 px above it (floating)', () => {
      expect(scss).toMatch(/padding-bottom: env\(safe-area-inset-bottom/);
      expect(scss).toMatch(/bottom: calc\(16px \+ env\(safe-area-inset-bottom/);
      expect(scss).toMatch(/border-radius: 28px/);
    });

    it('stays below dialogs (lc-modal 999) and menus', () => {
      expect(scss).toMatch(/z-index: var\(--lc-bottom-nav-z, 900\)/);
    });

    it('turns transitions off under reduced motion', () => {
      expect(scss).toMatch(/prefers-reduced-motion: reduce\) \{\s*transition: none/);
    });

    it('lets the label wrap instead of clipping', () => {
      expect(scss).toMatch(/\.lc-bottom-nav__label \{[^}]*overflow-wrap: break-word/s);
      expect(scss).not.toMatch(/\.lc-bottom-nav__label \{[^}]*white-space: nowrap/s);
    });
  });
});
