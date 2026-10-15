import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { readFileSync } from 'fs';
import { resolve } from 'path';
import {
  ProviderButtonAppearance,
  ProviderButtonComponent,
  ProviderButtonShape,
  ProviderButtonSize,
  ProviderButtonText,
  ProviderButtonType,
} from './provider-button.component';
import { GOOGLE_G_LOGO_DATA_URI } from './google-logo';

@Component({
  imports: [ProviderButtonComponent],
  changeDetection: ChangeDetectionStrategy.Eager,
  template: `
    <lc-provider-button
      provider="google"
      [text]="text()"
      [label]="label()"
      [appearance]="appearance()"
      [size]="size()"
      [shape]="shape()"
      [fullWidth]="fullWidth()"
      [iconOnly]="iconOnly()"
      [loading]="loading()"
      [disabled]="disabled()"
      [type]="type()"
      (clicked)="clicks = clicks + 1"
    />
  `,
})
class HostComponent {
  readonly text = signal<ProviderButtonText>('sign-in');
  readonly label = signal('');
  readonly appearance = signal<ProviderButtonAppearance>('auto');
  readonly size = signal<ProviderButtonSize>('md');
  readonly shape = signal<ProviderButtonShape>('pill');
  readonly fullWidth = signal(false);
  readonly iconOnly = signal(false);
  readonly loading = signal(false);
  readonly disabled = signal(false);
  readonly type = signal<ProviderButtonType>('button');
  clicks = 0;
}

describe('ProviderButtonComponent (lc-provider-button)', () => {
  function setup() {
    TestBed.configureTestingModule({ imports: [HostComponent] });
    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
    const element: HTMLElement = fixture.nativeElement;
    const button = () => element.querySelector('button') as HTMLButtonElement;
    const hostEl = () => element.querySelector('lc-provider-button') as HTMLElement;
    return { fixture, host: fixture.componentInstance, element, button, hostEl };
  }

  describe('title', () => {
    it.each<[ProviderButtonText, string]>([
      ['sign-in', 'Sign in with Google'],
      ['sign-up', 'Sign up with Google'],
      ['continue', 'Continue with Google'],
    ])('shows Google’s English title for text="%s" when no label is set', (text, title) => {
      const { fixture, host, button } = setup();
      host.text.set(text);
      fixture.detectChanges();
      expect(button().textContent?.trim()).toBe(title);
    });

    it('shows the localized label the app passes instead', () => {
      const { fixture, host, button } = setup();
      host.text.set('continue');
      host.label.set('Weiter mit Google');
      fixture.detectChanges();
      expect(button().textContent?.trim()).toBe('Weiter mit Google');
      // The visible text is the accessible name: no aria-label next to it.
      expect(button().hasAttribute('aria-label')).toBe(false);
    });
  });

  describe('Google "G"', () => {
    it('is the self-hosted standard G, decorative, at 20 × 20 px', () => {
      const { element } = setup();
      const logo = element.querySelector('img.lc-provider-button__logo') as HTMLImageElement;
      expect(logo).toBeTruthy();
      expect(logo.getAttribute('src')).toBe(GOOGLE_G_LOGO_DATA_URI);
      expect(logo.getAttribute('alt')).toBe('');
      expect(logo.getAttribute('width')).toBe('20');
      expect(logo.getAttribute('height')).toBe('20');
    });

    it('makes no request to Google: the artwork is an inline PNG data URI', () => {
      expect(GOOGLE_G_LOGO_DATA_URI.startsWith('data:image/png;base64,')).toBe(true);
      expect(GOOGLE_G_LOGO_DATA_URI).not.toMatch(/https?:/);
      // A real PNG (signature) of 80 × 80 px (IHDR), i.e. the 20 px G at 4×.
      const bytes = Buffer.from(GOOGLE_G_LOGO_DATA_URI.split(',')[1], 'base64');
      expect(bytes.subarray(1, 4).toString('ascii')).toBe('PNG');
      expect(bytes.readUInt32BE(16)).toBe(80);
      expect(bytes.readUInt32BE(20)).toBe(80);
    });

    it('stays visible when the button is icon-only', () => {
      const { fixture, host, element } = setup();
      host.iconOnly.set(true);
      fixture.detectChanges();
      expect(element.querySelector('img.lc-provider-button__logo')).toBeTruthy();
    });
  });

  describe('native button', () => {
    it('is a type="button" by default and type="submit" for a form POST', () => {
      const { fixture, host, button } = setup();
      expect(button().getAttribute('type')).toBe('button');
      host.type.set('submit');
      fixture.detectChanges();
      expect(button().getAttribute('type')).toBe('submit');
    });

    it('emits clicked on click', () => {
      const { host, button } = setup();
      button().click();
      expect(host.clicks).toBe(1);
    });

    it('is disabled and emits nothing while disabled', () => {
      const { fixture, host, button } = setup();
      host.disabled.set(true);
      fixture.detectChanges();
      expect(button().disabled).toBe(true);
      button().dispatchEvent(new MouseEvent('click'));
      expect(host.clicks).toBe(0);
    });

    it('is busy while loading: aria-busy, a spinner after the title, no clicks', () => {
      const { fixture, host, button, element } = setup();
      expect(button().hasAttribute('aria-busy')).toBe(false);
      host.loading.set(true);
      fixture.detectChanges();
      expect(button().getAttribute('aria-busy')).toBe('true');
      expect(button().disabled).toBe(true);
      const spinner = element.querySelector('.lc-provider-button__spinner');
      expect(spinner?.getAttribute('aria-hidden')).toBe('true');
      expect(spinner?.previousElementSibling?.classList).toContain('lc-provider-button__label');
      button().dispatchEvent(new MouseEvent('click'));
      expect(host.clicks).toBe(0);
    });
  });

  describe('modifiers', () => {
    it('sets the provider, appearance, size and shape classes', () => {
      const { fixture, host, button } = setup();
      expect(button().classList).toContain('lc-provider-button--google');
      expect(button().classList).toContain('lc-provider-button--auto');
      expect(button().classList).toContain('lc-provider-button--md');
      expect(button().classList).toContain('lc-provider-button--pill');

      host.appearance.set('neutral');
      host.size.set('lg');
      host.shape.set('rectangular');
      fixture.detectChanges();
      expect(button().classList).toContain('lc-provider-button--neutral');
      expect(button().classList).toContain('lc-provider-button--lg');
      expect(button().classList).toContain('lc-provider-button--rectangular');
      expect(button().classList).not.toContain('lc-provider-button--auto');
    });

    it('fullWidth stretches the host and the button', () => {
      const { fixture, host, button, hostEl } = setup();
      host.fullWidth.set(true);
      fixture.detectChanges();
      expect(hostEl().classList).toContain('lc-provider-button-host--full-width');
      expect(button().classList).toContain('lc-provider-button--full-width');
    });

    it('iconOnly drops the visible title and names the button with it', () => {
      const { fixture, host, button, element } = setup();
      host.iconOnly.set(true);
      host.label.set('Mit Google anmelden');
      host.fullWidth.set(true);
      fixture.detectChanges();
      expect(element.querySelector('.lc-provider-button__label')).toBeNull();
      expect(button().getAttribute('aria-label')).toBe('Mit Google anmelden');
      expect(button().classList).toContain('lc-provider-button--icon-only');
      // An icon-only button is square; it never stretches.
      expect(button().classList).not.toContain('lc-provider-button--full-width');
    });
  });

  describe('styles follow Google’s branding guidelines', () => {
    const scss = readFileSync(resolve(__dirname, 'provider-button.component.scss'), 'utf-8');
    const block = (name: string) => {
      const match = scss.match(new RegExp(`@mixin ${name} \\{([^}]*)\\}`));
      return (match?.[1] ?? '').toLowerCase();
    };

    it('uses Google’s light colours', () => {
      expect(block('google-light')).toContain('--lc-provider-button-bg: #ffffff');
      expect(block('google-light')).toContain('--lc-provider-button-fg: #1f1f1f');
      expect(block('google-light')).toContain('--lc-provider-button-border: #747775');
    });

    it('uses Google’s dark colours', () => {
      expect(block('google-dark')).toContain('--lc-provider-button-bg: #131314');
      expect(block('google-dark')).toContain('--lc-provider-button-fg: #e3e3e3');
      expect(block('google-dark')).toContain('--lc-provider-button-border: #8e918f');
    });

    it('uses Google’s neutral colours without a visible stroke', () => {
      expect(block('google-neutral')).toContain('--lc-provider-button-bg: #f2f2f2');
      expect(block('google-neutral')).toContain('--lc-provider-button-fg: #1f1f1f');
      expect(block('google-neutral')).toContain('--lc-provider-button-border: #f2f2f2');
    });

    it('sets Google Sans Medium 14/20 and the 12 · logo · 10 · text · 12 padding', () => {
      expect(scss).toMatch(/font-family: 'Google Sans'/);
      expect(scss).toMatch(/font-size: 0\.875rem;/);
      expect(scss).toMatch(/line-height: 1\.25rem;/);
      expect(scss).toMatch(/font-weight: 500;/);
      expect(scss).toMatch(/padding: var\(--lc-provider-button-padding-block\) 12px;/);
      expect(scss).toMatch(/gap: 10px;/);
    });

    it('keeps the G at 20 px', () => {
      expect(scss).toMatch(/\.lc-provider-button__logo \{[^}]*width: 20px;[^}]*height: 20px;/);
    });

    it('`auto` turns dark with the app theme, the way the theme stylesheets do', () => {
      expect(scss).toMatch(
        /:host-context\(:root:not\(\.light\):not\(\.system\)\) \.lc-provider-button--google\.lc-provider-button--auto/,
      );
      expect(scss).toMatch(/:host-context\(\.dark\) \.lc-provider-button--google\.lc-provider-button--auto/);
      expect(scss).toMatch(/prefers-color-scheme: dark\)[\s\S]*:host-context\(:root\.system:not\(\.light\)\)/);
    });

    it('is 40 px (md) and 48.5 px (lg) high, and labels may wrap', () => {
      expect(scss).toMatch(/--lc-provider-button-height: 2\.5rem;/);
      expect(scss).toMatch(/--lc-provider-button-height: 3\.03125rem;/);
      expect(scss).toMatch(/white-space: normal;/);
    });

    it('uses the kit focus ring', () => {
      expect(scss).toContain('@include mix.focus-ring;');
    });
  });
});
