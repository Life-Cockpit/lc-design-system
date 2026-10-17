import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient, withXhr } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { IconComponent, resetIconCache, resetIconWarnings } from './icon.component';
import { resetIconRendering } from './icon-dom';
import { ICON_NAMES } from '../icon-names/icon-names';
import { BUNDLED_ICONS } from '@lifecorner/angular-ui-kit/icons';
import { provideLcIcons } from './icon-registry';

/**
 * Unknown names in development and production (3.5, AS-15, AC-18 and AC-19 of
 * request 001). Production builds fold `ngDevMode` to `false`, which drops the
 * name list from the bundle; these tests switch the global the same way.
 */
declare const globalThis: { ngDevMode: unknown };

const INDEX_HTML =
  '<!doctype html>\n<html lang="en"><head><base href="/"><title>App</title></head>' +
  '<body><app-root></app-root><script src="main-abc123.js"></script></body></html>';
const ANCHOR =
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M0 0h24"/></svg>';

describe('IconComponent: unknown names in development and production (AS-15)', () => {
  let httpMock: HttpTestingController;
  let warnSpy: jest.SpyInstance;
  let devMode: unknown;

  beforeEach(async () => {
    // 3.6 (AS-17): inline icons render synchronously once registered.
    await TestBed.configureTestingModule({
      imports: [IconComponent],
      providers: [provideHttpClient(withXhr()), provideHttpClientTesting(), provideLcIcons(BUNDLED_ICONS)],
    }).compileComponents();
    resetIconWarnings();
    resetIconCache();
    resetIconRendering();
    httpMock = TestBed.inject(HttpTestingController);
    warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => undefined);
    devMode = globalThis.ngDevMode;
  });

  afterEach(() => {
    globalThis.ngDevMode = devMode;
    warnSpy.mockRestore();
    httpMock.verify();
  });

  function render(inputs: Record<string, unknown>): ComponentFixture<IconComponent> {
    const fixture = TestBed.createComponent(IconComponent);
    for (const [key, value] of Object.entries(inputs)) fixture.componentRef.setInput(key, value);
    fixture.detectChanges();
    return fixture;
  }

  const container = (fixture: ComponentFixture<IconComponent>) =>
    (fixture.nativeElement as HTMLElement).querySelector('.icon-container') as HTMLElement;
  const placeholderShown = (fixture: ComponentFixture<IconComponent>) =>
    Array.from(container(fixture).querySelectorAll(':scope > svg > *')).map((c) => c.tagName).join(',') === 'rect,text';

  it('every icon name has the form production checks', () => {
    const form = /^[a-z0-9]+(?:[-_][a-z0-9]+)*$/;
    expect(ICON_NAMES.filter((name) => !form.test(name) || name.length > 64)).toEqual([]);
  });

  describe('development (the list)', () => {
    it('warns for an unknown name and never requests it', () => {
      const fixture = render({ name: 'beaker' });
      httpMock.expectNone(() => true);
      expect(placeholderShown(fixture)).toBe(true);
      expect(warnSpy).toHaveBeenCalledTimes(1);
      expect(warnSpy.mock.calls[0][0]).toContain('[lc-icon] Unknown icon "beaker"');
    });

    it('throws for an unknown name in strict mode', () => {
      const fixture = TestBed.createComponent(IconComponent);
      fixture.componentRef.setInput('strict', true);
      fixture.componentRef.setInput('name', 'beaker');
      expect(() => fixture.detectChanges()).toThrow(/Unknown icon "beaker"/);
    });

    it('stays quiet when a known name\'s asset is missing', () => {
      const fixture = render({ name: 'anchor' });
      httpMock.expectOne('/tabler-icons/outline/anchor.svg').flush('Not Found', { status: 404, statusText: 'Not Found' });
      fixture.detectChanges();
      expect(placeholderShown(fixture)).toBe(true);
      expect(warnSpy).not.toHaveBeenCalled();
    });
  });

  describe('production (the form only)', () => {
    beforeEach(() => {
      globalThis.ngDevMode = false;
    });

    it('requests a well-formed unknown name once, then shows the placeholder with one warning (404)', () => {
      const fixture = render({ name: 'beaker' });
      expect(container(fixture).childNodes).toHaveLength(0);
      expect(container(fixture).style.width).toBe('24px');
      httpMock.expectOne('/tabler-icons/outline/beaker.svg').flush('Not Found', { status: 404, statusText: 'Not Found' });
      fixture.detectChanges();

      expect(placeholderShown(fixture)).toBe(true);
      expect(container(fixture).style.width).toBe('24px');
      expect(container(fixture).style.height).toBe('24px');
      expect(warnSpy).toHaveBeenCalledTimes(1);
      expect(warnSpy.mock.calls[0][0]).toBe(
        '[lc-icon] "beaker": /tabler-icons/outline/beaker.svg could not be loaded (404) — an unknown name or a missing asset. Rendering a placeholder instead.',
      );

      const second = render({ name: 'beaker' });
      httpMock.expectNone('/tabler-icons/outline/beaker.svg');
      expect(placeholderShown(second)).toBe(true);
      expect(warnSpy).toHaveBeenCalledTimes(1);
    });

    it('drops the SPA index.html fallback: placeholder, no HTML in the DOM, one warning', () => {
      const fixture = render({ name: 'beaker' });
      httpMock.expectOne('/tabler-icons/outline/beaker.svg').flush(INDEX_HTML, { headers: { 'content-type': 'text/html' } });
      fixture.detectChanges();

      expect(placeholderShown(fixture)).toBe(true);
      expect(container(fixture).querySelectorAll('script, base, app-root, html, body')).toHaveLength(0);
      expect(warnSpy).toHaveBeenCalledTimes(1);
      expect(warnSpy.mock.calls[0][0]).toContain('returned non-SVG content (text/html)');
    });

    it.each(['../x', 'Foo Bar', 'a'.repeat(65), 'x-', 'ß'])('neither requests nor accepts the malformed name %j', (name) => {
      const fixture = render({ name });
      httpMock.expectNone(() => true);
      expect(placeholderShown(fixture)).toBe(true);
      expect(warnSpy).toHaveBeenCalledTimes(1);
      expect(warnSpy.mock.calls[0][0]).toContain(`[lc-icon] Unknown icon "${name}"`);
    });

    it('renders a valid fetched icon and inline icons as before', () => {
      const fetched = render({ name: 'anchor' });
      httpMock.expectOne('/tabler-icons/outline/anchor.svg').flush(ANCHOR, { headers: { 'content-type': 'image/svg+xml' } });
      fetched.detectChanges();
      expect(container(fetched).querySelectorAll('svg > path')).toHaveLength(1);

      const inline = render({ name: 'home' });
      httpMock.expectNone(() => true);
      expect(container(inline).querySelector('svg')?.getAttribute('width')).toBe('24px');
      expect(warnSpy).not.toHaveBeenCalled();
    });

    it('does not throw in strict mode', () => {
      const fixture = TestBed.createComponent(IconComponent);
      fixture.componentRef.setInput('strict', true);
      fixture.componentRef.setInput('name', 'beaker');
      expect(() => fixture.detectChanges()).not.toThrow();
      httpMock.expectOne('/tabler-icons/outline/beaker.svg').flush('Not Found', { status: 404, statusText: 'Not Found' });
    });
  });
});
