import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  OnDestroy,
  ViewEncapsulation,
  computed,
  effect,
  inject,
  input,
  signal,
  untracked,
} from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { IconComponent } from '../icon/icon.component';
import { SpinnerComponent } from '../spinner/spinner.component';
import { CodeBlockComponent, CodeBlockLanguage } from '../code-block/code-block.component';
import { MarkdownComponent } from '../markdown/markdown.component';
import { isSafeResourceUrl } from '../shared/safe-url';

export type DocumentType = 'pdf' | 'markdown' | 'image' | 'text' | 'code' | 'auto';

const EXTENSION_TYPE_MAP: Record<string, DocumentType> = {
  pdf: 'pdf',
  md: 'markdown',
  markdown: 'markdown',
  png: 'image',
  jpg: 'image',
  jpeg: 'image',
  gif: 'image',
  webp: 'image',
  svg: 'image',
  bmp: 'image',
  ts: 'code',
  js: 'code',
  tsx: 'code',
  jsx: 'code',
  py: 'code',
  java: 'code',
  html: 'code',
  css: 'code',
  scss: 'code',
  json: 'code',
  sh: 'code',
  bash: 'code',
  txt: 'text',
  log: 'text',
  csv: 'text',
};

const EXTENSION_LANGUAGE_MAP: Record<string, CodeBlockLanguage> = {
  ts: 'typescript',
  tsx: 'typescript',
  js: 'javascript',
  jsx: 'javascript',
  py: 'python',
  java: 'java',
  html: 'html',
  css: 'css',
  scss: 'scss',
  json: 'json',
  sh: 'bash',
  bash: 'bash',
};

const TYPE_ICONS: Record<string, string> = {
  pdf: 'document-text',
  markdown: 'document-text',
  image: 'photo',
  text: 'document',
  code: 'code-bracket',
  unknown: 'document',
};

/**
 * Document viewer component for previewing various file types.
 *
 * Features:
 * - Auto-detects file type from URL extension or explicit type input
 * - PDF rendering via browser-native iframe viewer
 * - Markdown rendered through `lc-markdown` (escaped and sanitised — a fetched
 *   `.md` file cannot inject markup)
 * - Image display with zoom controls (25% – 500%)
 * - Code display using the built-in code block component
 * - Plain text display
 * - Toolbar with filename, type badge, zoom, download, and fullscreen
 * - Loading and error states
 * - Dark/light theme support
 *
 * `src` is only ever embedded (iframe) or downloaded when it is a http(s),
 * blob: or relative URL — or a `data:application/pdf` — so a `javascript:` URL
 * handed in as a document can neither run in the frame nor be "downloaded".
 *
 * @example
 * ```html
 * <lc-document-viewer src="https://example.com/report.pdf" />
 * <lc-document-viewer [content]="markdownString" type="markdown" filename="README.md" />
 * <lc-document-viewer src="/assets/diagram.png" />
 * ```
 */
@Component({
  selector: 'lc-document-viewer',
  standalone: true,
  imports: [IconComponent, SpinnerComponent, CodeBlockComponent, MarkdownComponent],
  templateUrl: './document-viewer.component.html',
  styleUrls: ['./document-viewer.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: {
    '[class]': '"doc-viewer"',
    '[style.height]': 'height()',
  },
})
export class DocumentViewerComponent implements OnDestroy {
  /** URL of the document to display (for PDF, images, or remote files) */
  readonly src = input<string>('');

  /** Direct content string (for markdown, text, or code — takes precedence over src for content-based types) */
  readonly content = input<string>('');

  /** File type — set to 'auto' to detect from URL extension */
  readonly type = input<DocumentType>('auto');

  /** Display name shown in the toolbar */
  readonly filename = input<string>('');

  /** Code language for syntax highlighting (when type is 'code') */
  readonly language = input<CodeBlockLanguage>('text');

  /** Whether to display the toolbar */
  readonly showToolbar = input(true);

  /** Whether to show the download button in the toolbar */
  readonly showDownload = input(true);

  /** Height of the viewer container */
  readonly height = input('500px');

  // ── Internal state ───────────────────────────────────────────────────────

  protected loading = signal(true);
  protected error = signal<string | null>(null);
  protected fetchedContent = signal<string>('');
  protected zoom = signal(100);
  protected isFullscreen = signal(false);

  private readonly sanitizer = inject(DomSanitizer);
  private readonly elementRef = inject(ElementRef);
  private fullscreenHandler: (() => void) | null = null;

  // ── Computed values ──────────────────────────────────────────────────────

  /** Resolved document type from input or URL extension */
  protected resolvedType = computed<DocumentType | 'unknown'>(() => {
    const t = this.type();
    if (t !== 'auto') return t;
    const ext = this.extractExtension(this.src());
    return ext && EXTENSION_TYPE_MAP[ext] ? EXTENSION_TYPE_MAP[ext] : 'unknown';
  });

  /** Display name for the toolbar */
  protected displayName = computed(() => {
    if (this.filename()) return this.filename();
    const src = this.src();
    if (!src) return 'Document';
    try {
      const url = new URL(src, 'http://localhost');
      const segments = url.pathname.split('/');
      return segments[segments.length - 1] || 'Document';
    } catch {
      return src.split('/').pop() || 'Document';
    }
  });

  /** Icon name for the document type */
  protected typeIcon = computed(() => TYPE_ICONS[this.resolvedType()] || TYPE_ICONS['unknown']);

  /** Type label for the toolbar badge */
  protected typeLabel = computed(() => {
    const t = this.resolvedType();
    switch (t) {
      case 'pdf': return 'PDF';
      case 'markdown': return 'Markdown';
      case 'image': return 'Image';
      case 'text': return 'Text';
      case 'code': return this.resolvedLanguage().toUpperCase();
      default: return 'File';
    }
  });

  /** Resolved code language */
  protected resolvedLanguage = computed<CodeBlockLanguage>(() => {
    const lang = this.language();
    if (lang !== 'text') return lang;
    const ext = this.extractExtension(this.src());
    return ext && EXTENSION_LANGUAGE_MAP[ext] ? EXTENSION_LANGUAGE_MAP[ext] : 'text';
  });

  /** Whether `src` may be embedded in a frame or downloaded at all. */
  protected srcEmbeddable = computed(() => isSafeResourceUrl(this.src()));

  /**
   * `src` as the iframe accepts it. Bypassing the resource-URL check is what
   * lets a PDF URL into an iframe at all; it is only done for URLs that passed
   * `isSafeResourceUrl` — anything else resolves to an empty frame.
   */
  protected safeSrc = computed<SafeResourceUrl>(() => {
    const src = this.src();
    return this.sanitizer.bypassSecurityTrustResourceUrl(this.srcEmbeddable() ? src : 'about:blank');
  });

  /** Effective content: direct content input or fetched content */
  protected effectiveContent = computed(() => {
    return this.content() || this.fetchedContent();
  });

  /** Image transform style for zoom */
  protected imageTransform = computed(() => {
    const z = this.zoom() / 100;
    return `scale(${z})`;
  });

  /** Whether zoom controls should be shown */
  protected showZoom = computed(() => {
    const t = this.resolvedType();
    return t === 'image';
  });

  // ── Lifecycle ────────────────────────────────────────────────────────────

  constructor() {
    // Load whenever the document changes — not just once. A new `src` starts a
    // fresh load (and cancels the one still in flight, so a slow old response
    // can't overwrite the new document), resets any earlier error, and re-enters
    // the loading state; a `content` string short-circuits all of that.
    effect((onCleanup) => {
      const type = this.resolvedType();
      const src = this.src();
      const content = this.content();
      const controller = typeof AbortController === 'function' ? new AbortController() : null;
      onCleanup(() => controller?.abort());
      untracked(() => this.load(type, src, content, controller));
    });
  }

  private load(
    type: DocumentType | 'unknown',
    src: string,
    content: string,
    controller: AbortController | null,
  ): void {
    this.error.set(null);
    this.fetchedContent.set('');

    if (content) {
      this.loading.set(false);
      return;
    }

    if (!src) {
      this.loading.set(false);
      this.error.set('No source or content provided');
      return;
    }

    // PDF and images are embedded directly — no fetch needed. They do have to be
    // embeddable, though: a `javascript:` (or other exotic) URL is refused up
    // front instead of being handed to an iframe.
    if (type === 'pdf' || type === 'image') {
      if (!this.srcEmbeddable()) {
        this.loading.set(false);
        this.error.set('This document URL cannot be displayed');
        return;
      }
      // Not "loading": the frame/img element only exists once loading is off,
      // and it is its own load event that would end the state — a deadlock.
      this.loading.set(false);
      return;
    }

    // Fetch text-based content
    if (type === 'markdown' || type === 'text' || type === 'code') {
      this.loading.set(true);
      this.fetchContent(src, controller);
    } else {
      this.loading.set(false);
    }
  }

  ngOnDestroy(): void {
    if (this.fullscreenHandler) {
      document.removeEventListener('fullscreenchange', this.fullscreenHandler);
    }
  }

  // ── Actions ──────────────────────────────────────────────────────────────

  protected zoomIn(): void {
    this.zoom.update(z => Math.min(z + 25, 500));
  }

  protected zoomOut(): void {
    this.zoom.update(z => Math.max(z - 25, 25));
  }

  protected resetZoom(): void {
    this.zoom.set(100);
  }

  protected download(): void {
    const src = this.src();
    // A download is a click the user never sees the target of — only URLs that
    // could be embedded are worth clicking.
    if (!src || !this.srcEmbeddable()) return;
    const a = document.createElement('a');
    a.href = src;
    a.download = this.displayName();
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }

  protected toggleFullscreen(): void {
    const el = this.elementRef.nativeElement as HTMLElement;
    if (!document.fullscreenElement) {
      el.requestFullscreen?.();
      this.isFullscreen.set(true);
    } else {
      document.exitFullscreen?.();
      this.isFullscreen.set(false);
    }

    if (!this.fullscreenHandler) {
      this.fullscreenHandler = () => {
        this.isFullscreen.set(!!document.fullscreenElement);
      };
      document.addEventListener('fullscreenchange', this.fullscreenHandler);
    }
  }

  protected onIframeLoad(): void {
    this.loading.set(false);
  }

  protected onImageLoad(): void {
    this.loading.set(false);
  }

  protected onImageError(): void {
    this.loading.set(false);
    this.error.set('Failed to load image');
  }

  // ── Private helpers ──────────────────────────────────────────────────────

  private extractExtension(url: string): string | null {
    if (!url) return null;
    try {
      const pathname = new URL(url, 'http://localhost').pathname;
      const parts = pathname.split('.');
      return parts.length > 1 ? parts.pop()!.toLowerCase() : null;
    } catch {
      const parts = url.split('.');
      return parts.length > 1 ? parts.pop()!.toLowerCase().split('?')[0] : null;
    }
  }

  private async fetchContent(url: string, controller: AbortController | null): Promise<void> {
    if (typeof fetch !== 'function') {
      this.loading.set(false);
      this.error.set('Failed to load document: fetch is not available');
      return;
    }
    try {
      const response = await fetch(url, controller ? { signal: controller.signal } : undefined);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      const text = await response.text();
      // A response for a document that has since been replaced is dropped: the
      // effect that replaced it aborted this controller and started its own load.
      if (controller?.signal.aborted) return;
      this.fetchedContent.set(text);
      this.loading.set(false);
    } catch (err) {
      if (controller?.signal.aborted) return;
      this.loading.set(false);
      this.error.set(`Failed to load document: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  }
}
