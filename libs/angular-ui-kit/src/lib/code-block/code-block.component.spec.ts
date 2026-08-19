import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Component } from '@angular/core';
import { readFileSync } from 'fs';
import { resolve } from 'path';
import { CodeBlockComponent, CodeBlockLanguage } from './code-block.component';
import { provideHttpClient } from '@angular/common/http';

@Component({
  standalone: true,
  imports: [CodeBlockComponent],
  template: `
    <lc-code-block
      [code]="code"
      [language]="language"
      [filename]="filename"
      [showLineNumbers]="showLineNumbers"
      [showCopy]="showCopy"
      [showHeader]="showHeader"
    />
  `,
})
class TestHostComponent {
  code = 'const x = 42;';
  language: CodeBlockLanguage = 'typescript';
  filename = '';
  showLineNumbers = true;
  showCopy = true;
  showHeader = true;
}

describe('CodeBlockComponent', () => {
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
    fixture.detectChanges();
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should render code content', () => {
    fixture.detectChanges();
    const content = fixture.nativeElement.querySelector('.code-block__line-content');
    expect(content.textContent).toContain('const x = 42;');
  });

  it('should render line numbers', () => {
    host.code = 'line1\nline2\nline3';
    fixture.detectChanges();
    const lineNums = fixture.nativeElement.querySelectorAll('.code-block__line-number');
    expect(lineNums.length).toBe(3);
    expect(lineNums[0].textContent.trim()).toBe('1');
    expect(lineNums[2].textContent.trim()).toBe('3');
  });

  it('should hide line numbers when disabled', () => {
    host.showLineNumbers = false;
    fixture.detectChanges();
    const lineNums = fixture.nativeElement.querySelectorAll('.code-block__line-number');
    expect(lineNums.length).toBe(0);
  });

  it('should render header with language', () => {
    fixture.detectChanges();
    const langLabel = fixture.nativeElement.querySelector('.code-block__language');
    expect(langLabel.textContent.trim()).toBe('typescript');
  });

  it('should show filename in header when provided', () => {
    host.filename = 'app.ts';
    fixture.detectChanges();
    const langLabel = fixture.nativeElement.querySelector('.code-block__language');
    expect(langLabel.textContent.trim()).toBe('app.ts');
  });

  it('should hide header when showHeader is false', () => {
    host.showHeader = false;
    fixture.detectChanges();
    const header = fixture.nativeElement.querySelector('.code-block__header');
    expect(header).toBeNull();
  });

  it('should render copy button', () => {
    fixture.detectChanges();
    const copyBtn = fixture.nativeElement.querySelector('.code-block__copy');
    expect(copyBtn).toBeTruthy();
  });

  it('should hide copy button when disabled', () => {
    host.showCopy = false;
    fixture.detectChanges();
    const copyBtn = fixture.nativeElement.querySelector('.code-block__copy');
    expect(copyBtn).toBeNull();
  });

  it('should render multiple lines', () => {
    host.code = 'const a = 1;\nconst b = 2;\nconst c = 3;';
    fixture.detectChanges();
    const lines = fixture.nativeElement.querySelectorAll('.code-block__line');
    expect(lines.length).toBe(3);
  });

  // ── Copy button a11y ────────────────────────────────────────────────

  describe('copy button', () => {
    const flush = () => new Promise<void>(r => setTimeout(r, 0));

    it('has an accessible name', () => {
      fixture.detectChanges();
      const btn = fixture.nativeElement.querySelector('.code-block__copy') as HTMLButtonElement;
      expect(btn.getAttribute('aria-label')).toBe('Copy code');
    });

    it('announces the copy confirmation through a polite live region', async () => {
      const writeText = jest.fn().mockResolvedValue(undefined);
      Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true });
      fixture.detectChanges();
      const live = fixture.nativeElement.querySelector('.code-block__live') as HTMLElement;
      expect(live).toBeTruthy();
      expect(live.getAttribute('aria-live')).toBe('polite');
      expect(live.textContent?.trim()).toBe('');

      (fixture.nativeElement.querySelector('.code-block__copy') as HTMLButtonElement).click();
      await flush();
      fixture.detectChanges();
      expect(writeText).toHaveBeenCalledWith('const x = 42;');
      expect(live.textContent?.trim()).toBe('Copied to clipboard');
    });

    it('does not throw when the clipboard write is rejected', async () => {
      Object.defineProperty(navigator, 'clipboard', {
        value: { writeText: jest.fn().mockRejectedValue(new Error('denied')) },
        configurable: true,
      });
      fixture.detectChanges();
      (fixture.nativeElement.querySelector('.code-block__copy') as HTMLButtonElement).click();
      await flush();
      fixture.detectChanges();
      const live = fixture.nativeElement.querySelector('.code-block__live') as HTMLElement;
      expect(live.textContent?.trim()).toBe('');
    });
  });

  // ── Theme-independent chrome ink ─────────────────────────────────────
  // The block is always a dark surface; its chrome must not follow the page
  // ink/border tokens (which turn dark in the light theme → sub-3:1 contrast).

  describe('styles', () => {
    const scss = readFileSync(resolve(__dirname, 'code-block.component.scss'), 'utf-8');

    it('uses component-local light-on-dark ink instead of page ink tokens', () => {
      expect(scss).not.toMatch(/--color-text-(primary|secondary|tertiary|disabled)/);
      expect(scss).toMatch(/--lc-code-block-muted:\s*#/);
      expect(scss).toMatch(/\.code-block[\s\S]*__line-number[\s\S]*color:\s*var\(--lc-code-block-muted\)/);
    });

    it('does not draw the light-theme page border around the dark box', () => {
      expect(scss).not.toMatch(/var\(--color-border\)/);
      expect(scss).toMatch(/border:\s*1px solid var\(--lc-code-block-border\)/);
    });
  });
});
