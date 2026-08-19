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
import { chartColor } from '../shared/chart-palette';
import { linearPath, smoothPath } from '../shared/chart-path';
import {
  ChartValueFormatter,
  formatChartValue,
  niceScale,
  toFinite,
} from '../shared/chart-scale';

export interface AreaChartSeries {
  label: string;
  data: number[];
  color?: string;
}

/** viewBox width used until the container has been measured. */
const DEFAULT_WIDTH = 400;

@Component({
  selector: 'lc-area-chart',
  standalone: true,
  templateUrl: './area-chart.component.html',
  styleUrls: ['./area-chart.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[style.max-width.px]': 'width()',
  },
})
/**
 * Area chart component for visualizing trends over time.
 *
 * Features:
 * - Multiple data series with stacking support
 * - Smooth or linear curve interpolation
 * - Configurable fill opacity for area shading
 * - Optional grid on a nice tick scale, axis labels, dots, and legend
 * - Responsive SVG rendering with configurable dimensions
 *
 * @example
 * ```html
 * <lc-area-chart [series]="data" [labels]="months" [showLegend]="true" />
 * ```
 */
export class AreaChartComponent {
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

  series = input.required<AreaChartSeries[]>();
  labels = input<string[]>([]);
  /**
   * Intrinsic chart width in pixels. The chart fills its container (the SVG is
   * `width="100%"` and its viewBox follows the measured container width);
   * `width` is the viewBox width until the container has been measured and,
   * when set, the host's `max-width`, so the chart never grows past it. Leave
   * unset for a fully fluid chart.
   */
  width = input<number | undefined>(undefined);
  height = input<number>(200);
  strokeWidth = input<number>(2);
  showDots = input<boolean>(false);
  showGrid = input<boolean>(true);
  showXLabels = input<boolean>(true);
  showYLabels = input<boolean>(true);
  showLegend = input<boolean>(false);
  smooth = input<boolean>(true);
  /** Opacity for the filled area (0–1). */
  fillOpacity = input<number>(0.2);
  /** Stack areas on top of each other. */
  stacked = input<boolean>(false);
  /** Formats Y-axis tick labels. Defaults to a float-safe `String(value)`. */
  formatValue = input<ChartValueFormatter>(formatChartValue);
  /**
   * Accessible name of the chart. Defaults to a generated summary naming each
   * series with its point count and value range.
   */
  ariaLabel = input<string>('');

  private readonly PL = 40;
  private readonly PR = 10;
  private readonly PT = 10;
  private readonly PB = 30;

  protected readonly effectiveWidth = computed(
    () => this._containerWidth() || this.width() || DEFAULT_WIDTH
  );

  protected readonly viewBox = computed(() => `0 0 ${this.effectiveWidth()} ${this.height()}`);

  protected readonly plotArea = computed(() => ({
    x: this.PL, y: this.PT,
    w: this.effectiveWidth() - this.PL - this.PR,
    h: this.height() - this.PT - this.PB,
  }));

  private readonly cleanSeries = computed(() =>
    (this.series() ?? []).map((ser) => ({
      ...ser,
      data: (ser.data ?? []).map((v) => toFinite(v)),
    }))
  );

  protected readonly computedSeries = computed(() => {
    const allSeries = this.cleanSeries();
    if (!allSeries.length) return [];

    if (this.stacked()) {
      const maxLen = Math.max(...allSeries.map(s => s.data.length));
      const stackedData: number[][] = [];
      const cumulative = new Array(maxLen).fill(0);

      for (const ser of allSeries) {
        const row = ser.data.map((v, i) => {
          cumulative[i] = (cumulative[i] || 0) + v;
          return cumulative[i];
        });
        stackedData.push(row);
      }
      return allSeries.map((ser, i) => ({
        ...ser,
        computedData: stackedData[i],
        prevData: i > 0 ? stackedData[i - 1] : null,
      }));
    }

    return allSeries.map(ser => ({
      ...ser,
      computedData: ser.data,
      prevData: null as number[] | null,
    }));
  });

  protected readonly minValue = computed(() => {
    if (this.stacked()) return 0;
    const all = this.cleanSeries().flatMap(s => s.data);
    return all.length ? Math.min(...all, 0) : 0;
  });

  protected readonly maxValue = computed(() => {
    // Every series may be empty ([{ data: [] }]) — Math.max() of nothing is -Infinity.
    const all = this.computedSeries().flatMap(s => s.computedData);
    return all.length ? Math.max(...all) : 0;
  });

  /** Y scale with nice tick bounds; the plot edges sit on the outermost ticks. */
  protected readonly scale = computed(() => niceScale(this.minValue(), this.maxValue(), 4));

  private valueToY(value: number): number {
    const { min, max } = this.scale();
    const pa = this.plotArea();
    return pa.y + pa.h - ((value - min) / (max - min || 1)) * pa.h;
  }

  protected readonly gridLines = computed(() => {
    if (!this.showGrid()) return [];
    const fmt = this.formatValue();
    return this.scale().ticks.map((tick) => ({ y: this.valueToY(tick), label: fmt(tick) }));
  });

  protected readonly xLabelItems = computed(() => {
    const lbls = this.labels();
    if (!this.showXLabels() || !lbls.length) return [];
    const pa = this.plotArea();
    return lbls.map((l, i) => ({
      x: pa.x + (lbls.length > 1 ? (i / (lbls.length - 1)) * pa.w : pa.w / 2),
      y: this.height() - this.PB + 16,
      label: l,
    }));
  });

  private toPoints(data: number[]) {
    const pa = this.plotArea();
    return data.map((v, i) => ({
      x: pa.x + (data.length > 1 ? (i / (data.length - 1)) * pa.w : pa.w / 2),
      y: this.valueToY(v),
    }));
  }

  protected readonly renderedSeries = computed(() => {
    const cs = this.computedSeries();
    const pa = this.plotArea();
    const bottomY = pa.y + pa.h;
    const smooth = this.smooth();

    return cs.map((ser, si) => {
      const color = ser.color || chartColor(si);
      const points = this.toPoints(ser.computedData);
      const lineD = smooth ? smoothPath(points) : linearPath(points);

      let areaD = '';
      if (lineD) {
        if (ser.prevData) {
          const prevPoints = this.toPoints(ser.prevData).reverse();
          const prevPath = prevPoints.map((p) => `L${p.x},${p.y}`).join(' ');
          areaD = `${lineD} ${prevPath} Z`;
        } else {
          const lastX = points[points.length - 1].x;
          const firstX = points[0].x;
          areaD = `${lineD} L${lastX},${bottomY} L${firstX},${bottomY} Z`;
        }
      }

      return {
        label: ser.label,
        color,
        lineD,
        areaD,
        points: this.showDots() ? points : [],
      };
    });
  });

  protected readonly axisLine = computed(() => {
    const pa = this.plotArea();
    return {
      vx1: pa.x, vy1: pa.y, vx2: pa.x, vy2: pa.y + pa.h,
      hx1: pa.x, hy1: pa.y + pa.h, hx2: pa.x + pa.w, hy2: pa.y + pa.h,
    };
  });

  protected readonly legendItems = computed(() => {
    if (!this.showLegend()) return [];
    return this.renderedSeries().map(s => ({ label: s.label, color: s.color }));
  });

  protected readonly effectiveAriaLabel = computed(() => {
    const explicit = this.ariaLabel();
    if (explicit) return explicit;
    const series = this.cleanSeries();
    if (!series.length) return 'Area chart: no data';
    const fmt = this.formatValue();
    const parts = series.map((s, i) => {
      const name = s.label || `Series ${i + 1}`;
      if (!s.data.length) return `${name} (no data)`;
      const n = s.data.length;
      return `${name} (${n} ${n === 1 ? 'point' : 'points'}, ${fmt(Math.min(...s.data))} to ${fmt(Math.max(...s.data))})`;
    });
    return `${this.stacked() ? 'Stacked area chart' : 'Area chart'}: ${parts.join(', ')}`;
  });
}
