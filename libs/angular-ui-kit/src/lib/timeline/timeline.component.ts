import {
  ChangeDetectionStrategy,
  Component,
  input,
  computed,
} from '@angular/core';
import { IconComponent } from '../icon/icon.component';

export interface TimelineItem {
  /** Optional stable identity for rendering (falls back to the list index). */
  id?: string;
  /** Title of the event */
  title: string;
  /** Optional description */
  description?: string;
  /** Optional timestamp string */
  timestamp?: string;
  /** Optional icon name (heroicon) */
  icon?: string;
  /** Optional color for the dot/icon */
  color?: 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'info' | 'neutral';
}

export type TimelineOrientation = 'vertical' | 'horizontal';

/**
 * Timeline component for chronological event display.
 *
 * Features:
 * - Vertical timeline with connecting line
 * - Semantic status colors per event (info, success, warning, error)
 * - Date and description display per item
 * - Icon support for timeline markers
 * - Dark mode support
 *
 * @example
 * ```html
 * <lc-timeline [items]="events"></lc-timeline>
 * ```
 */
@Component({
  selector: 'lc-timeline',
  standalone: true,
  imports: [IconComponent],
  templateUrl: './timeline.component.html',
  styleUrls: ['./timeline.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TimelineComponent {
  /**
   * List of timeline events.
   */
  items = input.required<TimelineItem[]>();

  /**
   * Layout orientation.
   * @default 'vertical'
   */
  orientation = input<TimelineOrientation>('vertical');

  /**
   * Compact mode reduces spacing.
   * @default false
   */
  compact = input<boolean>(false);

  protected timelineClasses = computed(() => {
    return [
      'timeline',
      `timeline--${this.orientation()}`,
      this.compact() ? 'timeline--compact' : '',
    ]
      .filter(Boolean)
      .join(' ');
  });
}
