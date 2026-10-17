import {
  ChangeDetectionStrategy,
  Component,
  inject,
  input,
  computed,
  signal,
} from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { IconComponent } from '@lifecorner/angular-ui-kit/icon';

export type CodeBlockLanguage =
  | 'typescript'
  | 'javascript'
  | 'html'
  | 'css'
  | 'scss'
  | 'json'
  | 'bash'
  | 'python'
  | 'java'
  | 'text';

interface TokenRule {
  pattern: RegExp;
  className: string;
}

const SHARED_RULES: TokenRule[] = [
  // Strings (double/single/backtick)
  { pattern: /`(?:[^`\\]|\\.)*`/g, className: 'token-string' },
  { pattern: /"(?:[^"\\]|\\.)*"/g, className: 'token-string' },
  { pattern: /'(?:[^'\\]|\\.)*'/g, className: 'token-string' },
  // Numbers
  { pattern: /\b\d+(?:\.\d+)?\b/g, className: 'token-number' },
];

const LANGUAGE_RULES: Record<string, TokenRule[]> = {
  typescript: [
    { pattern: /\/\/.*$/gm, className: 'token-comment' },
    { pattern: /\/\*[\s\S]*?\*\//g, className: 'token-comment' },
    ...SHARED_RULES,
    { pattern: /@\w+/g, className: 'token-decorator' },
    { pattern: /\b(?:import|export|from|const|let|var|function|return|if|else|for|while|class|interface|type|enum|extends|implements|new|this|super|async|await|yield|of|in|as|is|readonly|public|private|protected|static|abstract|override|get|set|constructor|declare|namespace|module|require)\b/g, className: 'token-keyword' },
    { pattern: /\b(?:string|number|boolean|void|null|undefined|never|any|unknown|object|symbol|bigint)\b/g, className: 'token-type' },
    { pattern: /\b(?:true|false|null|undefined|NaN|Infinity)\b/g, className: 'token-constant' },
    { pattern: /(?<=\b(?:class|interface|type|enum|extends|implements)\s+)\w+/g, className: 'token-type' },
  ],
  javascript: [
    { pattern: /\/\/.*$/gm, className: 'token-comment' },
    { pattern: /\/\*[\s\S]*?\*\//g, className: 'token-comment' },
    ...SHARED_RULES,
    { pattern: /\b(?:import|export|from|const|let|var|function|return|if|else|for|while|class|extends|new|this|super|async|await|yield|of|in|typeof|instanceof|delete|throw|try|catch|finally|switch|case|default|break|continue|do)\b/g, className: 'token-keyword' },
    { pattern: /\b(?:true|false|null|undefined|NaN|Infinity)\b/g, className: 'token-constant' },
  ],
  html: [
    { pattern: /<!--[\s\S]*?-->/g, className: 'token-comment' },
    ...SHARED_RULES,
    { pattern: /&lt;\/?[\w-]+/g, className: 'token-tag' },
    { pattern: /\/?&gt;/g, className: 'token-tag' },
    { pattern: /\b[\w-]+(?==)/g, className: 'token-attr' },
  ],
  css: [
    { pattern: /\/\*[\s\S]*?\*\//g, className: 'token-comment' },
    ...SHARED_RULES,
    { pattern: /[.#][\w-]+/g, className: 'token-selector' },
    { pattern: /\b(?:px|rem|em|%|vh|vw|s|ms|deg|fr)\b/g, className: 'token-unit' },
    { pattern: /[\w-]+(?=\s*:)/g, className: 'token-property' },
  ],
  scss: [
    { pattern: /\/\/.*$/gm, className: 'token-comment' },
    { pattern: /\/\*[\s\S]*?\*\//g, className: 'token-comment' },
    ...SHARED_RULES,
    { pattern: /\$[\w-]+/g, className: 'token-variable' },
    { pattern: /@(?:use|forward|import|mixin|include|extend|if|else|each|for|while|function|return)\b/g, className: 'token-keyword' },
    { pattern: /&/g, className: 'token-selector' },
    { pattern: /[.#][\w-]+/g, className: 'token-selector' },
  ],
  json: [
    ...SHARED_RULES,
    { pattern: /\b(?:true|false|null)\b/g, className: 'token-constant' },
    { pattern: /"(?:[^"\\]|\\.)*"(?=\s*:)/g, className: 'token-property' },
  ],
  bash: [
    { pattern: /#.*$/gm, className: 'token-comment' },
    ...SHARED_RULES,
    { pattern: /\$[\w{][\w}]*/g, className: 'token-variable' },
    { pattern: /\b(?:if|then|else|elif|fi|for|do|done|while|until|case|esac|function|in|select|time|coproc)\b/g, className: 'token-keyword' },
    { pattern: /(?:^|\s)(?:npm|npx|yarn|pnpm|git|cd|ls|mkdir|rm|cp|mv|echo|cat|grep|find|sed|awk|curl|wget|docker|node|python|pip|brew|apt|sudo)\b/g, className: 'token-builtin' },
    { pattern: /--?[\w-]+/g, className: 'token-flag' },
  ],
  python: [
    { pattern: /#.*$/gm, className: 'token-comment' },
    { pattern: /"""[\s\S]*?"""/g, className: 'token-string' },
    { pattern: /'''[\s\S]*?'''/g, className: 'token-string' },
    ...SHARED_RULES,
    { pattern: /@\w+/g, className: 'token-decorator' },
    { pattern: /\b(?:def|class|import|from|as|return|if|elif|else|for|while|break|continue|pass|raise|try|except|finally|with|yield|lambda|assert|del|global|nonlocal|async|await|in|not|and|or|is)\b/g, className: 'token-keyword' },
    { pattern: /\b(?:True|False|None)\b/g, className: 'token-constant' },
    { pattern: /\b(?:str|int|float|bool|list|dict|tuple|set|bytes|type|object|Exception|ValueError|TypeError|KeyError|IndexError|AttributeError|RuntimeError|StopIteration)\b/g, className: 'token-type' },
    { pattern: /\b(?:print|len|range|enumerate|zip|map|filter|sorted|reversed|isinstance|issubclass|hasattr|getattr|setattr|super|property|staticmethod|classmethod|open|input)\b/g, className: 'token-builtin' },
    { pattern: /\bself\b/g, className: 'token-variable' },
  ],
  java: [
    { pattern: /\/\/.*$/gm, className: 'token-comment' },
    { pattern: /\/\*[\s\S]*?\*\//g, className: 'token-comment' },
    ...SHARED_RULES,
    { pattern: /@\w+/g, className: 'token-decorator' },
    { pattern: /\b(?:abstract|assert|break|case|catch|class|continue|default|do|else|enum|extends|final|finally|for|if|implements|import|instanceof|interface|native|new|package|private|protected|public|return|static|strictfp|super|switch|synchronized|this|throw|throws|transient|try|volatile|while|var|record|sealed|permits|yield)\b/g, className: 'token-keyword' },
    { pattern: /\b(?:true|false|null)\b/g, className: 'token-constant' },
    { pattern: /\b(?:void|int|long|short|byte|float|double|char|boolean|String|Integer|Long|Double|Float|Boolean|Character|Object|Class|List|Map|Set|ArrayList|HashMap|HashSet|Optional|Stream|Collectors)\b/g, className: 'token-type' },
    { pattern: /\b(?:System|Math|Arrays|Collections|Objects|Thread|Runnable)\b/g, className: 'token-builtin' },
  ],
};

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function highlightCode(code: string, language: string): string {
  const escaped = escapeHtml(code);
  const rules = LANGUAGE_RULES[language];
  if (!rules) return escaped;

  // Collect all matches with positions
  const tokens: { start: number; end: number; className: string; text: string }[] = [];

  for (const rule of rules) {
    const regex = new RegExp(rule.pattern.source, rule.pattern.flags);
    let match: RegExpExecArray | null;
    while ((match = regex.exec(escaped)) !== null) {
      tokens.push({
        start: match.index,
        end: match.index + match[0].length,
        className: rule.className,
        text: match[0],
      });
    }
  }

  // Sort by start position, longer matches first for same position
  tokens.sort((a, b) => a.start - b.start || b.end - a.end);

  // Remove overlapping tokens (keep first/longest)
  const filtered: typeof tokens = [];
  let lastEnd = 0;
  for (const token of tokens) {
    if (token.start >= lastEnd) {
      filtered.push(token);
      lastEnd = token.end;
    }
  }

  // Build highlighted string
  let result = '';
  let cursor = 0;
  for (const token of filtered) {
    if (token.start > cursor) {
      result += escaped.slice(cursor, token.start);
    }
    result += `<span class="${token.className}">${token.text}</span>`;
    cursor = token.end;
  }
  result += escaped.slice(cursor);

  return result;
}

@Component({
  selector: 'lc-code-block',
  standalone: true,
  imports: [IconComponent],
  templateUrl: './code-block.component.html',
  styleUrls: ['./code-block.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
/**
 * Code block component for displaying syntax-highlighted source code.
 *
 * Features:
 * - Syntax highlighting for 10+ languages (TypeScript, Python, Java, etc.)
 * - Optional line numbers
 * - Copy-to-clipboard button
 * - Optional header with filename and language label
 * - Dark-mode compatible color scheme
 *
 * @example
 * ```html
 * <lc-code-block [code]="source" language="typescript" [showLineNumbers]="true" />
 * ```
 */
export class CodeBlockComponent {
  /** Code content to display */
  code = input.required<string>();

  /** Language label */
  language = input<CodeBlockLanguage>('text');

  /** Optional filename to display */
  filename = input<string>();

  /** Whether to show line numbers */
  showLineNumbers = input<boolean>(true);

  /** Whether to show copy button */
  showCopy = input<boolean>(true);

  /** Whether the code block has a header bar */
  showHeader = input<boolean>(true);

  /** Visible label of the copy button. */
  copyLabel = input('Copy');

  /** Accessible name of the copy button. */
  copyAriaLabel = input('Copy code');

  /** Label of the copy button after copying (also its accessible name). */
  copiedLabel = input('Copied');

  /** Announced to screen readers after copying. */
  copiedAnnouncement = input('Copied to clipboard');

  protected copied = signal(false);

  private readonly sanitizer = inject(DomSanitizer);

  protected highlightedLines = computed<SafeHtml[]>(() => {
    const highlighted = highlightCode(this.code(), this.language());
    return highlighted.split('\n').map(line =>
      this.sanitizer.bypassSecurityTrustHtml(line || '&nbsp;')
    );
  });

  protected lineNumbers = computed(() => {
    return this.code().split('\n').map((_, i) => i + 1);
  });

  protected headerLabel = computed(() => {
    return this.filename() || this.language();
  });

  protected codeClasses = computed(() => {
    return ['code-block', `code-block--${this.language()}`].join(' ');
  });

  protected async copyToClipboard(): Promise<void> {
    try {
      await navigator.clipboard.writeText(this.code());
      this.copied.set(true);
      setTimeout(() => this.copied.set(false), 2000);
    } catch {
      // Fallback: just ignore if clipboard API not available
    }
  }
}
