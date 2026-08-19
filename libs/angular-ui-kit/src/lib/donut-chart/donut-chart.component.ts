import {
  ChangeDetectionStrategy,
  Component,
  input,
  computed,
} from '@angular/core';
import { chartColor } from '../shared/chart-palette';
import { toFinite } from '../shared/chart-scale';

export interface DonutSegment {
  /** Share of the whole. Non-finite and negative values count as 0. */
  value: number;
  label?: string;
  color?: string;
}

export type DonutChartSize = 'sm' | 'md' | 'lg';

@Component({
  selector: 'lc-donut-chart',
  standalone: true,
  templateUrl: './donut-chart.component.html',
  styleUrls: ['./donut-chart.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
/**
 * Donut chart component for proportional data with center content.
 *
 * Features:
 * - Color-coded ring segments
 * - Configurable ring thickness
 * - Center label and value display
 * - Size presets (sm, md, lg)
 * - Optional legend display
 * - Responsive SVG rendering
 *
 * @example
 * ```html
 * <lc-donut-chart [segments]="data" centerLabel="Total" centerValue="100" />
 * ```
 */
export class DonutChartComponent {
  /** Segments to render. */
  segments = input.required<DonutSegment[]>();

  /** Size preset. */
  size = input<DonutChartSize>('md');

  /** Thickness of the donut ring (0-1 ratio of radius). */
  thickness = input<number>(0.35);

  /** Show the center label area. */
  showCenter = input<boolean>(true);

  /** Center label text. */
  centerLabel = input<string>('');

  /** Center value text (large number). */
  centerValue = input<string>('');

  /** Show legend below the chart. */
  showLegend = input<boolean>(false);

  /**
   * Accessible name of the chart. Defaults to a generated summary listing
   * every segment's label and share, e.g. "Donut chart: A 40%, B 60%".
   */
  ariaLabel = input<string>('');

  protected readonly sizeMap: Record<DonutChartSize, number> = {
    sm: 96,
    md: 140,
    lg: 200,
  };

  protected readonly svgSize = computed(() => this.sizeMap[this.size()]);
  protected readonly viewBox = computed(() => {
    const s = this.svgSize();
    return `0 0 ${s} ${s}`;
  });

  protected readonly center = computed(() => this.svgSize() / 2);
  protected readonly outerRadius = computed(() => this.svgSize() / 2 - 2);
  protected readonly innerRadius = computed(
    () => this.outerRadius() * (1 - this.thickness())
  );

  protected readonly arcs = computed(() => {
    const segs = this.segments();
    if (!segs || segs.length === 0) return [];

    const values = segs.map((s) => Math.max(0, toFinite(s.value)));
    const total = values.reduce((sum, v) => sum + v, 0);
    if (total === 0) return [];

    const cx = this.center();
    const cy = this.center();
    const r = this.outerRadius();
    const ir = this.innerRadius();

    let startAngle = -Math.PI / 2; // start at top
    const gap = segs.length > 1 ? 0.02 : 0; // small gap between segments

    return segs.map((seg, i) => {
      const fraction = values[i] / total;
      const sweepAngle = fraction * Math.PI * 2 - gap;
      const endAngle = startAngle + sweepAngle;

      let d: string;
      if (sweepAngle >= Math.PI * 2 - 1e-9) {
        // A full ring: an arc whose start and end coincide collapses to nothing,
        // so draw it as two half-circles, the inner ring wound the other way.
        d = [
          `M${cx},${cy - r}`,
          `A${r},${r} 0 1 1 ${cx},${cy + r}`,
          `A${r},${r} 0 1 1 ${cx},${cy - r}`,
          `M${cx},${cy - ir}`,
          `A${ir},${ir} 0 1 0 ${cx},${cy + ir}`,
          `A${ir},${ir} 0 1 0 ${cx},${cy - ir}`,
          'Z',
        ].join(' ');
      } else {
        const largeArc = sweepAngle > Math.PI ? 1 : 0;

        const x1 = cx + r * Math.cos(startAngle);
        const y1 = cy + r * Math.sin(startAngle);
        const x2 = cx + r * Math.cos(endAngle);
        const y2 = cy + r * Math.sin(endAngle);

        const ix1 = cx + ir * Math.cos(endAngle);
        const iy1 = cy + ir * Math.sin(endAngle);
        const ix2 = cx + ir * Math.cos(startAngle);
        const iy2 = cy + ir * Math.sin(startAngle);

        d = [
          `M${x1},${y1}`,
          `A${r},${r} 0 ${largeArc} 1 ${x2},${y2}`,
          `L${ix1},${iy1}`,
          `A${ir},${ir} 0 ${largeArc} 0 ${ix2},${iy2}`,
          'Z',
        ].join(' ');
      }

      startAngle = endAngle + gap;

      return {
        d,
        color: seg.color || chartColor(i),
        label: seg.label || '',
        value: values[i],
        percentage: Math.round(fraction * 100),
      };
    });
  });

  protected readonly legendItems = computed(() =>
    this.arcs().map((arc) => ({
      color: arc.color,
      label: arc.label,
      value: arc.value,
      percentage: arc.percentage,
    }))
  );

  protected readonly effectiveAriaLabel = computed(() => {
    const explicit = this.ariaLabel();
    if (explicit) return explicit;
    const arcs = this.arcs();
    if (!arcs.length) return 'Donut chart: no data';
    return `Donut chart: ${arcs
      .map((a, i) => `${a.label || `Segment ${i + 1}`} ${a.percentage}%`)
      .join(', ')}`;
  });
}
