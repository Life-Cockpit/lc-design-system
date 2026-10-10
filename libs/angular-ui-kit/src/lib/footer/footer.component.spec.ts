import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Component, ChangeDetectionStrategy } from '@angular/core';
import { readFileSync } from 'fs';
import { resolve } from 'path';
import { FooterComponent, FooterHeadingLevel, FooterSection, FooterVariant } from './footer.component';
import { provideHttpClient, withXhr } from '@angular/common/http';

@Component({
  standalone: true,
  imports: [FooterComponent],
  changeDetection: ChangeDetectionStrategy.Eager,
  template: `
    <lc-footer
      [sections]="sections"
      [copyright]="copyright"
      [showBorder]="showBorder"
      [compact]="compact"
      [variant]="variant"
      [headingLevel]="headingLevel"
      [navAriaLabel]="navAriaLabel"
      [externalLinkHint]="externalLinkHint"
    />
  `,
})
class TestHostComponent {
  sections: FooterSection[] = [];
  copyright = '';
  showBorder = true;
  compact = false;
  variant: FooterVariant = 'default';
  headingLevel: FooterHeadingLevel = 4;
  navAriaLabel = 'Footer';
  externalLinkHint = '(opens in a new tab)';
}

describe('FooterComponent', () => {
  let fixture: ComponentFixture<TestHostComponent>;
  let host: TestHostComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TestHostComponent],
      providers: [provideHttpClient(withXhr())],
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

  describe('accessibility (G-3)', () => {
    const sections: FooterSection[] = [
      {
        title: 'Seiten',
        links: [
          { label: 'Sicherheit', href: '/de/sicherheit', current: true },
          { label: 'Roadmap', href: '/de/roadmap' },
        ],
      },
      {
        title: 'Mitverfolgen',
        links: [
          { label: 'LinkedIn', href: 'https://www.linkedin.com/in/x', rel: 'me' },
          { label: 'GitHub', href: 'https://github.com/x', external: true },
          { label: 'Mastodon', href: 'https://mastodon.social/@x', external: true, rel: 'me noopener' },
        ],
      },
    ];

    beforeEach(() => {
      host.sections = sections;
    });

    it('wraps the sections in a labelled <nav>', () => {
      fixture.detectChanges();
      const nav = fixture.nativeElement.querySelector('footer nav');
      expect(nav).toBeTruthy();
      expect(nav.getAttribute('aria-label')).toBe('Footer');
      expect(nav.querySelectorAll('.footer__section').length).toBe(2);

      host.navAriaLabel = 'Fußzeile';
      fixture.changeDetectorRef.markForCheck();
      fixture.detectChanges();
      expect(nav.getAttribute('aria-label')).toBe('Fußzeile');
    });

    it('renders section titles as <h4> by default', () => {
      fixture.detectChanges();
      const titles = fixture.nativeElement.querySelectorAll('.footer__section-title');
      expect([...titles].map((t: Element) => t.tagName)).toEqual(['H4', 'H4']);
    });

    it.each<[FooterHeadingLevel, string]>([
      [2, 'H2'],
      [3, 'H3'],
      [5, 'H5'],
      [6, 'H6'],
    ])('renders section titles at headingLevel %s', (level, tag) => {
      host.headingLevel = level;
      fixture.detectChanges();
      const titles = fixture.nativeElement.querySelectorAll('.footer__section-title');
      expect([...titles].map((t: Element) => t.tagName)).toEqual([tag, tag]);
      expect(titles[0].textContent.trim()).toBe('Seiten');
    });

    it('marks the current page with aria-current="page"', () => {
      fixture.detectChanges();
      const links = [...fixture.nativeElement.querySelectorAll('.footer__link')] as HTMLAnchorElement[];
      expect(links.map((a) => a.getAttribute('aria-current'))).toEqual(['page', null, null, null, null]);
      expect(links[0].classList).toContain('footer__link--current');
    });

    it('uses the given rel, and noopener noreferrer for external links without one', () => {
      fixture.detectChanges();
      const links = [...fixture.nativeElement.querySelectorAll('.footer__link')] as HTMLAnchorElement[];
      expect(links[1].getAttribute('rel')).toBeNull();
      expect(links[2].getAttribute('rel')).toBe('me');
      expect(links[2].getAttribute('target')).toBe('_self');
      expect(links[3].getAttribute('rel')).toBe('noopener noreferrer');
      expect(links[4].getAttribute('rel')).toBe('me noopener');
    });

    it('tells screen-reader users that an external link opens a new tab', () => {
      fixture.detectChanges();
      const external = fixture.nativeElement.querySelectorAll('.footer__link')[3] as HTMLAnchorElement;
      const hint = external.querySelector('.footer__sr-only');
      expect(hint?.textContent?.trim()).toBe('(opens in a new tab)');
      expect(external.textContent?.replace(/\s+/g, ' ').trim()).toBe('GitHub (opens in a new tab)');
      // The icon is decoration; the hint carries the meaning.
      expect(external.querySelector('lc-icon')?.getAttribute('aria-hidden')).toBe('true');

      host.externalLinkHint = '(öffnet in neuem Tab)';
      fixture.changeDetectorRef.markForCheck();
      fixture.detectChanges();
      expect(external.querySelector('.footer__sr-only')?.textContent?.trim()).toBe('(öffnet in neuem Tab)');
    });

    it('adds no hint to internal links', () => {
      fixture.detectChanges();
      const internal = fixture.nativeElement.querySelectorAll('.footer__link')[0] as HTMLAnchorElement;
      expect(internal.querySelector('.footer__sr-only')).toBeNull();
    });
  });

  describe('Stylesheet contract (G-3)', () => {
    const scss = readFileSync(resolve(__dirname, 'footer.component.scss'), 'utf-8');

    it('draws default links and the copyright line in the secondary ink, not the tertiary one', () => {
      // Tertiary (#6b7280) measures 4.39:1 on the light page background
      // (#f3f4f6) — below 4.5:1 for 14 px text. Secondary measures 6.87:1.
      const link = scss.slice(scss.indexOf('&__link {'), scss.indexOf('&__external-icon'));
      expect(link).toMatch(/color:\s*var\(--color-text-secondary\)/);
      expect(link).not.toMatch(/--color-text-tertiary/);
      const copyright = scss.slice(scss.indexOf('&__copyright {'));
      expect(copyright.slice(0, copyright.indexOf('}'))).toMatch(/var\(--color-text-secondary\)/);
    });

    it('gives every link a 44 px minimum height', () => {
      const link = scss.slice(scss.indexOf('&__link {'), scss.indexOf('&__external-icon'));
      expect(link).toMatch(/min-height:\s*var\(--size-min-touch-height, 2\.75rem\)/);
    });
  });
});
