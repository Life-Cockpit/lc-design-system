import {
  ChangeDetectionStrategy,
  Component,
  input,
  computed,
} from '@angular/core';
import { ChartValueFormatter, formatChartValue, toFinite } from '../shared/chart-scale';

export interface RadarChartSeries {
  label: string;
  /** One value per axis; drawn clamped to [0, max]. */
  data: number[];
  color?: string;
}

@Component({
  selector: 'lc-radar-chart',
  standalone: true,
  templateUrl: './radar-chart.component.html',
  styleUrls: ['./radar-chart.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
/**
 * Radar chart component for multi-axis data comparison.
 *
 * Features:
 * - Multiple data series overlay
 * - Configurable concentric grid rings
 * - Axis labels with configurable max values
 * - Adjustable fill opacity per series
 * - Optional legend display
 * - Responsive SVG rendering
 *
 * @example
 * ```html
 * <lc-radar-chart [series]="data" [axes]="categories" [showLegend]="true" />
 * ```
 */
export class RadarChartComponent {
  series = input.required<RadarChartSeries[]>();
  /** Axis labels. */
  axes = input<string[]>([]);
  /** Max value for each axis. */
  max = input<number>(100);
  /** SVG size in pixels. */
  size = input<number>(250);
  /** Number of concentric grid rings. */
  rings = input<number>(4);
  /** Show axis labels. */
  showLabels = input<boolean>(true);
  /** Fill opacity for series polygons. */
  fillOpacity = input<number>(0.15);
  /** Show legend. */
  showLegend = input<boolean>(false);
  /** Formats values in the generated accessible summary. Defaults to a float-safe `String(value)`. */
  formatValue = input<ChartValueFormatter>(formatChartValue);
  /**
   * Accessible name of the chart. Defaults to a generated summary listing each
   * series with its per-axis values.
   */
  ariaLabel = input<string>('');

  protected readonly viewBox = computed(() => `0 0 ${this.size()} ${this.size()}`);
  protected readonly center = computed(() => this.size() / 2);
  protected readonly radius = computed(() => this.size() / 2 - 30);

  private readonly cleanSeries = computed(() =>
    (this.series() ?? []).map((ser) => ({
      ...ser,
      data: (ser.data ?? []).map((v) => toFinite(v)),
    }))
  );

  protected readonly axisCount = computed(() => {
    const s = this.cleanSeries();
    return s.length ? Math.max(...s.map(ser => ser.data.length)) : 0;
  });

  protected readonly gridRings = computed(() => {
    const n = this.rings();
    const r = this.radius();
    const cx = this.center();
    const cy = this.center();
    const ac = this.axisCount();
    if (!ac) return [];

    return Array.from({ length: n }, (_, ri) => {
      const ringR = ((ri + 1) / n) * r;
      const points = Array.from({ length: ac }, (_, ai) => {
        const angle = (ai / ac) * Math.PI * 2 - Math.PI / 2;
        return `${cx + ringR * Math.cos(angle)},${cy + ringR * Math.sin(angle)}`;
      });
      return points.join(' ');
    });
  });

  protected readonly axisLines = computed(() => {
    const ac = this.axisCount();
    const cx = this.center();
    const cy = this.center();
    const r = this.radius();
    if (!ac) return [];

    return Array.from({ length: ac }, (_, i) => {
      const angle = (i / ac) * Math.PI * 2 - Math.PI / 2;
      return {
        x2: cx + r * Math.cos(angle),
        y2: cy + r * Math.sin(angle),
      };
    });
  });

  protected readonly labelItems = computed(() => {
    if (!this.showLabels()) return [];
    const ax = this.axes();
    const ac = this.axisCount();
    const cx = this.center();
    const cy = this.center();
    const r = this.radius() + 14;
    if (!ac) return [];

    return Array.from({ length: ac }, (_, i) => {
      const angle = (i / ac) * Math.PI * 2 - Math.PI / 2;
      const x = cx + r * Math.cos(angle);
      const y = cy + r * Math.sin(angle);
      const anchor = Math.abs(Math.cos(angle)) < 0.01 ? 'middle' :
        Math.cos(angle) > 0 ? 'start' : 'end';
      return { x, y, label: ax[i] || `Axis ${i + 1}`, anchor };
    });
  });

  protected readonly seriesPolygons = computed(() => {
    const allSeries = this.cleanSeries();
    const cx = this.center();
    const cy = this.center();
    const r = this.radius();
    const m = toFinite(this.max()) || 1;
    const ac = this.axisCount();
    if (!ac) return [];

    return allSeries.map((ser, si) => {
      const points = ser.data.map((v, i) => {
        const angle = (i / ac) * Math.PI * 2 - Math.PI / 2;
        const vr = (Math.min(Math.max(v, 0), m) / m) * r;
        return `${cx + vr * Math.cos(angle)},${cy + vr * Math.sin(angle)}`;
      });
      return { points: points.join(' '), colorIndex: si % 8, customColor: ser.color || null, label: ser.label };
    });
  });

  protected readonly legendItems = computed(() => {
    if (!this.showLegend()) return [];
    return this.seriesPolygons().map(s => ({ label: s.label, colorIndex: s.colorIndex, customColor: s.customColor }));
  });

  protected readonly effectiveAriaLabel = computed(() => {
    const explicit = this.ariaLabel();
    if (explicit) return explicit;
    const series = this.cleanSeries();
    if (!series.length || !this.axisCount()) return 'Radar chart: no data';
    const fmt = this.formatValue();
    const axes = this.axes();
    const parts = series.map((s, si) => {
      const values = s.data.map((v, i) => `${axes[i] || `Axis ${i + 1}`} ${fmt(v)}`).join(', ');
      return `${s.label || `Series ${si + 1}`} (${values})`;
    });
    return `Radar chart: ${parts.join('; ')}`;
  });
}
