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
import {
  ChartValueFormatter,
  formatChartValue,
  niceScale,
  toFinite,
} from '../shared/chart-scale';

export interface WaterfallItem {
  label: string;
  /**
   * The bar's amount. For an incremental step the sign gives the direction
   * unless `type` says otherwise; for a `total` it is the absolute level.
   */
  value: number;
  /**
   * `'total'` renders from 0 to `value` instead of incrementally.
   * `'increase'` / `'decrease'` force the direction: the step moves the running
   * total by `|value|` up or down regardless of the sign of `value`. When
   * omitted the sign of `value` decides.
   */
  type?: 'increase' | 'decrease' | 'total';
}

/** viewBox width used until the container has been measured. */
const DEFAULT_WIDTH = 500;

@Component({
  selector: 'lc-waterfall-chart',
  standalone: true,
  templateUrl: './waterfall-chart.component.html',
  styleUrls: ['./waterfall-chart.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[style.max-width.px]': 'width()',
  },
})
/**
 * Waterfall chart component for visualizing cumulative value changes.
 *
 * Features:
 * - Increase, decrease, and total bar types
 * - Connector lines between bars
 * - Configurable colors for increase, decrease, and total
 * - Optional value labels and grid on a nice tick scale
 * - Adjustable bar gap spacing
 * - Responsive SVG rendering
 *
 * @example
 * ```html
 * <lc-waterfall-chart [data]="items" [showConnectors]="true" />
 * ```
 */
export class WaterfallChartComponent {
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

  data = input.required<WaterfallItem[]>();
  /**
   * Intrinsic chart width in pixels. The chart fills its container (the SVG is
   * `width="100%"` and its viewBox follows the measured container width);
   * `width` is the viewBox width until the container has been measured and,
   * when set, the host's `max-width`, so the chart never grows past it. Leave
   * unset for a fully fluid chart.
   */
  width = input<number | undefined>(undefined);
  height = input<number>(250);
  showValues = input<boolean>(true);
  showGrid = input<boolean>(true);
  showConnectors = input<boolean>(true);
  increaseColor = input<string>('var(--color-success-default)');
  decreaseColor = input<string>('var(--color-error-default)');
  totalColor = input<string>('var(--color-primary-500)');
  barGap = input<number>(0.3);
  /**
   * Formats value labels and axis ticks. Defaults to a float-safe
   * `String(value)`; incremental steps are additionally prefixed with their sign.
   */
  formatValue = input<ChartValueFormatter>(formatChartValue);
  /**
   * Accessible name of the chart. Defaults to a generated summary listing every
   * bar's label and signed value (totals unsigned).
   */
  ariaLabel = input<string>('');

  private readonly PL = 50;
  private readonly PR = 10;
  private readonly PT = 15;
  private readonly PB = 30;

  protected readonly effectiveWidth = computed(
    () => this._containerWidth() || this.width() || DEFAULT_WIDTH
  );

  protected readonly viewBox = computed(() => `0 0 ${this.effectiveWidth()} ${this.height()}`);

  /** Running totals with the explicit `type` applied. */
  private readonly entries = computed(() => {
    const entries: { label: string; start: number; end: number; delta: number; type: 'increase' | 'decrease' | 'total' }[] = [];
    let running = 0;

    for (const item of this.data() ?? []) {
      const raw = toFinite(item.value);
      if (item.type === 'total') {
        entries.push({ label: item.label, start: 0, end: raw, delta: raw, type: 'total' });
        running = raw;
        continue;
      }
      // An explicit direction wins over the sign of the value.
      const delta = item.type === 'increase' ? Math.abs(raw)
        : item.type === 'decrease' ? -Math.abs(raw)
        : raw;
      const start = running;
      running += delta;
      entries.push({
        label: item.label,
        start,
        end: running,
        delta,
        type: delta >= 0 ? 'increase' : 'decrease',
      });
    }
    return entries;
  });

  private valueLabel(e: { delta: number; type: string }): string {
    const fmt = this.formatValue();
    const text = fmt(e.delta);
    return e.type !== 'total' && e.delta > 0 ? `+${text}` : text;
  }

  /** One nice scale for bars and grid, always including zero. */
  private readonly scale = computed(() => {
    const allVals = this.entries().flatMap(e => [e.start, e.end]);
    return niceScale(Math.min(0, ...allVals), Math.max(0, ...allVals), 4);
  });

  private readonly plotH = computed(() => this.height() - this.PT - this.PB);

  private toY(value: number): number {
    const { min, max } = this.scale();
    return this.PT + this.plotH() - ((value - min) / (max - min || 1)) * this.plotH();
  }

  protected readonly computedBars = computed(() => {
    const entries = this.entries();
    if (!entries.length) return { bars: [], connectors: [], gridLines: [] };

    const w = this.effectiveWidth();
    const h = this.height();
    const plotW = w - this.PL - this.PR;
    const gap = this.barGap();
    const fmt = this.formatValue();

    const totalBarW = plotW / entries.length;
    const barW = totalBarW * (1 - gap);
    const barOff = (totalBarW - barW) / 2;

    const bars = entries.map((e, i) => {
      const top = this.toY(Math.max(e.start, e.end));
      const bottom = this.toY(Math.min(e.start, e.end));
      return {
        x: this.PL + i * totalBarW + barOff,
        y: top,
        width: barW,
        height: Math.max(bottom - top, 1),
        color: e.type === 'total' ? this.totalColor()
          : e.type === 'increase' ? this.increaseColor()
          : this.decreaseColor(),
        label: e.label,
        // The item's own amount — not `end - start`, which drifts (0.1 + 0.2).
        value: e.delta,
        valueText: this.valueLabel(e),
        labelX: this.PL + i * totalBarW + totalBarW / 2,
        labelY: h - this.PB + 16,
        valueY: top - 6,
        endVal: e.end,
      };
    });

    const connectors: { x1: number; x2: number; y: number }[] = [];
    if (this.showConnectors()) {
      for (let i = 0; i < entries.length - 1; i++) {
        connectors.push({
          x1: this.PL + i * totalBarW + barOff + barW,
          x2: this.PL + (i + 1) * totalBarW + barOff,
          y: this.toY(entries[i].end),
        });
      }
    }

    const gridLines = this.showGrid()
      ? this.scale().ticks.map((tick) => ({ y: this.toY(tick), label: fmt(tick) }))
      : [];

    return { bars, connectors, gridLines };
  });

  /** Value axis on the left plus the zero baseline (inside the plot when the data goes negative). */
  protected readonly axisLine = computed(() => {
    const zeroY = this.entries().length ? this.toY(0) : this.height() - this.PB;
    return {
      vx1: this.PL, vy1: this.PT,
      vx2: this.PL, vy2: this.height() - this.PB,
      hx1: this.PL, hy1: zeroY,
      hx2: this.effectiveWidth() - this.PR, hy2: zeroY,
    };
  });

  protected readonly effectiveAriaLabel = computed(() => {
    const explicit = this.ariaLabel();
    if (explicit) return explicit;
    const entries = this.entries();
    if (!entries.length) return 'Waterfall chart: no data';
    return `Waterfall chart: ${entries
      .map((e, i) => `${e.label || `Bar ${i + 1}`} ${this.valueLabel(e)}`)
      .join(', ')}`;
  });
}
