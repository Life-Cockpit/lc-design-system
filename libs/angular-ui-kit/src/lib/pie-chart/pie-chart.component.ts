import {
  ChangeDetectionStrategy,
  Component,
  input,
  computed,
} from '@angular/core';
import { chartColor } from '../shared/chart-palette';
import { toFinite } from '../shared/chart-scale';

export interface PieSegment {
  /** Share of the whole. Non-finite and negative values count as 0. */
  value: number;
  label?: string;
  color?: string;
}

export type PieChartSize = 'sm' | 'md' | 'lg';

@Component({
  selector: 'lc-pie-chart',
  standalone: true,
  templateUrl: './pie-chart.component.html',
  styleUrls: ['./pie-chart.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
/**
 * Pie chart component for displaying proportional data.
 *
 * Features:
 * - Color-coded segments with automatic arc calculation
 * - Size presets (sm, md, lg)
 * - Optional legend display
 * - Hover state support
 * - Responsive SVG rendering
 *
 * @example
 * ```html
 * <lc-pie-chart [segments]="data" size="md" [showLegend]="true" />
 * ```
 */
export class PieChartComponent {
  segments = input.required<PieSegment[]>();
  size = input<PieChartSize>('md');
  showLegend = input<boolean>(false);
  /**
   * Accessible name of the chart. Defaults to a generated summary listing
   * every segment's label and share, e.g. "Pie chart: A 40%, B 60%".
   */
  ariaLabel = input<string>('');

  private readonly SIZE_MAP: Record<PieChartSize, number> = { sm: 96, md: 140, lg: 200 };

  protected readonly svgSize = computed(() => this.SIZE_MAP[this.size()]);
  protected readonly viewBox = computed(() => `0 0 ${this.svgSize()} ${this.svgSize()}`);
  protected readonly center = computed(() => this.svgSize() / 2);
  protected readonly radius = computed(() => this.svgSize() / 2 - 2);

  protected readonly arcs = computed(() => {
    const segs = this.segments();
    if (!segs?.length) return [];
    const values = segs.map((s) => Math.max(0, toFinite(s.value)));
    const total = values.reduce((s, v) => s + v, 0);
    if (!total) return [];

    const cx = this.center();
    const cy = this.center();
    const r = this.radius();
    let startAngle = -Math.PI / 2;
    const gap = segs.length > 1 ? 0.02 : 0;

    return segs.map((seg, i) => {
      const frac = values[i] / total;
      const sweep = frac * Math.PI * 2 - gap;
      const endAngle = startAngle + sweep;
      const large = sweep > Math.PI ? 1 : 0;

      const x1 = cx + r * Math.cos(startAngle);
      const y1 = cy + r * Math.sin(startAngle);
      const x2 = cx + r * Math.cos(endAngle);
      const y2 = cy + r * Math.sin(endAngle);

      // A full circle can't be one arc (start === end collapses it): two half-circles.
      const d = sweep >= Math.PI * 2 - 1e-9
        ? `M${cx},${cy - r} A${r},${r} 0 1 1 ${cx},${cy + r} A${r},${r} 0 1 1 ${cx},${cy - r} Z`
        : `M${cx},${cy} L${x1},${y1} A${r},${r} 0 ${large} 1 ${x2},${y2} Z`;

      startAngle = endAngle + gap;

      return {
        d,
        color: seg.color || chartColor(i),
        label: seg.label || '',
        percentage: Math.round(frac * 100),
      };
    });
  });

  protected readonly legendItems = computed(() =>
    this.arcs().map(a => ({ color: a.color, label: a.label, percentage: a.percentage }))
  );

  protected readonly effectiveAriaLabel = computed(() => {
    const explicit = this.ariaLabel();
    if (explicit) return explicit;
    const arcs = this.arcs();
    if (!arcs.length) return 'Pie chart: no data';
    return `Pie chart: ${arcs
      .map((a, i) => `${a.label || `Segment ${i + 1}`} ${a.percentage}%`)
      .join(', ')}`;
  });
}
