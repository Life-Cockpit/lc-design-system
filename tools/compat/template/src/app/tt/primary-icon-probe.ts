import { ChangeDetectionStrategy, Component } from '@angular/core';
// The one place under /tt that imports from the PRIMARY entry for a component
// (AC-13): the same lc-icon class as `/icon`, so one module and one policy.
import { IconComponent as PrimaryIconComponent } from '@lifecorner/angular-ui-kit';
import { IconComponent as EntryIconComponent } from '@lifecorner/angular-ui-kit/icon';

@Component({
  selector: 'tt-primary-icon',
  imports: [PrimaryIconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<div id="tt-primary-icon" [attr.data-same-class]="sameClass"><lc-icon name="home" ariaLabel="Start (primär)" /></div>`,
})
export class PrimaryIconProbe {
  protected readonly sameClass = String(PrimaryIconComponent === EntryIconComponent);
}
