import {
  ChangeDetectionStrategy,
  Component,
  input,
  computed,
} from '@angular/core';
import {
  ChartValueFormatter,
  cleanNumber,
  formatChartValue,
  toFinite,
} from '../shared/chart-scale';

export interface HeatmapCell {
  row: number;
  col: number;
  value: number;
}

@Component({
  selector: 'lc-heatmap',
  standalone: true,
  templateUrl: './heatmap.component.html',
  styleUrls: ['./heatmap.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
/**
 * Heatmap component for visualizing 2D data density.
 *
 * Features:
 * - Cells blended from `colorMin` (lowest value) to `colorMax` (highest value)
 * - Configurable cell size, gap, and corner radius
 * - Custom min/max color range
 * - Optional row and column labels
 * - Optional value display within cells, ink chosen per cell for contrast
 * - Responsive SVG rendering
 *
 * @example
 * ```html
 * <lc-heatmap [data]="matrix" [rowLabels]="days" [colLabels]="hours" />
 * ```
 */
export class HeatmapComponent {
  /** 2D data: array of rows, each row an array of values. */
  data = input.required<number[][]>();

  /** Row labels (Y axis). */
  rowLabels = input<string[]>([]);

  /** Column labels (X axis). */
  colLabels = input<string[]>([]);

  /** Cell size in pixels. */
  cellSize = input<number>(28);

  /** Gap between cells in pixels. */
  cellGap = input<number>(2);

  /** Low-value color (the fill of the minimum value). */
  colorMin = input<string>('var(--color-primary-50)');

  /** High-value color (the fill of the maximum value). */
  colorMax = input<string>('var(--color-primary-500)');

  /** Show values inside cells. */
  showValues = input<boolean>(false);

  /** Corner radius of cells. */
  cellRadius = input<number>(3);

  /** Formats cell values. Defaults to a float-safe `String(value)`. */
  formatValue = input<ChartValueFormatter>(formatChartValue);

  /**
   * Accessible name of the chart. Defaults to a generated summary of the grid
   * shape and value range, e.g. "Heatmap: 5 rows by 7 columns, values from 0 to 15".
   */
  ariaLabel = input<string>('');

  private readonly LABEL_W = 60;
  private readonly LABEL_H = 20;

  /** Rows with every value coerced to a finite number (holes → 0). */
  private readonly cleanData = computed(() =>
    (this.data() ?? []).map((row) => (row ?? []).map((v) => toFinite(v)))
  );

  protected readonly minVal = computed(() => {
    const flat = this.cleanData().flat();
    return flat.length ? Math.min(...flat) : 0;
  });

  protected readonly maxVal = computed(() => {
    const flat = this.cleanData().flat();
    return flat.length ? Math.max(...flat) : 0;
  });

  protected readonly rows = computed(() => this.cleanData().length);
  protected readonly cols = computed(() => {
    const d = this.cleanData();
    return d.length ? Math.max(...d.map(r => r.length)) : 0;
  });

  protected readonly svgWidth = computed(() =>
    (this.rowLabels().length ? this.LABEL_W : 0) + this.cols() * (this.cellSize() + this.cellGap())
  );

  protected readonly svgHeight = computed(() =>
    (this.colLabels().length ? this.LABEL_H : 0) + this.rows() * (this.cellSize() + this.cellGap())
  );

  protected readonly viewBox = computed(() => `0 0 ${this.svgWidth()} ${this.svgHeight()}`);

  protected readonly offsetX = computed(() => this.rowLabels().length ? this.LABEL_W : 0);
  protected readonly offsetY = computed(() => this.colLabels().length ? this.LABEL_H : 0);

  protected readonly cells = computed(() => {
    const d = this.cleanData();
    const cs = this.cellSize();
    const cg = this.cellGap();
    const ox = this.offsetX();
    const oy = this.offsetY();
    const min = this.minVal();
    const max = this.maxVal();
    const range = max - min || 1;
    const lo = this.colorMin();
    const hi = this.colorMax();
    const fmt = this.formatValue();

    const result: {
      x: number; y: number; w: number; h: number;
      value: number; valueText: string; fill: string; ink: string;
    }[] = [];

    for (let r = 0; r < d.length; r++) {
      for (let c = 0; c < d[r].length; c++) {
        const val = d[r][c];
        const t = (val - min) / range;
        result.push({
          x: ox + c * (cs + cg),
          y: oy + r * (cs + cg),
          w: cs,
          h: cs,
          value: val,
          valueText: fmt(val),
          fill: `color-mix(in srgb, ${hi} ${cleanNumber(t * 100)}%, ${lo})`,
          // Strong cells sit near colorMax (a mid/light brand shade depending on
          // theme) and read best in the surface colour; weak cells sit near
          // colorMin (close to the surface) and take primary text.
          ink: t > 0.5 ? 'var(--color-surface)' : 'var(--color-text-primary)',
        });
      }
    }
    return result;
  });

  protected readonly rowLabelItems = computed(() => {
    const labels = this.rowLabels();
    if (!labels.length) return [];
    const cs = this.cellSize();
    const cg = this.cellGap();
    const oy = this.offsetY();
    return labels.map((l, i) => ({
      x: this.LABEL_W - 6,
      y: oy + i * (cs + cg) + cs / 2,
      label: l,
    }));
  });

  protected readonly colLabelItems = computed(() => {
    const labels = this.colLabels();
    if (!labels.length) return [];
    const cs = this.cellSize();
    const cg = this.cellGap();
    const ox = this.offsetX();
    return labels.map((l, i) => ({
      x: ox + i * (cs + cg) + cs / 2,
      y: this.LABEL_H - 4,
      label: l,
    }));
  });

  protected readonly effectiveAriaLabel = computed(() => {
    const explicit = this.ariaLabel();
    if (explicit) return explicit;
    const rows = this.rows();
    const cols = this.cols();
    if (!rows || !cols) return 'Heatmap: no data';
    const fmt = this.formatValue();
    return `Heatmap: ${rows} ${rows === 1 ? 'row' : 'rows'} by ${cols} ${cols === 1 ? 'column' : 'columns'}, values from ${fmt(this.minVal())} to ${fmt(this.maxVal())}`;
  });
}
