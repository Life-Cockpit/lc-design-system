import { Component, PLATFORM_ID, input } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient, withXhr } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';
import { INLINE_ICON_SVGS, INLINE_TABLER_SVGS } from '@lifecorner/angular-ui-kit/internal/icon-set';
import { BUNDLED_ICONS, ICON_HOME, ICON_HOME_SOLID, ICON_MAIL, ICON_X, ICON_X_MARK } from '@lifecorner/angular-ui-kit/icons';
import { ICON_NAMES } from '../icon-names/icon-names';
import { IconComponent, IconVariant, resetIconCache, resetIconWarnings } from './icon.component';
import { ICON_ALIASES } from './icon-aliases';
import { resetIconRendering } from './icon-dom';
import { iconConstantName, resolveInlineGlyph } from './icon-inline-lookup';
import { LcIconOptions, provideLcIcons, ɵprovideKitIcons } from './icon-registry';
import { loadIconSet, resetIconSet } from './icon-set-loader';

/**
 * Registration, the two fallbacks and the lazy set (3.6, AS-17; AC-2, AC-5,
 * AC-6 of request 002).
 */
declare const globalThis: { ngDevMode: unknown };

/** 3.5.1's lookup, from its maps: the markup an inline name rendered, or undefined (fetched). */
function markup351(name: string, variant: IconVariant): string | undefined {
  const resolved = ICON_ALIASES[name] ?? name;
  return INLINE_ICON_SVGS[name]?.[variant] ?? INLINE_ICON_SVGS[resolved]?.[variant] ?? INLINE_TABLER_SVGS[resolved]?.[variant];
}

const isPlaceholder = (svg: Element | undefined) =>
  !!svg && Array.from(svg.children).map((c) => c.tagName).join(',') === 'rect,text';

describe('lc-icon registration and the kit set (AS-17)', () => {
  let httpMock: HttpTestingController;
  let warnSpy: jest.SpyInstance;
  let devMode: unknown;

  function setup(providers: unknown[] = [], platform = 'browser'): void {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      imports: [IconComponent],
      providers: [
        provideHttpClient(withXhr()),
        provideHttpClientTesting(),
        { provide: PLATFORM_ID, useValue: platform },
        ...(providers as never[]),
      ],
    });
    httpMock = TestBed.inject(HttpTestingController);
  }

  beforeEach(() => {
    resetIconWarnings();
    resetIconCache();
    resetIconRendering();
    resetIconSet();
    warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => undefined);
    devMode = globalThis.ngDevMode;
  });

  afterEach(() => {
    globalThis.ngDevMode = devMode;
    warnSpy.mockRestore();
    httpMock?.verify();
  });

  function render(inputs: Record<string, unknown>): ComponentFixture<IconComponent> {
    const fixture = TestBed.createComponent(IconComponent);
    for (const [key, value] of Object.entries(inputs)) fixture.componentRef.setInput(key, value);
    fixture.detectChanges();
    return fixture;
  }

  const container = (fixture: ComponentFixture<unknown>) =>
    (fixture.nativeElement as HTMLElement).querySelector('.icon-container') as HTMLElement;
  const svgOf = (fixture: ComponentFixture<unknown>) => container(fixture).querySelector(':scope > svg') ?? undefined;
  const warnings = () => warnSpy.mock.calls.map(([m]) => String(m));

  describe('the 3.5.1 lookup is kept (AC-6)', () => {
    it('resolves every ICON_NAMES name, both variants, to the glyph 3.5.1 rendered (or to a fetch)', () => {
      const differences: string[] = [];
      for (const name of ICON_NAMES) {
        for (const variant of ['outline', 'solid'] as const) {
          const glyph = resolveInlineGlyph(name, variant);
          const now = glyph === undefined ? undefined : INLINE_ICON_SVGS[glyph]?.[variant] ?? INLINE_TABLER_SVGS[glyph]?.[variant];
          if (now !== markup351(name, variant)) differences.push(`${variant}:${name}`);
        }
      }
      expect(ICON_NAMES.length).toBeGreaterThan(5000);
      expect(differences).toEqual([]);
    });

    it('and a registered constant is the same markup as the loaded set', () => {
      for (const icon of BUNDLED_ICONS) expect(icon.svg).toBe(markup351(icon.name, icon.variant));
    });

    it('names the constant to register in upper snake case', () => {
      expect(iconConstantName('x-mark', 'outline')).toBe('ICON_X_MARK');
      expect(iconConstantName('bars-3', 'solid')).toBe('ICON_BARS_3_SOLID');
      expect(resolveInlineGlyph('envelope', 'outline')).toBe('mail');
      expect(resolveInlineGlyph('x-mark', 'outline')).toBe('x-mark');
      expect(resolveInlineGlyph('robot', 'solid')).toBeUndefined();
    });
  });

  describe('registered glyphs (AC-2)', () => {
    it('render synchronously, decorated, with the registered markup', () => {
      setup([provideLcIcons([ICON_HOME, ICON_HOME_SOLID])]);
      const outline = render({ name: 'home', ariaLabel: 'Start' });
      const solid = render({ name: 'home', variant: 'solid', size: 'xl', decorative: true });
      httpMock.expectNone(() => true);
      expect(svgOf(outline)?.getAttribute('aria-label')).toBe('Start');
      expect(svgOf(outline)?.getAttribute('role')).toBe('img');
      expect(svgOf(solid)?.getAttribute('aria-hidden')).toBe('true');
      expect(svgOf(solid)?.getAttribute('width')).toBe('40px');
      expect(svgOf(solid)?.getAttribute('fill')).toBe('currentColor');
      expect(warnings()).toEqual([]);
    });

    it('are found by the name as written, then by its alias target', () => {
      setup([provideLcIcons([ICON_MAIL, ICON_X])]);
      expect(isPlaceholder(svgOf(render({ name: 'envelope' })))).toBe(false);
      // x-mark itself is not registered; its alias target x is.
      const xMark = render({ name: 'x-mark' });
      expect(svgOf(xMark)?.innerHTML).toContain('M18 6l-12 12');
      httpMock.expectNone(() => true);
    });

    it('add up across calls in one injector and along the injector tree; the nearest unregistered wins', async () => {
      @Component({
        selector: 'lc-test-scope',
        imports: [IconComponent],
        providers: [provideLcIcons([ICON_X_MARK], { unregistered: 'load' })],
        template: `<lc-icon [name]="name()" />`,
      })
      class ScopeComponent {
        readonly name = input('home');
      }
      setup([provideLcIcons([ICON_HOME]), provideLcIcons([ICON_MAIL], { unregistered: 'placeholder' })]);
      const fixture = TestBed.createComponent(ScopeComponent);
      fixture.detectChanges();
      expect(isPlaceholder(svgOf(fixture))).toBe(false); // home, from the root scope
      for (const name of ['mail', 'x-mark']) {
        fixture.componentRef.setInput('name', name);
        fixture.detectChanges();
        expect(svgOf(fixture)).toBeDefined();
        expect(isPlaceholder(svgOf(fixture))).toBe(false);
      }
      // sun is registered nowhere: the component's 'load' wins over the root's 'placeholder'.
      fixture.componentRef.setInput('name', 'sun');
      fixture.detectChanges();
      await fixture.whenStable();
      expect(isPlaceholder(svgOf(fixture))).toBe(false);
      expect(svgOf(fixture)?.innerHTML).toContain('M12 3v2.25');
    });

    it("a kit component's own glyphs serve its view, set no mode and do not count as the app's", async () => {
      @Component({
        selector: 'lc-test-kit',
        imports: [IconComponent],
        viewProviders: [ɵprovideKitIcons([ICON_X_MARK])],
        template: `<lc-icon name="x-mark" /><lc-icon name="home" />`,
      })
      class KitComponent {}
      setup();
      const fixture = TestBed.createComponent(KitComponent);
      fixture.detectChanges();
      const [own, other] = Array.from((fixture.nativeElement as HTMLElement).querySelectorAll('.icon-container'));
      expect(own.querySelector('svg')).not.toBeNull();
      expect(other.childNodes).toHaveLength(0); // home: the kit set is loading ('load', no app registration)
      await fixture.whenStable();
      expect(other.querySelector('svg')).not.toBeNull();
      expect(warnings()).toEqual([]);
    });
  });

  describe("unregistered: 'placeholder' (AC-5)", () => {
    const options: LcIconOptions = { unregistered: 'placeholder' };

    it('shows the placeholder in the same box, warns once per name, requests nothing and never loads the set', async () => {
      setup([provideLcIcons([ICON_HOME], options)]);
      const imports = jest.spyOn(jest.requireActual('./icon-set-loader'), 'loadIconSet');
      const sun = render({ name: 'sun' });
      render({ name: 'sun' });
      const home = render({ name: 'home' });
      const anchor = render({ name: 'anchor' });
      httpMock.expectOne('/tabler-icons/outline/anchor.svg').flush('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M0 0h24"/></svg>');
      anchor.detectChanges();
      await sun.whenStable();
      expect(isPlaceholder(svgOf(sun))).toBe(true);
      expect(isPlaceholder(svgOf(home))).toBe(false);
      expect(isPlaceholder(svgOf(anchor))).toBe(false);
      for (const f of [sun, home, anchor]) {
        expect(container(f).style.width).toBe('24px');
        expect(container(f).style.height).toBe('24px');
      }
      expect(warnings()).toEqual([
        '[lc-icon] "sun" is not registered. Add ICON_SUN from @lifecorner/angular-ui-kit/icons to provideLcIcons(). Rendering a placeholder instead.',
      ]);
      expect(imports).not.toHaveBeenCalled();
      imports.mockRestore();
    });

    it('keeps the accessible name on the placeholder', () => {
      setup([provideLcIcons([], options)]);
      const fixture = render({ name: 'x-mark', ariaLabel: 'Schließen' });
      expect(svgOf(fixture)?.getAttribute('aria-label')).toBe('Schließen');
      expect(svgOf(fixture)?.getAttribute('role')).toBe('img');
    });

    it('names the solid constant for the solid variant', () => {
      setup([provideLcIcons([], options)]);
      render({ name: 'check-circle', variant: 'solid' });
      expect(warnings()[0]).toContain('Add ICON_CHECK_CIRCLE_SOLID from');
    });

    it('throws in strict mode in development', () => {
      setup([provideLcIcons([], options)]);
      const fixture = TestBed.createComponent(IconComponent);
      fixture.componentRef.setInput('strict', true);
      fixture.componentRef.setInput('name', 'sun');
      expect(() => fixture.detectChanges()).toThrow(/"sun" is not registered \(strict mode\)/);
    });

    it('warns in production too, and does not throw there', () => {
      setup([provideLcIcons([], options)]);
      globalThis.ngDevMode = false;
      const fixture = TestBed.createComponent(IconComponent);
      fixture.componentRef.setInput('strict', true);
      fixture.componentRef.setInput('name', 'sun');
      expect(() => fixture.detectChanges()).not.toThrow();
      expect(isPlaceholder(svgOf(fixture))).toBe(true);
      expect(warnings()).toHaveLength(1);
    });
  });

  describe("unregistered: 'load', the default (AC-6)", () => {
    it('renders an unregistered inline name from the lazy set, the 3.5.1 markup, with the box sized while it loads', async () => {
      setup();
      const fixture = render({ name: 'logout', size: 'sm', ariaLabel: 'Abmelden' });
      expect(container(fixture).childNodes).toHaveLength(0);
      expect(container(fixture).style.width).toBe('20px');
      expect(container(fixture).style.height).toBe('20px');
      await fixture.whenStable();
      const svg = svgOf(fixture);
      expect(svg?.getAttribute('aria-label')).toBe('Abmelden');
      expect(svg?.getAttribute('width')).toBe('20px');
      expect(svg?.innerHTML).toContain('M14 8v-2a2 2 0 0 0 -2 -2h-7');
      expect(container(fixture).style.width).toBe('20px');
      httpMock.expectNone(() => true);
      expect(warnings()).toEqual([]);
    });

    it('renders synchronously once the set is there', async () => {
      setup();
      await loadIconSet();
      const fixture = render({ name: 'globe-alt' });
      expect(svgOf(fixture)).toBeDefined();
      expect(isPlaceholder(svgOf(fixture))).toBe(false);
    });

    it('leaves a prerendered <svg> in place while the set loads (hydration), then replaces it', async () => {
      setup();
      const fixture = TestBed.createComponent(IconComponent);
      fixture.componentRef.setInput('name', 'home');
      fixture.detectChanges();
      const server = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      container(fixture).appendChild(server);
      fixture.detectChanges();
      expect(container(fixture).firstChild).toBe(server);
      await fixture.whenStable();
      expect(container(fixture).childNodes).toHaveLength(1);
      expect(container(fixture).firstChild).not.toBe(server);
      expect(svgOf(fixture)?.innerHTML).toContain('m2.25 12 8.954-8.955');
    });

    it('ignores a load that a name change overtook', async () => {
      setup();
      const fixture = render({ name: 'home' });
      fixture.componentRef.setInput('name', 'anchor');
      fixture.detectChanges();
      httpMock.expectOne('/tabler-icons/outline/anchor.svg').flush('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/></svg>');
      fixture.detectChanges();
      await fixture.whenStable();
      expect(svgOf(fixture)?.querySelector('circle')).not.toBeNull();
      expect(svgOf(fixture)?.innerHTML).not.toContain('m2.25 12');
    });

    it('warns in development when the app registers glyphs but missed one', async () => {
      setup([provideLcIcons([ICON_HOME])]);
      const fixture = render({ name: 'sun' });
      await fixture.whenStable();
      expect(isPlaceholder(svgOf(fixture))).toBe(false);
      expect(warnings()).toEqual([
        '[lc-icon] "sun" is not registered. Add ICON_SUN from @lifecorner/angular-ui-kit/icons to provideLcIcons(). Loading the kit\'s icon set instead.',
      ]);
    });

    it('stays quiet in production', async () => {
      setup([provideLcIcons([ICON_HOME])]);
      globalThis.ngDevMode = false;
      const fixture = render({ name: 'sun' });
      await fixture.whenStable();
      expect(isPlaceholder(svgOf(fixture))).toBe(false);
      expect(warnings()).toEqual([]);
    });

    it('renders on the server before the HTML is serialised (PendingTasks)', async () => {
      setup([], 'server');
      const fixture = render({ name: 'home', ariaLabel: 'Start' });
      await fixture.whenStable();
      const svg = svgOf(fixture);
      expect(svg?.getAttribute('aria-label')).toBe('Start');
      expect(svg?.innerHTML).toContain('m2.25 12 8.954-8.955');
    });
  });

  describe('bundle shape', () => {
    it('the icon entry reaches the markup only through one dynamic import of internal/icon-set', () => {
      const code = readdirSync(__dirname)
        .filter((f) => f.endsWith('.ts') && !/\.(spec|stories)\.ts$/.test(f))
        .map((f) => readFileSync(join(__dirname, f), 'utf-8'))
        .join('\n');
      expect(code).not.toMatch(/from '@lifecorner\/angular-ui-kit\/(icons|internal\/icon-set)'/);
      expect(code.match(/import\('@lifecorner\/angular-ui-kit\/internal\/icon-set'\)/g)).toHaveLength(1);
      expect(code).not.toContain('<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5"');
    });
  });
});
