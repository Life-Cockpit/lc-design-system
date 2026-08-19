/**
 * Numeric helpers shared by the chart family: a "nice" linear scale for axes
 * and grids, float-safe value formatting, and a NaN guard for caller data.
 *
 * Every chart used to place its grid on its own ad-hoc rounding
 * (`Math.ceil(max / 4)`, `Math.round(v * 10) / 10`, `toFixed`), which let the
 * top tick disagree with the value at the plot edge and leaked binary float
 * noise (`0.30000000000000004`) into tick labels. This module is the one
 * routine they all go through instead.
 */

/** Signature of a chart's `formatValue` input. */
export type ChartValueFormatter = (value: number) => string;

/** `value` if it is a finite number, otherwise `fallback` (NaN, ±Infinity, undefined, null…). */
export function toFinite(value: unknown, fallback = 0): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

/** Strips binary float noise (0.1 + 0.2 → 0.3) and normalises -0 to 0. */
export function cleanNumber(value: number): number {
  if (!Number.isFinite(value)) return 0;
  const v = Number(value.toPrecision(12));
  return v === 0 ? 0 : v;
}

/** Default tick/value formatter: float-clean `String(value)`, no locale, no unit. */
export function formatChartValue(value: number): string {
  return String(cleanNumber(value));
}

export interface NiceScale {
  /** Lower bound — a multiple of `step`, ≤ the requested min. */
  min: number;
  /** Upper bound — a multiple of `step`, ≥ the requested max. */
  max: number;
  /** Tick interval: 1, 2, 2.5 or 5 × 10ⁿ. */
  step: number;
  /** All tick values from `min` to `max` inclusive. */
  ticks: number[];
}

/** Rounds a raw interval up to the nearest 1, 2, 2.5 or 5 × 10ⁿ. */
export function niceStep(raw: number): number {
  if (!Number.isFinite(raw) || raw <= 0) return 1;
  const magnitude = Math.pow(10, Math.floor(Math.log10(raw)));
  const fraction = raw / magnitude;
  const nice = fraction <= 1 ? 1 : fraction <= 2 ? 2 : fraction <= 2.5 ? 2.5 : fraction <= 5 ? 5 : 10;
  return cleanNumber(nice * magnitude);
}

/**
 * Linear scale whose bounds are multiples of a nice step, so every tick label
 * is a round number and the outermost ticks equal the values at the plot
 * edges. Bounds are only ever extended outward, never shrunk. A degenerate
 * range (`min === max`) is widened towards zero, or to [0, 1] when both are 0.
 *
 * `intervals` is the *target* number of steps; the result may have one more
 * or fewer because the bounds snap to the step.
 */
export function niceScale(min: number, max: number, intervals = 4): NiceScale {
  let lo = Math.min(toFinite(min), toFinite(max));
  let hi = Math.max(toFinite(min), toFinite(max));
  if (lo === hi) {
    if (lo > 0) lo = 0;
    else if (lo < 0) hi = 0;
    else hi = 1;
  }
  const step = niceStep((hi - lo) / Math.max(1, intervals));
  // cleanNumber before floor/ceil: 0.3 / 0.1 is 2.9999999999999996, which would
  // otherwise floor to 2 and pull the bound one step too far out.
  const niceMin = cleanNumber(Math.floor(cleanNumber(lo / step)) * step);
  const niceMax = cleanNumber(Math.ceil(cleanNumber(hi / step)) * step);
  const count = Math.round((niceMax - niceMin) / step);
  const ticks: number[] = [];
  for (let i = 0; i <= count; i++) ticks.push(cleanNumber(niceMin + i * step));
  return { min: niceMin, max: niceMax, step, ticks };
}
