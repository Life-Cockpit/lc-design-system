import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient, withXhr } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { PLATFORM_ID } from '@angular/core';
import { readFileSync, readdirSync } from 'fs';
import { join, resolve } from 'path';
import { IconComponent, resetIconCache, resetIconWarnings } from './icon.component';
// 3.6 (AS-17): the maps moved to the lazy internal entry; the bundled icons
// render synchronously once registered, so the setup registers all of them.
import { INLINE_ICON_SVGS, INLINE_TABLER_SVGS } from '@lifecorner/angular-ui-kit/internal/icon-set';
import { BUNDLED_ICONS } from '@lifecorner/angular-ui-kit/icons';
import { provideLcIcons } from './icon-registry';
import { ICON_FALLBACK_SVG } from './icon-placeholder';
import { buildSvg } from './icon-svg-builder';
import { resetIconRendering } from './icon-dom';
import { ICON_POLICY_REFUSED_WARNING, IconPolicyRules, bundledIconSvgs } from './icon-trusted-types';

/**
 * lc-icon under Trusted Types (3.5, AS-14): AC-5 to AC-9 of request 001.
 * jsdom has no Trusted Types, so a fake factory stands in for
 * `window.trustedTypes`: it records every `createPolicy` call and wraps
 * `createHTML`'s result in an object, like a browser's TrustedHTML.
 */

class FakeTrustedHTML {
  constructor(private readonly value: string) {}
  toString(): string {
    return this.value;
  }
}

interface FakeFactory {
  /** Every policy the kit asked for (Angular's own `angular*` policies are left out). */
  calls: Array<{ name: string; rules: IconPolicyRules }>;
  /** The names of every policy created on the page, Angular's included. */
  names: string[];
  createPolicy: jest.Mock;
}

/**
 * A stand-in for `window.trustedTypes`. Angular's JIT compiler (used by the
 * tests) creates its own `angular#unsafe-jit` policy through it too; that one
 * gets pass-through rules and is not counted as the kit's.
 */
function installTrustedTypes(options: { refuse?: boolean } = {}): FakeFactory {
  const factory: FakeFactory = {
    calls: [],
    names: [],
    createPolicy: jest.fn((name: string, rules: Record<string, (input: string) => string>) => {
      factory.names.push(name);
      if (name.startsWith('angular')) {
        return { createHTML: (s: string) => s, createScript: (s: string) => s, createScriptURL: (s: string) => s };
      }
      factory.calls.push({ name, rules: rules as unknown as IconPolicyRules });
      if (options.refuse) throw new TypeError(`Refused to create a TrustedTypePolicy named '${name}'`);
      return { createHTML: (input: string) => new FakeTrustedHTML(rules['createHTML'](input)) };
    }),
  };
  (window as unknown as { trustedTypes?: unknown }).trustedTypes = factory;
  return factory;
}

function removeTrustedTypes(): void {
  delete (window as unknown as { trustedTypes?: unknown }).trustedTypes;
}

const ALL_BUNDLED: string[] = [
  ...Object.values(INLINE_ICON_SVGS).flatMap((v) => Object.values(v)),
  ...Object.values(INLINE_TABLER_SVGS).flatMap((v) => Object.values(v) as string[]),
];

/** The DOM 3.4.1 rendered in jsdom for these inputs (captured from the 3.4.1 sources, request 001). */
const ICON_DOM_341: ReadonlyArray<{ inputs: Record<string, unknown>; className: string; style: string; svg: string }> = [
  {
    inputs: {"name":"home"},
    className: "icon-container icon-md icon-outline",
    style: "width: 24px; height: 24px;",
    svg:
      "<svg xmlns=\"http://www.w3.org/2000/svg\" fill=\"none\" viewBox=\"0 0 24 24\" stroke-width=\"1.5\" stroke=\"currentColor\" width=\"24px\" height=\"24px\" style=\"color: currentcolor;\" role=\"img\"><path stroke-linecap=\"round\" stroke-linejoin=\"round\" d=\"m2.25 12 8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25\"></path></svg>",
  },
  {
    inputs: {"name":"home","variant":"solid","size":"xl","color":"#FF5733","ariaLabel":"Start"},
    className: "icon-container icon-solid icon-xl",
    style: "width: 40px; height: 40px;",
    svg:
      "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 24 24\" fill=\"currentColor\" width=\"40px\" height=\"40px\" style=\"color: rgb(255, 87, 51);\" role=\"img\" aria-label=\"Start\"><path d=\"M11.47 3.841a.75.75 0 0 1 1.06 0l8.69 8.69a.75.75 0 1 0 1.06-1.061l-8.689-8.69a2.25 2.25 0 0 0-3.182 0l-8.69 8.69a.75.75 0 1 0 1.061 1.06l8.69-8.689Z\"></path><path d=\"m12 5.432 8.159 8.159c.03.03.06.058.091.086v6.198c0 1.035-.84 1.875-1.875 1.875H15a.75.75 0 0 1-.75-.75v-4.5a.75.75 0 0 0-.75-.75h-3a.75.75 0 0 0-.75.75V21a.75.75 0 0 1-.75.75H5.625a1.875 1.875 0 0 1-1.875-1.875v-6.198a2.29 2.29 0 0 0 .091-.086L12 5.432Z\"></path></svg>",
  },
  {
    inputs: {"name":"logout","size":"sm","decorative":true},
    className: "icon-container icon-outline icon-sm",
    style: "width: 20px; height: 20px;",
    svg:
      "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" width=\"20px\" height=\"20px\" style=\"color: currentcolor;\" aria-hidden=\"true\"><path d=\"M14 8v-2a2 2 0 0 0 -2 -2h-7a2 2 0 0 0 -2 2v12a2 2 0 0 0 2 2h7a2 2 0 0 0 2 -2v-2\"></path><path d=\"M9 12h12l-3 -3\"></path><path d=\"M18 15l3 -3\"></path></svg>",
  },
  {
    inputs: {"name":"beaker"},
    className: "icon-container icon-md icon-outline",
    style: "width: 24px; height: 24px;",
    svg:
      "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.5\" width=\"24px\" height=\"24px\" style=\"color: currentcolor;\" role=\"img\"><rect x=\"3.5\" y=\"3.5\" width=\"17\" height=\"17\" rx=\"3\" stroke-dasharray=\"2.5 2.5\"></rect><text x=\"12\" y=\"16.5\" text-anchor=\"middle\" font-size=\"12\" font-weight=\"700\" font-family=\"system-ui, -apple-system, sans-serif\" fill=\"currentColor\" stroke=\"none\">?</text></svg>",
  },
];

/** The icon sources AC-5 scans: everything in this folder that ships (no specs, no stories). */
function shippedSources(): Array<{ file: string; code: string }> {
  return readdirSync(__dirname)
    .filter((f) => /\.(ts|html)$/.test(f) && !/\.(spec|stories)\.ts$/.test(f))
    .map((file) => {
      const raw = readFileSync(join(__dirname, file), 'utf-8');
      // Comments may name the sinks (to say they are not used); code may not.
      const code = raw.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '').replace(/<!--[\s\S]*?-->/g, '');
      return { file, code };
    });
}

describe('IconComponent under Trusted Types (AS-14)', () => {
  let httpMock: HttpTestingController;
  let warnSpy: jest.SpyInstance;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [IconComponent],
      providers: [provideHttpClient(withXhr()), provideHttpClientTesting(), provideLcIcons(BUNDLED_ICONS)],
    }).compileComponents();
    resetIconWarnings();
    resetIconCache();
    resetIconRendering();
    httpMock = TestBed.inject(HttpTestingController);
    warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => undefined);
  });

  afterEach(() => {
    removeTrustedTypes();
    resetIconRendering();
    warnSpy.mockRestore();
    jest.restoreAllMocks();
    httpMock.verify();
  });

  function render(inputs: Record<string, unknown>): ComponentFixture<IconComponent> {
    const fixture = TestBed.createComponent(IconComponent);
    for (const [key, value] of Object.entries(inputs)) fixture.componentRef.setInput(key, value);
    fixture.detectChanges();
    return fixture;
  }

  const svgsOf = (fixture: ComponentFixture<IconComponent>) =>
    Array.from((fixture.nativeElement as HTMLElement).querySelectorAll('.icon-container > svg'));

  describe('AC-5: no string-fed sink', () => {
    it('ships no sanitizer bypass, no HTML binding and no HTML-string sink', () => {
      const sources = shippedSources();
      expect(sources.map((s) => s.file)).toEqual(expect.arrayContaining(['icon.component.ts', 'icon.component.html', 'icon-dom.ts', 'icon-svg-builder.ts']));
      for (const { file, code } of sources) {
        for (const sink of ['bypassSecurityTrust', '[innerHTML]', 'innerHTML', 'outerHTML', 'insertAdjacentHTML', 'createContextualFragment', 'setHTMLUnsafe', 'DomSanitizer']) {
          expect({ file, sink, found: code.includes(sink) }).toEqual({ file, sink, found: false });
        }
      }
    });

    it('calls parseFromString at exactly one place', () => {
      const sites = shippedSources().flatMap(({ file, code }) => [...code.matchAll(/parseFromString\(/g)].map(() => file));
      expect(sites).toEqual(['icon-dom.ts']);
    });

    it('never hands the parser a plain string when the page has Trusted Types', () => {
      installTrustedTypes();
      const parse = jest.spyOn(DOMParser.prototype, 'parseFromString');
      // Hand-picked inline icons (both variants), an inlined Tabler one and an unknown name (the placeholder).
      for (const name of [...Object.keys(INLINE_ICON_SVGS).slice(0, 5), 'mail', 'beaker']) {
        for (const variant of ['outline', 'solid']) render({ name, variant, ariaLabel: name });
      }
      expect(parse.mock.calls.length).toBeGreaterThan(0);
      for (const [input] of parse.mock.calls) {
        expect(typeof input).not.toBe('string');
        expect(input).toBeInstanceOf(FakeTrustedHTML);
      }
    });
  });

  describe('AC-6: exactly one policy, lc-icon, created lazily', () => {
    it('creates no policy when no icon renders', () => {
      const factory = installTrustedTypes();
      render({ name: '' });
      expect(factory.calls).toHaveLength(0);
    });

    it('creates one policy named lc-icon with createHTML only, across 50 instances and a fetched icon', () => {
      const factory = installTrustedTypes();
      // Ten names inline in both variants (the hand-picked set).
      const names = Object.keys(INLINE_ICON_SVGS).slice(0, 10);
      // Every size and both variants: outline in xs, sm, md and solid in lg, xl.
      const sizesFor: Record<string, string[]> = { outline: ['xs', 'sm', 'md'], solid: ['lg', 'xl'] };
      let count = 0;
      for (const name of names) {
        for (const variant of ['outline', 'solid']) {
          for (const size of sizesFor[variant]) {
            const fixture = render({ name, variant, size });
            expect(svgsOf(fixture)).toHaveLength(1);
            count++;
          }
        }
      }
      expect(count).toBe(50);
      render({ name: 'anchor' });
      httpMock.expectOne('/tabler-icons/outline/anchor.svg').flush(readFileSync(TABLER('outline/anchor.svg'), 'utf-8'));

      expect(factory.calls).toHaveLength(1);
      expect(factory.calls[0].name).toBe('lc-icon');
      expect(Object.keys(factory.calls[0].rules)).toEqual(['createHTML']);
      expect(factory.names.filter((n) => !n.startsWith('angular'))).toEqual(['lc-icon']);
    });

    it('asks once when the page refuses the policy, and warns once', () => {
      const factory = installTrustedTypes({ refuse: true });
      for (const name of ['home', 'x-mark', 'logout']) render({ name });
      expect(factory.calls).toHaveLength(1);
      expect(warnSpy.mock.calls.filter(([m]) => m === ICON_POLICY_REFUSED_WARNING)).toHaveLength(1);
    });
  });

  describe('AC-7: the policy accepts only the kit\'s own strings', () => {
    let rules: IconPolicyRules;

    beforeEach(() => {
      const factory = installTrustedTypes();
      render({ name: 'home' });
      rules = factory.calls[0].rules;
    });

    it('returns each of the 133 bundled constants and the placeholder unchanged', () => {
      expect(ALL_BUNDLED).toHaveLength(133);
      expect(bundledIconSvgs().size).toBe(134);
      for (const svg of [...ALL_BUNDLED, ICON_FALLBACK_SVG]) expect(rules.createHTML(svg)).toBe(svg);
    });

    it.each([
      ['a fetched Tabler file', () => readFileSync(TABLER('outline/anchor.svg'), 'utf-8')],
      ['an altered constant', () => `${ALL_BUNDLED[0]} `],
      ['an SVG with an event handler', () => '<svg onload="alert(1)">'],
      ['an image with an event handler', () => '<img src=x onerror=alert(1)>'],
      ['the empty string', () => ''],
    ])('throws for %s', (_label, input) => {
      expect(() => rules.createHTML(input())).toThrow(TypeError);
    });
  });

  describe('AC-8: consumer input reaches attributes only', () => {
    it('keeps a hostile aria-label literal and adds no element', () => {
      const label = '"><img src=x onerror=alert(1)>';
      const fixture = render({ name: 'home', ariaLabel: label });
      const [svg] = svgsOf(fixture);
      expect(svg.getAttribute('aria-label')).toBe(label);
      expect((fixture.nativeElement as HTMLElement).querySelectorAll('img')).toHaveLength(0);
    });

    it('applies the colour through style.color only', () => {
      const fixture = render({ name: 'home', color: 'red;"><img src=x onerror=alert(1)>' });
      const [svg] = svgsOf(fixture) as SVGElement[];
      expect((fixture.nativeElement as HTMLElement).querySelectorAll('img')).toHaveLength(0);
      // An invalid colour is ignored by the style declaration, never written raw.
      expect(svg.getAttribute('style') ?? '').not.toContain('<img');
      fixture.componentRef.setInput('color', 'var(--color-primary-500)');
      fixture.detectChanges();
      expect(svg.style.color).toBe('var(--color-primary-500)');
    });
  });

  describe('AC-9: the same DOM as 3.4.1', () => {
    it.each(ICON_DOM_341.map((c) => [JSON.stringify(c.inputs), c] as const))('renders %s exactly as 3.4.1 did', (_label, expected) => {
      const fixture = render(expected.inputs);
      const container = (fixture.nativeElement as HTMLElement).querySelector('.icon-container') as HTMLElement;
      expect(container.className).toBe(expected.className);
      expect(container.getAttribute('style')).toBe(expected.style);
      expect(container.innerHTML).toBe(expected.svg);
    });

    it('renders the same DOM with the policy as without it', () => {
      const without = ICON_DOM_341.map((c) => render(c.inputs).nativeElement.querySelector('.icon-container').innerHTML);
      resetIconRendering();
      installTrustedTypes();
      const withPolicy = ICON_DOM_341.map((c) => render(c.inputs).nativeElement.querySelector('.icon-container').innerHTML);
      expect(withPolicy).toEqual(without);
    });

    it('builds every bundled constant exactly as the XML parser does (server and client agree)', () => {
      const serializer = new XMLSerializer();
      for (const svg of [...ALL_BUNDLED, ICON_FALLBACK_SVG]) {
        const parsed = document.importNode(new DOMParser().parseFromString(svg, 'image/svg+xml').documentElement, true) as Element;
        const built = buildSvg(document, svg).svg as SVGElement;
        expect(built).toBeDefined();
        expect(serializer.serializeToString(built)).toBe(serializer.serializeToString(parsed));
        expect(built.outerHTML).toBe(parsed.outerHTML);
      }
    });

    it('re-decorates the same element when size, colour or labels change', () => {
      const fixture = render({ name: 'home' });
      const [svg] = svgsOf(fixture);
      fixture.componentRef.setInput('size', 'xl');
      fixture.componentRef.setInput('color', '#FF5733');
      fixture.componentRef.setInput('ariaLabel', 'Start');
      fixture.detectChanges();
      expect(svgsOf(fixture)).toEqual([svg]);
      expect(svg.getAttribute('width')).toBe('40px');
      expect(svg.getAttribute('aria-label')).toBe('Start');
    });
  });

  describe('AC-11: a refused policy', () => {
    it('renders the decorated placeholder for bundled icons, keeping the accessible name', () => {
      installTrustedTypes({ refuse: true });
      const fixture = render({ name: 'logout', ariaLabel: 'Abmelden', size: 'sm' });
      const [svg] = svgsOf(fixture);
      expect(svgsOf(fixture)).toHaveLength(1);
      expect(Array.from(svg.children).map((c) => c.tagName)).toEqual(['rect', 'text']);
      expect(svg.getAttribute('aria-label')).toBe('Abmelden');
      expect(svg.getAttribute('role')).toBe('img');
      expect(svg.getAttribute('width')).toBe('20px');
    });

    it('still renders fetched icons, which need no policy', () => {
      installTrustedTypes({ refuse: true });
      const fixture = render({ name: 'anchor' });
      httpMock.expectOne('/tabler-icons/outline/anchor.svg').flush(readFileSync(TABLER('outline/anchor.svg'), 'utf-8'));
      fixture.detectChanges();
      const [svg] = svgsOf(fixture);
      expect(svg.querySelectorAll('path')).toHaveLength(3);
    });
  });

  describe('AC-12: fetched text never reaches the policy or a parser', () => {
    it('builds a fetched icon without createHTML and without parsing', () => {
      const factory = installTrustedTypes();
      render({ name: 'home' });
      const createHTML = jest.spyOn(factory.calls[0].rules, 'createHTML');
      const parse = jest.spyOn(DOMParser.prototype, 'parseFromString');
      const fixture = render({ name: 'anchor' });
      httpMock.expectOne('/tabler-icons/outline/anchor.svg').flush(readFileSync(TABLER('outline/anchor.svg'), 'utf-8'));
      fixture.detectChanges();
      expect(svgsOf(fixture)).toHaveLength(1);
      expect(createHTML).not.toHaveBeenCalled();
      expect(parse).not.toHaveBeenCalled();
    });

    it('drops a crafted SVG with an event handler and shows the placeholder, with one warning', () => {
      const fixture = render({ name: 'anchor' });
      httpMock
        .expectOne('/tabler-icons/outline/anchor.svg')
        .flush('<svg xmlns="http://www.w3.org/2000/svg" onload="window.__pwned=1"><path d="M0 0"/></svg>', {
          headers: { 'content-type': 'image/svg+xml' },
        });
      fixture.detectChanges();
      const [svg] = svgsOf(fixture);
      expect(svg.hasAttribute('onload')).toBe(false);
      expect(Array.from(svg.children).map((c) => c.tagName)).toEqual(['rect', 'text']);
      expect((window as unknown as { __pwned?: unknown }).__pwned).toBeUndefined();
      expect(warnSpy).toHaveBeenCalledTimes(1);
      expect(warnSpy.mock.calls[0][0]).toBe(
        '[lc-icon] "anchor": /tabler-icons/outline/anchor.svg was dropped: the attribute "onload" is not allowed. Fetched icons may contain only basic shapes with paint and geometry attributes. Rendering a placeholder instead.',
      );
    });
  });

  describe('3.6 (AS-17): registered glyphs go through the same policy and allow-list', () => {
    /** A string registered as if it were a kit glyph: it must never reach a parser. */
    const CRAFTED = {
      name: 'home',
      variant: 'outline',
      svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" onload="window.__pwned=1"><path d="M0 0h24"/></svg>',
    } as const;

    function registerOnly(...icons: Array<{ name: string; variant: 'outline' | 'solid'; svg: string }>): void {
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        imports: [IconComponent],
        providers: [provideHttpClient(withXhr()), provideHttpClientTesting(), provideLcIcons(icons)],
      });
      httpMock = TestBed.inject(HttpTestingController);
    }

    it('renders registered glyphs through createHTML, with no CSP or Trusted Types message', () => {
      const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => undefined);
      const factory = installTrustedTypes();
      const parse = jest.spyOn(DOMParser.prototype, 'parseFromString');
      for (const name of ['home', 'x-mark', 'logout', 'mail']) render({ name, ariaLabel: name });
      expect(factory.names.filter((n) => !n.startsWith('angular'))).toEqual(['lc-icon']);
      expect(parse.mock.calls.length).toBeGreaterThan(0);
      for (const [input] of parse.mock.calls) expect(input).toBeInstanceOf(FakeTrustedHTML);
      const logged = [...warnSpy.mock.calls, ...errorSpy.mock.calls].map((args) => args.map(String).join(' '));
      expect(logged.filter((m) => /trusted.?types|content.security.policy|\bCSP\b/i.test(m))).toEqual([]);
    });

    it('drops a non-kit string registered as a glyph: the builder rejects it, the placeholder shows, createHTML throws', () => {
      registerOnly(CRAFTED);
      const factory = installTrustedTypes();
      const parse = jest.spyOn(DOMParser.prototype, 'parseFromString');
      const fixture = render({ name: 'home', ariaLabel: 'Start' });
      const [svg] = svgsOf(fixture);
      expect(svgsOf(fixture)).toHaveLength(1);
      expect(Array.from(svg.children).map((c) => c.tagName)).toEqual(['rect', 'text']);
      expect(svg.getAttribute('aria-label')).toBe('Start');
      expect(svg.hasAttribute('onload')).toBe(false);
      expect((window as unknown as { __pwned?: unknown }).__pwned).toBeUndefined();
      expect(() => factory.calls[0].rules.createHTML(CRAFTED.svg)).toThrow(TypeError);
      expect(parse.mock.calls.map(([input]) => String(input))).not.toContain(CRAFTED.svg);
    });

    it('drops it without Trusted Types as well: no parser ever sees it', () => {
      registerOnly(CRAFTED);
      const parse = jest.spyOn(DOMParser.prototype, 'parseFromString');
      const fixture = render({ name: 'home' });
      const [svg] = svgsOf(fixture);
      expect(Array.from(svg.children).map((c) => c.tagName)).toEqual(['rect', 'text']);
      expect(parse.mock.calls.map(([input]) => String(input))).not.toContain(CRAFTED.svg);
    });

    it('rejects every string nobody registered, even a kit glyph of another scope', () => {
      registerOnly({ name: 'home', variant: 'outline', svg: BUNDLED_ICONS[0].svg });
      const factory = installTrustedTypes();
      render({ name: 'home' });
      const rules = factory.calls[0].rules;
      expect(rules.createHTML(BUNDLED_ICONS[0].svg)).toBe(BUNDLED_ICONS[0].svg);
      expect(() => rules.createHTML(BUNDLED_ICONS[1].svg)).toThrow(TypeError);
      expect(() => rules.createHTML(readFileSync(TABLER('outline/anchor.svg'), 'utf-8'))).toThrow(TypeError);
    });
  });

  describe('on the server', () => {
    beforeEach(() => {
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        imports: [IconComponent],
        providers: [
          provideHttpClient(withXhr()),
          provideHttpClientTesting(),
          { provide: PLATFORM_ID, useValue: 'server' },
          provideLcIcons(BUNDLED_ICONS),
        ],
      });
      httpMock = TestBed.inject(HttpTestingController);
    });

    it('builds bundled icons through the allow-list builder, decorated, without a parser or a policy', () => {
      const factory = installTrustedTypes();
      const parse = jest.spyOn(DOMParser.prototype, 'parseFromString');
      const fixture = render({ name: 'home', ariaLabel: 'Start' });
      const container = (fixture.nativeElement as HTMLElement).querySelector('.icon-container') as HTMLElement;
      expect(container.innerHTML).toBe(ICON_DOM_341[0].svg.replace('role="img"', 'role="img" aria-label="Start"'));
      expect(parse).not.toHaveBeenCalled();
      expect(factory.calls).toHaveLength(0);
    });

    it('renders nothing for a fetched name and sends no request', () => {
      const fixture = render({ name: 'anchor' });
      httpMock.expectNone(() => true);
      expect(svgsOf(fixture)).toHaveLength(0);
    });
  });
});

function TABLER(file: string): string {
  return resolve(__dirname, '../../../../../node_modules/@tabler/icons/icons', file);
}
