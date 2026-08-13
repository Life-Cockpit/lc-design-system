import { Component, ChangeDetectionStrategy, ViewEncapsulation, input, computed } from '@angular/core';

export type StatusDotTone = 'done' | 'run' | 'wait' | 'blocked' | 'open';
export type StatusDotSize = 'sm' | 'md';

/**
 * Status dot — the small traffic-light atom used in list rows, rails and
 * boards to signal an item's state at a glance.
 *
 * Features:
 * - Five semantic tones: done (success), run (brand teal), wait (warning),
 *   blocked (error), open (neutral)
 * - Optional pulse animation for "in progress" states (static under
 *   prefers-reduced-motion)
 * - Decorative by default (aria-hidden); pass `label` to expose the state
 *   to assistive technology
 *
 * @example
 * ```html
 * <lc-status-dot tone="run" [pulse]="true" label="In Arbeit" />
 * <lc-status-dot tone="blocked" />
 * ```
 */
@Component({
  selector: 'lc-status-dot',
  standalone: true,
  imports: [],
  templateUrl: './status-dot.component.html',
  styleUrl: './status-dot.component.scss',
  encapsulation: ViewEncapsulation.None, // Required for dynamic tone class styling
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StatusDotComponent {
  /** Semantic tone of the dot */
  readonly tone = input<StatusDotTone>('open');

  /** Size of the dot (sm = 6px for dense list rows, md = 8px) */
  readonly size = input<StatusDotSize>('md');

  /**
   * Pulse animation for "in progress" states. Renders static under
   * prefers-reduced-motion.
   * @default false
   */
  readonly pulse = input(false);

  /**
   * Accessible label for the state (e.g. "In Arbeit"). Without it the dot is
   * treated as decorative and hidden from assistive technology.
   */
  readonly label = input('');

  readonly dotClasses = computed(() => {
    const classes = ['lc-status-dot', `lc-status-dot--${this.tone()}`, `lc-status-dot--${this.size()}`];
    if (this.pulse()) {
      classes.push('lc-status-dot--pulse');
    }
    return classes.join(' ');
  });
}
