import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Component } from '@angular/core';
import { readFileSync } from 'fs';
import { resolve } from 'path';
import { FooterComponent, FooterSection, FooterVariant } from './footer.component';
import { provideHttpClient } from '@angular/common/http';

@Component({
  standalone: true,
  imports: [FooterComponent],
  template: `
    <lc-footer
      [sections]="sections"
      [copyright]="copyright"
      [showBorder]="showBorder"
      [compact]="compact"
      [variant]="variant"
    />
  `,
})
class TestHostComponent {
  sections: FooterSection[] = [];
  copyright = '';
  showBorder = true;
  compact = false;
  variant: FooterVariant = 'default';
}

describe('FooterComponent', () => {
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

  it('should render footer element', () => {
    fixture.detectChanges();
    const footer = fixture.nativeElement.querySelector('footer');
    expect(footer).toBeTruthy();
    expect(footer.getAttribute('role')).toBe('contentinfo');
  });

  it('should render copyright text', () => {
    host.copyright = '© 2026 Life-Cockpit';
    fixture.detectChanges();
    const copyright = fixture.nativeElement.querySelector('.footer__copyright');
    expect(copyright.textContent.trim()).toBe('© 2026 Life-Cockpit');
  });

  it('should render sections with links', () => {
    host.sections = [
      {
        title: 'Product',
        links: [
          { label: 'Features', href: '/features' },
          { label: 'Pricing', href: '/pricing' },
        ],
      },
      {
        title: 'Company',
        links: [{ label: 'About', href: '/about' }],
      },
    ];
    fixture.detectChanges();

    const sectionTitles = fixture.nativeElement.querySelectorAll('.footer__section-title');
    expect(sectionTitles.length).toBe(2);
    expect(sectionTitles[0].textContent.trim()).toBe('Product');

    const links = fixture.nativeElement.querySelectorAll('.footer__link');
    expect(links.length).toBe(3);
  });

  it('should apply bordered class by default', () => {
    fixture.detectChanges();
    const footer = fixture.nativeElement.querySelector('.footer');
    expect(footer.classList).toContain('footer--bordered');
  });

  it('should not apply bordered class when disabled', () => {
    host.showBorder = false;
    fixture.detectChanges();
    const footer = fixture.nativeElement.querySelector('.footer');
    expect(footer.classList).not.toContain('footer--bordered');
  });

  it('should apply compact class', () => {
    host.compact = true;
    fixture.detectChanges();
    const footer = fixture.nativeElement.querySelector('.footer');
    expect(footer.classList).toContain('footer--compact');
  });

  it('should not render sections in compact mode', () => {
    host.compact = true;
    host.sections = [
      { title: 'Test', links: [{ label: 'Link', href: '#' }] },
    ];
    fixture.detectChanges();
    const sections = fixture.nativeElement.querySelector('.footer__sections');
    expect(sections).toBeNull();
  });

  (['default', 'primary', 'dark', 'neutral'] as FooterVariant[]).forEach((variant) => {
    it(`should apply the ${variant} variant class`, () => {
      host.variant = variant;
      fixture.detectChanges();
      const footer = fixture.nativeElement.querySelector('.footer');
      expect(footer.classList).toContain(`footer--${variant}`);
    });
  });

  describe('Stylesheet contract', () => {
    // jsdom does not apply component styles; the fixed-surface variants are
    // checked against the source. `dark` and `primary` promise a dark surface
    // with light ink in BOTH themes, which the inverting neutral/primary scale
    // tokens cannot deliver (neutral-100 title on a neutral-100 surface in
    // light, white link hover on a light surface).
    const scss = readFileSync(resolve(__dirname, 'footer.component.scss'), 'utf-8');

    function block(marker: string): string {
      const start = scss.indexOf(marker);
      expect(start).toBeGreaterThan(-1);
      // Up to the next top-level variant / end of the modifier list.
      const rest = scss.slice(start + marker.length);
      const end = rest.search(/\n {2}&--/);
      return rest.slice(0, end === -1 ? undefined : end);
    }

    it('dark variant uses no theme-inverting neutral tokens for surface or ink', () => {
      const dark = block('&--dark {');
      expect(dark).not.toMatch(/var\(--color-neutral-/);
      expect(dark).not.toMatch(/var\(--color-surface-sunken/);
      expect(dark).not.toMatch(/var\(--color-text-/);
    });

    it('primary variant uses no theme-inverting primary/neutral tokens', () => {
      const primary = block('&--primary {');
      expect(primary).not.toMatch(/var\(--color-primary-/);
      expect(primary).not.toMatch(/var\(--color-neutral-/);
    });
  });

  it('should set target blank for external links', () => {
    host.sections = [
      {
        title: 'External',
        links: [{ label: 'GitHub', href: 'https://github.com', external: true }],
      },
    ];
    fixture.detectChanges();
    const link = fixture.nativeElement.querySelector('.footer__link');
    expect(link.getAttribute('target')).toBe('_blank');
    expect(link.getAttribute('rel')).toBe('noopener noreferrer');
  });
});
