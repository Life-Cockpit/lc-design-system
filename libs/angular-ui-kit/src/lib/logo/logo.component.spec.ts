import { ComponentFixture, TestBed } from '@angular/core/testing';
import { readFileSync } from 'fs';
import { resolve } from 'path';
import { LC_LOGO_BASE_PATH, LogoComponent } from './logo.component';

describe('LogoComponent', () => {
  let fixture: ComponentFixture<LogoComponent>;
  let component: LogoComponent;

  function images(): HTMLImageElement[] {
    return Array.from(fixture.nativeElement.querySelectorAll('img'));
  }

  function singleImage(): HTMLImageElement {
    const all = images();
    expect(all.length).toBe(1);
    return all[0];
  }

  function srcs(): (string | null)[] {
    return images().map((img) => img.getAttribute('src'));
  }

  function set(inputs: Record<string, unknown>): void {
    for (const [name, value] of Object.entries(inputs)) {
      fixture.componentRef.setInput(name, value);
    }
    fixture.detectChanges();
  }

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LogoComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(LogoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('Built-in LifeCorner assets (G-5, G-28)', () => {
    it('renders the LifeCorner lockup with its dark drawing by default', () => {
      expect(component.logoSrc()).toBe('/assets/lifecorner-logo.svg');
      expect(component.logoDarkSrc()).toBe('/assets/lifecorner-logo-on-dark.svg');
      expect(srcs()).toEqual(['/assets/lifecorner-logo.svg', '/assets/lifecorner-logo-on-dark.svg']);
    });

    it('names the built-in logo "LifeCorner" by default', () => {
      for (const img of images()) {
        expect(img.getAttribute('alt')).toBe('LifeCorner');
      }
    });

    it('renders the emblem pair for variant="emblem" from 33 px up', () => {
      for (const size of ['md', 'lg', 'xl']) {
        set({ variant: 'emblem', size });
        expect(srcs()).toEqual(['/assets/lifecorner-emblem.svg', '/assets/lifecorner-emblem-on-dark.svg']);
      }
    });

    it('switches to the small emblem at 32 px and below (xs, sm)', () => {
      for (const size of ['xs', 'sm']) {
        set({ variant: 'emblem', size });
        expect(srcs()).toEqual([
          '/assets/lifecorner-emblem-small.svg',
          '/assets/lifecorner-emblem-small-on-dark.svg',
        ]);
      }
    });

    it('keeps the lockup at small sizes (it already uses the filled emblem)', () => {
      set({ size: 'xs' });
      expect(srcs()).toEqual(['/assets/lifecorner-logo.svg', '/assets/lifecorner-logo-on-dark.svg']);
    });

    it('shows only the dark drawing for colorMode="dark" and only the light one for "light"', () => {
      set({ colorMode: 'dark' });
      expect(singleImage().getAttribute('src')).toBe('/assets/lifecorner-logo-on-dark.svg');

      set({ colorMode: 'light' });
      expect(singleImage().getAttribute('src')).toBe('/assets/lifecorner-logo.svg');
    });

    it('never recolours the logo with a CSS filter or invert class', () => {
      for (const colorMode of ['auto', 'light', 'dark']) {
        set({ colorMode });
        for (const img of images()) {
          expect(img.className).not.toMatch(/lc-logo--(auto|dark)(\s|$)/);
          expect(img.style.filter).toBe('');
        }
      }
    });

    it('resolves the built-in assets against LC_LOGO_BASE_PATH (trailing slash tolerated)', async () => {
      TestBed.resetTestingModule();
      await TestBed.configureTestingModule({
        imports: [LogoComponent],
        providers: [{ provide: LC_LOGO_BASE_PATH, useValue: '/static/ui-kit/' }],
      }).compileComponents();
      const custom = TestBed.createComponent(LogoComponent);
      custom.detectChanges();

      expect(custom.componentInstance.logoSrc()).toBe('/static/ui-kit/lifecorner-logo.svg');
      expect(custom.componentInstance.logoDarkSrc()).toBe('/static/ui-kit/lifecorner-logo-on-dark.svg');
    });

    it('ships every built-in file it points to', () => {
      const assets = resolve(__dirname, '../../assets');
      for (const file of [
        'lifecorner-logo.svg',
        'lifecorner-logo-on-dark.svg',
        'lifecorner-emblem.svg',
        'lifecorner-emblem-on-dark.svg',
        'lifecorner-emblem-small.svg',
        'lifecorner-emblem-small-on-dark.svg',
        'lifecorner-emblem-mono.svg',
      ]) {
        const svg = readFileSync(resolve(assets, file), 'utf-8');
        expect(svg).toContain('<svg');
        expect(svg).toContain('aria-label="LifeCorner"');
      }
    });

    it('outlines the lockup text, so it renders inside <img> where web fonts never load', () => {
      const assets = resolve(__dirname, '../../assets');
      for (const file of ['lifecorner-logo.svg', 'lifecorner-logo-on-dark.svg']) {
        const svg = readFileSync(resolve(assets, file), 'utf-8');
        expect(svg).not.toMatch(/<text[\s>]/);
        expect(svg).not.toMatch(/font-family/);
        expect(svg).not.toMatch(/<animate|<set[\s>]|@keyframes/);
      }
    });
  });

  describe('Custom sources', () => {
    it('prefers a custom src / emblemSrc over the built-in assets', () => {
      set({ src: '/brand/logo.svg', emblemSrc: '/brand/emblem.svg' });
      expect(singleImage().getAttribute('src')).toBe('/brand/logo.svg');

      set({ variant: 'emblem' });
      expect(singleImage().getAttribute('src')).toBe('/brand/emblem.svg');

      set({ size: 'xs' });
      expect(singleImage().getAttribute('src')).toBe('/brand/emblem.svg');
    });

    it('shows a custom logo without a dark partner as it is, also for colorMode="dark"', () => {
      set({ src: '/brand/logo.svg', colorMode: 'dark' });
      const img = singleImage();
      expect(img.getAttribute('src')).toBe('/brand/logo.svg');
      expect(component.hasCustomSrc()).toBe(true);
      expect(component.logoDarkSrc()).toBe('');
    });

    it('applies the alt text and the size class', () => {
      set({ alt: 'Acme Inc.', size: 'lg' });
      for (const img of images()) {
        expect(img.getAttribute('alt')).toBe('Acme Inc.');
        expect(img.classList).toContain('size-lg');
        expect(img.classList).toContain('lc-logo');
      }
    });

    it('adds the clickable class on demand', () => {
      set({ clickable: true, colorMode: 'light' });
      expect(singleImage().classList).toContain('clickable');
    });
  });

  describe('Dark / light source selection', () => {
    beforeEach(() => {
      set({
        src: '/brand/logo.svg',
        darkSrc: '/brand/logo-dark.svg',
        emblemSrc: '/brand/emblem.svg',
        darkEmblemSrc: '/brand/emblem-dark.svg',
      });
    });

    it('does not use <picture>/<source media> for the swap', () => {
      expect(fixture.nativeElement.querySelector('picture')).toBeNull();
      expect(fixture.nativeElement.querySelector('source')).toBeNull();
    });

    it('renders both sources in auto mode, tagged for the theme stylesheet to pick one', () => {
      const [light, dark] = images();
      expect(images().length).toBe(2);
      expect(light.getAttribute('src')).toBe('/brand/logo.svg');
      expect(light.classList).toContain('lc-logo--light-src');
      expect(dark.getAttribute('src')).toBe('/brand/logo-dark.svg');
      expect(dark.classList).toContain('lc-logo--dark-src');
      expect(dark.getAttribute('alt')).toBe(light.getAttribute('alt'));
    });

    it('uses the emblem pair for variant="emblem"', () => {
      set({ variant: 'emblem' });
      const [light, dark] = images();
      expect(light.getAttribute('src')).toBe('/brand/emblem.svg');
      expect(dark.getAttribute('src')).toBe('/brand/emblem-dark.svg');
    });

    it('renders only the dark source for colorMode="dark"', () => {
      set({ colorMode: 'dark' });
      const img = singleImage();
      expect(img.getAttribute('src')).toBe('/brand/logo-dark.svg');
      expect(img.classList).not.toContain('lc-logo--dark-src');
    });

    it('renders only the light source for colorMode="light"', () => {
      set({ colorMode: 'light' });
      const img = singleImage();
      expect(img.getAttribute('src')).toBe('/brand/logo.svg');
      expect(img.classList).not.toContain('lc-logo--light-src');
    });

    it('falls back to the light source alone when a custom logo has no dark source', () => {
      set({ darkSrc: '' });
      const img = singleImage();
      expect(img.getAttribute('src')).toBe('/brand/logo.svg');
      expect(img.classList).not.toContain('lc-logo--light-src');
    });

    it('pairs a custom dark source with the built-in light lockup when only darkSrc is set', () => {
      set({ src: '' });
      expect(srcs()).toEqual(['/assets/lifecorner-logo.svg', '/brand/logo-dark.svg']);
    });
  });

  describe('Stylesheet contract', () => {
    // jsdom does not apply component styles; the theme selectors are checked
    // against the source. The pair follows the app theme with exactly the
    // selectors of _theme-dark.scss, through `:host-context`, because a plain
    // `:root.dark &` in an emulated-encapsulation component is scoped to
    // `[_ngcontent]:root.dark` and never matches the document root.
    const scss = readFileSync(resolve(__dirname, 'logo.component.scss'), 'utf-8');
    const code = scss.replace(/\/\/[^\n]*/g, '');

    it('shows the dark source under :root.dark and under a root without a theme class', () => {
      expect(code).toMatch(/:host-context\(:root\.dark\)/);
      expect(code).toMatch(/:host-context\(:root:not\(\.light\):not\(\.system\)\)/);
    });

    it('follows the OS only for :root.system, inside prefers-color-scheme: dark', () => {
      expect(code).toMatch(
        /@media \(prefers-color-scheme: dark\)\s*\{\s*:host-context\(:root\.system:not\(\.light\)\)/,
      );
    });

    it('never shows the dark logo under :root.system in a light OS (no bare :not(.light))', () => {
      // A selector that only excludes `.light` also matches `:root.system`.
      expect(code).not.toMatch(/:root:not\(\.light\)\)/);
      const outsideMedia = code.replace(/@media[^{]*\{[\s\S]*$/, '');
      expect(outsideMedia).not.toMatch(/\.system:not/);
    });

    it('keeps the logo flat: no filter, transition, animation or transform', () => {
      expect(code).not.toMatch(/\b(filter|transition|animation|transform)\s*:/);
    });

    it('toggles the tagged sources', () => {
      expect(code).toContain('.lc-logo--dark-src');
      expect(code).toContain('.lc-logo--light-src');
    });
  });
});
