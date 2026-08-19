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

  describe('Source resolution', () => {
    it('renders the built-in full logo from the default base path', () => {
      expect(component.logoSrc()).toBe('/assets/life-cockpit-logo.svg');
      expect(singleImage().getAttribute('src')).toBe('/assets/life-cockpit-logo.svg');
    });

    it('renders the built-in emblem for variant="emblem"', () => {
      fixture.componentRef.setInput('variant', 'emblem');
      fixture.detectChanges();
      expect(singleImage().getAttribute('src')).toBe('/assets/life-cockpit-emblem.svg');
    });

    it('prefers a custom src / emblemSrc over the built-in assets', () => {
      fixture.componentRef.setInput('src', '/brand/logo.svg');
      fixture.componentRef.setInput('emblemSrc', '/brand/emblem.svg');
      fixture.detectChanges();
      expect(singleImage().getAttribute('src')).toBe('/brand/logo.svg');

      fixture.componentRef.setInput('variant', 'emblem');
      fixture.detectChanges();
      expect(singleImage().getAttribute('src')).toBe('/brand/emblem.svg');
    });

    it('resolves the built-in assets against LC_LOGO_BASE_PATH (trailing slash tolerated)', async () => {
      TestBed.resetTestingModule();
      await TestBed.configureTestingModule({
        imports: [LogoComponent],
        providers: [{ provide: LC_LOGO_BASE_PATH, useValue: '/static/ui-kit/' }],
      }).compileComponents();
      const custom = TestBed.createComponent(LogoComponent);
      custom.detectChanges();

      expect(custom.componentInstance.logoSrc()).toBe('/static/ui-kit/life-cockpit-logo.svg');
    });

    it('applies the alt text and the size class', () => {
      fixture.componentRef.setInput('alt', 'Acme Inc.');
      fixture.componentRef.setInput('size', 'lg');
      fixture.detectChanges();
      const img = singleImage();
      expect(img.getAttribute('alt')).toBe('Acme Inc.');
      expect(img.classList).toContain('size-lg');
      expect(img.classList).toContain('lc-logo');
    });

    it('adds the clickable class on demand', () => {
      fixture.componentRef.setInput('clickable', true);
      fixture.detectChanges();
      expect(singleImage().classList).toContain('clickable');
    });
  });

  describe('Dark / light source selection', () => {
    beforeEach(() => {
      fixture.componentRef.setInput('src', '/brand/logo.svg');
      fixture.componentRef.setInput('darkSrc', '/brand/logo-dark.svg');
      fixture.componentRef.setInput('emblemSrc', '/brand/emblem.svg');
      fixture.componentRef.setInput('darkEmblemSrc', '/brand/emblem-dark.svg');
      fixture.detectChanges();
    });

    it('does not key the swap on the OS color scheme (<picture>/<source media>)', () => {
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
      fixture.componentRef.setInput('variant', 'emblem');
      fixture.detectChanges();
      const [light, dark] = images();
      expect(light.getAttribute('src')).toBe('/brand/emblem.svg');
      expect(dark.getAttribute('src')).toBe('/brand/emblem-dark.svg');
    });

    it('renders only the dark source for colorMode="dark"', () => {
      fixture.componentRef.setInput('colorMode', 'dark');
      fixture.detectChanges();
      const img = singleImage();
      expect(img.getAttribute('src')).toBe('/brand/logo-dark.svg');
      expect(img.classList).not.toContain('lc-logo--dark-src');
    });

    it('renders only the light source for colorMode="light"', () => {
      fixture.componentRef.setInput('colorMode', 'light');
      fixture.detectChanges();
      const img = singleImage();
      expect(img.getAttribute('src')).toBe('/brand/logo.svg');
      expect(img.classList).not.toContain('lc-logo--light-src');
    });

    it('falls back to the light source alone when there is no dark source', () => {
      fixture.componentRef.setInput('darkSrc', '');
      fixture.detectChanges();
      const img = singleImage();
      expect(img.getAttribute('src')).toBe('/brand/logo.svg');
      expect(img.classList).not.toContain('lc-logo--light-src');
    });
  });

  describe('Invert classes (built-in assets only)', () => {
    it('adds lc-logo--auto in auto mode for the built-in logo', () => {
      expect(singleImage().classList).toContain('lc-logo--auto');
      expect(singleImage().classList).not.toContain('lc-logo--dark');
    });

    it('adds lc-logo--dark for colorMode="dark"', () => {
      fixture.componentRef.setInput('colorMode', 'dark');
      fixture.detectChanges();
      expect(singleImage().classList).toContain('lc-logo--dark');
      expect(singleImage().classList).not.toContain('lc-logo--auto');
    });

    it('adds no invert class for colorMode="light"', () => {
      fixture.componentRef.setInput('colorMode', 'light');
      fixture.detectChanges();
      expect(singleImage().classList).not.toContain('lc-logo--dark');
      expect(singleImage().classList).not.toContain('lc-logo--auto');
    });

    it('never inverts a custom brand asset', () => {
      fixture.componentRef.setInput('src', '/brand/logo.svg');
      fixture.componentRef.setInput('colorMode', 'dark');
      fixture.detectChanges();
      expect(singleImage().classList).not.toContain('lc-logo--dark');
      expect(singleImage().classList).not.toContain('lc-logo--auto');
      expect(component.hasCustomSrc()).toBe(true);
    });
  });

  describe('Stylesheet contract', () => {
    // jsdom does not apply component styles; the theme selectors are checked
    // against the source. Both rules key on the app theme the way the theme
    // stylesheets do — dark-first `:root:not(.light)` — and go through
    // `:host-context`, because a plain `:root.dark &` in an emulated-
    // encapsulation component is scoped to `[_ngcontent]:root.dark` and never
    // matches the document root.
    const scss = readFileSync(resolve(__dirname, 'logo.component.scss'), 'utf-8');

    it('auto-invert fires under the classless dark-first root, via :host-context', () => {
      expect(scss).toMatch(/:host-context\(:root:not\(\.light\)\)\s*&/);
      expect(scss).not.toMatch(/^\s*:root\.dark\s*&/m);
    });

    it('the source pair is toggled by the root theme class, not prefers-color-scheme', () => {
      expect(scss).toMatch(/:host-context\(:root:not\(\.light\)\)\s*\{/);
      expect(scss).toContain('.lc-logo--dark-src');
      expect(scss).toContain('.lc-logo--light-src');
      expect(scss).not.toMatch(/@media[^{]*prefers-color-scheme/);
    });
  });
});
