import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withXhr } from '@angular/common/http';
import { readFileSync } from 'fs';
import { resolve } from 'path';
import { SidenavComponent } from './sidenav.component';
import { NavigationItem } from '../models/navigation-item.interface';

// JSDOM has no matchMedia; the sidenav reads it for its mobile breakpoint.
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

/** WCAG contrast of two #rrggbb colours. */
function contrast(a: string, b: string): number {
  const lum = (hex: string) => {
    const [r, g, bl] = [1, 3, 5].map((i) => {
      const v = parseInt(hex.slice(i, i + 2), 16) / 255;
      return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
    });
    return 0.2126 * r + 0.7152 * g + 0.0722 * bl;
  };
  const [hi, lo] = [lum(a), lum(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

const items: NavigationItem[] = [
  { id: 'today', icon: 'sun', label: 'Heute', route: '/', displayOrder: 1 },
  { id: 'household', icon: 'home', label: 'Haushalt', route: '/household', displayOrder: 2 },
];

/** The side navigation of the app shell: AS-4 (ink, 44 px, documented items) and LK-8 (transparent, pills). */
describe('SidenavComponent — app shell (AS-4, LK-8)', () => {
  let fixture: ComponentFixture<SidenavComponent>;
  let el: HTMLElement;
  const scss = readFileSync(resolve(__dirname, 'sidenav.component.scss'), 'utf-8');
  const source = readFileSync(resolve(__dirname, 'sidenav.component.ts'), 'utf-8');

  function set(inputs: Record<string, unknown>): void {
    for (const [name, value] of Object.entries(inputs)) fixture.componentRef.setInput(name, value);
    fixture.detectChanges();
  }

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SidenavComponent],
      providers: [provideRouter([]), provideHttpClient(withXhr())],
    }).compileComponents();
    fixture = TestBed.createComponent(SidenavComponent);
    el = fixture.nativeElement;
  });

  describe('AS-4', () => {
    it('(a) inks the current item with the selected tint’s own colour, not primary-500', () => {
      expect(scss).toMatch(/--lc-sidenav-active-fg: var\(--color-on-surface-selected, var\(--color-link\)\);/);
      expect(scss).toMatch(/--lc-sidenav-active-icon: var\(--color-on-surface-selected, var\(--color-link\)\);/);
      expect(scss).not.toMatch(/--lc-sidenav-active-fg: var\(--color-primary-500\)/);
      // "Weite" light values: ink #144F5B on the pill #E0F1F4; the fallback --color-link #1A6A79 on the old tint #F0F8FA.
      expect(contrast('#144f5b', '#e0f1f4')).toBeGreaterThanOrEqual(4.5);
      expect(contrast('#1a6a79', '#f0f8fa')).toBeGreaterThanOrEqual(4.5);
    });

    it('(b) gives every item at least 44 px in every density', () => {
      expect(scss).toMatch(/\.lc-sidenav__nav-item \{[^}]*min-height: var\(--size-min-touch-height, 2\.75rem\);/s);
    });

    it('(c) documents the NavigationItem shape on the items input', () => {
      const doc = source.match(/\/\*\*([^]*?)\*\/\s*readonly items = input<NavigationItem\[\]>/)?.[1] ?? '';
      for (const field of ['`id`', '`icon`', '`label`', '`route`', '`displayOrder`', '`children`', '`isSection`', '`badge`', '`action`']) {
        expect(doc).toContain(field);
      }
    });

    it('styles the aria-current item as current, not only the router-matched one', () => {
      expect(scss).toMatch(/&--active,\s*&\[aria-current='page'\] \{/);
    });

    it('marks the current item with aria-current="page"', () => {
      set({ items, activeRoute: '/household', isOpen: true, mode: 'docked' });
      const current = el.querySelectorAll('[aria-current="page"]');
      expect(current).toHaveLength(1);
      expect(current[0].textContent).toContain('Haushalt');
    });
  });

  describe('LK-8: variant="transparent"', () => {
    it('keeps the rail by default', () => {
      set({ items, isOpen: true, mode: 'docked' });
      expect(el.querySelector('.lc-sidenav')?.classList).not.toContain('lc-sidenav--transparent');
    });

    it('adds the transparent class', () => {
      set({ items, isOpen: true, mode: 'docked', variant: 'transparent' });
      const aside = el.querySelector('.lc-sidenav');
      expect(aside?.classList).toContain('lc-sidenav--transparent');
      expect(aside?.classList).toContain('lc-sidenav--docked');
    });

    it('drops background and border only when docked (a drawer keeps its surface)', () => {
      const block = scss.match(/\.lc-sidenav--transparent \{([^]*?)\n\}/)?.[1] ?? '';
      expect(block).toMatch(/&\.lc-sidenav--docked \{[^}]*--lc-sidenav-bg: transparent;[^}]*border-right: 0;/s);
    });

    it('draws 48 px pill items with 16 px labels and no inset bar on the current one', () => {
      const block = scss.match(/\.lc-sidenav--transparent \{([^]*?)\n\}/)?.[1] ?? '';
      expect(block).toMatch(/\.lc-sidenav__nav-item \{[^}]*min-height: 3rem;[^}]*border-radius: var\(--border-radius-full, 9999px\);[^}]*font-size: var\(--font-size-base, 1rem\);/s);
      expect(block).toMatch(/\.lc-sidenav__nav-item--active,\s*\.lc-sidenav__nav-item\[aria-current='page'\] \{[^}]*box-shadow: none;/s);
    });
  });
});
