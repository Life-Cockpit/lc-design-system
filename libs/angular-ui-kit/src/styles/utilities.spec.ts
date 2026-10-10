import { compile } from 'sass';
import { resolve } from 'path';

/** jsdom applies no stylesheets, so the utility contract is read from the compiled CSS. */
const css = compile(resolve(__dirname, '_utilities.scss')).css;

function rule(selector: string): string {
  const start = css.indexOf(`${selector} {`);
  expect(start).toBeGreaterThan(-1);
  return css.slice(start, css.indexOf('}', start));
}

describe('Accessibility utilities', () => {
  describe('.skip-to-content (G-15)', () => {
    const base = rule('.skip-to-content');
    const focused = rule('.skip-to-content:focus');

    it('uses the primary fill with its ink (6.21:1 in both palettes)', () => {
      expect(base).toMatch(/background-color:\s*var\(--color-primary-fill/);
      expect(base).toMatch(/color:\s*var\(--color-on-primary/);
      expect(base).not.toMatch(/--color-primary-500/);
    });

    it('is at least 44 px high', () => {
      expect(base).toMatch(/min-height:\s*var\(--size-min-touch-height, 2\.75rem\)/);
    });

    it('stays focusable while hidden and appears on focus', () => {
      expect(base).toMatch(/transform:\s*translateY\(-100%\)/);
      expect(base).not.toMatch(/display:\s*none|visibility:\s*hidden/);
      expect(focused).toMatch(/transform:\s*none/);
      expect(focused).toMatch(/outline:\s*2px solid/);
    });

    it('layers above the sticky lc-header (z-index 1000)', () => {
      const z = Number(base.match(/z-index:\s*(\d+)/)?.[1]);
      expect(z).toBeGreaterThan(1000);
    });
  });

  it('.sr-only hides content visually without removing it from the accessibility tree', () => {
    const srOnly = rule('.sr-only');
    expect(srOnly).toMatch(/position:\s*absolute/);
    expect(srOnly).toMatch(/clip:\s*rect\(0, 0, 0, 0\)/);
    expect(srOnly).not.toMatch(/display:\s*none|visibility:\s*hidden/);
  });
});
