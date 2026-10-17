import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CodeBlockComponent } from '@lifecorner/angular-ui-kit/code-block';

/** The lazy route of the code-block measurement (AC-12): one lc-code-block and nothing else of the kit. */
@Component({
  selector: 'lc-bundle-code-page',
  imports: [CodeBlockComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<lc-code-block [code]="code" language="typescript" filename="app.ts" />`,
})
export class CodePage {
  protected readonly code = "import { inject } from '@angular/core';\n\nconst answer = 42; // note";
}
