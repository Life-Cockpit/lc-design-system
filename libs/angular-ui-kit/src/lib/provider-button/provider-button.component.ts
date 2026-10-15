import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { GOOGLE_G_LOGO_DATA_URI } from './google-logo';

/**
 * Sign-in providers the button can draw. Only Google today; Apple follows as a
 * new member of this union (no other API change), with its own artwork and the
 * colours of Apple's Human Interface Guidelines.
 */
export type ProviderButtonProvider = 'google';

/**
 * Which of the provider's titles the button shows when no `label` is set:
 * `sign-in` "Sign in with Google", `sign-up` "Sign up with Google",
 * `continue` "Continue with Google" — the three titles Google recommends.
 */
export type ProviderButtonText = 'sign-in' | 'sign-up' | 'continue';

/**
 * The provider's colour theme. `auto` follows the app theme (light on a light
 * page, dark on a dark page); `light`, `dark` and `neutral` (Google only) pin
 * one theme.
 */
export type ProviderButtonAppearance = 'auto' | 'light' | 'dark' | 'neutral';

/** `md` is Google's standard 40 px; `lg` is 48.5 px, the height of `lc-button size="lg"`. */
export type ProviderButtonSize = 'md' | 'lg';

/** `pill` (the kit's button shape) or `rectangular` (Google's 4 px corners). */
export type ProviderButtonShape = 'pill' | 'rectangular';

export type ProviderButtonType = 'button' | 'submit';

/**
 * The provider's own English titles, used only when the app passes no `label`.
 * Apps pass the provider's localized title in `label` (Google: German
 * „Weiter mit Google“ for `continue`).
 */
const DEFAULT_TITLES: Record<ProviderButtonProvider, Record<ProviderButtonText, string>> = {
  google: {
    'sign-in': 'Sign in with Google',
    'sign-up': 'Sign up with Google',
    continue: 'Continue with Google',
  },
};

const LOGOS: Record<ProviderButtonProvider, string> = {
  google: GOOGLE_G_LOGO_DATA_URI,
};

/**
 * "Sign in with Google" button drawn to Google's branding guidelines
 * (https://developers.google.com/identity/branding-guidelines, last updated
 * 2026-07-07): the standard "G" (self-hosted, no request to Google), Google
 * Sans Medium 14/20 (the app self-hosts the font: SIL OFL 1.1, see the docs),
 * padding 12 · logo · 10 · text · 12, and Google's light,
 * dark and neutral colours. No Google script is loaded; the button starts the
 * app's own redirect (often a form POST, hence `type="submit"`).
 *
 * @example
 * ```html
 * <form method="post" action="/v1/auth/providers/google/start">
 *   <lc-provider-button provider="google" text="continue" label="Weiter mit Google"
 *                       size="lg" [fullWidth]="true" type="submit" />
 * </form>
 * ```
 */
@Component({
  selector: 'lc-provider-button',
  templateUrl: './provider-button.component.html',
  styleUrl: './provider-button.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class.lc-provider-button-host--full-width]': 'fullWidth() && !iconOnly()',
  },
})
export class ProviderButtonComponent {
  /** The sign-in provider. `google` only in this release; `apple` follows. */
  readonly provider = input<ProviderButtonProvider>('google');

  /** Which of the provider's titles to show when `label` is empty. */
  readonly text = input<ProviderButtonText>('sign-in');

  /**
   * The visible title — pass the provider's localized title
   * (e.g. „Weiter mit Google“). Must say that the person signs in with the
   * provider, never the provider's name alone. Empty = the provider's English
   * title for `text`. Also the accessible name of an `iconOnly` button.
   */
  readonly label = input<string>('');

  /** Colour theme: `auto` follows the app theme; `neutral` is Google's grey fill. */
  readonly appearance = input<ProviderButtonAppearance>('auto');

  /** `md` 40 px (Google's standard), `lg` 48.5 px (matches `lc-button size="lg"`, 44 px touch target). */
  readonly size = input<ProviderButtonSize>('md');

  /** `pill` (default, the kit's shape) or `rectangular` (4 px corners). */
  readonly shape = input<ProviderButtonShape>('pill');

  /** Stretches the button to the container width; logo and title stay centred together. */
  readonly fullWidth = input<boolean>(false);

  /** Only the logo in a square (or round) button; `label` becomes its accessible name. */
  readonly iconOnly = input<boolean>(false);

  /** Busy state: shows a spinner after the title, sets `aria-busy` and blocks clicks. */
  readonly loading = input<boolean>(false);

  /** Disables the button. */
  readonly disabled = input<boolean>(false);

  /** Native button type. `submit` when the button posts the form that starts the provider's redirect. */
  readonly type = input<ProviderButtonType>('button');

  /** Emitted on click while the button is neither disabled nor loading. */
  readonly clicked = output<void>();

  protected readonly logoSrc = computed(() => LOGOS[this.provider()]);

  protected readonly title = computed(
    () => this.label() || DEFAULT_TITLES[this.provider()][this.text()],
  );

  protected readonly isDisabled = computed(() => this.disabled() || this.loading());

  protected readonly classes = computed(() => {
    const classes = [
      'lc-provider-button',
      `lc-provider-button--${this.provider()}`,
      `lc-provider-button--${this.appearance()}`,
      `lc-provider-button--${this.size()}`,
      `lc-provider-button--${this.shape()}`,
    ];
    if (this.fullWidth() && !this.iconOnly()) classes.push('lc-provider-button--full-width');
    if (this.iconOnly()) classes.push('lc-provider-button--icon-only');
    if (this.loading()) classes.push('lc-provider-button--loading');
    return classes.join(' ');
  });

  protected handleClick(): void {
    if (!this.isDisabled()) {
      this.clicked.emit();
    }
  }
}
