import { Type } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient, withXhr } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { readFileSync, readdirSync, statSync } from 'fs';
import { join, resolve } from 'path';
import { provideLcIcons } from '@lifecorner/angular-ui-kit/icon';
import * as ICONS from '@lifecorner/angular-ui-kit/icons';
import { AccordionComponent } from '@lifecorner/angular-ui-kit/accordion';
import { AlertComponent } from '@lifecorner/angular-ui-kit/alert';
import { CalloutComponent } from '@lifecorner/angular-ui-kit/callout';
import { ChatComponent } from '@lifecorner/angular-ui-kit/chat';
import { DateRangePickerComponent } from '@lifecorner/angular-ui-kit/date-range-picker';
import { EmailInputComponent } from '@lifecorner/angular-ui-kit/email-input';
import { HeaderComponent } from '@lifecorner/angular-ui-kit/header';
import { NextStepCardComponent } from '@lifecorner/angular-ui-kit/next-step-card';
import { NotificationCenterComponent } from '@lifecorner/angular-ui-kit/notification-center';
import { NumberInputComponent } from '@lifecorner/angular-ui-kit/number-input';
import { PasswordInputComponent } from '@lifecorner/angular-ui-kit/password-input';
import { PipelineComponent } from '@lifecorner/angular-ui-kit/pipeline';
import { RatingComponent } from '@lifecorner/angular-ui-kit/rating';
import { ToastComponent } from '@lifecorner/angular-ui-kit/toast';
import { resetIconCache, resetIconWarnings } from './icon/icon.component';
import { resetIconRendering } from './icon/icon-dom';
import { resolveInlineGlyph } from './icon/icon-inline-lookup';
import { resetIconSet } from './icon/icon-set-loader';

/**
 * AC-3 of request 002 (3.6, AS-17): kit components keep rendering the glyphs
 * they choose themselves (chevrons, close, status icons) without the app
 * registering them, because each registers them for its own view through
 * `ɵprovideKitIcons()`.
 *
 * 1. A static scan: every 3.5.1 inline name a kit component's sources contain
 *    is registered by that component (or listed below as not an icon), and
 *    every glyph it registers is used.
 * 2. Rendering: with an app that registers nothing and sets
 *    `unregistered: 'placeholder'`, each component renders its own glyphs
 *    synchronously, with no request and no "is not registered" warning.
 */

const SRC_LIB = resolve(__dirname);
const NOT_KIT_COMPONENTS = new Set(['icon', 'icons', 'icon-names', 'internal']);

/**
 * String literals in icon-rendering components that look like inline icon
 * names but are not icons (variant names, roles, input types). Key:
 * `<folder>/<file>: <literal>`.
 */
const NOT_ICONS: Record<string, string> = {
  'bottom-nav/bottom-nav.component.ts: error': 'badge variant',
  'card/card.component.ts: error': 'badge variant',
  'chat/chat.component.html: user': 'message role',
  'chat/chat.component.html: file': 'input type',
  'chat/chat.component.ts: user': 'message role',
  'chip/chip.component.ts: error': 'chip variant',
  'input/input.component.ts: done': 'enterkeyhint value',
  'input/input.component.ts: password': 'input type',
  'list/list.component.ts: error': 'badge variant',
  'log-viewer/log-viewer.component.html: error': 'log level',
  'log-viewer/log-viewer.component.ts: error': 'log level',
  'password-input/password-input.component.html: password': 'input type',
  'pipeline/pipeline.component.ts: error': 'step status (its glyph is x)',
  'stat-trend/stat-trend.component.ts: error': 'colour name',
  'timeline/timeline.component.ts: error': 'colour name',
};

const variantKey = (variant: string, name: string) => `${variant}:${name}`;
const definitions = ICONS as unknown as Record<string, { name: string; variant: string } | undefined>;

function sourcesOf(folder: string): Array<{ file: string; code: string }> {
  const dir = join(SRC_LIB, folder);
  return readdirSync(dir)
    .filter((f) => /\.(ts|html)$/.test(f) && !/\.(spec|stories)\.ts$/.test(f) && statSync(join(dir, f)).isFile())
    .map((file) => ({
      file,
      code: readFileSync(join(dir, file), 'utf-8')
        .replace(/\/\*[\s\S]*?\*\//g, '')
        .replace(/^\s*\/\/.*$/gm, '')
        .replace(/<!--[\s\S]*?-->/g, ''),
    }));
}

/** The glyphs (`variant:name`) a folder registers through ɵprovideKitIcons([...]). */
function registeredBy(sources: Array<{ code: string }>): Set<string> {
  const glyphs = new Set<string>();
  for (const { code } of sources) {
    for (const call of code.matchAll(/ɵprovideKitIcons\(\s*\[([^\]]*)\]/g)) {
      for (const id of call[1].match(/ICON_[A-Z0-9_]+/g) ?? []) {
        const icon = definitions[id];
        if (!icon) throw new Error(`${id} is not exported by @lifecorner/angular-ui-kit/icons`);
        glyphs.add(variantKey(icon.variant, icon.name));
      }
    }
  }
  return glyphs;
}

const kitFolders = readdirSync(SRC_LIB)
  .filter((f) => statSync(join(SRC_LIB, f)).isDirectory() && !NOT_KIT_COMPONENTS.has(f))
  .filter((f) => sourcesOf(f).some(({ code }) => /lc-icon|IconComponent|ɵprovideKitIcons/.test(code)))
  .sort();

describe('kit-internal glyphs (AS-17, AC-3)', () => {
  describe('static scan of the kit components', () => {
    it('covers every component that renders lc-icon', () => {
      expect(kitFolders.length).toBeGreaterThan(30);
      expect(kitFolders).toEqual(expect.arrayContaining(['alert', 'header', 'sidenav', 'email-input', 'tree-view']));
    });

    it('registers every 3.5.1 inline name a component uses, outline and solid', () => {
      const missing: string[] = [];
      for (const folder of kitFolders) {
        const sources = sourcesOf(folder);
        const registered = registeredBy(sources);
        for (const { file, code } of sources) {
          for (const [, , literal] of code.matchAll(/(['"])([a-z0-9]+(?:-[a-z0-9]+)*)\1/g)) {
            const glyph = resolveInlineGlyph(literal, 'outline');
            if (!glyph || registered.has(variantKey('outline', glyph)) || NOT_ICONS[`${folder}/${file}: ${literal}`]) continue;
            missing.push(`${folder}/${file}: '${literal}' needs ${glyph}`);
          }
          for (const [tag] of code.matchAll(/<lc-icon\b[^>]*>/g)) {
            const name = tag.match(/\sname="([^"]+)"/)?.[1];
            if (!name || !/\svariant="solid"/.test(tag)) continue;
            const glyph = resolveInlineGlyph(name, 'solid');
            if (glyph && !registered.has(variantKey('solid', glyph))) missing.push(`${folder}/${file}: solid '${name}' needs ${glyph}`);
          }
        }
      }
      expect(missing).toEqual([]);
    });

    it('registers no glyph it does not use', () => {
      const unused: string[] = [];
      for (const folder of kitFolders) {
        const sources = sourcesOf(folder);
        const used = new Set<string>();
        for (const { code } of sources) {
          for (const [, , literal] of code.matchAll(/(['"])([a-z0-9]+(?:-[a-z0-9]+)*)\1/g)) {
            for (const variant of ['outline', 'solid'] as const) {
              const glyph = resolveInlineGlyph(literal, variant);
              if (glyph) used.add(variantKey(variant, glyph));
            }
          }
        }
        for (const glyph of registeredBy(sources)) if (!used.has(glyph)) unused.push(`${folder}: ${glyph}`);
      }
      expect(unused).toEqual([]);
    });

    it('lists only exceptions that still occur', () => {
      const stale = Object.keys(NOT_ICONS).filter((key) => {
        const [path, literal] = key.split(': ');
        const [folder, file] = path.split('/');
        return !sourcesOf(folder).some((s) => s.file === file && (s.code.includes(`'${literal}'`) || s.code.includes(`"${literal}"`)));
      });
      expect(stale).toEqual([]);
    });
  });

  describe('rendering with nothing registered by the app', () => {
    let httpMock: HttpTestingController;
    let warnSpy: jest.SpyInstance;

    beforeEach(() => {
      TestBed.configureTestingModule({
        providers: [
          provideHttpClient(withXhr()),
          provideHttpClientTesting(),
          provideRouter([]),
          provideLcIcons([], { unregistered: 'placeholder' }),
        ],
      });
      resetIconWarnings();
      resetIconCache();
      resetIconRendering();
      resetIconSet();
      httpMock = TestBed.inject(HttpTestingController);
      warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => undefined);
    });

    afterEach(() => warnSpy.mockRestore());

    function render<T>(component: Type<T>, inputs: Record<string, unknown> = {}): ComponentFixture<T> {
      const fixture = TestBed.createComponent(component);
      for (const [key, value] of Object.entries(inputs)) fixture.componentRef.setInput(key, value);
      fixture.detectChanges();
      return fixture;
    }

    const isPlaceholder = (svg: Element) => Array.from(svg.children).map((c) => c.tagName).join(',') === 'rect,text';

    /** Synchronously, right after the first change detection: glyphs shown, no placeholder, no warning, no request for them. */
    function expectOwnGlyphs(fixture: ComponentFixture<unknown>, atLeast: number): void {
      const notRegistered = warnSpy.mock.calls.map(([m]) => String(m)).filter((m) => m.includes('is not registered'));
      expect(notRegistered).toEqual([]);
      const requested = httpMock.match(() => true).map((r) => r.request.url.replace(/^\/tabler-icons\/\w+\/|\.svg$/g, ''));
      expect(requested.filter((name) => resolveInlineGlyph(name, 'outline'))).toEqual([]);
      const rendered = Array.from((fixture.nativeElement as HTMLElement).querySelectorAll('lc-icon .icon-container > svg'));
      expect(rendered.filter(isPlaceholder)).toHaveLength(0);
      expect(rendered.length).toBeGreaterThanOrEqual(atLeast);
    }

    it.each(['info', 'success', 'warning', 'error'])('lc-alert (%s, dismissible): status glyph and x-mark', (variant) => {
      expectOwnGlyphs(render(AlertComponent, { variant, dismissible: true }), 2);
    });

    it.each(['info', 'success', 'warning', 'error', 'neutral'])('lc-callout (%s, dismissible): status glyph and x-mark', (variant) => {
      expectOwnGlyphs(render(CalloutComponent, { variant, dismissible: true }), 2);
    });

    it.each(['info', 'success', 'warning', 'error'])('lc-toast (%s): status glyph and x-mark', (variant) => {
      const toast = { id: 't', message: 'Gespeichert', variant, duration: 0, showCloseButton: true, title: '' };
      expectOwnGlyphs(render(ToastComponent, { toast }), 2);
    });

    it('lc-accordion: chevron-down', () => expectOwnGlyphs(render(AccordionComponent, { title: 'Details' }), 1));
    it('lc-rating: star', () => expectOwnGlyphs(render(RatingComponent), 5));
    it('lc-password-input: eye', () => expectOwnGlyphs(render(PasswordInputComponent), 1));
    it('lc-number-input: plus', () => expectOwnGlyphs(render(NumberInputComponent), 1));
    it('lc-date-range-picker: calendar', () => expectOwnGlyphs(render(DateRangePickerComponent), 1));
    it('lc-email-input: envelope (mail) through lc-input', () => expectOwnGlyphs(render(EmailInputComponent), 1));
    it('lc-next-step-card: its default information-circle', () =>
      expectOwnGlyphs(render(NextStepCardComponent, { cardTitle: 'Nächster Schritt' }), 1));
    it('lc-header: theme button, user menu and chevron', () =>
      expectOwnGlyphs(render(HeaderComponent, { title: 'LifeCorner', showThemeButton: true }), 3));

    it('lc-pipeline: check, alert-triangle and x', () => {
      const steps = [
        { label: 'A', status: 'complete' },
        { label: 'B', status: 'warning' },
        { label: 'C', status: 'error' },
      ];
      expectOwnGlyphs(render(PipelineComponent, { steps }), 3);
    });

    it('lc-notification-center: one status glyph per type', () => {
      const notifications = (['info', 'success', 'warning', 'error'] as const).map((type, i) => ({
        id: String(i),
        title: type,
        type,
        timestamp: new Date(2026, 9, 17),
      }));
      expectOwnGlyphs(render(NotificationCenterComponent, { notifications }), 4);
    });

    it('lc-chat: one status glyph per semantic status', () => {
      const messages = (['info', 'success', 'warning', 'error'] as const).map((status, i) => ({
        id: String(i),
        role: 'agent',
        content: status,
        status,
      }));
      expectOwnGlyphs(render(ChatComponent, { messages }), 4);
    });

    it("a name the app passes in is the app's: it follows the app's unregistered setting", () => {
      const fixture = render(NextStepCardComponent, { cardTitle: 'Haushalt', icon: 'home' });
      expect(warnSpy.mock.calls.map(([m]) => String(m))).toEqual([
        '[lc-icon] "home" is not registered. Add ICON_HOME from @lifecorner/angular-ui-kit/icons to provideLcIcons(). Rendering a placeholder instead.',
      ]);
      const [svg] = Array.from((fixture.nativeElement as HTMLElement).querySelectorAll('lc-icon .icon-container > svg'));
      expect(isPlaceholder(svg)).toBe(true);
    });
  });
});
