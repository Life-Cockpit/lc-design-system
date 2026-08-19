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
import { readableInk } from '../shared/chart-color';
import {
  ChartValueFormatter,
  formatChartValue,
  toFinite,
} from '../shared/chart-scale';

export interface FunnelStep {
  label: string;
  value: number;
  color?: string;
}

/**
 * Sequential default fills: 500 → 700 of each brand scale. Only 500+ shades are
 * used because the 300/400 shades resolve to dark, low-contrast teals on the
 * dark theme (the scales invert there).
 */
const DEFAULT_COLORS = [
  'var(--color-primary-500)',
  'var(--color-primary-600)',
  'var(--color-primary-700)',
  'var(--color-secondary-500)',
  'var(--color-secondary-600)',
  'var(--color-secondary-700)',
  'var(--color-success-default)',
  'var(--color-warning-default)',
];

/** viewBox width used until the container has been measured. */
const DEFAULT_WIDTH = 400;

@Component({
  selector: 'lc-funnel-chart',
  standalone: true,
  templateUrl: './funnel-chart.component.html',
  styleUrls: ['./funnel-chart.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[style.max-width.px]': 'width()',
  },
})
/**
 * Funnel chart for visualizing conversion pipelines and progressive filtering.
 *
 * Features:
 * - Vertical and horizontal orientations
 * - Automatic percentage calculation relative to the first step
 * - Toggleable value and percentage labels, readable on any step fill
 * - Per-step custom colors
 * - Responsive SVG rendering
 *
 * @example
 * ```html
 * <lc-funnel-chart [steps]="steps" [showPercentage]="true" />
 * ```
 */
export class FunnelChartComponent {
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

  readonly steps = input.required<FunnelStep[]>();
  /**
   * Intrinsic chart width in pixels. The chart fills its container (the SVG is
   * `width="100%"` and its viewBox follows the measured container width);
   * `width` is the viewBox width until the container has been measured and,
   * when set, the host's `max-width`, so the chart never grows past it. Leave
   * unset for a fully fluid chart.
   */
  readonly width = input<number | undefined>(undefined);
  readonly height = input(300);
  readonly showLabels = input(true);
  readonly showValues = input(true);
  readonly showPercentage = input(true);
  readonly orientation = input<'vertical' | 'horizontal'>('vertical');
  /** Formats step values. Defaults to a float-safe `String(value)`. */
  readonly formatValue = input<ChartValueFormatter>(formatChartValue);
  /**
   * Accessible name of the chart. Defaults to a generated summary listing
   * every step's label, value and share of the first step.
   */
  readonly ariaLabel = input<string>('');

  protected readonly effectiveWidth = computed(
    () => this._containerWidth() || this.width() || DEFAULT_WIDTH
  );

  protected readonly viewBox = computed(() => `0 0 ${this.effectiveWidth()} ${this.height()}`);

  protected readonly renderedSteps = computed(() => {
    const steps = this.steps();
    if (!steps?.length) return [];

    const values = steps.map((s) => Math.max(0, toFinite(s.value)));
    const maxVal = Math.max(...values);
    const w = this.effectiveWidth();
    const h = this.height();
    const isV = this.orientation() === 'vertical';
    const count = steps.length;
    const fmt = this.formatValue();
    const padding = 20;

    return steps.map((step, i) => {
      const ratio = maxVal > 0 ? values[i] / maxVal : 0;
      // The last step tapers to 60% of its own width; every other step tapers to the next step.
      const nextRatio = i < count - 1 && maxVal > 0 ? values[i + 1] / maxVal : ratio * 0.6;
      const pct = i === 0 ? 100 : maxVal > 0 ? Math.round((values[i] / maxVal) * 100) : 0;
      const color = step.color || DEFAULT_COLORS[i % DEFAULT_COLORS.length];
      // A literal fill gets ink picked from its luminance; a token fill can't be
      // resolved here, so the label falls back to primary text with a surface halo.
      const ink = readableInk(color);

      let path: string;
      let labelX: number;
      let labelY: number;
      if (isV) {
        const stepH = h / count;
        const maxWidth = w - padding * 2;
        const topW = ratio * maxWidth;
        const bottomW = nextRatio * maxWidth;
        const y = i * stepH;
        const cx = w / 2;
        path = [
          `M ${cx - topW / 2} ${y}`,
          `L ${cx + topW / 2} ${y}`,
          `L ${cx + bottomW / 2} ${y + stepH}`,
          `L ${cx - bottomW / 2} ${y + stepH}`,
          'Z',
        ].join(' ');
        labelX = cx;
        labelY = y + stepH / 2;
      } else {
        const stepW = w / count;
        const maxHeight = h - padding * 2;
        const leftH = ratio * maxHeight;
        const rightH = nextRatio * maxHeight;
        const x = i * stepW;
        const cy = h / 2;
        path = [
          `M ${x} ${cy - leftH / 2}`,
          `L ${x + stepW} ${cy - rightH / 2}`,
          `L ${x + stepW} ${cy + rightH / 2}`,
          `L ${x} ${cy + leftH / 2}`,
          'Z',
        ].join(' ');
        labelX = x + stepW / 2;
        labelY = cy;
      }

      return {
        path,
        color,
        ink: ink ?? 'var(--color-text-primary)',
        halo: ink === null,
        label: step.label,
        value: values[i],
        valueText: fmt(values[i]),
        pct,
        labelX,
        labelY,
      };
    });
  });

  protected readonly effectiveAriaLabel = computed(() => {
    const explicit = this.ariaLabel();
    if (explicit) return explicit;
    const steps = this.renderedSteps();
    if (!steps.length) return 'Funnel chart: no data';
    return `Funnel chart: ${steps
      .map((s, i) => `${s.label || `Step ${i + 1}`} ${s.valueText} (${s.pct}%)`)
      .join(', ')}`;
  });
}
