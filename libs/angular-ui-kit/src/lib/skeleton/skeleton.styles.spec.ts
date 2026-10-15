import { compile } from 'sass';
import { resolve } from 'path';

/**
 * Stylesheet contract of lc-skeleton. jsdom applies no stylesheets, so the
 * rules are read from the compiled CSS.
 */
const css = compile(resolve(__dirname, 'skeleton.component.scss')).css;

function reducedMotionBlock(): string {
  const start = css.indexOf('@media (prefers-reduced-motion: reduce)');
  expect(start).toBeGreaterThan(-1);
  return css.slice(start, css.indexOf('}\n}', start) + 3);
}

describe('lc-skeleton styles', () => {
  it('shimmers between the skeleton fill and its highlight, both themable', () => {
    const base = css.slice(css.indexOf('.lc-skeleton {'), css.indexOf('}', css.indexOf('.lc-skeleton {')));
    expect(base).toMatch(/var\(--lc-skeleton-bg, var\(--color-skeleton/);
    expect(base).toMatch(/var\(--lc-skeleton-highlight, var\(--color-skeleton-highlight/);
    expect(base).toMatch(/animation:\s*lc-skeleton-shimmer/);
  });

  // AS-7 (WCAG 2.3.3): the shimmer runs forever; under reduced motion the
  // placeholder is a static fill.
  it('stops the shimmer and shows a static fill under prefers-reduced-motion', () => {
    const block = reducedMotionBlock();
    expect(block).toMatch(/\.lc-skeleton\s*\{/);
    expect(block).toMatch(/animation:\s*none/);
    expect(block).toMatch(/background:\s*var\(--lc-skeleton-bg, var\(--color-skeleton/);
  });
});
