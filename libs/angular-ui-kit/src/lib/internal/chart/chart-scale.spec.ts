import { cleanNumber, formatChartValue, niceScale, niceStep, toFinite } from './chart-scale';

describe('chart-scale', () => {
  describe('toFinite', () => {
    it('passes finite numbers through and replaces everything else', () => {
      expect(toFinite(3)).toBe(3);
      expect(toFinite(-0.5)).toBe(-0.5);
      expect(toFinite(NaN)).toBe(0);
      expect(toFinite(Infinity)).toBe(0);
      expect(toFinite(undefined)).toBe(0);
      expect(toFinite(null, 7)).toBe(7);
      expect(toFinite('4')).toBe(0);
    });
  });

  describe('cleanNumber / formatChartValue', () => {
    it('strips float noise and normalises -0', () => {
      expect(cleanNumber(0.1 + 0.2)).toBe(0.3);
      expect(cleanNumber(3 * 0.1)).toBe(0.3);
      expect(Object.is(cleanNumber(-0), 0)).toBe(true);
      expect(formatChartValue(0.1 + 0.2)).toBe('0.3');
      expect(formatChartValue(92)).toBe('92');
      expect(formatChartValue(-12.5)).toBe('-12.5');
      expect(formatChartValue(NaN)).toBe('0');
    });
  });

  describe('niceStep', () => {
    it('rounds up to 1 / 2 / 2.5 / 5 × 10^n', () => {
      expect(niceStep(22.5)).toBe(25);
      expect(niceStep(0.2)).toBe(0.2);
      expect(niceStep(0.25)).toBe(0.25);
      expect(niceStep(1.25)).toBe(2);
      expect(niceStep(0.75)).toBe(1);
      expect(niceStep(7)).toBe(10);
      expect(niceStep(1000)).toBe(1000);
    });

    it('falls back to 1 for a non-positive or non-finite interval', () => {
      expect(niceStep(0)).toBe(1);
      expect(niceStep(-3)).toBe(1);
      expect(niceStep(NaN)).toBe(1);
    });
  });

  describe('niceScale', () => {
    it('extends the bounds to multiples of the step and returns every tick', () => {
      expect(niceScale(0, 90)).toEqual({ min: 0, max: 100, step: 25, ticks: [0, 25, 50, 75, 100] });
      expect(niceScale(0, 1)).toEqual({ min: 0, max: 1, step: 0.25, ticks: [0, 0.25, 0.5, 0.75, 1] });
      expect(niceScale(0, 0.8)).toEqual({ min: 0, max: 0.8, step: 0.2, ticks: [0, 0.2, 0.4, 0.6, 0.8] });
    });

    it('never shrinks the requested range', () => {
      const s = niceScale(12.3, 12.9);
      expect(s.min).toBeLessThanOrEqual(12.3);
      expect(s.max).toBeGreaterThanOrEqual(12.9);
      expect(s.ticks[0]).toBe(s.min);
      expect(s.ticks[s.ticks.length - 1]).toBe(s.max);
    });

    it('produces float-clean ticks', () => {
      for (const t of niceScale(0.1, 0.7).ticks) {
        expect(String(t)).not.toMatch(/0000|9999/);
      }
      expect(niceScale(0.3, 0.6).min).toBe(0.3);
    });

    it('spans negative and positive values', () => {
      const s = niceScale(-30, 90);
      expect(s.min).toBeLessThanOrEqual(-30);
      expect(s.max).toBeGreaterThanOrEqual(90);
      expect(s.ticks).toContain(0);
    });

    it('widens a degenerate range towards zero, and [0, 0] to [0, 1]', () => {
      expect(niceScale(5, 5).min).toBe(0);
      expect(niceScale(5, 5).max).toBeGreaterThanOrEqual(5);
      expect(niceScale(-5, -5).max).toBe(0);
      expect(niceScale(0, 0)).toEqual({ min: 0, max: 1, step: 0.25, ticks: [0, 0.25, 0.5, 0.75, 1] });
    });

    it('guards non-finite input', () => {
      const s = niceScale(NaN, Infinity);
      expect(Number.isFinite(s.min)).toBe(true);
      expect(Number.isFinite(s.max)).toBe(true);
      expect(s.ticks.length).toBeGreaterThan(1);
    });
  });
});
