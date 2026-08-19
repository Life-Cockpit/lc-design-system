import {
  ChangeDetectionStrategy,
  Component,
  input,
  computed,
} from '@angular/core';
import { ChartValueFormatter, toFinite } from '../shared/chart-scale';

export type GaugeColor = 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'info';
export type GaugeSize = 'sm' | 'md' | 'lg';

@Component({
  selector: 'lc-gauge',
  standalone: true,
  templateUrl: './gauge.component.html',
  styleUrls: ['./gauge.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
/**
 * Gauge component for displaying a value on a semicircular scale.
 *
 * Features:
 * - Semicircle arc with value and track segments
 * - Color theme variants (primary, secondary, success, warning, error)
 * - Size presets (sm, md, lg)
 * - Configurable max value and suffix
 * - Optional numeric value display
 * - Responsive SVG rendering
 *
 * @example
 * ```html
 * <lc-gauge [value]="75" [max]="100" color="primary" label="CPU" suffix="%" />
 * ```
 */
export class GaugeComponent {
  /** Value between 0 and max. */
  value = input<number>(0);

  /** Maximum value. */
  max = input<number>(100);

  /** Color theme. */
  color = input<GaugeColor>('primary');

  /** Size preset. */
  size = input<GaugeSize>('md');

  /** Label text below the value. */
  label = input<string>('');

  /** Value suffix (e.g. '%', '°C'). */
  suffix = input<string>('%');

  /** Show the value in the center. */
  showValue = input<boolean>(true);

  /**
   * Formats the displayed value. When set it replaces the default
   * `Math.round(value) + suffix` entirely (the suffix is not appended).
   */
  formatValue = input<ChartValueFormatter | null>(null);

  /**
   * Accessible name of the gauge. Defaults to a generated summary such as
   * "CPU: 72% of 100%", so assistive technology hears the value.
   */
  ariaLabel = input<string>('');

  private readonly SIZE_MAP: Record<GaugeSize, number> = { sm: 100, md: 160, lg: 220 };

  protected readonly svgSize = computed(() => this.SIZE_MAP[this.size()]);
  protected readonly svgHeight = computed(() => {
    const s = this.svgSize();
    const sw = this.strokeW();
    const r = (s - sw * 2) / 2;
    // height = stroke padding + radius (arc) + text area
    return sw + r + 36;
  });
  protected readonly viewBox = computed(() => {
    const s = this.svgSize();
    return `0 0 ${s} ${this.svgHeight()}`;
  });

  protected readonly cx = computed(() => this.svgSize() / 2);
  protected readonly cy = computed(() => {
    const sw = this.strokeW();
    const r = (this.svgSize() - sw * 2) / 2;
    return sw + r;
  });
  protected readonly radius = computed(() => (this.svgSize() - this.strokeW() * 2) / 2);
  protected readonly strokeW = computed(() => {
    const map: Record<GaugeSize, number> = { sm: 8, md: 12, lg: 16 };
    return map[this.size()];
  });

  protected readonly fraction = computed(() => {
    const m = toFinite(this.max()) || 1;
    return Math.min(Math.max(toFinite(this.value()) / m, 0), 1);
  });

  protected readonly trackD = computed(() => {
    const r = this.radius();
    const cxv = this.cx();
    const cyv = this.cy();
    return `M${cxv - r},${cyv} A${r},${r} 0 0 1 ${cxv + r},${cyv}`;
  });

  protected readonly valueD = computed(() => {
    const r = this.radius();
    const cxv = this.cx();
    const cyv = this.cy();
    const f = this.fraction();
    if (f <= 0) return '';
    const angle = Math.PI * f;
    const x = cxv - r * Math.cos(angle);
    const y = cyv - r * Math.sin(angle);
    return `M${cxv - r},${cyv} A${r},${r} 0 0 1 ${x},${y}`;
  });

  private formatted(value: number): string {
    const fmt = this.formatValue();
    return fmt ? fmt(value) : `${Math.round(toFinite(value))}${this.suffix()}`;
  }

  protected readonly displayValue = computed(() => this.formatted(this.value()));

  protected readonly effectiveAriaLabel = computed(() => {
    const explicit = this.ariaLabel();
    if (explicit) return explicit;
    const label = this.label();
    const summary = `${this.displayValue()} of ${this.formatted(this.max())}`;
    return label ? `${label}: ${summary}` : `Gauge: ${summary}`;
  });

  protected readonly valueFontSize = computed(() => {
    const map: Record<GaugeSize, string> = { sm: '1rem', md: '1.5rem', lg: '2rem' };
    return map[this.size()];
  });

  protected readonly labelFontSize = computed(() => {
    const map: Record<GaugeSize, string> = { sm: '0.625rem', md: '0.75rem', lg: '0.875rem' };
    return map[this.size()];
  });
}
