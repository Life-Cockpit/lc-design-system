import { ChangeDetectionStrategy, Component } from '@angular/core';
import { IconComponent } from '@lifecorner/angular-ui-kit/icon';
import { INLINE_ICONS } from './inline-icons';
import { PrimaryIconProbe } from './primary-icon-probe';

/** Every inline icon the kit ships, in each variant it ships (AC-10 a), plus the primary-entry probe (AC-13). */
@Component({
  selector: 'tt-icons',
  imports: [IconComponent, PrimaryIconProbe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <h1>Icons</h1>
    <tt-primary-icon />
    <ul class="tt-icons" style="display: flex; flex-wrap: wrap; gap: 8px; list-style: none; padding: 0;">
      @for (icon of icons; track icon.join(':')) {
        <li><lc-icon [name]="icon[0]" [variant]="icon[1]" [ariaLabel]="icon[0] + ' ' + icon[1]" [attr.data-icon]="icon[0] + ':' + icon[1]" /></li>
      }
    </ul>
  `,
})
export class TtIcons {
  protected readonly icons = INLINE_ICONS;
}
