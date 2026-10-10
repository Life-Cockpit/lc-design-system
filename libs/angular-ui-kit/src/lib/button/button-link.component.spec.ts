import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ButtonLinkComponent } from './button-link.component';
import type { ButtonSize, ButtonVariant } from './button.component';

@Component({
  imports: [ButtonLinkComponent],
  changeDetection: ChangeDetectionStrategy.Eager,
  template: `
    <a
      lcButton
      class="consumer-class"
      [class.consumer-bound]="bound()"
      [variant]="variant()"
      [size]="size()"
      [fullWidth]="fullWidth()"
      [iconOnly]="iconOnly()"
      [inline]="inline()"
      href="/de/neuigkeiten"
      hreflang="de"
      lang="de"
      rel="me noopener"
      target="_self"
      title="Changelog"
      aria-describedby="hint"
      download="file.pdf"
    >
      <span slot="icon-after" class="after">→</span>
      <span class="label">Schau uns beim Bauen zu</span>
      <span slot="icon-before" class="before">●</span>
    </a>
  `,
})
class HostComponent {
  readonly variant = signal<ButtonVariant>('primary');
  readonly size = signal<ButtonSize>('md');
  readonly fullWidth = signal(false);
  readonly iconOnly = signal(false);
  readonly inline = signal(false);
  readonly bound = signal(true);
}

@Component({
  imports: [ButtonLinkComponent],
  changeDetection: ChangeDetectionStrategy.Eager,
  template: `<a lcButton [href]="href" [attr.hreflang]="lang" [attr.lang]="lang">English</a>`,
})
class BoundAttributesHostComponent {
  href = '/en/security';
  lang = 'en';
}

describe('ButtonLinkComponent (a[lcButton])', () => {
  function setup() {
    TestBed.configureTestingModule({ imports: [HostComponent] });
    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
    const anchor: HTMLAnchorElement = fixture.nativeElement.querySelector('a');
    return { fixture, host: fixture.componentInstance, anchor };
  }

  it('styles the anchor itself as a primary md button by default', () => {
    const { anchor } = setup();
    expect(anchor.tagName).toBe('A');
    expect(anchor.classList).toContain('btn');
    expect(anchor.classList).toContain('btn-primary');
    expect(anchor.classList).toContain('btn-md');
  });

  it('renders no inner <button>: the link stays the interactive element', () => {
    const { anchor } = setup();
    expect(anchor.querySelector('button')).toBeNull();
  });

  it.each<ButtonVariant>(['primary', 'secondary', 'outline', 'ghost', 'link', 'danger', 'warning', 'info'])(
    'supports the %s variant like lc-button',
    (variant) => {
      const { fixture, host, anchor } = setup();
      host.variant.set(variant);
      fixture.detectChanges();
      expect(anchor.classList).toContain(`btn-${variant}`);
      const variantClasses = [...anchor.classList].filter((c) =>
        /^btn-(primary|secondary|outline|ghost|link|danger|warning|info)$/.test(c),
      );
      expect(variantClasses).toEqual([`btn-${variant}`]);
    },
  );

  it.each<ButtonSize>(['xs', 'sm', 'md', 'lg'])('supports the %s size like lc-button', (size) => {
    const { fixture, host, anchor } = setup();
    host.size.set(size);
    fixture.detectChanges();
    expect(anchor.classList).toContain(`btn-${size}`);
    expect([...anchor.classList].filter((c) => /^btn-(xs|sm|md|lg)$/.test(c))).toEqual([`btn-${size}`]);
  });

  it('maps fullWidth, iconOnly and inline to the lc-button modifier classes', () => {
    const { fixture, host, anchor } = setup();
    expect(anchor.classList).not.toContain('btn-full-width');
    host.fullWidth.set(true);
    host.iconOnly.set(true);
    host.inline.set(true);
    fixture.detectChanges();
    expect(anchor.classList).toContain('btn-full-width');
    expect(anchor.classList).toContain('btn-icon-only');
    expect(anchor.classList).toContain('btn-inline');
  });

  it('passes native link attributes through untouched', () => {
    const { anchor } = setup();
    expect(anchor.getAttribute('href')).toBe('/de/neuigkeiten');
    expect(anchor.getAttribute('hreflang')).toBe('de');
    expect(anchor.getAttribute('lang')).toBe('de');
    expect(anchor.getAttribute('rel')).toBe('me noopener');
    expect(anchor.getAttribute('target')).toBe('_self');
    expect(anchor.getAttribute('title')).toBe('Changelog');
    expect(anchor.getAttribute('aria-describedby')).toBe('hint');
    expect(anchor.getAttribute('download')).toBe('file.pdf');
  });

  it('passes bound native attributes through (they are not inputs)', () => {
    TestBed.configureTestingModule({ imports: [BoundAttributesHostComponent] });
    const fixture = TestBed.createComponent(BoundAttributesHostComponent);
    fixture.detectChanges();
    const anchor: HTMLAnchorElement = fixture.nativeElement.querySelector('a');
    expect(anchor.getAttribute('href')).toBe('/en/security');
    expect(anchor.getAttribute('hreflang')).toBe('en');
    expect(anchor.getAttribute('lang')).toBe('en');
    expect(anchor.classList).toContain('btn-primary');
  });

  it('keeps the consumer’s own static and bound classes', () => {
    const { fixture, host, anchor } = setup();
    expect(anchor.classList).toContain('consumer-class');
    expect(anchor.classList).toContain('consumer-bound');
    host.bound.set(false);
    host.variant.set('outline');
    fixture.detectChanges();
    expect(anchor.classList).toContain('consumer-class');
    expect(anchor.classList).not.toContain('consumer-bound');
    expect(anchor.classList).toContain('btn-outline');
    expect(anchor.classList).not.toContain('btn-primary');
  });

  it('projects icon-before, the label and icon-after in that order', () => {
    const { anchor } = setup();
    const order = [...anchor.children].map((el) => el.className);
    expect(order).toEqual(['before', 'label', 'after']);
  });

  it('adds no event listeners: navigation is the browser’s, so it works without JavaScript', () => {
    const { fixture } = setup();
    const debugAnchor = fixture.debugElement.query((de) => de.nativeElement.tagName === 'A');
    expect(debugAnchor.listeners).toEqual([]);
  });
});
