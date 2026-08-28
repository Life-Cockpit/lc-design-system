import {
  ChangeDetectionStrategy,
  Component,
  contentChild,
  input,
  computed,
} from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { IconComponent } from '../icon/icon.component';
import { BadgeComponent, BadgeVariant } from '../badge/badge.component';
import {
  TimelineContentDirective,
  TimelineMetaDirective,
} from './timeline-templates.directive';

/**
 * Semantic state of a timeline entry (e.g. one step of a run transcript).
 * Drives the marker color via the semantic tokens; `running` additionally
 * pulses (respecting `prefers-reduced-motion`).
 */
export type TimelineItemState = 'success' | 'running' | 'failed' | 'pending';

export interface TimelineItem {
  /** Optional stable identity for rendering (falls back to the list index). */
  id?: string;
  /** Title of the event */
  title: string;
  /** Optional monospace suffix after the title (e.g. a tool id like `gate_test`). */
  titleMono?: string;
  /** Optional badge label in the header line (e.g. "Fehlgeschlagen"). */
  badge?: string;
  /** Variant of the header badge. @default 'default' */
  badgeVariant?: BadgeVariant;
  /** Optional right-aligned header meta (duration / time). */
  meta?: string;
  /** Optional description */
  description?: string;
  /** Optional timestamp string */
  timestamp?: string;
  /** Optional icon name (heroicon) */
  icon?: string;
  /** Optional color for the dot/icon */
  color?: 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'info' | 'neutral';
  /**
   * Semantic entry state — colors the marker from the semantic tokens and
   * takes precedence over `color`. `running` pulses the marker.
   */
  state?: TimelineItemState;
}

export type TimelineOrientation = 'vertical' | 'horizontal';

/** Marker color class per entry state. */
const STATE_COLORS: Record<TimelineItemState, string> = {
  success: 'success',
  running: 'primary',
  failed: 'error',
  pending: 'neutral',
};

/**
 * Timeline component for chronological event display.
 *
 * Features:
 * - Vertical timeline with connecting line
 * - Semantic status colors per event (info, success, warning, error)
 * - Entry states (`success | running | failed | pending`); `running` pulses
 * - Composable header line: title + monospace suffix (`titleMono`) + badge
 *   (`badge`/`badgeVariant`) + right-aligned meta (`meta` or the
 *   `lcTimelineMeta` template for live values)
 * - Free content per entry below the header via the `lcTimelineContent`
 *   template (code blocks, prose, diffs, …)
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
  imports: [IconComponent, BadgeComponent, NgTemplateOutlet],
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

  /** Optional per-item content template (below the header line). */
  protected contentTemplate = contentChild(TimelineContentDirective);

  /** Optional per-item live meta template (right-aligned in the header). */
  protected metaTemplate = contentChild(TimelineMetaDirective);

  protected timelineClasses = computed(() => {
    return [
      'timeline',
      `timeline--${this.orientation()}`,
      this.compact() ? 'timeline--compact' : '',
    ]
      .filter(Boolean)
      .join(' ');
  });

  protected markerClasses(item: TimelineItem): string {
    const color = item.state ? STATE_COLORS[item.state] : item.color || 'primary';
    return [
      'timeline__marker',
      `timeline__marker--${color}`,
      item.state === 'running' ? 'timeline__marker--running' : '',
    ]
      .filter(Boolean)
      .join(' ');
  }
}
