import { Component, input } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { provideHttpClient, withXhr } from '@angular/common/http';
import { compile } from 'sass';
import { resolve } from 'path';
import type { NavigationItem } from '@lifecorner/angular-ui-kit/models';
import { SidenavComponent } from '@lifecorner/angular-ui-kit/sidenav';
import { SidenavPlaceholderComponent } from './sidenav-placeholder.component';

// JSDOM has no matchMedia; lc-sidenav reads it for its mobile breakpoint.
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

const flat: NavigationItem[] = [
  { id: 'today', icon: 'sun', label: 'Heute', route: '/', displayOrder: 1 },
  { id: 'household', icon: 'home', label: 'Haushaltsübersicht', route: '/household', displayOrder: 2 },
  { id: 'settings', icon: 'settings', label: 'Benachrichtigungseinstellungen', route: '/settings', displayOrder: 3 },
];

const nested: NavigationItem[] = [
  { id: 'today', icon: 'sun', label: 'Heute', route: '/', displayOrder: 1 },
  {
    id: 'money', icon: 'banknotes', label: 'Finanzen', route: '', displayOrder: 2,
    children: [
      { id: 'budget', icon: 'chart-bar', label: 'Budget', route: '/money/budget', displayOrder: 1 },
      { id: 'accounts', icon: 'building-library', label: 'Konten', route: '/money/accounts', displayOrder: 2 },
    ],
  },
  {
    id: 'section', icon: '', label: 'Haushalt', route: '', displayOrder: 3, isSection: true,
    children: [
      { id: 'members', icon: 'users', label: 'Mitglieder', route: '/members', displayOrder: 1 },
      {
        id: 'lists', icon: 'check', label: 'Listen', route: '', displayOrder: 2,
        children: [
          { id: 'shopping', icon: '', label: 'Einkauf', route: '/lists/shopping', displayOrder: 1 },
          { id: 'chores', icon: '', label: 'Aufgaben', route: '/lists/chores', displayOrder: 2 },
        ],
      },
    ],
  },
];

/** The same bindings on both, side by side. */
@Component({
  selector: 'lc-test-pair',
  imports: [SidenavComponent, SidenavPlaceholderComponent],
  template: `
    <lc-sidenav class="real" mode="docked" [mobileBreakpoint]="0" [isOpen]="isOpen()" [collapsed]="collapsed()"
                [width]="width()" [variant]="variant()" [theme]="theme()" [position]="position()"
                [showLogo]="showLogo()" [logoSize]="logoSize()" [items]="items()" [activeRoute]="activeRoute()" />
    <lc-sidenav-placeholder class="placeholder" [isOpen]="isOpen()" [collapsed]="collapsed()"
                [width]="width()" [variant]="variant()" [theme]="theme()" [position]="position()"
                [showLogo]="showLogo()" [logoSize]="logoSize()" [items]="items()" [activeRoute]="activeRoute()" />
  `,
})
class PairComponent {
  readonly isOpen = input(true);
  readonly collapsed = input(false);
  readonly width = input('320px');
  readonly variant = input<'default' | 'transparent'>('default');
  readonly theme = input<'light' | 'dark' | 'auto'>('auto');
  readonly position = input<'left' | 'right'>('left');
  readonly showLogo = input(false);
  readonly logoSize = input<'xs' | 'sm' | 'md' | 'lg' | 'xl'>('md');
  readonly items = input<NavigationItem[]>(flat);
  readonly activeRoute = input('');
}

describe('SidenavPlaceholderComponent (AS-18)', () => {
  let fixture: ComponentFixture<PairComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PairComponent],
      providers: [provideRouter([{ path: '**', children: [] }]), provideHttpClient(withXhr())],
    }).compileComponents();
    fixture = TestBed.createComponent(PairComponent);
  });

  function set(inputs: Record<string, unknown>): void {
    for (const [name, value] of Object.entries(inputs)) fixture.componentRef.setInput(name, value);
    fixture.detectChanges();
  }

  const real = () => (fixture.nativeElement as HTMLElement).querySelector('lc-sidenav') as HTMLElement;
  const placeholder = () => (fixture.nativeElement as HTMLElement).querySelector('lc-sidenav-placeholder') as HTMLElement;

  /** What decides the boxes: the classes of every element that carries one of the shared box classes, in document order. */
  function boxes(host: HTMLElement): string[] {
    const shared = /^lc-sidenav(__(logo(--size-\w+)?|nav|nav--docked|section|section-header|section-title|section-items|nav-item-row|nav-item|nav-icon|nav-label|nav-children|content|content--docked)|--\w+)?$/;
    return [host, ...Array.from(host.querySelectorAll('*'))]
      .map((el) => Array.from(el.classList).filter((c) => shared.test(c) || c.startsWith('lc-sidenav-container')).sort().join(' '))
      .filter(Boolean)
      .map((classes) => classes.replace(/ ?lc-sidenav__nav-item--(child|parent|expanded|active|has-active-child)/g, ''));
  }

  describe('AC-11: inert, hidden, no landmark, no tab stop', () => {
    beforeEach(() => set({ items: nested, activeRoute: '/lists/shopping', showLogo: true }));

    it('is aria-hidden and inert at its root', () => {
      expect(placeholder().getAttribute('aria-hidden')).toBe('true');
      expect(placeholder().hasAttribute('inert')).toBe(true);
    });

    it('holds nothing focusable, no landmark, no link and no text', () => {
      const el = placeholder();
      expect(el.querySelectorAll('a, button, input, select, textarea, [tabindex], [contenteditable]')).toHaveLength(0);
      expect(el.querySelectorAll('nav, aside, main, header, footer, section, form, [role]')).toHaveLength(0);
      expect(el.textContent?.trim()).toBe('');
    });

    it('lc-sidenav keeps its landmark, aria-current and tab stops (3.5)', () => {
      expect(real().querySelectorAll('nav')).toHaveLength(1);
      expect(real().querySelectorAll('[aria-current="page"]')).toHaveLength(1);
      expect(real().querySelectorAll('a[href]').length).toBeGreaterThan(0);
    });
  });

  describe('AC-9: the same boxes as lc-sidenav', () => {
    it.each([
      ['flat, default', { items: flat }],
      ['nested, a group and a section sub-group expanded by activeRoute', { items: nested, activeRoute: '/lists/shopping' }],
      ['nested, a top-level group expanded', { items: nested, activeRoute: '/money/accounts' }],
      ['collapsed rail', { items: nested, collapsed: true, activeRoute: '/money/budget' }],
      ['transparent column', { items: flat, variant: 'transparent', width: '100%' }],
      ['logo block, xl, right, dark', { items: flat, showLogo: true, logoSize: 'xl', position: 'right', theme: 'dark' }],
      ['closed (0 px)', { items: flat, isOpen: false }],
      ['no items', { items: [] }],
    ])('%s', (_label, inputs) => {
      set(inputs);
      expect(boxes(placeholder())).toEqual(boxes(real()));
      const rail = (host: HTMLElement) => host.querySelector('.lc-sidenav') as HTMLElement;
      expect(rail(placeholder()).className).toBe(rail(real()).className);
      expect(rail(placeholder()).style.width).toBe(rail(real()).style.width);
    });

    it('follows the router when activeRoute is empty (3.5 rules)', async () => {
      set({ items: nested });
      await TestBed.inject(Router).navigateByUrl('/money/budget');
      fixture.detectChanges();
      expect(placeholder().querySelectorAll('.lc-sidenav__nav-children')).toHaveLength(1);
      expect(boxes(placeholder())).toEqual(boxes(real()));
    });

    it('works without a router', () => {
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({ imports: [SidenavPlaceholderComponent] });
      const solo = TestBed.createComponent(SidenavPlaceholderComponent);
      solo.componentRef.setInput('items', nested);
      solo.componentRef.setInput('isOpen', true);
      solo.detectChanges();
      expect((solo.nativeElement as HTMLElement).querySelectorAll('.lc-sidenav__nav-item').length).toBe(4);
    });
  });

  describe('styles', () => {
    const css = (file: string) => compile(resolve(__dirname, file)).css.replace(/\/\*[\s\S]*?\*\//g, '');
    /** `selector → declarations` of every plain rule (outside @media), in order. */
    const rules = (text: string) =>
      [...text.matchAll(/(^|\n)([^{}@\n][^{}]*)\{([^{}]*)\}/g)].map(([, , selector, body]) => ({
        selector: selector.trim().replace(/\s+/g, ' '),
        declarations: body.split(';').map((d) => d.trim().replace(/\s+/g, ' ')).filter(Boolean),
      }));

    it("every box rule is lc-sidenav's own (the shared partial): same selector, same declarations", () => {
      const sidenav = rules(css('../sidenav/sidenav.component.scss'));
      const own = rules(css('sidenav-placeholder.component.scss')).filter((r) => !r.selector.includes('lc-sidenav-placeholder__'));
      expect(own.length).toBeGreaterThan(30);
      const foreign = own
        .filter((r) => !sidenav.some((s) => s.selector === r.selector && r.declarations.every((d) => s.declarations.includes(d))))
        .map((r) => r.selector);
      expect(foreign).toEqual([]);
    });

    it('fills the shapes through --lc-sidenav-placeholder-fill, GrayText in forced colours, no animation', () => {
      const text = css('sidenav-placeholder.component.scss');
      expect(text).toMatch(/background-color: var\(--lc-sidenav-placeholder-fill, color-mix\(in srgb, var\(--lc-sidenav-fg\) 16%, transparent\)\)/);
      expect(text).toMatch(/@media \(forced-colors: active\) \{\s*\.lc-sidenav-placeholder__shape \{\s*forced-color-adjust: none;\s*background-color: GrayText;/);
      const skeleton = text.slice(text.indexOf('.lc-sidenav-placeholder__shape'));
      expect(skeleton).not.toMatch(/animation|transition|@keyframes/);
    });
  });
});
