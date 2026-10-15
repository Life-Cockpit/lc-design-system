import { readFileSync } from 'fs';
import { resolve } from 'path';
import { compile } from 'sass';

/**
 * HS-5: every badge variant's ink reaches 4.5:1 on its own fill, in both
 * palettes, on the page and on a card. Measured on the compiled theme files and
 * the badge stylesheet (the real values, not copies): the fill is the variant's
 * `--lc-badge-bg` composited over the surface (dark fills are translucent), the
 * ink its `--lc-badge-fg`.
 */

type Tokens = Record<string, string>;
type Rgb = [number, number, number];

const STYLES = resolve(__dirname, '../../styles');

function themeTokens(file: string): Tokens {
  const css = compile(resolve(STYLES, file)).css;
  const tokens: Tokens = {};
  // The first declaration wins: the base palette, not a later scoped override.
  for (const match of css.matchAll(/(--[\w-]+):\s*([^;]+);/g)) {
    if (!(match[1] in tokens)) tokens[match[1]] = match[2].trim();
  }
  return tokens;
}

function value(tokens: Tokens, raw: string, depth = 0): string {
  const ref = raw.match(/^var\((--[\w-]+)(?:,\s*(.+))?\)$/);
  if (!ref) return raw;
  if (depth > 10) throw new Error(`${raw} does not resolve`);
  const next = tokens[ref[1]] ?? ref[2];
  if (next === undefined) throw new Error(`${ref[1]} is not defined`);
  return value(tokens, next, depth + 1);
}

function rgba(color: string): [Rgb, number] {
  const hex = color.match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i);
  if (hex) {
    let h = hex[1];
    if (h.length === 3) h = [...h].map((c) => c + c).join('');
    return [[0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16)) as Rgb, 1];
  }
  const fn = color.match(/^rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)\s*(?:,\s*([\d.]+)\s*)?\)$/i);
  if (fn) return [[+fn[1], +fn[2], +fn[3]], fn[4] === undefined ? 1 : +fn[4]];
  throw new Error(`not a colour: ${color}`);
}

function over(top: string, bottom: Rgb): Rgb {
  const [rgb, alpha] = rgba(top);
  return rgb.map((c, i) => c * alpha + bottom[i] * (1 - alpha)) as Rgb;
}

function luminance(rgb: Rgb): number {
  const [r, g, b] = rgb.map((c) => {
    const v = c / 255;
    return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function ratio(a: Rgb, b: Rgb): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

/** `--lc-badge-bg` / `--lc-badge-fg` per variant, read from the badge stylesheet. */
function badgeHooks(): Record<string, { bg: string; fg: string }> {
  const scss = readFileSync(resolve(__dirname, 'badge.component.scss'), 'utf-8');
  const hooks: Record<string, { bg: string; fg: string }> = {};
  for (const match of scss.matchAll(/&--(\w+)\s*\{([^}]*)\}/g)) {
    const bg = match[2].match(/--lc-badge-bg:\s*([^;]+);/)?.[1];
    const fg = match[2].match(/--lc-badge-fg:\s*([^;]+);/)?.[1];
    if (bg && fg) hooks[match[1]] = { bg: bg.trim(), fg: fg.trim() };
  }
  return hooks;
}

const hooks = badgeHooks();
const variants = Object.keys(hooks);
const palettes: [string, Tokens][] = [
  ['light', themeTokens('_theme-light.scss')],
  ['dark', themeTokens('_theme-dark.scss')],
];
const surfaces = ['--color-background', '--color-surface'];

describe('Badge contrast (HS-5, WCAG 2.2 AA 1.4.3)', () => {
  it('reads all six variants from the stylesheet', () => {
    expect(variants.sort()).toEqual(['default', 'error', 'info', 'primary', 'success', 'warning']);
  });

  it('takes the ink of the tinted variants from --color-on-*-subtle', () => {
    for (const variant of ['primary', 'success', 'warning', 'error', 'info']) {
      expect(hooks[variant].fg).toBe(`var(--color-on-${variant}-subtle)`);
    }
  });

  describe.each(palettes)('%s palette', (_name, tokens) => {
    describe.each(surfaces)('on %s', (surface) => {
      it.each(variants)('%s badge ink reaches 4.5:1 on its fill', (variant) => {
        const page = over(value(tokens, `var(${surface})`), [255, 255, 255]);
        const fill = over(value(tokens, hooks[variant].bg), page);
        const ink = over(value(tokens, hooks[variant].fg), fill);
        expect(ratio(ink, fill)).toBeGreaterThanOrEqual(4.5);
      });
    });
  });
});
