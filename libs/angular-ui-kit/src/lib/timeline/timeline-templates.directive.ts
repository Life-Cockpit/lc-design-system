import { Directive, TemplateRef, inject } from '@angular/core';
import type { TimelineItem } from './timeline.component';

/** Template context for the per-item timeline templates. */
export interface TimelineTemplateContext {
  $implicit: TimelineItem;
}

/**
 * Free content slot rendered below an entry's header line — arbitrary markup
 * per item (code block, prose, collapsible text, diff), not just a
 * description string. The template receives the item as `$implicit`.
 *
 * @example
 * ```html
 * <lc-timeline [items]="steps">
 *   <ng-template lcTimelineContent let-item>
 *     @if (item.state === 'failed') {
 *       <lc-code-block [code]="item.command" language="bash" />
 *     }
 *   </ng-template>
 * </lc-timeline>
 * ```
 */
@Directive({
  selector: '[lcTimelineContent]',
  standalone: true,
})
export class TimelineContentDirective {
  public readonly template = inject(TemplateRef<TimelineTemplateContext>);
}

/**
 * Live meta slot rendered right-aligned in an entry's header line — for
 * values the app keeps ticking itself ("läuft seit 42 s"). Takes precedence
 * over the item's static `meta` string.
 *
 * @example
 * ```html
 * <lc-timeline [items]="steps">
 *   <ng-template lcTimelineMeta let-item>
 *     @if (item.state === 'running') { {{ elapsed() }} }
 *     @else { {{ item.meta }} }
 *   </ng-template>
 * </lc-timeline>
 * ```
 */
@Directive({
  selector: '[lcTimelineMeta]',
  standalone: true,
})
export class TimelineMetaDirective {
  public readonly template = inject(TemplateRef<TimelineTemplateContext>);
}
