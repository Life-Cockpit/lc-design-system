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
});
