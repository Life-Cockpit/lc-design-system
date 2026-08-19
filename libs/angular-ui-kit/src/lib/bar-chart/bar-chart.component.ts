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
import {
  ChartValueFormatter,
  formatChartValue,
  niceScale,
  toFinite,
} from '../shared/chart-scale';

export interface BarChartItem {
  /** Bar value. Negative values draw downward (left) from the zero baseline. */
  value: number;
  label?: string;
  color?: string;
}

export type BarChartOrientation = 'vertical' | 'horizontal';

/** viewBox width used until the container has been measured. */
const DEFAULT_WIDTH = 400;

@Component({
  selector: 'lc-bar-chart',
  standalone: true,
  templateUrl: './bar-chart.component.html',
  styleUrls: ['./bar-chart.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[style.max-width.px]': 'width()',
  },
})
/**
 * Bar chart component for comparing categorical data.
 *
 * Features:
 * - Vertical and horizontal orientation
 * - Per-bar or uniform color support
 * - Negative values drawn from a zero baseline
 * - Optional value labels on bars
 * - Configurable grid and axis labels on a nice tick scale
 * - Adjustable bar gap spacing
 * - Responsive SVG rendering
 *
 * @example
 * ```html
 * <lc-bar-chart [data]="items" orientation="vertical" [showValues]="true" />
 * ```
 */
export class BarChartComponent {
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

  /** Data items. */
  data = input.required<BarChartItem[]>();

  /**
   * Intrinsic chart width in pixels. The chart fills its container (the SVG is
   * `width="100%"` and its viewBox follows the measured container width);
   * `width` is the viewBox width until the container has been measured and,
   * when set, the host's `max-width`, so the chart never grows past it. Leave
   * unset for a fully fluid chart.
   */
  width = input<number | undefined>(undefined);

  /** Chart height in pixels. */
  height = input<number>(200);

  /** Bar orientation. */
  orientation = input<BarChartOrientation>('vertical');

  /** Show value labels on bars. */
  showValues = input<boolean>(true);

  /** Show axis labels. */
  showLabels = input<boolean>(true);

  /** Show grid lines. */
  showGrid = input<boolean>(true);

  /** Gap between bars as ratio (0-1). */
  barGap = input<number>(0.3);

  /** Use a single color for all bars. */
  color = input<string>('');

  /** Formats value labels and axis ticks. Defaults to a float-safe `String(value)`. */
  formatValue = input<ChartValueFormatter>(formatChartValue);

  /**
   * Accessible name of the chart. Defaults to a generated summary that lists
   * every bar's label and value, so assistive technology hears the data and
   * not just "Bar chart".
   */
  ariaLabel = input<string>('');

  // Layout constants
  private readonly PADDING_LEFT = 40;
  private readonly PADDING_RIGHT = 10;
  private readonly PADDING_TOP = 10;
  private readonly PADDING_BOTTOM = 30;

  protected readonly effectiveWidth = computed(
    () => this._containerWidth() || this.width() || DEFAULT_WIDTH
  );

  protected readonly viewBox = computed(
    () => `0 0 ${this.effectiveWidth()} ${this.height()}`
  );

  protected readonly isVertical = computed(() => this.orientation() === 'vertical');

  private readonly plot = computed(() => {
    const w = this.effectiveWidth();
    const h = this.height();
    return {
      x: this.PADDING_LEFT,
      y: this.PADDING_TOP,
      w: w - this.PADDING_LEFT - this.PADDING_RIGHT,
      h: h - this.PADDING_TOP - this.PADDING_BOTTOM,
    };
  });

  /**
   * One scale for grid *and* bars: bounds are nice multiples of the tick step,
   * always include zero, and extend below zero when the data does — so the top
   * tick is the value at the plot edge and negative bars hang off the baseline.
   */
  protected readonly scale = computed(() => {
    const values = (this.data() ?? []).map((i) => toFinite(i.value));
    return niceScale(Math.min(0, ...values), Math.max(0, ...values), 4);
  });

  /** Maps a data value to a pixel position along the value axis. */
  private valueToPos(value: number): number {
    const { min, max } = this.scale();
    const p = this.plot();
    const frac = (value - min) / (max - min || 1);
    return this.isVertical() ? p.y + p.h - frac * p.h : p.x + frac * p.w;
  }

  protected readonly gridLines = computed(() => {
    if (!this.showGrid() || !this.data()?.length) return [];
    const fmt = this.formatValue();
    return this.scale().ticks.map((tick) => ({
      pos: this.valueToPos(tick),
      label: fmt(tick),
    }));
  });

  protected readonly bars = computed(() => {
    const d = this.data();
    if (!d || d.length === 0) return [];

    const isVertical = this.isVertical();
    const p = this.plot();
    const gap = this.barGap();
    const singleColor = this.color();
    const fmt = this.formatValue();
    const zero = this.valueToPos(0);
    const h = this.height();

    if (isVertical) {
      const totalBarWidth = p.w / d.length;
      const barWidth = totalBarWidth * (1 - gap);
      const barOffset = (totalBarWidth - barWidth) / 2;

      return d.map((item, i) => {
        const value = toFinite(item.value);
        const end = this.valueToPos(value);
        const y = Math.min(zero, end);
        const barH = Math.abs(end - zero);
        return {
          x: p.x + i * totalBarWidth + barOffset,
          y,
          width: barWidth,
          height: barH,
          color: singleColor || item.color || chartColor(i),
          label: item.label || '',
          value,
          valueText: fmt(value),
          labelX: p.x + i * totalBarWidth + totalBarWidth / 2,
          labelY: h - this.PADDING_BOTTOM + 16,
          valueX: p.x + i * totalBarWidth + totalBarWidth / 2,
          // Above a positive bar, below a negative one.
          valueY: value >= 0 ? y - 6 : y + barH + 12,
          valueAnchor: 'middle',
        };
      });
    } else {
      const totalBarHeight = p.h / d.length;
      const barHeight = totalBarHeight * (1 - gap);
      const barOffset = (totalBarHeight - barHeight) / 2;

      return d.map((item, i) => {
        const value = toFinite(item.value);
        const end = this.valueToPos(value);
        const x = Math.min(zero, end);
        const barW = Math.abs(end - zero);
        return {
          x,
          y: p.y + i * totalBarHeight + barOffset,
          width: barW,
          height: barHeight,
          color: singleColor || item.color || chartColor(i),
          label: item.label || '',
          value,
          valueText: fmt(value),
          labelX: p.x - 6,
          labelY: p.y + i * totalBarHeight + totalBarHeight / 2,
          // Right of a positive bar, left of a negative one.
          valueX: value >= 0 ? x + barW + 6 : x - 6,
          valueY: p.y + i * totalBarHeight + totalBarHeight / 2,
          valueAnchor: value >= 0 ? 'start' : 'end',
        };
      });
    }
  });

  /**
   * Value axis along the plot edge plus the zero baseline, which sits inside
   * the plot when the data goes negative.
   */
  protected readonly axisLine = computed(() => {
    const p = this.plot();
    const isVertical = this.isVertical();
    const zero = this.data()?.length ? this.valueToPos(0) : (isVertical ? p.y + p.h : p.x);
    return {
      x1: isVertical ? p.x : zero,
      y1: p.y,
      x2: isVertical ? p.x : zero,
      y2: p.y + p.h,
      bx1: p.x,
      by1: isVertical ? zero : p.y + p.h,
      bx2: p.x + p.w,
      by2: isVertical ? zero : p.y + p.h,
    };
  });

  /** Bottom edge of the plot — where horizontal-orientation tick labels sit. */
  protected readonly plotBottom = computed(() => this.plot().y + this.plot().h);

  protected readonly effectiveAriaLabel = computed(() => {
    const explicit = this.ariaLabel();
    if (explicit) return explicit;
    const d = this.data() ?? [];
    if (!d.length) return 'Bar chart: no data';
    const fmt = this.formatValue();
    return `Bar chart: ${d
      .map((item, i) => `${item.label || `Bar ${i + 1}`} ${fmt(toFinite(item.value))}`)
      .join(', ')}`;
  });
}
