import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient, withXhr } from '@angular/common/http';
import { resolve } from 'path';
import { compile } from 'sass';
import { provideLcIcons, type LcIconDefinition } from '@lifecorner/angular-ui-kit/icon';
import { CodeBlockComponent } from './code-block.component';

/**
 * 3.7 (request 004, AS-21, WCAG 2.1.1): the body is a focusable, named scroll
 * region, unless `wrap` wraps the lines instead. code-block.component.spec.ts
 * and code-block.rendering.spec.ts stay unchanged (AC-8).
 */

const CLIPBOARD: LcIconDefinition = {
  name: 'clipboard-document',
  variant: 'outline',
  svg: '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M9 5h6v4H9z" /></svg>',
};

/** What the browser puts in the tab order, in DOM order. */
const FOCUSABLE = 'a[href], button:not([disabled]), input, select, textarea, [tabindex]:not([tabindex="-1"])';

function render(code: string, inputs: Record<string, unknown> = {}): ComponentFixture<CodeBlockComponent> {
  const fixture = TestBed.createComponent(CodeBlockComponent);
  fixture.componentRef.setInput('code', code);
  for (const [key, value] of Object.entries(inputs)) fixture.componentRef.setInput(key, value);
  fixture.detectChanges();
  return fixture;
}

const body = (fixture: ComponentFixture<CodeBlockComponent>) =>
  fixture.nativeElement.querySelector('.code-block__body') as HTMLElement;

/** The element's attributes without Angular's encapsulation markers. */
const attributesOf = (el: Element) =>
  [...el.attributes].filter((a) => !a.name.startsWith('_ng')).map((a) => [a.name, a.value]);

describe('CodeBlockComponent scroll region (AS-21)', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CodeBlockComponent],
      providers: [provideHttpClient(withXhr()), provideLcIcons([CLIPBOARD])],
    }).compileComponents();
  });

  describe('AC-1: a keyboard-reachable region by default', () => {
    it('gives the body tabindex="0" and role="region"', () => {
      const el = body(render('npm test', { language: 'bash' }));
      expect(el.getAttribute('tabindex')).toBe('0');
      expect(el.getAttribute('role')).toBe('region');
      expect(el.tabIndex).toBe(0);
    });

    it('is the next tab stop after the copy button, and takes focus', () => {
      const fixture = render('npm test', { language: 'bash' });
      const root = fixture.nativeElement as HTMLElement;
      const stops = [...root.querySelectorAll<HTMLElement>(FOCUSABLE)];
      const copy = root.querySelector('.code-block__copy') as HTMLElement;
      expect(stops).toEqual([copy, body(fixture)]);
      body(fixture).focus();
      expect(document.activeElement).toBe(body(fixture));
    });

    it('is the only tab stop without a header', () => {
      const fixture = render('npm test', { language: 'bash', showHeader: false });
      expect([...(fixture.nativeElement as HTMLElement).querySelectorAll(FOCUSABLE)]).toEqual([body(fixture)]);
    });
  });

  describe('AC-2: the region name', () => {
    const name = (inputs: Record<string, unknown>) => body(render('x', inputs)).getAttribute('aria-label');

    it('is the filename when one is set', () => {
      expect(name({ language: 'typescript', filename: 'x.ts' })).toBe('x.ts');
    });

    it('is the language without a filename', () => {
      expect(name({ language: 'bash' })).toBe('bash');
    });

    it('is regionLabel when set, before the filename', () => {
      expect(name({ language: 'bash', filename: 'Terminal', regionLabel: 'Befehl für Claude Code' })).toBe('Befehl für Claude Code');
    });

    it('is set when the header is hidden', () => {
      expect(name({ language: 'bash', showHeader: false })).toBe('bash');
      expect(name({ language: 'bash', showHeader: false, regionLabel: 'Command for Claude Code' })).toBe('Command for Claude Code');
    });

    it('falls through an empty regionLabel', () => {
      expect(name({ language: 'bash', filename: 'Terminal', regionLabel: '' })).toBe('Terminal');
    });

    it('follows a changed regionLabel', () => {
      const fixture = render('x', { language: 'bash', regionLabel: 'Command' });
      fixture.componentRef.setInput('regionLabel', 'Befehl');
      fixture.detectChanges();
      expect(body(fixture).getAttribute('aria-label')).toBe('Befehl');
    });
  });

  describe('AC-7: wrap', () => {
    it('removes the tab stop, the role and the name, and marks the root', () => {
      const fixture = render('npm test', { language: 'bash', filename: 'Terminal', regionLabel: 'Befehl', wrap: true });
      const el = body(fixture);
      expect(el.hasAttribute('tabindex')).toBe(false);
      expect(el.hasAttribute('role')).toBe(false);
      expect(el.hasAttribute('aria-label')).toBe(false);
      expect(el.tabIndex).toBe(-1);
      expect(fixture.nativeElement.querySelector('.code-block')?.className).toBe('code-block code-block--bash code-block--wrap');
    });

    it('leaves the copy button as the only tab stop', () => {
      const fixture = render('npm test', { language: 'bash', wrap: true });
      const root = fixture.nativeElement as HTMLElement;
      expect([...root.querySelectorAll(FOCUSABLE)]).toEqual([root.querySelector('.code-block__copy')]);
    });
  });

  describe('AC-8: the default rendering is unchanged', () => {
    it('adds only the three region attributes to the body; root class and line markup as in 3.6.1', () => {
      for (const inputs of [{}, { wrap: false }]) {
        const root = render('const a = 1;\nb', { language: 'typescript', ...inputs }).nativeElement as HTMLElement;
        expect(root.querySelector('.code-block')?.className).toBe('code-block code-block--typescript');
        expect(attributesOf(root.querySelector('.code-block__body') as Element)).toEqual([
          ['class', 'code-block__body'], ['tabindex', '0'], ['role', 'region'], ['aria-label', 'typescript'],
        ]);
        expect(attributesOf(root.querySelector('.code-block__body > pre') as Element)).toEqual([['class', 'code-block__pre']]);
        const code = root.querySelector('pre.code-block__pre > code.code-block__code') as HTMLElement;
        expect(attributesOf(code)).toEqual([['class', 'code-block__code']]);
        expect([...code.childNodes].filter((n) => n.nodeType !== Node.COMMENT_NODE).map((n) => n.textContent)).toEqual([
          '1const a = 1;', '\n', '2b', '\n',
        ]);
      }
    });
  });

  describe('styles (AC-5, AC-6)', () => {
    const css = compile(resolve(__dirname, 'code-block.component.scss')).css.replace(/\/\*[\s\S]*?\*\//g, '');
    /** The declarations of every rule whose selector list equals `selector` (outside @media unless `media`). */
    const rule = (selector: string, media?: string) => {
      const scope = media ? `${(css.split(`@media ${media} {`)[1] ?? '').split(/\}\s*\}/)[0]}}` : css.replace(/@media[^{]*\{(?:[^{}]*\{[^}]*\})*\s*\}/g, '');
      const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      return [...scope.matchAll(new RegExp(`(?<=^|\\})\\s*${escaped}\\s*\\{([^}]*)\\}`, 'g'))].map((m) => m[1]).join('');
    };

    it('the scroller is the body: the pre does not scroll (global `pre` overridden)', () => {
      expect(rule('.code-block__body')).toMatch(/overflow-x:\s*auto;/);
      expect(rule('.code-block__pre')).toMatch(/overflow:\s*visible;/);
    });

    it('draws an inset 2 px outline ring in the primary colour, not a box-shadow (AC-5)', () => {
      const focus = rule('.code-block__body:focus-visible');
      expect(focus).toMatch(/outline:\s*2px solid var\(--color-primary-500\);/);
      expect(focus).toMatch(/outline-offset:\s*-4px;/);
      expect(focus).toMatch(/border-radius:\s*0 0 calc\(var\(--border-radius-md\) - 1px\) calc\(var\(--border-radius-md\) - 1px\);/);
      expect(focus).not.toMatch(/box-shadow/);
      expect(rule('.code-block__body:first-child:focus-visible')).toMatch(/border-radius:\s*calc\(var\(--border-radius-md\) - 1px\);/);
    });

    it('keeps the body without a radius at rest', () => {
      expect(rule('.code-block__body')).not.toMatch(/border-radius/);
    });

    it('colours the ring Highlight in forced colors (AC-5)', () => {
      expect(rule('.code-block__body:focus-visible', '(forced-colors: active)')).toMatch(/outline-color:\s*Highlight;/);
    });

    it('wraps line content only under code-block--wrap (AC-6)', () => {
      const wrapped = rule('.code-block--wrap .code-block__line-content');
      expect(wrapped).toMatch(/white-space:\s*pre-wrap;/);
      expect(wrapped).toMatch(/overflow-wrap:\s*anywhere;/);
      expect(wrapped).toMatch(/min-width:\s*0;/);
      expect(rule('.code-block__line-content')).toMatch(/white-space:\s*pre;/);
      expect(rule('.code-block__line')).not.toMatch(/align-items/);
    });
  });
});
