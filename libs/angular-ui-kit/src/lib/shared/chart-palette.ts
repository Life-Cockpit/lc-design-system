/**
 * Default categorical palette for the chart family.
 *
 * Every entry is a theme token whose light *and* dark resolutions sit clearly
 * against `--color-surface`: the 500 brand shades and the status defaults flip
 * to their pastel tints in the dark theme, the 700 shades to their light tints,
 * so consecutive hues stay distinguishable on both themes. (The 300 shades and
 * `-light` status tints some charts used before resolve to dark, low-contrast
 * colours on the dark theme, which is why they are not in this list.)
 *
 * Charts fall back to this list when a series/segment brings no `color` of its
 * own; per-item colours always win.
 */
export const CHART_PALETTE: readonly string[] = [
  'var(--color-primary-500)',
  'var(--color-secondary-500)',
  'var(--color-success-default)',
  'var(--color-warning-default)',
  'var(--color-error-default)',
  'var(--color-info-default)',
  'var(--color-primary-700)',
  'var(--color-secondary-700)',
];

/** Palette colour for the series/segment at `index`, wrapping around. */
export function chartColor(index: number): string {
  return CHART_PALETTE[index % CHART_PALETTE.length];
}
