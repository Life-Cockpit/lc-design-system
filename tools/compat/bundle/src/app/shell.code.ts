import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

/**
 * A bare shell for the code-block measurement (3.6.1, request 003, AC-12):
 * no kit component in the initial chunks, only the router outlet of the lazy
 * route in app.config.code.ts.
 */
@Component({
  selector: 'lc-bundle-root',
  imports: [RouterOutlet],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<router-outlet />`,
})
export class Shell {}
