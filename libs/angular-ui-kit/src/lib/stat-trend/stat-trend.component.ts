import {
  ChangeDetectionStrategy,
  Component,
  input,
  computed,
} from '@angular/core';
import { SparklineComponent, SparklineColor } from '@lifecorner/angular-ui-kit/sparkline';
import { IconComponent } from '@lifecorner/angular-ui-kit/icon';

export type StatTrendDirection = 'up' | 'down' | 'neutral';

@Component({
  selector: 'lc-stat-trend',
  standalone: true,
  imports: [SparklineComponent, IconComponent],
  templateUrl: './stat-trend.component.html',
  styleUrls: ['./stat-trend.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
/**
 * Stat trend component for displaying KPI values with change indicators.
 *
 * Features:
 * - Value display with label and optional icon
 * - Change percentage with auto-detected trend direction (up/down/neutral)
 * - Color-coded trend indicator (green for up, red for down)
 * - Optional embedded sparkline chart
 * - Configurable sparkline color theme
 *
 * @example
 * ```html
 * <lc-stat-trend label="Revenue" value="$42,350" change="+12.5%" [sparklineData]="data" />
 * ```
 */
export class StatTrendComponent {
  /** Main KPI label. */
  label = input<string>('');

  /** Main KPI value to display. */
  value = input.required<string>();

  /** Change value text, e.g. "+12%" or "-3.5%". */
  change = input<string>('');

  /** Trend direction for color coding. Auto-detected from change if not set. */
  direction = input<StatTrendDirection | undefined>(undefined);

  /** Sparkline data points. If empty, no sparkline is shown. */
  sparklineData = input<number[]>([]);

  /** Color of the sparkline. Auto-matched to trend direction if not set. */
  sparklineColor = input<SparklineColor | undefined>(undefined);

  /** Optional icon name (Tabler icon). */
  icon = input<string>('');

  protected readonly resolvedDirection = computed<StatTrendDirection>(() => {
    const dir = this.direction();
    if (dir) return dir;
    const c = this.change();
    if (c.startsWith('+') || c.startsWith('↑')) return 'up';
    if (c.startsWith('-') || c.startsWith('↓')) return 'down';
    return 'neutral';
  });

  protected readonly trendColorClass = computed(() => {
    const map: Record<StatTrendDirection, string> = {
      up: 'lc-stat-trend__change--up',
      down: 'lc-stat-trend__change--down',
      neutral: 'lc-stat-trend__change--neutral',
    };
    return map[this.resolvedDirection()];
  });

  protected readonly resolvedSparklineColor = computed<SparklineColor>(() => {
    const c = this.sparklineColor();
    if (c) return c;
    const map: Record<StatTrendDirection, SparklineColor> = {
      up: 'success',
      down: 'error',
      neutral: 'info',
    };
    return map[this.resolvedDirection()];
  });

  protected readonly trendIcon = computed(() => {
    const map: Record<StatTrendDirection, string> = {
      up: '↑',
      down: '↓',
      neutral: '→',
    };
    return map[this.resolvedDirection()];
  });

  protected readonly hasSparkline = computed(() => this.sparklineData().length >= 2);
}
