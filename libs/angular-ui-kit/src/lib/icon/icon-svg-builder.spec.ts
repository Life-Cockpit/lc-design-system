import { readFileSync, readdirSync } from 'fs';
import { join, resolve } from 'path';
import { MAX_SVG_LENGTH, SVG_NS, SVG_REJECTION, buildSvg, looksLikeSvgDocument } from './icon-svg-builder';

/**
 * The allow-list builder for fetched icons (3.5, AS-14, AC-12 of request 001;
 * the rules are design 001 §4). It never parses: it creates nodes one by one,
 * so nothing it accepts or rejects can run a script.
 */
const TABLER = resolve(__dirname, '../../../../../node_modules/@tabler/icons/icons');
const svg = (body: string, attrs = '') => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"${attrs}>${body}</svg>`;
const build = (text: string) => buildSvg(document, text);

describe('buildSvg (allow-list builder)', () => {
  describe('accepts', () => {
    it('every Tabler icon (outline and filled) with its paths and attributes', () => {
      let count = 0;
      for (const variant of ['outline', 'filled']) {
        for (const file of readdirSync(join(TABLER, variant)).filter((f) => f.endsWith('.svg'))) {
          const text = readFileSync(join(TABLER, variant, file), 'utf-8');
          const result = build(text);
          if (!result.svg) throw new Error(`${variant}/${file}: ${result.reason}`);
          count++;
        }
      }
      expect(count).toBeGreaterThan(6000);
    });

    it('anchor.svg as three paths with its geometry and paint', () => {
      const result = build(readFileSync(join(TABLER, 'outline/anchor.svg'), 'utf-8'));
      const el = result.svg as SVGElement;
      expect(el.namespaceURI).toBe(SVG_NS);
      expect(el.getAttribute('viewBox')).toBe('0 0 24 24');
      expect(el.getAttribute('stroke-linecap')).toBe('round');
      expect(el.getAttribute('class')).toContain('icon-tabler-anchor');
      expect(Array.from(el.children).map((c) => [c.tagName, c.namespaceURI])).toEqual([
        ['path', SVG_NS],
        ['path', SVG_NS],
        ['path', SVG_NS],
      ]);
    });

    it('every allowed element', () => {
      const body =
        '<g transform="translate(1 1)"><path d="M0 0"/><circle cx="1" cy="1" r="1"/><ellipse rx="1" ry="2"/>' +
        '<line x1="0" y1="0" x2="1" y2="1"/><polyline points="0 0 1 1"/><polygon points="0 0 1 1 2 0"/>' +
        '<rect width="1" height="1"/><text x="1" y="2">A</text></g>';
      const el = build(svg(body)).svg as SVGElement;
      expect(Array.from(el.querySelectorAll('*')).map((c) => c.tagName)).toEqual([
        'g', 'path', 'circle', 'ellipse', 'line', 'polyline', 'polygon', 'rect', 'text',
      ]);
    });

    it('a BOM, an XML declaration, comments and whitespace around the root', () => {
      const text = `\uFEFF<?xml version="1.0" encoding="UTF-8"?>\n<!-- Tabler -->\n${svg('<!-- inner --><path d="M0 0"/>')}\n<!-- end -->\n`;
      const el = build(text).svg as SVGElement;
      expect(el.querySelectorAll('path')).toHaveLength(1);
      expect(el.childNodes).toHaveLength(1); // comments are not kept
    });

    it('text inside <text> as a text node, with entities decoded', () => {
      const el = build(svg('<text x="1">&lt;b&gt; &amp; &#65;&#x42; &quot;&apos;</text>')).svg as SVGElement;
      const text = el.querySelector('text') as SVGElement;
      expect(text.textContent).toBe('<b> & AB "\'');
      expect(text.children).toHaveLength(0);
    });

    it('single-quoted values, whitespace around `=`, and line breaks in values', () => {
      const el = build(`<svg xmlns='http://www.w3.org/2000/svg' viewBox = '0 0\n24 24'><path d='M0 0'/></svg>`).svg as SVGElement;
      expect(el.getAttribute('viewBox')).toBe('0 0 24 24');
    });
  });

  describe('drops silently', () => {
    it.each([
      'style="fill:red"', 'id="a"', 'data-icon="x"', 'aria-label="x"', 'role="img"', 'focusable="false"',
      'version="1.1"', 'xmlns:xlink="http://www.w3.org/1999/xlink"', 'xml:space="preserve"', 'VIEWBOX="0 0 1 1"',
    ])('the attribute %s', (attr) => {
      const el = build(svg('<path d="M0 0"/>', ` ${attr}`)).svg as SVGElement;
      expect(el).toBeDefined();
      expect(el.getAttribute(attr.split('=')[0])).toBeNull();
      expect(el.getAttribute('viewBox')).toBe('0 0 24 24');
    });

    it('xmlns below the root', () => {
      const el = build(svg('<path xmlns="http://www.w3.org/2000/svg" d="M0 0"/>')).svg as SVGElement;
      expect((el.firstElementChild as Element).attributes).toHaveLength(1);
    });
  });

  describe('rejects the icon', () => {
    it.each([
      ['<script>', svg('<script>alert(1)</script>'), SVG_REJECTION.element('script')],
      ['<foreignObject>', svg('<foreignObject><div/></foreignObject>'), SVG_REJECTION.element('foreignObject')],
      ['<style>', svg('<style>*{}</style>'), SVG_REJECTION.element('style')],
      ['<a>', svg('<a><path d="M0 0"/></a>'), SVG_REJECTION.element('a')],
      ['<use>', svg('<use href="#a"/>'), SVG_REJECTION.element('use')],
      ['<image>', svg('<image/>'), SVG_REJECTION.element('image')],
      ['<defs>', svg('<defs/>'), SVG_REJECTION.element('defs')],
      ['<animate>', svg('<animate attributeName="x"/>'), SVG_REJECTION.element('animate')],
      ['<set>', svg('<set attributeName="x"/>'), SVG_REJECTION.element('set')],
      ['<filter>', svg('<filter/>'), SVG_REJECTION.element('filter')],
      ['a prefixed element', svg('<x:path d="M0 0"/>'), SVG_REJECTION.element('x:path')],
      ['a nested <svg>', svg('<svg/>'), SVG_REJECTION.element('svg')],
      ['a root other than <svg>', '<html><body/></html>', SVG_REJECTION.element('html')],
      ['onload on the root', svg('', ' onload="window.__pwned=1"'), SVG_REJECTION.attribute('onload')],
      ['an event handler in any case', svg('<path ONCLICK="x" d="M0 0"/>'), SVG_REJECTION.attribute('ONCLICK')],
      ['href', svg('<path href="#a" d="M0 0"/>'), SVG_REJECTION.reference('#a')],
      ['xlink:href', svg('<path xlink:href="https://x.test/a" d="M0 0"/>'), SVG_REJECTION.reference('https://x.test/a')],
      ['url(…) in a value', svg('<path fill="url(#g)" d="M0 0"/>'), SVG_REJECTION.reference('url(#g)')],
      ['javascript: in a value', svg('<path class="javascript:alert(1)" d="M0 0"/>'), SVG_REJECTION.reference('javascript:alert(1)')],
      ['a DOCTYPE', `<!DOCTYPE svg>${svg('')}`, SVG_REJECTION.doctype],
      ['an ENTITY declaration', `<!ENTITY x "y">${svg('')}`, SVG_REJECTION.doctype],
      ['CDATA', svg('<text><![CDATA[x]]></text>'), SVG_REJECTION.malformed],
      ['a processing instruction after the start', svg('<?php x ?>'), SVG_REJECTION.malformed],
      ['an unclosed tag', '<svg xmlns="http://www.w3.org/2000/svg"><path d="M0 0">', SVG_REJECTION.malformed],
      ['unbalanced tags', svg('<g><path d="M0 0"/></rect></g>'), SVG_REJECTION.malformed],
      ['an unquoted value', '<svg viewBox=0><path d="M0 0"/></svg>', SVG_REJECTION.malformed],
      ['a duplicate attribute', svg('<path d="M0 0" d="M1 1"/>'), SVG_REJECTION.malformed],
      ['< inside a value', svg('<path d="M0 0<"/>'), SVG_REJECTION.malformed],
      ['an unknown entity', svg('<text>&nbsp;</text>'), SVG_REJECTION.malformed],
      ['a bare ampersand', svg('<text>a & b</text>'), SVG_REJECTION.malformed],
      ['text outside <text>', svg('hello'), SVG_REJECTION.malformed],
      ['another namespace', '<svg xmlns="http://www.w3.org/1999/xhtml"/>', SVG_REJECTION.malformed],
      ['content after the root', `${svg('')}<svg/>`, SVG_REJECTION.malformed],
      ['nesting deeper than 16', svg(`${'<g>'.repeat(16)}${'</g>'.repeat(16)}`), SVG_REJECTION.malformed],
    ])('for %s', (_label, text, reason) => {
      expect(build(text)).toEqual({ reason });
    });

    it(`above ${MAX_SVG_LENGTH} characters`, () => {
      const text = svg(`<path d="M${'0 '.repeat(MAX_SVG_LENGTH / 2)}"/>`);
      expect(build(text)).toEqual({ reason: SVG_REJECTION.tooLarge });
    });

    it('accepts nesting of exactly 16', () => {
      expect(build(svg(`${'<g>'.repeat(15)}${'</g>'.repeat(15)}`)).svg).toBeDefined();
    });
  });

  describe('looksLikeSvgDocument (which console message)', () => {
    it('tells an SVG from an HTML page', () => {
      expect(looksLikeSvgDocument(readFileSync(join(TABLER, 'outline/anchor.svg'), 'utf-8'))).toBe(true);
      expect(looksLikeSvgDocument(`<?xml version="1.0"?><!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "x.dtd">${svg('')}`)).toBe(true);
      expect(looksLikeSvgDocument('<!doctype html><html><body><app-root></app-root></body></html>')).toBe(false);
      expect(looksLikeSvgDocument('Not Found')).toBe(false);
    });
  });
});
