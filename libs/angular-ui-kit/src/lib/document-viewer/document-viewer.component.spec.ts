import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Component, signal } from '@angular/core';
import { DocumentViewerComponent, DocumentType } from './document-viewer.component';
import { CodeBlockLanguage } from '../code-block/code-block.component';
import { provideHttpClient } from '@angular/common/http';

@Component({
  standalone: true,
  imports: [DocumentViewerComponent],
  template: `
    <lc-document-viewer
      [src]="src()"
      [content]="content()"
      [type]="type()"
      [filename]="filename()"
      [language]="language()"
      [showToolbar]="showToolbar()"
      [showDownload]="showDownload()"
      [height]="height()"
    />
  `,
})
// Signals, not plain fields: the tests run zoneless, where a plain field changed
// after the first render is not picked up by `fixture.detectChanges()`.
class TestHostComponent {
  src = signal('');
  content = signal('');
  type = signal<DocumentType>('auto');
  filename = signal('');
  language = signal<CodeBlockLanguage>('text');
  showToolbar = signal(true);
  showDownload = signal(true);
  height = signal('400px');
}

describe('DocumentViewerComponent', () => {
  let fixture: ComponentFixture<TestHostComponent>;
  let host: TestHostComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TestHostComponent],
      providers: [provideHttpClient()],
    }).compileComponents();

    fixture = TestBed.createComponent(TestHostComponent);
    host = fixture.componentInstance;
  });

  it('should create', () => {
    host.content.set('Hello');
    host.type.set('text');
    fixture.detectChanges();
    expect(fixture.componentInstance).toBeTruthy();
  });

  // ── Toolbar ──────────────────────────────────────────────────────────

  it('should display toolbar by default', () => {
    host.content.set('Test');
    host.type.set('text');
    fixture.detectChanges();
    const toolbar = fixture.nativeElement.querySelector('.doc-viewer__toolbar');
    expect(toolbar).toBeTruthy();
  });

  it('should hide toolbar when showToolbar is false', () => {
    host.content.set('Test');
    host.type.set('text');
    host.showToolbar.set(false);
    fixture.detectChanges();
    const toolbar = fixture.nativeElement.querySelector('.doc-viewer__toolbar');
    expect(toolbar).toBeNull();
  });

  it('should display filename in toolbar', () => {
    host.content.set('Test');
    host.type.set('text');
    host.filename.set('readme.txt');
    fixture.detectChanges();
    const name = fixture.nativeElement.querySelector('.doc-viewer__filename');
    expect(name.textContent).toContain('readme.txt');
  });

  it('should extract filename from src when no filename provided', () => {
    host.content.set('Test');
    host.type.set('text');
    host.src.set('https://example.com/docs/guide.txt');
    fixture.detectChanges();
    const name = fixture.nativeElement.querySelector('.doc-viewer__filename');
    expect(name.textContent).toContain('guide.txt');
  });

  it('should show type badge', () => {
    host.content.set('# Hello');
    host.type.set('markdown');
    fixture.detectChanges();
    const badge = fixture.nativeElement.querySelector('.doc-viewer__badge');
    expect(badge.textContent.trim()).toBe('Markdown');
  });

  // ── Type detection ───────────────────────────────────────────────────

  it('should auto-detect PDF from URL extension', () => {
    host.src.set('https://example.com/report.pdf');
    fixture.detectChanges();
    const badge = fixture.nativeElement.querySelector('.doc-viewer__badge');
    expect(badge.textContent.trim()).toBe('PDF');
  });

  it('should auto-detect image from URL extension', () => {
    host.src.set('/assets/photo.png');
    fixture.detectChanges();
    const badge = fixture.nativeElement.querySelector('.doc-viewer__badge');
    expect(badge.textContent.trim()).toBe('Image');
  });

  it('should auto-detect markdown from URL extension', () => {
    host.src.set('/docs/readme.md');
    fixture.detectChanges();
    const badge = fixture.nativeElement.querySelector('.doc-viewer__badge');
    expect(badge.textContent.trim()).toBe('Markdown');
  });

  it('should auto-detect code from URL extension', () => {
    host.src.set('/src/app.ts');
    fixture.detectChanges();
    const badge = fixture.nativeElement.querySelector('.doc-viewer__badge');
    expect(badge.textContent.trim()).toBe('TYPESCRIPT');
  });

  it('should use explicit type over auto-detection', () => {
    host.src.set('/myfile.txt');
    host.type.set('markdown');
    fixture.detectChanges();
    const badge = fixture.nativeElement.querySelector('.doc-viewer__badge');
    expect(badge.textContent.trim()).toBe('Markdown');
  });

  // ── Markdown rendering ───────────────────────────────────────────────

  it('should render markdown headings', () => {
    host.content.set('# Hello World');
    host.type.set('markdown');
    fixture.detectChanges();
    const h1 = fixture.nativeElement.querySelector('.doc-viewer__markdown h1');
    expect(h1).toBeTruthy();
    expect(h1.textContent).toContain('Hello World');
  });

  it('should render markdown bold and italic', () => {
    host.content.set('**bold** and *italic*');
    host.type.set('markdown');
    fixture.detectChanges();
    const md = fixture.nativeElement.querySelector('.doc-viewer__markdown');
    expect(md.querySelector('strong').textContent).toBe('bold');
    expect(md.querySelector('em').textContent).toBe('italic');
  });

  it('should render markdown unordered list', () => {
    host.content.set('- Item 1\n- Item 2\n- Item 3');
    host.type.set('markdown');
    fixture.detectChanges();
    const items = fixture.nativeElement.querySelectorAll('.doc-viewer__markdown li');
    expect(items.length).toBe(3);
  });

  it('should render markdown ordered list', () => {
    host.content.set('1. First\n2. Second');
    host.type.set('markdown');
    fixture.detectChanges();
    const ol = fixture.nativeElement.querySelector('.doc-viewer__markdown ol');
    expect(ol).toBeTruthy();
  });

  it('should render markdown links', () => {
    host.content.set('[Click here](https://example.com)');
    host.type.set('markdown');
    fixture.detectChanges();
    const a = fixture.nativeElement.querySelector('.doc-viewer__markdown a');
    expect(a).toBeTruthy();
    expect(a.textContent).toBe('Click here');
    expect(a.getAttribute('target')).toBe('_blank');
    expect(a.getAttribute('rel')).toContain('noopener');
  });

  it('should render markdown inline code', () => {
    host.content.set('Use `console.log()` for debugging');
    host.type.set('markdown');
    fixture.detectChanges();
    const code = fixture.nativeElement.querySelector('.doc-viewer__markdown code');
    expect(code).toBeTruthy();
    expect(code.textContent).toBe('console.log()');
  });

  it('should render markdown code blocks', () => {
    host.content.set('```typescript\nconst x = 1;\n```');
    host.type.set('markdown');
    fixture.detectChanges();
    // Fenced code is rendered by lc-markdown through lc-code-block.
    const block = fixture.nativeElement.querySelector('.doc-viewer__markdown lc-code-block');
    expect(block).toBeTruthy();
    expect(block.textContent).toContain('const x = 1;');
  });

  it('should render markdown blockquotes', () => {
    host.content.set('> This is a quote');
    host.type.set('markdown');
    fixture.detectChanges();
    const bq = fixture.nativeElement.querySelector('.doc-viewer__markdown blockquote');
    expect(bq).toBeTruthy();
    expect(bq.textContent).toContain('This is a quote');
  });

  it('should render markdown tables', () => {
    host.content.set('| Name | Value |\n| --- | --- |\n| A | 1 |\n| B | 2 |');
    host.type.set('markdown');
    fixture.detectChanges();
    const table = fixture.nativeElement.querySelector('.doc-viewer__markdown table');
    expect(table).toBeTruthy();
    const rows = table.querySelectorAll('tbody tr');
    expect(rows.length).toBe(2);
  });

  it('should render markdown horizontal rule', () => {
    host.content.set('Before\n\n---\n\nAfter');
    host.type.set('markdown');
    fixture.detectChanges();
    const hr = fixture.nativeElement.querySelector('.doc-viewer__markdown hr');
    expect(hr).toBeTruthy();
  });

  // ── Safety ───────────────────────────────────────────────────────────
  // Markdown may come from a fetched file, `src` from anywhere. Neither may
  // put script into the page.

  it('should not render script or event handlers from markdown', () => {
    host.content.set('Hi <img src=x onerror="alert(1)"> <script>alert(2)</script> [x](javascript:alert(3))');
    host.type.set('markdown');
    fixture.detectChanges();
    const md = fixture.nativeElement.querySelector('.doc-viewer__markdown') as HTMLElement;
    expect(md.querySelector('script')).toBeNull();
    const withHandler = Array.from(md.querySelectorAll('*')).some((n) =>
      Array.from(n.attributes).some((a) => a.name.startsWith('on')),
    );
    expect(withHandler).toBe(false);
    const link = md.querySelector('a[href^="javascript"]');
    expect(link).toBeNull();
  });

  it('should refuse to embed a javascript: URL as a PDF', () => {
    host.src.set('javascript:alert(1)');
    host.type.set('pdf');
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('iframe')).toBeNull();
    expect(fixture.nativeElement.querySelector('.doc-viewer__error')?.textContent).toContain('cannot be displayed');
  });

  it('should embed http(s) PDFs in a titled iframe', () => {
    host.src.set('https://example.com/report.pdf');
    host.type.set('pdf');
    fixture.detectChanges();
    const iframe = fixture.nativeElement.querySelector('iframe') as HTMLIFrameElement;
    expect(iframe).toBeTruthy();
    expect(iframe.getAttribute('title')).toBe('report.pdf');
  });

  it('should not download a javascript: URL', () => {
    host.src.set('javascript:alert(1)');
    host.type.set('text');
    host.content.set('x');
    fixture.detectChanges();
    const created: HTMLAnchorElement[] = [];
    const orig = document.createElement.bind(document);
    const spy = jest.spyOn(document, 'createElement').mockImplementation((tag: string) => {
      const el = orig(tag);
      if (tag === 'a') created.push(el as HTMLAnchorElement);
      return el;
    });
    const btn = fixture.nativeElement.querySelector('button[aria-label="Download"]') as HTMLButtonElement;
    btn.click();
    spy.mockRestore();
    expect(created.length).toBe(0);
  });

  // ── Reacting to input changes ────────────────────────────────────────

  it('should re-render when content changes after init', () => {
    host.content.set('# One');
    host.type.set('markdown');
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.doc-viewer__markdown h1').textContent).toContain('One');
    host.content.set('# Two');
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.doc-viewer__markdown h1').textContent).toContain('Two');
  });

  it('should recover from an error state when a valid content arrives', () => {
    host.type.set('text');
    fixture.detectChanges(); // no src, no content → error
    expect(fixture.nativeElement.querySelector('.doc-viewer__error')).toBeTruthy();
    host.content.set('Now there is content');
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.doc-viewer__error')).toBeNull();
    expect(fixture.nativeElement.querySelector('.doc-viewer__text').textContent).toContain('Now there is content');
  });

  // ── Text rendering ───────────────────────────────────────────────────

  it('should render text content in pre tag', () => {
    host.content.set('Plain text content');
    host.type.set('text');
    fixture.detectChanges();
    const pre = fixture.nativeElement.querySelector('.doc-viewer__text');
    expect(pre).toBeTruthy();
    expect(pre.textContent).toBe('Plain text content');
  });

  // ── Code rendering ──────────────────────────────────────────────────

  it('should render code with code-block component', () => {
    host.content.set('const x = 42;');
    host.type.set('code');
    host.language.set('typescript');
    fixture.detectChanges();
    const codeBlock = fixture.nativeElement.querySelector('lc-code-block');
    expect(codeBlock).toBeTruthy();
  });

  // ── Image rendering ─────────────────────────────────────────────────

  it('should render image with img tag', () => {
    host.src.set('/assets/test.png');
    host.type.set('image');
    fixture.detectChanges();
    const img = fixture.nativeElement.querySelector('.doc-viewer__image');
    expect(img).toBeTruthy();
    expect(img.getAttribute('src')).toBe('/assets/test.png');
  });

  it('should show zoom controls for images', () => {
    host.src.set('/assets/test.png');
    host.type.set('image');
    fixture.detectChanges();
    const zoom = fixture.nativeElement.querySelector('.doc-viewer__zoom');
    expect(zoom).toBeTruthy();
  });

  it('should not show zoom controls for non-image types', () => {
    host.content.set('Hello');
    host.type.set('text');
    fixture.detectChanges();
    const zoom = fixture.nativeElement.querySelector('.doc-viewer__zoom');
    expect(zoom).toBeNull();
  });

  // ── PDF rendering ───────────────────────────────────────────────────

  it('should render PDF in iframe', () => {
    host.src.set('/assets/test.pdf');
    host.type.set('pdf');
    fixture.detectChanges();
    const iframe = fixture.nativeElement.querySelector('.doc-viewer__iframe');
    expect(iframe).toBeTruthy();
  });

  // ── Unsupported type ────────────────────────────────────────────────

  it('should show unsupported state for unknown file type', () => {
    host.src.set('/file.xyz');
    fixture.detectChanges();
    const unsup = fixture.nativeElement.querySelector('.doc-viewer__unsupported');
    expect(unsup).toBeTruthy();
    expect(unsup.textContent).toContain('Preview not available');
  });

  // ── Error state ─────────────────────────────────────────────────────

  it('should show error when no src or content', () => {
    fixture.detectChanges();
    const error = fixture.nativeElement.querySelector('.doc-viewer__error');
    expect(error).toBeTruthy();
    expect(error.textContent).toContain('No source or content provided');
  });

  // ── Download button ─────────────────────────────────────────────────

  it('should show download button when src is provided', () => {
    host.src.set('/assets/test.png');
    host.type.set('image');
    fixture.detectChanges();
    const dlBtn = fixture.nativeElement.querySelector('[aria-label="Download"]');
    expect(dlBtn).toBeTruthy();
  });

  it('should hide download button when showDownload is false', () => {
    host.src.set('/assets/test.png');
    host.type.set('image');
    host.showDownload.set(false);
    fixture.detectChanges();
    const dlBtn = fixture.nativeElement.querySelector('[aria-label="Download"]');
    expect(dlBtn).toBeNull();
  });

  // ── Container height ────────────────────────────────────────────────

  it('should apply custom height', () => {
    host.content.set('Test');
    host.type.set('text');
    host.height.set('300px');
    fixture.detectChanges();
    const viewer = fixture.nativeElement.querySelector('.doc-viewer');
    expect(viewer.style.height).toBe('300px');
  });
});
