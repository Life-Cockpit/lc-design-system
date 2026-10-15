import { compile } from 'sass';
import { resolve } from 'path';

/** The horizon block (3.3, LK-1), read from the compiled CSS. */
const css = '\n' + compile(resolve(__dirname, '_horizon.scss')).css;

function block(prefix: string): string {
  const start = css.indexOf(prefix);
  expect(start).toBeGreaterThan(-1);
  return css.slice(start, css.indexOf('}', start));
}

describe('.lc-horizon (LK-1)', () => {
  const base = block('\n.lc-horizon {');

  it('is pure CSS: gradients only, no image file', () => {
    expect(base).not.toMatch(/url\(/);
    expect(base).toMatch(/linear-gradient/);
    expect(base).toMatch(/radial-gradient/);
  });

  it('draws every layer from the theme tokens, so dark mode is the night horizon', () => {
    for (const token of [
      '--color-horizon-line',
      '--color-sun-1',
      '--color-sun-2',
      '--color-sun-3',
      '--color-sun-ring',
      '--color-sun-halo',
      '--color-land-1',
      '--color-land-2',
      '--color-land-3',
      '--color-background-low',
    ]) {
      expect(base).toContain(`var(${token})`);
    }
    expect(base).not.toMatch(/#[0-9a-f]{3,6}\b/i);
  });

  it('anchors the land to the bottom edge and the sun to the horizon line', () => {
    expect(base).toMatch(/0 100%\s*\/\s*100% var\(--_lc-horizon-land\)/);
    expect(base).toMatch(/at var\(--_lc-horizon-x\) 100%/);
    expect(base).toMatch(/100% calc\(100% - var\(--_lc-horizon-land\)\)/);
  });

  it('takes the inputs from custom properties with Today’s phone geometry as default', () => {
    expect(base).toMatch(/--_lc-horizon-land:\s*var\(--lc-horizon-land, 112px\)/);
    expect(base).toMatch(/--_lc-horizon-r:\s*var\(--lc-horizon-sun-radius, 58px\)/);
    expect(base).toMatch(/--_lc-horizon-x:\s*var\(--lc-horizon-sun-x, 72%\)/);
  });

  it.each([
    [1024, '100px', '70px'],
    [1280, '120px', '90px'],
    [1440, '140px', '120px'],
    [1920, '184px', '166px'],
  ])('uses Today’s desktop geometry from %s px', (width, land, radius) => {
    const step = block(`@media (min-width: ${width}px) {\n  .lc-horizon {`);
    expect(step).toContain(`var(--lc-horizon-land, ${land})`);
    expect(step).toContain(`var(--lc-horizon-sun-radius, ${radius})`);
  });

  it('is the last block of a flex column: grows, never shrinks below land + sun + 22 px', () => {
    expect(base).toMatch(/flex:\s*1 0 auto/);
    expect(base).toMatch(/min-height:\s*calc\(var\(--_lc-horizon-land\) \+ var\(--_lc-horizon-r\) \+ 22px\)/);
  });

  it('drops the decoration in forced-colour modes', () => {
    expect(block('@media (forced-colors: active)')).toMatch(/background:\s*none/);
  });

  it('pins content on the land to the bottom edge', () => {
    const land = block('\n.lc-horizon__land {');
    expect(land).toMatch(/position:\s*absolute/);
    expect(land).toMatch(/inset:\s*auto 0 0/);
  });
});
