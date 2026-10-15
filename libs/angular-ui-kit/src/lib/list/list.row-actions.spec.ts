import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient, withXhr } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { compile } from 'sass';
import { join } from 'path';
import { ListComponent, ListItem } from './list.component';

/** 3.3: row actions (AC-1) and hover only on clickable rows (AC-3). */
describe('ListComponent 3.3: row actions and affordance (AC-1, AC-3)', () => {
  let fixture: ComponentFixture<ListComponent>;
  let el: HTMLElement;
  let httpMock: HttpTestingController;

  const items: ListItem[] = [
    { id: 'a', label: 'iPhone · Safari', action: 'Entfernen', actionAriaLabel: 'iPhone · Safari entfernen' },
    { id: 'b', label: 'Windows · Edge', action: 'Entfernen' },
  ];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ListComponent],
      providers: [provideHttpClient(withXhr()), provideHttpClientTesting()],
    }).compileComponents();
    fixture = TestBed.createComponent(ListComponent);
    fixture.componentRef.setInput('items', items);
    el = fixture.nativeElement;
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.match(() => true).forEach((req) => req.cancelled || req.flush('<svg xmlns="http://www.w3.org/2000/svg"/>'));
    httpMock.verify();
  });

  const actionButtons = (): HTMLButtonElement[] =>
    Array.from(el.querySelectorAll('.lc-list__action button')) as HTMLButtonElement[];

  it('keeps the 3.2 ghost xs action by default', () => {
    fixture.detectChanges();
    for (const b of actionButtons()) {
      expect(b.classList).toContain('btn-ghost');
      expect(b.classList).toContain('btn-xs');
    }
  });

  it('applies actionVariant and actionSize to every row action', () => {
    fixture.componentRef.setInput('actionVariant', 'outline');
    fixture.componentRef.setInput('actionSize', 'lg');
    fixture.detectChanges();
    expect(actionButtons().length).toBe(2);
    for (const b of actionButtons()) {
      expect(b.classList).toContain('btn-outline');
      expect(b.classList).toContain('btn-lg');
    }
  });

  it('names each row action with its actionAriaLabel', () => {
    fixture.detectChanges();
    const [first, second] = actionButtons();
    expect(first.getAttribute('aria-label')).toBe('iPhone · Safari entfernen');
    expect(second.getAttribute('aria-label')).toBeNull();
  });

  it('marks the list as clickable only when rows act', () => {
    fixture.detectChanges();
    expect(el.querySelector('.lc-list')?.classList).not.toContain('lc-list--clickable');
    fixture.componentRef.setInput('clickable', true);
    fixture.detectChanges();
    expect(el.querySelector('.lc-list')?.classList).toContain('lc-list--clickable');
  });

  it('clamps descriptions by default and not with clampDescription=false (G-11)', () => {
    fixture.detectChanges();
    expect(el.querySelector('.lc-list')?.classList).not.toContain('lc-list--no-clamp');
    fixture.componentRef.setInput('clampDescription', false);
    fixture.detectChanges();
    expect(el.querySelector('.lc-list')?.classList).toContain('lc-list--no-clamp');
  });

  describe('stylesheet', () => {
    // jsdom applies no stylesheets: read the contract from the compiled CSS.
    const css = compile(join(__dirname, 'list.component.scss'), {
      loadPaths: [join(__dirname, '../../styles')],
    }).css;
    const rule = (selector: string): string => {
      const start = css.indexOf(`${selector} {`);
      expect(start).toBeGreaterThan(-1);
      return css.slice(start, css.indexOf('}', start));
    };

    it('gives plain rows no pointer and no hover', () => {
      expect(rule('.lc-list__item')).not.toMatch(/cursor:\s*pointer/);
      expect(css).not.toMatch(/(^|\n)\.lc-list__item:hover/);
    });

    it('shows full descriptions without the clamp', () => {
      const rule2 = rule('.lc-list--no-clamp .lc-list__description');
      expect(rule2).toMatch(/-webkit-line-clamp:\s*unset/);
      expect(rule2).toMatch(/overflow:\s*visible/);
    });

    it('gives clickable rows the pointer and the hover background', () => {
      expect(rule('.lc-list--clickable .lc-list__item')).toMatch(/cursor:\s*pointer/);
      expect(css).toMatch(/\.lc-list--clickable \.lc-list__item:hover:not\(\.lc-list__item--disabled\)\s*{[^}]*--color-surface-hover/);
    });
  });
});
