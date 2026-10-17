import { compile } from 'sass';
import { resolve } from 'path';

/**
 * Stylesheet contract of lc-button and a[lcButton] (one shared stylesheet).
 * jsdom applies no stylesheets, so the rules are read from the compiled CSS.
 */
const css = '\n' + compile(resolve(__dirname, 'button.component.scss')).css;

/** The declarations of the rule whose selector list is exactly `selector`. */
function rule(selector: string): string {
  const start = css.indexOf(`\n${selector} {`);
  expect(start).toBeGreaterThan(-1);
  return css.slice(start, css.indexOf('}', start));
}

describe('lc-button styles', () => {
  // SI-7 (WCAG 1.4.4, 1.4.10): a nowrap label wider than the viewport overflows
  // at 320 px or 200 % text. Every button wraps, as a[lcButton] already did.
  describe('labels wrap (SI-7)', () => {
    it('lets <button> labels wrap and centres the lines', () => {
      const base = rule('.btn');
      expect(base).toMatch(/white-space:\s*normal/);
      expect(base).not.toMatch(/white-space:\s*nowrap/);
      expect(base).toMatch(/text-align:\s*center/);
    });

    it('breaks a single word that is wider than the button instead of overflowing', () => {
      expect(rule('.btn')).toMatch(/overflow-wrap:\s*break-word/);
    });

    it('nothing re-enables nowrap for a button or a link variant', () => {
      expect(css).not.toMatch(/white-space:\s*nowrap/);
    });

    it('the inline variant keeps flowing with the surrounding text', () => {
      const inline = rule('.btn-inline');
      expect(inline).toMatch(/white-space:\s*normal/);
      expect(inline).toMatch(/text-align:\s*inherit/);
    });
  });

  // AS-19 (WCAG 1.4.1, axe link-in-text-block): the inline link carries a
  // non-colour cue at rest, through a documented hook (AC-13 to AC-15, request 002).
  describe('inline link underline (AS-19)', () => {
    it('underlines .btn.btn-inline at rest through --lc-btn-inline-text-decoration (default underline)', () => {
      const inline = rule('.btn.btn-inline');
      expect(inline).toMatch(/text-decoration:\s*var\(--lc-btn-inline-text-decoration,\s*underline\)/);
      expect(inline).toMatch(/text-decoration-thickness:\s*max\(1px,\s*0\.0625em\)/);
      expect(inline).toMatch(/text-underline-offset:\s*0\.15em/);
    });

    it('outranks the a.btn reset (no underline on button links) by specificity', () => {
      // a.btn is (0,1,1); .btn.btn-inline is (0,2,0).
      expect(rule('a.btn')).toMatch(/text-decoration:\s*none/);
      expect(css.indexOf('\n.btn.btn-inline {')).toBeGreaterThan(-1);
    });

    it('keeps the line on hover, thicker, without animating it', () => {
      expect(rule('.btn.btn-inline:hover:not(:disabled)')).toMatch(/text-decoration-thickness:\s*max\(2px,\s*0\.125em\)/);
      const transition = rule('.btn.btn-inline').match(/transition-property:\s*([^;]+);/)?.[1] ?? '';
      expect(transition.split(',').map((p) => p.trim())).toEqual(['color', 'background-color', 'border-color', 'box-shadow']);
    });

    it('no rule removes the line from the inline variant (focus, disabled and forced colours keep it)', () => {
      const removing = [...css.matchAll(/\n([^{}\n]*btn-inline[^{}\n]*)\{([^}]*)\}/g)]
        .filter(([, , body]) => /text-decoration(-line)?:\s*none/.test(body))
        .map(([, selector]) => selector.trim());
      expect(removing).toEqual([]);
    });
  });
});
