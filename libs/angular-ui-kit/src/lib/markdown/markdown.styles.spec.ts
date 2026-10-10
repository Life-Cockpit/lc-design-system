import { compile } from 'sass';
import { resolve } from 'path';

/**
 * Stylesheet contract of lc-markdown prose (G-8). jsdom applies no
 * stylesheets, so the rules are read from the compiled CSS.
 */
const css = compile(resolve(__dirname, 'markdown.component.scss')).css;

function rule(selector: string): string {
  const start = css.indexOf(`${selector} {`);
  expect(start).toBeGreaterThan(-1);
  return css.slice(start, css.indexOf('}', start));
}

describe('lc-markdown prose styles (G-8)', () => {
  it('underlines links by default (color alone fails WCAG 1.4.1), with an opt-out hook', () => {
    const link = rule('.lc-markdown a');
    expect(link).toMatch(/text-decoration:\s*var\(--lc-markdown-link-decoration, underline\)/);
    expect(link).not.toMatch(/text-decoration:\s*none/);
  });

  it('colors links with the theme-aware link token, not the inverting primary scale', () => {
    const link = rule('.lc-markdown a');
    expect(link).toMatch(/color:\s*var\(--lc-markdown-link-color, var\(--color-link/);
    expect(link).not.toMatch(/--color-primary-600/);
    expect(rule('.lc-markdown a:hover')).toMatch(/var\(--color-link-hover/);
  });

  it('hyphenates prose and breaks unbreakable strings instead of overflowing', () => {
    const root = rule('.lc-markdown');
    expect(root).toMatch(/hyphens:\s*var\(--lc-markdown-hyphens, auto\)/);
    expect(root).toMatch(/overflow-wrap:\s*var\(--lc-markdown-overflow-wrap, anywhere\)/);
  });

  it('never hyphenates code', () => {
    expect(rule('.lc-markdown code')).toMatch(/hyphens:\s*none/);
    expect(rule('.lc-markdown pre')).toMatch(/hyphens:\s*none/);
    expect(rule('.lc-markdown lc-code-block')).toMatch(/hyphens:\s*none/);
  });

  it('keeps table columns from collapsing (no hyphenation, no break-anywhere)', () => {
    const wrap = rule('.lc-markdown__table-wrap');
    expect(wrap).toMatch(/hyphens:\s*manual/);
    expect(wrap).toMatch(/overflow-wrap:\s*break-word/);
  });

  it('keeps heading anchors out of the link styling', () => {
    // Must outrank `.lc-markdown a` (0,1,1): nested under the root it is (0,2,0).
    const anchor = rule('.lc-markdown .lc-markdown__anchor');
    expect(anchor).toMatch(/text-decoration:\s*none/);
  });
});
