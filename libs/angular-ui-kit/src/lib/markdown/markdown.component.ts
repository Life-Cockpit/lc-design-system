import {
  Component,
  ChangeDetectionStrategy,
  input,
  output,
  computed,
  signal,
  effect,
  untracked,
  inject,
  ElementRef,
  OnDestroy,
  SecurityContext,
  ViewEncapsulation,
} from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { HttpClient } from '@angular/common/http';
import { Subscription } from 'rxjs';
import { CodeBlockComponent, CodeBlockLanguage } from '../code-block/code-block.component';
import { isSafeImageUrl, isSafeLinkUrl } from '../shared/safe-url';

export interface MarkdownHeading {
  level: number;
  text: string;
  id: string;
}

export interface MarkdownLinkClick {
  href: string;
  event: MouseEvent;
}

export interface MarkdownRendered {
  headings: MarkdownHeading[];
}

export interface MarkdownChangesHighlighted {
  /** Number of changed/added blocks highlighted in the current render. */
  changedBlocks: number;
}

export interface RenderPart {
  type: 'html' | 'code' | 'mermaid';
  index: number;
  safeHtml?: SafeHtml;
  code?: string;
  lang?: CodeBlockLanguage;
}

/**
 * Stand-in for a fenced code block while the rest of the markdown is processed.
 * Bracketed in NUL characters, which the source is stripped of first — so no
 * text a user writes can ever spell a placeholder and be mistaken for a block.
 * (The earlier `<!--CODE_BLOCK_N-->` form was: an escaped literal comment in
 * the text matched it and dereferenced a block that wasn't there.)
 */
const BLOCK_MARK = '\u0000';
const blockPlaceholder = (idx: number): string => `${BLOCK_MARK}LCBLOCK${idx}${BLOCK_MARK}`;
// eslint-disable-next-line no-control-regex -- the NUL bracket is the point: unforgeable
const BLOCK_PLACEHOLDER = /\u0000LCBLOCK(\d+)\u0000/g;

/** Instances numbered so their mermaid render ids never collide on one page. */
let markdownInstances = 0;

/**
 * Markdown renderer component.
 *
 * Renders GitHub-Flavored Markdown (GFM) to sanitized HTML with
 * optional syntax highlighting via `<lc-code-block>`.
 *
 * Supports headings (+ anchors), paragraphs, ordered/unordered lists, task lists
 * (`- [ ]` / `- [x]` → accessible checkbox), blockquotes, horizontal rules,
 * images, GFM tables (column alignment + horizontal scroll), bold/italic/
 * strikethrough, inline code, fenced code (incl. `mermaid`), explicit links and
 * autolinks (bare URLs / `www.` / emails, never inside code).
 *
 * Optionally highlights *changed* blocks in place: pass the pre-edit markdown as
 * `previousContent` and set `highlightChanges` — added/edited blocks (diffed at
 * block / list-item level) gain a left accent bar + subtle tint, can auto-fade
 * (`changeHighlightFadeMs`) and scroll into view (`scrollToFirstChange`).
 *
 * @example
 * ```html
 * <lc-markdown [content]="'# Hello World'" />
 * <lc-markdown [src]="'/docs/readme.md'" />
 * <lc-markdown
 *   [content]="current" [previousContent]="prev"
 *   [highlightChanges]="true" [changeHighlightFadeMs]="3000" />
 * ```
 */
@Component({
  selector: 'lc-markdown',
  standalone: true,
  imports: [CodeBlockComponent],
  templateUrl: './markdown.component.html',
  styleUrls: ['./markdown.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
})
export class MarkdownComponent implements OnDestroy {
  private readonly sanitizer = inject(DomSanitizer);
  private readonly instanceId = ++markdownInstances;
  private readonly http = inject(HttpClient);
  private readonly host = inject(ElementRef<HTMLElement>);
  private httpSub?: Subscription;
  private fadeTimer?: ReturnType<typeof setTimeout>;
  private scrollTimer?: ReturnType<typeof setTimeout>;
  private mermaidApiPromise?: Promise<any>;
  private mermaidInitialized = false;
  private mermaidRenderRun = 0;

  /** URL or path to load markdown from */
  readonly src = input<string>();

  /** Raw markdown string */
  readonly content = input<string>();

  /** Display variant */
  readonly variant = input<'default' | 'compact' | 'chat'>('default');

  /** Target for links */
  readonly linkTarget = input<'_self' | '_blank'>('_self');

  /** Whether to sanitize HTML output */
  readonly sanitize = input<boolean>(true);

  /** Whether to use code-block for fenced code */
  readonly syntaxHighlight = input<boolean>(true);

  /** Whether to show anchor links on headings */
  readonly showHeadingAnchors = input<boolean>(false);

  /** Base URL for resolving relative links/images */
  readonly baseUrl = input<string>();

  // -- Change highlighting --
  /** Enable change highlighting (requires `previousContent` to compute a diff). */
  readonly highlightChanges = input<boolean>(false);

  /**
   * The prior Markdown. When it differs from `content`, the changed/added blocks
   * in `content` are highlighted. The caller passes the pre-edit markdown.
   */
  readonly previousContent = input<string>();

  /** Auto-fade the highlight after N ms. 0 / undefined ⇒ persist until content changes. */
  readonly changeHighlightFadeMs = input<number>();

  /** Scroll the first changed block into view when highlights appear. */
  readonly scrollToFirstChange = input<boolean>(false);

  /** Emitted when a link is clicked */
  readonly linkClick = output<MarkdownLinkClick>();

  /** Emitted after rendering with heading TOC */
  readonly rendered = output<MarkdownRendered>();

  /** Emitted after a render that produced change highlights. */
  readonly changesHighlighted = output<MarkdownChangesHighlighted>();

  /** Internal resolved markdown source */
  protected resolvedMarkdown = signal<string>('');

  /** Parsed result (computed once from resolvedMarkdown) */
  private parsed = computed(() => {
    const md = this.resolvedMarkdown();
    if (!md) {
      return {
        html: '',
        blocks: [] as { kind: 'code' | 'mermaid'; lang: string; code: string }[],
        headings: [] as MarkdownHeading[],
      };
    }
    return this.parseMarkdown(md);
  });

  /**
   * Rendered HTML after applying change highlights. When highlighting is off (or
   * there is no differing `previousContent`) this returns the parsed HTML
   * unchanged, so the non-highlight path is byte-for-byte identical to before.
   */
  private readonly highlightResult = computed<{ html: string; count: number }>(() => {
    const { html } = this.parsed();
    const prev = this.previousContent();
    if (
      !html ||
      !this.highlightChanges() ||
      prev == null ||
      prev === this.resolvedMarkdown()
    ) {
      return { html, count: 0 };
    }
    return this.applyChangeHighlights(html, prev);
  });

  /** Number of changed/added blocks highlighted in the current render. */
  protected readonly changedCount = computed(() => this.highlightResult().count);

  /** Visually-hidden polite summary announced when highlights appear. */
  protected readonly changeSummary = computed(() => {
    const n = this.changedCount();
    if (n <= 0) return '';
    return `${n} ${n === 1 ? 'Abschnitt' : 'Abschnitte'} geändert`;
  });

  /** Whether the current highlights have faded out (after `changeHighlightFadeMs`). */
  protected readonly highlightsFaded = signal(false);

  /** Computed render parts (HTML chunks + code blocks interleaved) */
  protected renderParts = computed<RenderPart[]>(() => {
    const html = this.highlightResult().html;
    const { blocks } = this.parsed();
    if (!html) return [];

    if (this.syntaxHighlight() && blocks.length > 0) {
      return this.splitIntoParts(html, blocks);
    }

    // No code blocks — single HTML part
    return [{
      type: 'html',
      index: 0,
      safeHtml: this.sanitizer.bypassSecurityTrustHtml(this.sanitizeHtml(html, { next: 0 })),
    }];
  });

  /**
   * The HTML as it may go into the DOM. With `sanitize` on (the default) that is
   * Angular's HTML sanitizer's output — which drops every `id`, since `id` isn't
   * on its attribute allow-list. The heading ids are put back afterwards: they
   * are what anchors and the `rendered` TOC point at, and each is a `[\w-]`
   * slug this parser produced itself, so re-adding them reopens nothing. The
   * cursor walks the parsed headings in document order across the parts.
   */
  private sanitizeHtml(html: string, cursor: { next: number }): string {
    const headings = this.headings();
    if (!this.sanitize()) {
      cursor.next += (html.match(/<h[1-6]\b/g) ?? []).length;
      return html;
    }
    const sanitized = this.sanitizer.sanitize(SecurityContext.HTML, html) || '';
    return sanitized.replace(/<h([1-6])(\s[^>]*)?>/g, (tag, level: string, attrs = '') => {
      const heading = headings[cursor.next++];
      if (!heading || /\sid=/.test(attrs)) return tag;
      return `<h${level} id="${heading.id}"${attrs}>`;
    });
  }

  protected containerClasses = computed(() => {
    let classes = `lc-markdown lc-markdown--${this.variant()}`;
    if (this.highlightsFaded()) classes += ' lc-markdown--faded';
    return classes;
  });

  protected mermaidSvgs = signal<Record<number, SafeHtml>>({});
  protected mermaidErrors = signal<Record<number, string>>({});

  private headings = computed(() => this.parsed().headings);

  constructor() {
    // Load content from src when src changes
    effect(() => {
      const src = this.src();
      if (src) {
        this.loadFromUrl(src);
      }
    });

    // Use raw content when provided
    effect(() => {
      const content = this.content();
      if (content !== undefined) {
        this.resolvedMarkdown.set(content);
      }
    });

    // Emit rendered event whenever a render produced a (possibly empty) TOC
    effect(() => {
      const h = this.headings();
      untracked(() => this.rendered.emit({ headings: h }));
    });

    // Render Mermaid code fences as inline SVG diagrams.
    effect(() => {
      void this.renderMermaidParts(this.renderParts());
    });

    // React to a render that produced change highlights: emit, schedule fade,
    // and optionally scroll the first changed block into view.
    effect(() => {
      const count = this.highlightResult().count;
      untracked(() => this.onHighlightResult(count));
    });
  }

  ngOnDestroy(): void {
    this.httpSub?.unsubscribe();
    clearTimeout(this.fadeTimer);
    clearTimeout(this.scrollTimer);
  }

  protected onLinkClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    const anchor = target.closest('a');
    if (anchor) {
      this.linkClick.emit({ href: anchor.href, event });
    }
  }

  // -- Change highlighting -----------------------------------------------------

  /** Side-effects for a render: emit, (re)arm the fade timer, optional scroll. */
  private onHighlightResult(count: number): void {
    clearTimeout(this.fadeTimer);
    clearTimeout(this.scrollTimer);
    // A fresh render starts un-faded (re-entrant: never reuse stale fade state).
    this.highlightsFaded.set(false);
    if (count <= 0) return;

    this.changesHighlighted.emit({ changedBlocks: count });

    const fadeMs = this.changeHighlightFadeMs();
    if (fadeMs && fadeMs > 0) {
      this.fadeTimer = setTimeout(() => this.highlightsFaded.set(true), fadeMs);
    }
    if (this.scrollToFirstChange()) {
      // Defer until the highlighted HTML has been written to the DOM.
      this.scrollTimer = setTimeout(() => this.scrollToFirstChanged(), 0);
    }
  }

  private scrollToFirstChanged(): void {
    if (typeof document === 'undefined') return;
    const el = this.host.nativeElement.querySelector('.lc-markdown__block--changed');
    el?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  /**
   * Wraps the changed/added top-level blocks of `html` with
   * `.lc-markdown__block--changed`. A block is "changed" when its normalized
   * text is not present among the blocks of `prevMarkdown`. Lists are diffed
   * per `<li>` and tables per `<tr>` so a single edited item highlights alone.
   */
  private applyChangeHighlights(
    html: string,
    prevMarkdown: string
  ): { html: string; count: number } {
    if (typeof document === 'undefined') return { html, count: 0 };

    const prevKeys = this.collectBlockKeys(this.parseMarkdown(prevMarkdown).html);
    const root = this.htmlToElement(html);
    if (!root) return { html, count: 0 };

    let count = 0;
    const markIfChanged = (el: Element): void => {
      const key = this.blockTextKey(el.textContent ?? '');
      if (!key || prevKeys.has(key)) return;
      el.classList.add('lc-markdown__block--changed');
      const sr = document.createElement('span');
      sr.className = 'lc-markdown__sr-only';
      sr.textContent = '(geändert) ';
      el.insertBefore(sr, el.firstChild);
      count++;
    };

    this.eachLogicalBlock(root, markIfChanged);
    return { html: root.innerHTML, count };
  }

  /** Normalized text set of the logical blocks within an HTML fragment. */
  private collectBlockKeys(html: string): Set<string> {
    const keys = new Set<string>();
    const root = this.htmlToElement(html);
    if (!root) return keys;
    this.eachLogicalBlock(root, (el) => {
      const key = this.blockTextKey(el.textContent ?? '');
      if (key) keys.add(key);
    });
    return keys;
  }

  /**
   * Visits each diffable block under `root`: top-level elements, but descending
   * into `<ul>`/`<ol>` (per `<li>`) and `<table>` (per `<tr>`).
   */
  private eachLogicalBlock(root: Element, visit: (el: Element) => void): void {
    for (const node of Array.from(root.childNodes)) {
      if (node.nodeType !== 1) continue; // elements only (skips code placeholders)
      const el = node as Element;
      const tag = el.tagName;
      if (tag === 'UL' || tag === 'OL') {
        for (const li of Array.from(el.children)) {
          if (li.tagName === 'LI') visit(li);
        }
      } else if (tag === 'TABLE' || el.querySelector('table')) {
        // Tables (incl. the scroll wrapper div) diff per row.
        for (const tr of Array.from(el.querySelectorAll('tr'))) {
          visit(tr);
        }
      } else {
        visit(el);
      }
    }
  }

  private blockTextKey(text: string): string {
    return text.replace(/\s+/g, ' ').trim().toLowerCase();
  }

  private htmlToElement(html: string): HTMLElement | null {
    if (typeof document === 'undefined') return null;
    const div = document.createElement('div');
    div.innerHTML = html;
    return div;
  }

  private loadFromUrl(url: string): void {
    this.httpSub?.unsubscribe();
    this.httpSub = this.http.get(url, { responseType: 'text' }).subscribe({
      next: (text) => this.resolvedMarkdown.set(text),
      error: () => this.resolvedMarkdown.set(`*Failed to load ${url}*`),
    });
  }

  private splitIntoParts(
    html: string,
    blocks: { kind: 'code' | 'mermaid'; lang: string; code: string }[]
  ): RenderPart[] {
    const parts: RenderPart[] = [];
    const regex = new RegExp(BLOCK_PLACEHOLDER.source, 'g');
    const cursor = { next: 0 };
    let lastIndex = 0;
    let partIndex = 0;
    let match: RegExpExecArray | null;

    while ((match = regex.exec(html)) !== null) {
      const before = html.slice(lastIndex, match.index);
      if (before.trim()) {
        parts.push({
          type: 'html',
          index: partIndex++,
          safeHtml: this.sanitizer.bypassSecurityTrustHtml(this.sanitizeHtml(before, cursor)),
        });
      }
      const block = blocks[parseInt(match[1], 10)];
      lastIndex = match.index + match[0].length;
      // Unforgeable placeholder, so this can only be a bug — but never a crash.
      if (!block) continue;
      if (block.kind === 'mermaid') {
        parts.push({
          type: 'mermaid',
          index: partIndex++,
          code: block.code,
        });
      } else {
        parts.push({
          type: 'code',
          index: partIndex++,
          code: block.code,
          lang: block.lang as CodeBlockLanguage,
        });
      }
    }

    const remaining = html.slice(lastIndex);
    if (remaining.trim()) {
      parts.push({
        type: 'html',
        index: partIndex++,
        safeHtml: this.sanitizer.bypassSecurityTrustHtml(this.sanitizeHtml(remaining, cursor)),
      });
    }

    return parts;
  }

  private parseMarkdown(md: string): {
    html: string;
    blocks: { kind: 'code' | 'mermaid'; lang: string; code: string }[];
    headings: MarkdownHeading[];
  } {
    const blocks: { kind: 'code' | 'mermaid'; lang: string; code: string }[] = [];
    const headings: MarkdownHeading[] = [];
    const baseUrl = this.baseUrl();
    const linkTarget = this.linkTarget();
    const showAnchors = this.showHeadingAnchors();

    // 1. Extract fenced code blocks → placeholders (see BLOCK_MARK: the source
    //    is stripped of the marker character first, so it can't forge one)
    // eslint-disable-next-line no-control-regex -- strip the placeholder marker (see BLOCK_MARK)
    let processed = md.replace(/\u0000/g, '').replace(
      /```(\w*)\n([\s\S]*?)```/g,
      (_match, lang: string, code: string) => {
        const idx = blocks.length;
        const normalizedLang = (lang || 'text').toLowerCase();
        blocks.push({
          kind: normalizedLang === 'mermaid' ? 'mermaid' : 'code',
          lang: normalizedLang,
          code: code.trimEnd(),
        });
        return blockPlaceholder(idx);
      }
    );

    // 2. Escape HTML entities — quotes included, so nothing the parser later
    //    interpolates into an attribute (link/image URLs, alt text) can close it.
    processed = this.escapeHtml(processed);

    // 3. Headings (# to ######)
    processed = processed.replace(
      /^(#{1,6})\s+(.+)$/gm,
      (_match, hashes: string, text: string) => {
        const level = hashes.length;
        const id = text
          .toLowerCase()
          .replace(/[^\w\s-]/g, '')
          .replace(/\s+/g, '-');
        headings.push({ level, text, id });
        const anchor = showAnchors
          ? `<a href="#${id}" class="lc-markdown__anchor" aria-hidden="true">#</a>`
          : '';
        return `<h${level} id="${id}">${anchor}${text}</h${level}>`;
      }
    );

    // 4. Horizontal rules
    processed = processed.replace(/^---+$/gm, '<hr>');

    // 5. Blockquotes
    processed = processed.replace(
      /^(?:&gt;)\s?(.*)$/gm,
      '<blockquote>$1</blockquote>'
    );
    // Merge consecutive blockquotes
    processed = processed.replace(
      /<\/blockquote>\n<blockquote>/g,
      '\n'
    );

    // 6. Tables (GFM)
    processed = this.parseTables(processed);

    // 7. Task lists. Angular's HTML sanitizer strips <input>, so the checkbox is
    // rendered as a styled <span role="checkbox"> (which survives sanitization and
    // carries accessible checked/disabled state) rather than a form control.
    processed = processed.replace(
      /^[-*]\s+\[[xX]\]\s+(.*)$/gm,
      '<li class="lc-markdown__task-item">' +
        '<span class="lc-markdown__checkbox lc-markdown__checkbox--checked" role="checkbox" aria-checked="true" aria-disabled="true"></span>' +
        '<span class="lc-markdown__task-label">$1</span></li>'
    );
    processed = processed.replace(
      /^[-*]\s+\[ \]\s+(.*)$/gm,
      '<li class="lc-markdown__task-item">' +
        '<span class="lc-markdown__checkbox" role="checkbox" aria-checked="false" aria-disabled="true"></span>' +
        '<span class="lc-markdown__task-label">$1</span></li>'
    );

    // 8. Unordered lists
    processed = processed.replace(
      /^[-*]\s+(.*)$/gm,
      '<li>$1</li>'
    );
    // Wrap consecutive <li> in <ul>
    processed = processed.replace(
      /((?:<li[^>]*>.*<\/li>\n?)+)/g,
      '<ul>$1</ul>'
    );

    // 9. Ordered lists — marked while wrapping, so a run of them gets its <ol>
    //    and isn't confused with the <li>s already inside <ul>s above.
    processed = processed.replace(
      /^\d+\.\s+(.*)$/gm,
      '<li data-ol>$1</li>'
    );
    processed = processed.replace(
      /((?:<li data-ol>.*<\/li>\n?)+)/g,
      (run) => `<ol>${run.replace(/ data-ol/g, '')}</ol>`
    );

    // 10. Inline code
    processed = processed.replace(
      /`([^`]+)`/g,
      '<code>$1</code>'
    );

    // 11. Bold + italic combos
    processed = processed.replace(
      /\*\*\*(.+?)\*\*\*/g,
      '<strong><em>$1</em></strong>'
    );
    processed = processed.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    processed = processed.replace(/\*(.+?)\*/g, '<em>$1</em>');

    // 12. Strikethrough (GFM)
    processed = processed.replace(/~~(.+?)~~/g, '<del>$1</del>');

    // 13. Images. Only allow-listed URL schemes become a `src` (see
    //     safe-url.ts); anything else — `javascript:`, unknown schemes — is
    //     rendered as its alt text. This holds regardless of `sanitize`.
    processed = processed.replace(
      /!\[([^\]]*)\]\(([^)]+)\)/g,
      (_match, alt: string, src: string) => {
        if (!isSafeImageUrl(src)) return alt;
        const resolvedSrc = baseUrl && !src.startsWith('http') ? `${baseUrl}/${src}` : src;
        return `<img src="${resolvedSrc}" alt="${alt}" class="lc-markdown__img">`;
      }
    );

    // 14. Links — same rule: an unsafe URL leaves plain text, not a link.
    processed = processed.replace(
      /\[([^\]]+)\]\(([^)]+)\)/g,
      (_match, text: string, href: string) => {
        if (!isSafeLinkUrl(href)) return text;
        const resolvedHref = baseUrl && !href.startsWith('http') && !href.startsWith('#')
          ? `${baseUrl}/${href}`
          : href;
        return `<a href="${resolvedHref}" target="${linkTarget}" rel="noopener">${text}</a>`;
      }
    );

    // 14b. Autolinks — linkify bare URLs / www / emails in plain text. Runs after
    // explicit links and inline code so it can skip anything already inside an
    // <a> or <code> (and never touches tag attributes).
    processed = this.autolink(processed, linkTarget);

    // 15. Paragraphs — wrap standalone lines
    processed = processed
      .split('\n\n')
      .map((block) => {
        const trimmed = block.trim();
        if (!trimmed) return '';
        if (
          trimmed.startsWith('<h') ||
          trimmed.startsWith('<ul') ||
          trimmed.startsWith('<ol') ||
          trimmed.startsWith('<blockquote') ||
          trimmed.startsWith('<hr') ||
          trimmed.startsWith('<table') ||
          trimmed.startsWith('<div') ||
          trimmed.startsWith(BLOCK_MARK)
        ) {
          return trimmed;
        }
        return `<p>${trimmed.replace(/\n/g, '<br>')}</p>`;
      })
      .join('\n');

    // 16. Restore code block placeholders
    if (this.syntaxHighlight()) {
      // Leave placeholders — the template will render <lc-code-block> for each
      // No replacement needed here
    } else {
      processed = processed.replace(
        new RegExp(BLOCK_PLACEHOLDER.source, 'g'),
        (_match, idx: string) => {
          const block = blocks[parseInt(idx, 10)];
          if (!block) return '';
          return `<pre><code class="language-${block.lang}">${this.escapeHtml(block.code)}</code></pre>`;
        }
      );
    }

    return { html: processed, blocks, headings };
  }

  private parseTables(text: string): string {
    return text.replace(
      /^(\|.+\|)\n(\|[-| :]+\|)\n((?:\|.+\|\n?)*)/gm,
      (_match, header: string, separator: string, body: string) => {
        // Per-column alignment from the delimiter row: :--- left, :--: center,
        // ---: right. Surfaced as classes (the sanitizer strips inline `style`).
        const aligns = this.splitTableRow(separator).map((cell) => {
          const left = cell.startsWith(':');
          const right = cell.endsWith(':');
          if (left && right) return 'center';
          if (right) return 'right';
          if (left) return 'left';
          return '';
        });
        const alignClass = (col: number): string =>
          aligns[col] ? ` class="lc-markdown__cell--${aligns[col]}"` : '';

        const headers = this.splitTableRow(header)
          .map((cell, i) => `<th scope="col"${alignClass(i)}>${cell.trim()}</th>`)
          .join('');

        const rows = body
          .trim()
          .split('\n')
          .map((row: string) => {
            const cells = this.splitTableRow(row)
              .map((cell, i) => `<td${alignClass(i)}>${cell.trim()}</td>`)
              .join('');
            return `<tr>${cells}</tr>`;
          })
          .join('');

        // Wrapped so wide tables scroll horizontally instead of breaking layout.
        return (
          `<div class="lc-markdown__table-wrap">` +
          `<table class="lc-markdown__table"><thead><tr>${headers}</tr></thead><tbody>${rows}</tbody></table>` +
          `</div>`
        );
      }
    );
  }

  /** Splits a pipe-table row into trimmed cells, dropping the leading/trailing edges. */
  private splitTableRow(row: string): string[] {
    return row
      .trim()
      .replace(/^\|/, '')
      .replace(/\|$/, '')
      .split('|')
      .map((cell) => cell.trim());
  }

  private escapeHtml(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  /**
   * Linkifies bare URLs (`http(s)://…`, `www.…`) and email addresses in text,
   * leaving anything inside an existing `<a>` or `<code>` (and all tag
   * attributes) untouched. The HTML is tokenized into tags vs. text so only
   * top-level text runs are linkified.
   */
  private autolink(html: string, linkTarget: string): string {
    const url = /(?:https?:\/\/|www\.)[^\s<]*[^\s<.,:;!?)\]}'"]/;
    const email = /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/;
    const pattern = new RegExp(`${url.source}|${email.source}`, 'g');

    let depth = 0; // inside <a> or <code>
    return html
      .split(/(<[^>]+>)/g)
      .map((segment) => {
        if (segment.startsWith('<')) {
          if (/^<(a|code)[\s>]/i.test(segment)) depth++;
          else if (/^<\/(a|code)>/i.test(segment)) depth = Math.max(0, depth - 1);
          return segment;
        }
        if (depth > 0 || !segment) return segment;
        return segment.replace(pattern, (token) => {
          const isEmail = token.includes('@') && !/^(?:https?:\/\/|www\.)/.test(token);
          const href = isEmail
            ? `mailto:${token}`
            : token.startsWith('www.')
              ? `https://${token}`
              : token;
          return `<a href="${href}" target="${linkTarget}" rel="noopener">${token}</a>`;
        });
      })
      .join('');
  }

  protected mermaidSvgFor(index: number): SafeHtml | null {
    return this.mermaidSvgs()[index] ?? null;
  }

  protected mermaidErrorFor(index: number): string | null {
    return this.mermaidErrors()[index] ?? null;
  }

  private async renderMermaidParts(parts: RenderPart[]): Promise<void> {
    const mermaidParts = parts.filter((part) => part.type === 'mermaid' && !!part.code);
    this.mermaidSvgs.set({});
    this.mermaidErrors.set({});

    if (mermaidParts.length === 0) {
      return;
    }

    const runId = ++this.mermaidRenderRun;

    try {
      const mermaidApi = await this.getMermaidApi();
      if (runId !== this.mermaidRenderRun) return;

      const nextSvgs: Record<number, SafeHtml> = {};
      const nextErrors: Record<number, string> = {};

      for (const part of mermaidParts) {
        try {
          // Per instance, per run, per part: mermaid's render() removes any
          // element already carrying the id it is given, so an id shared with
          // another <lc-markdown> on the page would delete that one's diagram.
          const renderId = `lc-md-mermaid-${this.instanceId}-${runId}-${part.index}`;
          const { svg } = await mermaidApi.render(renderId, part.code!);
          if (runId !== this.mermaidRenderRun) return;
          // Mermaid emits self-contained SVG with internal <style> rules.
          // Angular HTML sanitization strips critical style declarations,
          // which leaves only labels visible (no edges/shapes). We trust
          // Mermaid output here and rely on Mermaid's strict security mode.
          nextSvgs[part.index] = this.sanitizer.bypassSecurityTrustHtml(svg);
        } catch {
          nextErrors[part.index] = 'Mermaid diagram could not be rendered.';
        }
      }

      if (runId !== this.mermaidRenderRun) return;
      this.mermaidSvgs.set(nextSvgs);
      this.mermaidErrors.set(nextErrors);
    } catch {
      if (runId !== this.mermaidRenderRun) return;
      const fallbackErrors: Record<number, string> = {};
      for (const part of mermaidParts) {
        fallbackErrors[part.index] = 'Mermaid runtime is not available.';
      }
      this.mermaidErrors.set(fallbackErrors);
    }
  }

  private async getMermaidApi(): Promise<any> {
    if (!this.mermaidApiPromise) {
      this.mermaidApiPromise = import('mermaid').then((module) => {
        const api = module.default ?? module;
        if (!this.mermaidInitialized) {
          api.initialize({
            startOnLoad: false,
            securityLevel: 'strict',
          });
          this.mermaidInitialized = true;
        }
        return api;
      });
    }
    return this.mermaidApiPromise;
  }
}
