import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { By } from '@angular/platform-browser';
import { RichTextEditorComponent } from './rich-text-editor.component';

@Component({
  standalone: true,
  imports: [RichTextEditorComponent, ReactiveFormsModule],
  template: `<lc-rich-text-editor [formControl]="control" [mode]="mode()" />`,
})
class FormHost {
  control = new FormControl('# Hello **world**');
  mode = signal<'rich' | 'markdown' | 'split'>('rich');
}

describe('RichTextEditorComponent', () => {
  let component: RichTextEditorComponent;
  let fixture: ComponentFixture<RichTextEditorComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RichTextEditorComponent, FormHost],
    }).compileComponents();

    fixture = TestBed.createComponent(RichTextEditorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('Basic Structure', () => {
    it('should render the editor container', () => {
      const el = fixture.debugElement.query(By.css('.lc-rich-text-editor'));
      expect(el).toBeTruthy();
    });

    it('should render the toolbar', () => {
      const toolbar = fixture.debugElement.query(By.css('.lc-rich-text-editor__toolbar'));
      expect(toolbar).toBeTruthy();
    });

    it('should render toolbar action buttons', () => {
      const buttons = fixture.debugElement.queryAll(By.css('.lc-rich-text-editor__toolbar-btn'));
      expect(buttons.length).toBeGreaterThan(0);
    });

    it('should render mode toggle buttons', () => {
      const modes = fixture.debugElement.queryAll(By.css('.lc-rich-text-editor__mode-btn'));
      expect(modes.length).toBe(3);
    });

    it('should show word count footer by default', () => {
      const footer = fixture.debugElement.query(By.css('.lc-rich-text-editor__footer'));
      expect(footer).toBeTruthy();
    });
  });

  describe('Modes', () => {
    it('should default to rich mode', () => {
      const richArea = fixture.debugElement.query(By.css('.lc-rich-text-editor__rich'));
      expect(richArea).toBeTruthy();
    });

    it('should switch to markdown mode', () => {
      const mdBtn = fixture.debugElement.queryAll(By.css('.lc-rich-text-editor__mode-btn'))[1];
      mdBtn.nativeElement.click();
      fixture.detectChanges();

      const textarea = fixture.debugElement.query(By.css('.lc-rich-text-editor__textarea'));
      expect(textarea).toBeTruthy();
    });

    it('should switch to split mode', () => {
      const splitBtn = fixture.debugElement.queryAll(By.css('.lc-rich-text-editor__mode-btn'))[2];
      splitBtn.nativeElement.click();
      fixture.detectChanges();

      const split = fixture.debugElement.query(By.css('.lc-rich-text-editor__split'));
      expect(split).toBeTruthy();
    });

    it('should highlight active mode button', () => {
      const richBtn = fixture.debugElement.queryAll(By.css('.lc-rich-text-editor__mode-btn'))[0];
      expect(richBtn.nativeElement.classList.contains('active')).toBe(true);
    });
  });

  describe('Markdown Input', () => {
    beforeEach(() => {
      // Switch to markdown mode
      const mdBtn = fixture.debugElement.queryAll(By.css('.lc-rich-text-editor__mode-btn'))[1];
      mdBtn.nativeElement.click();
      fixture.detectChanges();
    });

    it('should accept text input in markdown mode', () => {
      const textarea = fixture.debugElement.query(By.css('.lc-rich-text-editor__textarea'));
      textarea.nativeElement.value = 'Hello World';
      textarea.nativeElement.dispatchEvent(new Event('input'));
      fixture.detectChanges();

      expect(component.wordCount()).toBe(2);
    });

    it('should emit contentChange on input', () => {
      jest.spyOn(component.contentChange, 'emit');
      const textarea = fixture.debugElement.query(By.css('.lc-rich-text-editor__textarea'));
      textarea.nativeElement.value = 'Test content';
      textarea.nativeElement.dispatchEvent(new Event('input'));
      fixture.detectChanges();

      expect(component.contentChange.emit).toHaveBeenCalledWith('Test content');
    });

    it('should show word count', () => {
      const textarea = fixture.debugElement.query(By.css('.lc-rich-text-editor__textarea'));
      textarea.nativeElement.value = 'one two three four five';
      textarea.nativeElement.dispatchEvent(new Event('input'));
      fixture.detectChanges();

      expect(component.wordCount()).toBe(5);
    });

    it('should show character count', () => {
      const textarea = fixture.debugElement.query(By.css('.lc-rich-text-editor__textarea'));
      textarea.nativeElement.value = 'hello';
      textarea.nativeElement.dispatchEvent(new Event('input'));
      fixture.detectChanges();

      expect(component.charCount()).toBe(5);
    });
  });

  describe('Markdown to HTML', () => {
    it('should convert headings', () => {
      component.writeValue('# Title\n## Subtitle');
      expect(component['renderedHtml']()).toContain('<h1>Title</h1>');
      expect(component['renderedHtml']()).toContain('<h2>Subtitle</h2>');
    });

    it('should convert bold text', () => {
      component.writeValue('**bold**');
      expect(component['renderedHtml']()).toContain('<strong>bold</strong>');
    });

    it('should convert italic text', () => {
      component.writeValue('*italic*');
      expect(component['renderedHtml']()).toContain('<em>italic</em>');
    });

    it('should convert inline code', () => {
      component.writeValue('`code`');
      expect(component['renderedHtml']()).toContain('<code>code</code>');
    });

    it('should convert links', () => {
      component.writeValue('[link](http://example.com)');
      expect(component['renderedHtml']()).toContain('<a href="http://example.com">link</a>');
    });

    it('should convert horizontal rules', () => {
      component.writeValue('---');
      expect(component['renderedHtml']()).toContain('<hr>');
    });

    it('should convert blockquotes', () => {
      component.writeValue('> quote');
      expect(component['renderedHtml']()).toContain('<blockquote>quote</blockquote>');
    });

    it('should convert strikethrough', () => {
      component.writeValue('~~deleted~~');
      expect(component['renderedHtml']()).toContain('<del>deleted</del>');
    });
  });

  // ── Safety of the built-in markdown renderer ─────────────────────────
  // The rich area is filled via innerHTML, and the markdown may come from a
  // server or another user — nothing in it may become live markup.
  describe('Sanitisation', () => {
    const rendered = () => component['renderedHtml']();
    // What the browser would actually build from the HTML — the only thing that
    // matters. (Text that merely *reads* like an attribute is harmless.)
    const dom = (html: string) => {
      const el = document.createElement('div');
      el.innerHTML = html;
      return el;
    };
    const hasEventHandler = (root: HTMLElement) =>
      Array.from(root.querySelectorAll('*')).some((n) =>
        Array.from(n.attributes).some((a) => a.name.startsWith('on')),
      );

    it('should show raw HTML in the markdown as text, not markup', () => {
      component.writeValue('Hello <img src=x onerror="alert(1)"> <script>alert(2)</script>');
      const root = dom(rendered());
      expect(root.querySelector('img')).toBeNull();
      expect(root.querySelector('script')).toBeNull();
      expect(hasEventHandler(root)).toBe(false);
      expect(root.textContent).toContain('<img src=x onerror="alert(1)">');
    });

    it('should drop javascript: links but keep their text', () => {
      component.writeValue('[click me](javascript:alert(1))');
      const html = rendered();
      expect(html).not.toContain('javascript:');
      expect(html).not.toContain('<a');
      expect(html).toContain('click me');
    });

    it('should keep http(s), mailto and relative links', () => {
      component.writeValue('[a](https://example.com) [b](mailto:x@example.com) [c](/docs) [d](#top)');
      const html = rendered();
      expect(html).toContain('href="https://example.com"');
      expect(html).toContain('href="mailto:x@example.com"');
      expect(html).toContain('href="/docs"');
      expect(html).toContain('href="#top"');
    });

    it('should not let a quote in a URL break out of the attribute', () => {
      component.writeValue('![x](x" onerror="alert(1))');
      const root = dom(rendered());
      const img = root.querySelector('img');
      // Either no image at all, or one whose only attributes are alt/src.
      expect(img === null || !img.hasAttribute('onerror')).toBe(true);
      expect(hasEventHandler(root)).toBe(false);
    });

    it('should never put unsanitised markup into the rich area', () => {
      component.writeValue('<b onclick="alert(1)">x</b> <img src=x onerror=alert(1)>');
      fixture.detectChanges();
      const rich = fixture.debugElement.query(By.css('.lc-rich-text-editor__rich')).nativeElement as HTMLElement;
      expect(rich.querySelector('img')).toBeNull();
      expect(rich.querySelector('b')).toBeNull();
      expect(hasEventHandler(rich)).toBe(false);
    });

    it('should still support the underline markup the toolbar writes', () => {
      component.writeValue('<u>under</u>');
      expect(rendered()).toContain('<u>under</u>');
    });
  });

  // ── Form integration ─────────────────────────────────────────────────
  describe('Form integration', () => {
    let hostFixture: ComponentFixture<FormHost>;
    let host: FormHost;

    beforeEach(() => {
      hostFixture = TestBed.createComponent(FormHost);
      host = hostFixture.componentInstance;
      hostFixture.detectChanges();
    });

    const richArea = () =>
      hostFixture.nativeElement.querySelector('.lc-rich-text-editor__rich') as HTMLElement;

    it('should render the initial form value into the rich area', () => {
      // writeValue runs before the view exists — the rich area must still be filled.
      expect(richArea().innerHTML).toContain('<h1>Hello <strong>world</strong></h1>');
    });

    it('should render a later setValue into the rich area', () => {
      host.control.setValue('*later*');
      hostFixture.detectChanges();
      expect(richArea().innerHTML).toContain('<em>later</em>');
    });

    it('should re-render when switching back into rich mode', () => {
      host.mode.set('markdown');
      hostFixture.detectChanges();
      expect(richArea()).toBeNull();
      host.mode.set('rich');
      hostFixture.detectChanges();
      expect(richArea().innerHTML).toContain('<h1>');
    });

    it('should honour control.disable(): toolbar and rich area become inert', () => {
      host.control.disable();
      hostFixture.detectChanges();
      expect(richArea().getAttribute('contenteditable')).toBe('false');
      expect(richArea().getAttribute('aria-disabled')).toBe('true');
      const btns = hostFixture.nativeElement.querySelectorAll('.lc-rich-text-editor__toolbar-btn') as NodeListOf<HTMLButtonElement>;
      btns.forEach((b) => expect(b.disabled).toBe(true));

      host.control.enable();
      hostFixture.detectChanges();
      expect(richArea().getAttribute('contenteditable')).toBe('true');
    });
  });

  describe('Readonly', () => {
    it('should make the rich area non-editable', () => {
      fixture.componentRef.setInput('readonly', true);
      fixture.detectChanges();
      const rich = fixture.debugElement.query(By.css('.lc-rich-text-editor__rich')).nativeElement as HTMLElement;
      expect(rich.getAttribute('contenteditable')).toBe('false');
      expect(rich.getAttribute('aria-readonly')).toBe('true');
    });
  });

  describe('ControlValueAccessor', () => {
    it('should write value', () => {
      component.writeValue('Hello World');
      expect(component.wordCount()).toBe(2);
    });

    it('should register onChange', () => {
      const fn = jest.fn();
      component.registerOnChange(fn);
      // Switch to markdown mode to trigger input
      const mdBtn = fixture.debugElement.queryAll(By.css('.lc-rich-text-editor__mode-btn'))[1];
      mdBtn.nativeElement.click();
      fixture.detectChanges();

      const textarea = fixture.debugElement.query(By.css('.lc-rich-text-editor__textarea'));
      textarea.nativeElement.value = 'New text';
      textarea.nativeElement.dispatchEvent(new Event('input'));
      fixture.detectChanges();

      expect(fn).toHaveBeenCalledWith('New text');
    });

    it('should register onTouched', () => {
      const fn = jest.fn();
      component.registerOnTouched(fn);
      // Switch to markdown mode
      const mdBtn = fixture.debugElement.queryAll(By.css('.lc-rich-text-editor__mode-btn'))[1];
      mdBtn.nativeElement.click();
      fixture.detectChanges();

      const textarea = fixture.debugElement.query(By.css('.lc-rich-text-editor__textarea'));
      textarea.nativeElement.dispatchEvent(new Event('blur'));
      fixture.detectChanges();

      expect(fn).toHaveBeenCalled();
    });
  });

  describe('Disabled State', () => {
    it('should apply disabled class when disabled', () => {
      fixture.componentRef.setInput('disabled', true);
      fixture.detectChanges();

      const el = fixture.debugElement.query(By.css('.lc-rich-text-editor--disabled'));
      expect(el).toBeTruthy();
    });

    it('should disable toolbar buttons when disabled', () => {
      fixture.componentRef.setInput('disabled', true);
      fixture.detectChanges();

      const btns = fixture.debugElement.queryAll(By.css('.lc-rich-text-editor__toolbar-btn'));
      btns.forEach(btn => {
        expect(btn.nativeElement.disabled).toBe(true);
      });
    });
  });

  describe('Configuration', () => {
    it('should hide word count when showWordCount is false', () => {
      fixture.componentRef.setInput('showWordCount', false);
      fixture.detectChanges();

      const footer = fixture.debugElement.query(By.css('.lc-rich-text-editor__footer'));
      expect(footer).toBeFalsy();
    });

    it('should apply minHeight', () => {
      fixture.componentRef.setInput('minHeight', 300);
      fixture.detectChanges();

      const content = fixture.debugElement.query(By.css('.lc-rich-text-editor__content'));
      expect(content.nativeElement.style.minHeight).toBe('300px');
    });

    it('should respect custom toolbar config', () => {
      fixture.componentRef.setInput('toolbar', { actions: ['bold', 'italic'] });
      fixture.detectChanges();

      const btns = fixture.debugElement.queryAll(By.css('.lc-rich-text-editor__toolbar-btn'));
      expect(btns.length).toBe(2);
    });
  });
});
