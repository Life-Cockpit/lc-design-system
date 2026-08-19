/**
 * Colour helpers for text drawn on top of chart fills.
 */

/** Parses `#rgb`, `#rrggbb`, `rgb()` and `rgba()`. Anything else → null. */
export function parseRgb(color: string): [number, number, number] | null {
  const hex = color.trim().match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i);
  if (hex) {
    const h = hex[1];
    const full = h.length === 3 ? h.split('').map(c => c + c).join('') : h;
    return [0, 2, 4].map(i => parseInt(full.slice(i, i + 2), 16)) as [number, number, number];
  }
  const rgb = color.match(/^rgba?\(([^)]+)\)/i);
  if (rgb) {
    const p = rgb[1].split(',').map(s => parseFloat(s));
    if (p.length >= 3 && p.every(n => !Number.isNaN(n))) return [p[0], p[1], p[2]];
  }
  return null;
}

/**
 * Ink that stays readable on `fill`, or `null` when that cannot be decided.
 *
 * A literal colour (`#…`, `rgb()`) is measured by its relative luminance and
 * gets a dark or light ink. A `var(--…)` token can't be resolved without the
 * DOM — and its resolution flips with the theme — so `null` is returned and
 * the caller should draw the label in `--color-text-primary` with a
 * `--color-surface` halo (`paint-order: stroke`), which reads on any fill in
 * both themes.
 */
export function readableInk(fill: string): string | null {
  const rgb = parseRgb(fill);
  if (!rgb) return null;
  const [r, g, b] = rgb.map(c => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  });
  const luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  return luminance > 0.4 ? '#111827' : '#f9fafb';
}
