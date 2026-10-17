import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

/** The root: `''` is the broad page on the primary entry, `/tt` the F1 pages on secondary entries. */
@Component({
  selector: 'lc-compat-root',
  imports: [RouterOutlet],
  template: '<router-outlet />',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class App {}
