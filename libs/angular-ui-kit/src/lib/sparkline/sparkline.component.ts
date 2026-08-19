import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  afterNextRender,
  inject,
  input,
  computed,
  signal,
} from '@angular/core';
import { linearPath, smoothPath } from '../shared/chart-path';
import { ChartValueFormatter, formatChartValue, toFinite } from '../shared/chart-scale';

export type SparklineColor = 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'info';
export type SparklineCurve = 'linear' | 'smooth';

@Component({
  selector: 'lc-sparkline',
  standalone: true,
  templateUrl: './sparkline.component.html',
  styleUrls: ['./sparkline.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class.lc-sparkline--fluid]': 'fluid()',
    '[style.width.px]': 'fluid() ? null : width()',
  },
})
/**
 * Sparkline component for compact inline trend visualization.
 *
 * Features:
 * - Linear or smooth curve interpolation
 * - Optional area fill below the line
 * - Color theme variants (primary, secondary, success, warning, error)
 * - Optional end-dot indicator
 * - Fixed `width` × `height` inline box, or `fluid` to fill the container
 * - Lightweight SVG rendering
 *
 * @example
 * ```html
 * <lc-sparkline [data]="[10, 25, 15, 30, 20]" color="primary" [filled]="true" />
 * ```
 */
export class SparklineComponent {
  private readonly _el = inject(ElementRef);
  private readonly _destroyRef = inject(DestroyRef);
  private readonly _containerWidth = signal<number>(0);

  constructor() {
    afterNextRender(() => {
      const obs = new ResizeObserver(([entry]) => {
        this._containerWidth.set(entry.contentRect.width);
      });
      obs.observe(this._el.nativeElement);
      this._destroyRef.onDestroy(() => obs.disconnect());
    });
  }

  /** Data points to plot. */
  data = input.required<number[]>();

  /** Stroke color theme. */
  color = input<SparklineColor>('primary');

  /**
   * Width of the sparkline in pixels. The host is an inline-block of exactly
   * this width unless `fluid` is set, in which case the sparkline fills its
   * container and `width` only serves as the viewBox width until the container
   * has been measured.
   */
  width = input<number>(120);

  /** Height of the SVG in pixels. */
  height = input<number>(32);

  /** Stroke width in pixels. */
  strokeWidth = input<number>(2);

  /** Show a filled area under the line. */
  filled = input<boolean>(false);

  /** Curve interpolation mode. */
  curve = input<SparklineCurve>('smooth');

  /** Show a dot on the last data point. */
  showEndDot = input<boolean>(false);

  /** Stretch to the container width instead of the fixed `width`. */
  fluid = input<boolean>(false);

  /** Formats values in the generated accessible summary. Defaults to a float-safe `String(value)`. */
  formatValue = input<ChartValueFormatter>(formatChartValue);

  /**
   * Accessible name of the sparkline. Defaults to a generated summary such as
   * "Sparkline: 10 points, min 4, max 18, last 18".
   */
  ariaLabel = input<string>('');

  protected readonly colorVar = computed(() => {
    const map: Record<SparklineColor, string> = {
      primary: 'var(--color-primary-500)',
      secondary: 'var(--color-secondary-500)',
      success: 'var(--color-success-default)',
      warning: 'var(--color-warning-default)',
      error: 'var(--color-error-default)',
      info: 'var(--color-info-default)',
    };
    return map[this.color()];
  });

  protected readonly fillColorVar = computed(() => {
    const map: Record<SparklineColor, string> = {
      primary: 'var(--color-primary-100)',
      secondary: 'var(--color-secondary-100)',
      success: 'var(--color-success-light)',
      warning: 'var(--color-warning-light)',
      error: 'var(--color-error-light)',
      info: 'var(--color-info-light)',
    };
    return map[this.color()];
  });

  private readonly values = computed(() => (this.data() ?? []).map((v) => toFinite(v)));

  protected readonly effectiveWidth = computed(() =>
    this.fluid() ? this._containerWidth() || this.width() : this.width()
  );

  protected readonly viewBox = computed(
    () => `0 0 ${this.effectiveWidth()} ${this.height()}`
  );

  /** Plot geometry and the data mapped into it; null with fewer than two points. */
  private readonly layout = computed(() => {
    const d = this.values();
    if (d.length < 2) return null;

    const w = this.effectiveWidth();
    const h = this.height();
    const padding = this.strokeWidth();
    const plotW = w - padding * 2;
    const plotH = h - padding * 2;

    const min = Math.min(...d);
    const max = Math.max(...d);
    const range = max - min || 1;

    const points = d.map((v, i) => ({
      x: padding + (i / (d.length - 1)) * plotW,
      y: padding + plotH - ((v - min) / range) * plotH,
    }));
    return { points, padding, plotW, bottomY: h - padding };
  });

  protected readonly pathD = computed(() => {
    const l = this.layout();
    if (!l) return '';
    return this.curve() === 'linear' ? linearPath(l.points) : smoothPath(l.points);
  });

  protected readonly areaD = computed(() => {
    if (!this.filled()) return '';
    const line = this.pathD();
    const l = this.layout();
    if (!line || !l) return '';
    return `${line} L${l.padding + l.plotW},${l.bottomY} L${l.padding},${l.bottomY} Z`;
  });

  protected readonly endDot = computed(() => {
    if (!this.showEndDot()) return null;
    const l = this.layout();
    if (!l) return null;
    const last = l.points[l.points.length - 1];
    return { cx: last.x, cy: last.y, r: this.strokeWidth() + 1 };
  });

  protected readonly effectiveAriaLabel = computed(() => {
    const explicit = this.ariaLabel();
    if (explicit) return explicit;
    const d = this.values();
    if (!d.length) return 'Sparkline: no data';
    const fmt = this.formatValue();
    return `Sparkline: ${d.length} ${d.length === 1 ? 'point' : 'points'}, min ${fmt(Math.min(...d))}, max ${fmt(Math.max(...d))}, last ${fmt(d[d.length - 1])}`;
  });
}
