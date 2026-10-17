import { ChangeDetectionStrategy, Component } from '@angular/core';
import { IconComponent } from '@lifecorner/angular-ui-kit/icon';

/**
 * Fetched icons (AC-12): a Tabler asset, a name the server answers with its
 * index.html fallback, and one it answers with a crafted SVG.
 */
@Component({
  selector: 'tt-fetched',
  imports: [IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <h1>Geladene Icons</h1>
    <lc-icon id="tt-anchor" name="anchor" ariaLabel="Anker" />
    <lc-icon id="tt-typo" name="lc-typo-icon" ariaLabel="Tippfehler" />
    <lc-icon id="tt-crafted" name="lc-crafted" ariaLabel="Präpariert" />
  `,
})
export class TtFetched {}
