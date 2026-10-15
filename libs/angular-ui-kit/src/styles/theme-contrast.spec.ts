import { compile } from 'sass';
import { resolve } from 'path';

/**
 * Contrast contract of the semantic color tokens, measured on the compiled
 * theme files (the real values, not copies of them). WCAG 2.2 AA asks 4.5:1
 * for text below 18.66 px bold / 24 px regular.
 */

type Tokens = Record<string, string>;

function themeTokens(file: string): Tokens {
  const css = compile(resolve(__dirname, file)).css;
  const tokens: Tokens = {};
  for (const match of css.matchAll(/(--[\w-]+):\s*([^;]+);/g)) {
    tokens[match[1]] = match[2].trim();
  }
  return tokens;
}

type Rgba = [number, number, number, number];

/** A token's color: hex or rgba(), following var() references. */
function color(tokens: Tokens, name: string, depth = 0): Rgba {
  const value = tokens[name];
  if (value === undefined) throw new Error(`${name} is not defined`);
  const ref = value.match(/^var\((--[\w-]+)(?:,\s*(.+))?\)$/);
  if (ref) {
    if (depth > 10) throw new Error(`${name} does not resolve`);
    return tokens[ref[1]] !== undefined ? color(tokens, ref[1], depth + 1) : parse(ref[2]);
  }
  return parse(value);
}

function parse(value: string): Rgba {
  const rgba = value.match(/^rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)\s*(?:,\s*([\d.]+)\s*)?\)$/);
  if (rgba) return [Number(rgba[1]), Number(rgba[2]), Number(rgba[3]), rgba[4] === undefined ? 1 : Number(rgba[4])];
  if (!/^#[0-9a-f]{3}([0-9a-f]{3})?$/i.test(value)) throw new Error(`not a color: ${value}`);
  let h = value.slice(1);
  if (h.length === 3) h = [...h].map((c) => c + c).join('');
  return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16)).concat(1) as Rgba;
}

/** A translucent color composited over an opaque one. */
function over(top: Rgba, base: Rgba): Rgba {
  const a = top[3];
  return [0, 1, 2].map((i) => top[i] * a + base[i] * (1 - a)).concat(1) as Rgba;
}

function hex(tokens: Tokens, name: string): string {
  const value = color(tokens, name);
  if (value[3] !== 1) throw new Error(`${name} is translucent; composite it first`);
  return '#' + value.slice(0, 3).map((v) => Math.round(v).toString(16).padStart(2, '0')).join('');
}

function luminance(color: string | Rgba): number {
  const rgb = typeof color === 'string' ? parse(color) : color;
  const [r, g, b] = rgb.slice(0, 3).map((c) => {
    const v = c / 255;
    return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function ratio(a: string | Rgba, b: string | Rgba): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

const palettes: [string, Tokens][] = [
  ['light', themeTokens('_theme-light.scss')],
  ['dark', themeTokens('_theme-dark.scss')],
];

const surfaces = ['--color-background', '--color-surface', '--color-surface-2', '--color-surface-sunken'];

// The "Weite" ground (3.3, LK-11): every surface text may sit on in the app
// look - the sky, the sky at the horizon, the soft card fills, the muted tile,
// the land and the selected pill. Translucent ones composite over the page.
const weiteSurfaces = [
  '--color-background',
  '--color-background-low',
  '--color-surface',
  '--color-next-step-soft-neutral',
  '--color-next-step-soft-primary',
  '--color-next-step-soft-success',
  '--color-next-step-soft-warning',
  '--color-muted-tile',
  '--color-land-1',
  '--color-land-2',
  '--color-land-3',
  '--color-surface-selected',
];

const tones = ['primary', 'success', 'warning', 'error', 'info'];
const members = [1, 2, 3, 4, 5, 6].map((n) => `--color-member-${n}`);

describe('Theme contrast (WCAG 2.2 AA)', () => {
  describe.each(palettes)('%s palette', (_palette, tokens) => {
    const contrast = (fg: string, bg: string) => ratio(hex(tokens, fg), hex(tokens, bg));
    /** fg on bg, where bg may be translucent: composited over `base` first. */
    const on = (fg: string, bg: string, base = '--color-background') =>
      ratio(color(tokens, fg), over(color(tokens, bg), color(tokens, base)));

    it.each(surfaces)('--color-link reaches 4.5:1 on %s', (bg) => {
      expect(contrast('--color-link', bg)).toBeGreaterThanOrEqual(4.5);
    });

    it.each(surfaces)('--color-link-hover reaches 4.5:1 on %s', (bg) => {
      expect(contrast('--color-link-hover', bg)).toBeGreaterThanOrEqual(4.5);
    });

    // Footer links and copyright, header navigation links.
    it.each(surfaces)('--color-text-secondary reaches 4.5:1 on %s', (bg) => {
      expect(contrast('--color-text-secondary', bg)).toBeGreaterThanOrEqual(4.5);
    });

    // The focused .skip-to-content utility.
    it('--color-on-primary reaches 4.5:1 on --color-primary-fill', () => {
      expect(contrast('--color-on-primary', '--color-primary-fill')).toBeGreaterThanOrEqual(4.5);
    });

    describe('"Weite" ground (LK-11)', () => {
      const inks = ['--color-text-primary', '--color-text-secondary', '--color-text-tertiary', '--color-link'];
      const pairs = inks.flatMap((ink) => weiteSurfaces.map((bg) => [ink, bg]));

      it.each(pairs)('%s reaches 4.5:1 on %s', (ink, bg) => {
        expect(on(ink, bg)).toBeGreaterThanOrEqual(4.5);
      });

      it.each(['--color-background', '--color-background-low', '--color-next-step-soft-neutral', '--color-next-step-soft-primary'])(
        '--color-overline reaches 4.5:1 on %s',
        (bg) => {
          expect(on('--color-overline', bg)).toBeGreaterThanOrEqual(4.5);
        },
      );

      it.each(['--color-background', '--color-surface'])(
        '--color-on-surface-selected reaches 4.5:1 on --color-surface-selected over %s',
        (base) => {
          expect(on('--color-on-surface-selected', '--color-surface-selected', base)).toBeGreaterThanOrEqual(4.5);
        },
      );

      // Non-text contrast (1.4.11) for the icons; they carry no meaning alone.
      it('the soft card bubble icon reaches 3:1 on the bubble', () => {
        expect(on('--color-bubble-icon', '--color-bubble')).toBeGreaterThanOrEqual(3);
      });

      it('the muted tile icon reaches 3:1 on the tile', () => {
        expect(on('--color-muted-tile-icon', '--color-muted-tile')).toBeGreaterThanOrEqual(3);
      });
    });

    // LK-7: white initials on every member colour.
    it.each(members)('--color-on-member reaches 4.5:1 on %s', (bg) => {
      expect(contrast('--color-on-member', bg)).toBeGreaterThanOrEqual(4.5);
    });

    // SI-8: a form field's boundary is a user-interface component (1.4.11).
    it.each(surfaces)('--color-field-border reaches 3:1 on %s', (bg) => {
      expect(contrast('--color-field-border', bg)).toBeGreaterThanOrEqual(3);
    });

    // HS-5: badge and alert ink on its tint, wherever the tint sits.
    const tintPairs = tones.flatMap((tone) => surfaces.map((base) => [tone, base]));
    it.each(tintPairs)('--color-on-%s-subtle reaches 4.5:1 on its tint over %s', (tone, base) => {
      expect(on(`--color-on-${tone}-subtle`, `--color-${tone}-subtle`, base)).toBeGreaterThanOrEqual(4.5);
    });
  });

  // Why the light tertiary ink moved (LK-11): the 3.2 value #6b7280 fails on
  // the tinted "Weite" surfaces, the new one passes (asserted above).
  it('the 3.2 tertiary ink #6b7280 stays below 4.5:1 on the light soft fills', () => {
    const light = palettes[0][1];
    expect(hex(light, '--color-text-tertiary')).not.toBe('#6b7280');
    for (const bg of ['--color-next-step-soft-primary', '--color-land-1', '--color-surface-selected']) {
      expect(ratio('#6b7280', hex(light, bg))).toBeLessThan(4.5);
    }
  });

  // Why the light warning and dark success ink moved (HS-5).
  it('the 3.2 badge inks stay below 4.5:1 on their tints', () => {
    const [light, dark] = [palettes[0][1], palettes[1][1]];
    expect(ratio('#9b6b2b', hex(light, '--color-warning-subtle'))).toBeLessThan(4.5);
    // Measured on the 3.2 dark card #14222e (3.3 cards are #101c26; #14222e is
    // now the floating bar's surface).
    const darkCard = over(color(dark, '--color-success-subtle'), parse('#14222e'));
    expect(ratio('#8ea475', darkCard)).toBeLessThan(4.5);
    expect(hex(dark, '--color-floating-bar-surface')).toBe('#14222e');
  });

  // The kit's accent rust cannot carry white initials; member 2 is rust-600.
  it('white on the kit accent rust #c6592e stays below 4.5:1', () => {
    expect(ratio('#ffffff', '#c6592e')).toBeLessThan(4.5);
  });

  it('white on --color-primary-500 stays below 4.5:1 in both palettes', () => {
    for (const [, tokens] of palettes) {
      expect(ratio('#ffffff', hex(tokens, '--color-primary-500'))).toBeLessThan(4.5);
    }
  });

  // "Weite": dark content cards are #101c26; the floating bar keeps #14222e,
  // a step above them, so it stands off a card behind it.
  it('dark cards are #101c26 and the floating bar a step above them', () => {
    const dark = palettes[1][1];
    expect(hex(dark, '--color-surface')).toBe('#101c26');
    expect(hex(dark, '--color-floating-bar-surface')).toBe('#14222e');
    expect(luminance(hex(dark, '--color-floating-bar-surface'))).toBeGreaterThan(luminance(hex(dark, '--color-surface')));
  });

  // The new tokens exist in both palettes (other components reference them).
  it('defines every 3.3 token in both palettes', () => {
    const names = [
      '--color-background-low', '--color-overline', '--color-next-step-soft-neutral', '--color-next-step-soft-primary',
      '--color-next-step-soft-success', '--color-next-step-soft-warning', '--color-bubble', '--color-bubble-ring',
      '--color-bubble-icon', '--color-hairline', '--color-surface-selected', '--color-on-surface-selected',
      '--color-muted-tile', '--color-muted-tile-border', '--color-muted-tile-icon', '--color-horizon-line',
      '--color-land-1', '--color-land-2', '--color-land-3', '--color-sun-1', '--color-sun-2', '--color-sun-3',
      '--color-sun-ring', '--color-sun-halo', ...members, '--color-on-member', '--color-floating-bar-surface',
      '--color-floating-bar-border', '--shadow-floating-bar', '--shadow-auth-card', '--color-field-border',
      '--color-on-warning-subtle', '--color-on-success-subtle', '--app-background-image', '--color-skeleton',
      '--color-skeleton-highlight', '--typography-font-size-7xl',
    ];
    for (const [, tokens] of palettes) {
      for (const name of names) expect(tokens[name]).toBeDefined();
    }
  });
});
