import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CodeBlockComponent } from '@lifecorner/angular-ui-kit/code-block';

/**
 * Code blocks (3.6.1, request 003, AS-20): the tokens are elements, so the
 * blocks render under Trusted Types. TypeScript with an empty line and line
 * numbers, HTML with markup and an entity as text (no line numbers), and bash
 * with an empty line before a command. `data-code` holds the source the
 * rendered text is compared with. 3.7 (request 004, AS-21): each body is a
 * named region and a tab stop; the TypeScript block names it with
 * `regionLabel`, the others fall back to the language.
 */
@Component({
  selector: 'tt-code',
  imports: [CodeBlockComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <h1>Code</h1>
    <lc-code-block id="tt-code-ts" [attr.data-code]="ts" [code]="ts" language="typescript" filename="gruss.ts"
                   regionLabel="Beispielcode" copyLabel="Kopieren" copyAriaLabel="Code kopieren" copiedLabel="Kopiert"
                   copiedAnnouncement="In die Zwischenablage kopiert" />
    <lc-code-block id="tt-code-html" [attr.data-code]="html" [code]="html" language="html" [showLineNumbers]="false" />
    <lc-code-block id="tt-code-bash" [attr.data-code]="bash" [code]="bash" language="bash" [showLineNumbers]="false" />
  `,
})
export class TtCode {
  protected readonly ts = [
    "const greeting = 'Hallo';",
    '',
    'export function greet(name: string): string {',
    '  return greeting + ", " + name; // Gruß',
    '}',
  ].join('\n');
  protected readonly html = '<a href="x">&amp; "q"</a>';
  protected readonly bash = 'npm install @lifecorner/angular-ui-kit\n\nnpm test';
}
