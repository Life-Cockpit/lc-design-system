import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

/**
 * A page inside `lc-app-shell`: the `<main>` landmark with the page's content
 * centred at a reading width, and an optional right column docked to the
 * window's right edge (LK-6).
 *
 * - `<main [id]="mainId">` holds the default slot as a column (24 px apart,
 *   40 px from 1024 px), centred and capped at `contentMaxWidth` (880 px of
 *   content). Side padding 24 · 32 · 48 · 56 · 72 · 96 px at 360 · 640 ·
 *   1024 · 1280 · 1440 · 1920 px.
 * - `[page-aside]` is the right column: an `<aside>` AFTER `<main>` in the DOM,
 *   shown from 1280 px at 360 px (400 from 1440, 460 from 1920; override
 *   with `--lc-app-page-aside-width`), with a tint and a hairline that fade
 *   downwards; inside `lc-app-shell` they start at the top of the window,
 *   behind a transparent header. Below 1280 px it is hidden: show the page's narrow equivalent
 *   inside main instead (e.g. a member row). It renders only with an
 *   accessible name — `asideLabelledby` (the id of its heading) or
 *   `asideAriaLabel`.
 * - `busy` marks the page as loading: `aria-busy="true"` on `<main>` while a
 *   skeleton stands in for the content (AS-12). No visual change.
 *
 * @example
 * ```html
 * <lc-app-page asideLabelledby="members-title">
 *   <lc-page-header … />
 *   <lc-next-step-card … />
 *   <section page-aside>
 *     <h2 id="members-title">Mitglieder</h2>
 *     <lc-list [items]="members" />
 *   </section>
 * </lc-app-page>
 * ```
 */
@Component({
  selector: 'lc-app-page',
  standalone: true,
  templateUrl: './app-page.component.html',
  styleUrl: './app-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppPageComponent {
  /** Id of the `<main>` element (the skip link's target). */
  readonly mainId = input('main');

  /**
   * Widest the page content gets (CSS length; `none` for no cap). The default
   * keeps lines readable on wide screens: the page gains air, not line length.
   */
  readonly contentMaxWidth = input('880px');

  /** Id of the heading that names the right column (`aria-labelledby`). */
  readonly asideLabelledby = input('');

  /** Accessible name of the right column when it has no visible heading. */
  readonly asideAriaLabel = input('');

  /**
   * Marks the page as loading: `aria-busy="true"` on its `<main>` while
   * `true`, no attribute while `false`. Set it while a skeleton stands in for
   * the content. Screen readers may hold back changes inside a busy region
   * until it clears, so a loading message that must be heard belongs outside
   * `<main>` (for example a `.sr-only` `role="status"` next to the page) or is
   * static text. No visual change.
   * @default false
   */
  readonly busy = input(false);

  /** The right column renders only when it has an accessible name. */
  protected readonly hasAside = computed(() => !!(this.asideLabelledby() || this.asideAriaLabel()));

  protected readonly pageClasses = computed(() => {
    const classes = ['lc-app-page'];
    if (this.hasAside()) classes.push('lc-app-page--aside');
    return classes.join(' ');
  });
}
