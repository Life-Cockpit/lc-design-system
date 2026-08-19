import {
  ChangeDetectionStrategy,
  Component,
  input,
  computed,
  signal,
  output,
} from '@angular/core';
import { chartColor } from '../shared/chart-palette';
import {
  ChartValueFormatter,
  formatChartValue,
  niceScale,
  toFinite,
} from '../shared/chart-scale';

export interface ScatterPoint {
  x: number;
  y: number;
  label?: string;
  size?: number;
}

export interface ScatterSeries {
  label: string;
  data: ScatterPoint[];
  color?: string;
}

/** Approximate glyph width of the 10px tooltip font, used to size its backplate. */
const TOOLTIP_CHAR_W = 6;
const TOOLTIP_PAD_X = 8;
const TOOLTIP_H = 18;

@Component({
  selector: 'lc-scatter-plot',
  standalone: true,
  templateUrl: './scatter-plot.component.html',
  styleUrls: ['./scatter-plot.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
/**
 * Scatter plot for visualizing correlations between two variables.
 *
 * Features:
 * - Multiple data series with automatic color assignment
 * - Variable dot sizes for bubble-chart style (`size` on data points)
 * - Configurable axis labels (X / Y) and grid on a nice tick scale
 * - Interactive dots: hover/focus tooltip, click and Enter/Space emit `pointClick`
 * - Optional legend for multi-series data
 *
 * @example
 * ```html
 * <lc-scatter-plot [series]="data" xAxisLabel="Weight" yAxisLabel="Height" (pointClick)="select($event)" />
 * ```
 */
export class ScatterPlotComponent {
  readonly series = input.required<ScatterSeries[]>();
  /** Chart width in pixels (fixed; the SVG is not fluid). */
  readonly width = input(400);
  /** Chart height in pixels. */
  readonly height = input(300);
  readonly showGrid = input(true);
  readonly showXLabels = input(true);
  readonly showYLabels = input(true);
  readonly showLegend = input(false);
  readonly showTooltip = input(true);
  readonly dotRadius = input(4);
  readonly xAxisLabel = input('');
  readonly yAxisLabel = input('');
  /**
   * Whether the dots are interactive: keyboard-focusable buttons that show
   * the tooltip on focus and emit `pointClick` on click / Enter / Space. When
   * false the chart is a static image (`role="img"`).
   */
  readonly interactive = input(true);
  /** Formats axis ticks and the default point label. Defaults to a float-safe `String(value)`. */
  readonly formatValue = input<ChartValueFormatter>(formatChartValue);
  /**
   * Accessible name of the chart. Defaults to a generated summary naming the
   * axes and each series with its point count.
   */
  readonly ariaLabel = input<string>('');

  readonly pointClick = output<{ series: string; point: ScatterPoint }>();

  /** Tooltip: label, backplate centre x / top y and width (SVG units). */
  protected hoveredPoint = signal<{ label: string; sx: number; ty: number; w: number } | null>(null);

  private readonly PL = 48;
  private readonly PR = 16;
  private readonly PT = 16;
  private readonly PB = 36;

  protected readonly viewBox = computed(() => `0 0 ${this.width()} ${this.height()}`);

  private readonly cleanSeries = computed(() =>
    (this.series() ?? []).map((ser) => ({
      ...ser,
      data: (ser.data ?? []).map((p) => ({ ...p, x: toFinite(p.x), y: toFinite(p.y) })),
    }))
  );

  private readonly allPoints = computed(() => this.cleanSeries().flatMap(s => s.data));

  /** Nice tick scale over the data extent, padded 5% so edge points don't sit on the axis. */
  private extent(values: number[]) {
    if (!values.length) return niceScale(0, 1, 5);
    const min = Math.min(...values);
    const max = Math.max(...values);
    const pad = (max - min) * 0.05 || 0.5;
    return niceScale(min - pad, max + pad, 5);
  }

  private readonly xScale = computed(() => this.extent(this.allPoints().map(p => p.x)));
  private readonly yScale = computed(() => this.extent(this.allPoints().map(p => p.y)));

  protected readonly plotArea = computed(() => ({
    x: this.PL,
    y: this.PT,
    w: this.width() - this.PL - this.PR,
    h: this.height() - this.PT - this.PB,
  }));

  private toSx(x: number): number {
    const { min, max } = this.xScale();
    const pa = this.plotArea();
    return pa.x + ((x - min) / (max - min || 1)) * pa.w;
  }

  private toSy(y: number): number {
    const { min, max } = this.yScale();
    const pa = this.plotArea();
    return pa.y + pa.h - ((y - min) / (max - min || 1)) * pa.h;
  }

  protected readonly gridLinesX = computed(() => {
    if (!this.showGrid()) return [];
    const fmt = this.formatValue();
    return this.xScale().ticks.map((tick) => ({ x: this.toSx(tick), label: fmt(tick) }));
  });

  protected readonly gridLinesY = computed(() => {
    if (!this.showGrid()) return [];
    const fmt = this.formatValue();
    return this.yScale().ticks.map((tick) => ({ y: this.toSy(tick), label: fmt(tick) }));
  });

  protected readonly renderedSeries = computed(() => {
    const dr = this.dotRadius();
    const fmt = this.formatValue();

    return this.cleanSeries().map((ser, si) => {
      const color = ser.color || chartColor(si);
      const points = ser.data.map(p => {
        const coords = `(${fmt(p.x)}, ${fmt(p.y)})`;
        const label = p.label || coords;
        return {
          cx: this.toSx(p.x),
          cy: this.toSy(p.y),
          r: Math.max(0, toFinite(p.size, dr)),
          label,
          ariaLabel: `${ser.label}: ${p.label ? `${p.label} ${coords}` : coords}`,
          orig: p,
        };
      });
      return { label: ser.label, color, points };
    });
  });

  protected readonly legendItems = computed(() => {
    if (!this.showLegend()) return [];
    return this.renderedSeries().map(s => ({ label: s.label, color: s.color }));
  });

  protected readonly axisLine = computed(() => {
    const pa = this.plotArea();
    return {
      vx1: pa.x, vy1: pa.y, vx2: pa.x, vy2: pa.y + pa.h,
      hx1: pa.x, hy1: pa.y + pa.h, hx2: pa.x + pa.w, hy2: pa.y + pa.h,
    };
  });

  protected readonly effectiveAriaLabel = computed(() => {
    const explicit = this.ariaLabel();
    if (explicit) return explicit;
    const series = this.cleanSeries();
    const xl = this.xAxisLabel();
    const yl = this.yAxisLabel();
    const axes = xl || yl ? ` (${xl || 'x'} vs ${yl || 'y'})` : '';
    if (!series.length) return `Scatter plot${axes}: no data`;
    const parts = series.map((s, i) => {
      const n = s.data.length;
      return `${s.label || `Series ${i + 1}`} ${n} ${n === 1 ? 'point' : 'points'}`;
    });
    return `Scatter plot${axes}: ${parts.join(', ')}`;
  });

  protected onDotEnter(cx: number, cy: number, label: string): void {
    if (!this.showTooltip()) return;
    // Size the backplate from the label and keep it inside the SVG: clamped
    // horizontally, flipped below the dot when there is no room above it.
    const w = label.length * TOOLTIP_CHAR_W + TOOLTIP_PAD_X * 2;
    const half = w / 2;
    const sx = Math.min(Math.max(cx, half), this.width() - half);
    const above = cy - 12 - TOOLTIP_H;
    this.hoveredPoint.set({ label, sx, ty: above < 0 ? cy + 12 : above, w });
  }

  protected onDotLeave(): void {
    this.hoveredPoint.set(null);
  }

  protected onDotClick(seriesLabel: string, point: ScatterPoint): void {
    this.pointClick.emit({ series: seriesLabel, point });
  }

  protected readonly tooltipH = TOOLTIP_H;
}
