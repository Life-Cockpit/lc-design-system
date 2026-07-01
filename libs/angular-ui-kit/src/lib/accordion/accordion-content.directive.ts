import { Directive, TemplateRef, inject } from '@angular/core';

/**
 * Marks an `<ng-template>` as the (optionally lazy) body content for an
 * `<lc-accordion>`.
 *
 * Unlike default `<ng-content>` projection — which Angular always instantiates
 * eagerly — a template referenced through this directive is only stamped out
 * when the accordion decides to render its body. That is what makes
 * `[lazy]="true"` and `[destroyOnClose]="true"` possible: expensive children
 * (HTTP-backed panels, charts, live-polling views) are not created until the
 * panel is first opened.
 *
 * @example
 * ```html
 * <lc-accordion [lazy]="true">
 *   <ng-template lcAccordionContent>
 *     <expensive-panel [id]="id" />
 *   </ng-template>
 * </lc-accordion>
 * ```
 */
@Directive({
  selector: '[lcAccordionContent]',
  standalone: true,
})
export class AccordionContentDirective {
  public readonly template = inject(TemplateRef<unknown>);
}
