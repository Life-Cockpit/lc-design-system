import { Component, input, computed, HostBinding, ChangeDetectionStrategy } from '@angular/core';

/** Where the layout takes its height from. */
export type PageLayoutFill = 'screen' | 'parent';

/** How wide the layout lets its content grow. */
export type PageLayoutContentWidth = 'capped' | 'full';

@Component({
  selector: 'lc-page-layout',
  standalone: true,
  imports: [],
  templateUrl: './page-layout.component.html',
  styleUrls: ['./page-layout.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
/**
 * Full-height page shell that pins a header (and optional footer) while the
 * body fills the remaining space and scrolls *internally* — the page itself
 * never scrolls.
 *
 * It encapsulates the "height chain" that this kind of layout needs: a flex
 * column with `height: 100dvh`/`100%`, `overflow: hidden` on the shell, and —
 * crucially — `min-height: 0` on the body so it can shrink below its content
 * and become the scroll container instead of pushing the page taller.
 *
 * Content is projected into three slots:
 * - `[layout-header]` — pinned to the top (e.g. `<lc-page-header>`).
 * - default slot — the body; fills the remaining height and scrolls.
 * - `[layout-footer]` — pinned to the bottom (e.g. a chat input bar).
 *
 * Children that bring their own internal scroll + sticky footer (such as
 * `<lc-chat>`) just need `height: 100%`, which they get for free from the body.
 *
 * @example Generic long content under a fixed header
 * ```html
 * <lc-page-layout padded>
 *   <lc-page-header layout-header title="Reports" />
 *   <p>…lots of content that scrolls under the header…</p>
 * </lc-page-layout>
 * ```
 *
 * @example Chat at 100% height, input pinned at the bottom
 * ```html
 * <lc-page-layout>
 *   <lc-page-header layout-header title="Assistant" />
 *   <lc-chat [messages]="messages" [showHeader]="false" (messageSend)="onSend($event)" />
 * </lc-page-layout>
 * ```
 *
 * @example Nested below an app shell with topbar / sidenav
 * ```html
 * <!-- every ancestor must also pass the height down (height:100% / flex:1) -->
 * <lc-page-layout fill="parent"> … </lc-page-layout>
 * ```
 */
export class PageLayoutComponent {
  /**
   * Source of the layout's height.
   * - `'screen'` (default): `100dvh` — fills the viewport. Use as the page root.
   * - `'parent'`: `100%` — fills its parent. Use when nested below an app shell;
   *   every ancestor must also carry the height down.
   */
  fill = input<PageLayoutFill>('screen');

  /**
   * Whether the body region scrolls internally. Defaults to `true`, which is
   * correct both for long page content and for children like `<lc-chat>` that
   * fit the body exactly (no scrollbar appears in that case). Set `false` for
   * full-bleed bodies that must never scroll (e.g. a map).
   */
  scrollBody = input<boolean>(true);

  /** Add density-aware padding to the body. Off by default so embedded components keep their own padding. */
  padded = input<boolean>(false);

  /**
   * How wide content may grow on very large monitors.
   * - `'capped'` (default): header, body and footer are capped at
   *   `--lc-content-max-width` and centred, so content doesn't stretch edge to
   *   edge on wide/ultrawide displays. All three regions share the cap, so the
   *   page title stays aligned with the body beneath it.
   * - `'full'`: no cap — content spans the whole shell. Use for full-bleed
   *   bodies (maps, boards, canvases) that should use every pixel.
   *
   * Override the width itself — globally or per subtree — via the
   * `--lc-content-max-width` custom property.
   */
  contentWidth = input<PageLayoutContentWidth>('capped');

  @HostBinding('class')
  get hostClasses(): string {
    return this.classes();
  }

  classes = computed(() => {
    const classes: string[] = ['lc-page-layout'];
    classes.push(`fill-${this.fill()}`);
    if (this.scrollBody()) classes.push('scroll-body');
    if (this.padded()) classes.push('padded');
    if (this.contentWidth() === 'capped') classes.push('content-capped');
    return classes.join(' ');
  });
}
