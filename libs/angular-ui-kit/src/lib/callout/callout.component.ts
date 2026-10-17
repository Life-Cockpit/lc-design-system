import {
  ChangeDetectionStrategy,
  Component,
  input,
  model,
  output,
  computed,
} from '@angular/core';
import { IconComponent, ɵprovideKitIcons } from '@lifecorner/angular-ui-kit/icon';
import {
  ICON_CHECK_CIRCLE,
  ICON_CIRCLE_X,
  ICON_EXCLAMATION_TRIANGLE,
  ICON_INFORMATION_CIRCLE,
  ICON_X_MARK,
} from '@lifecorner/angular-ui-kit/icons';

export type CalloutVariant = 'info' | 'success' | 'warning' | 'error' | 'neutral';

@Component({
  selector: 'lc-callout',
  standalone: true,
  imports: [IconComponent],
  viewProviders: [
    ɵprovideKitIcons([ICON_X_MARK, ICON_INFORMATION_CIRCLE, ICON_CHECK_CIRCLE, ICON_EXCLAMATION_TRIANGLE, ICON_CIRCLE_X]),
  ],
  templateUrl: './callout.component.html',
  styleUrls: ['./callout.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
/**
 * Callout component for contextual information banners.
 *
 * Features:
 * - Semantic variants (info, success, warning, error, neutral)
 * - Auto-mapped variant icons (override with `icon`); decorative unless
 *   `iconAriaLabel` names them — no built-in English word
 * - Optional title text
 * - Dismissible with close button; `visible` is two-way bindable so a
 *   dismissed callout can be shown again
 * - `role="alert"` for error / warning, `role="status"` otherwise
 * - Content projection for custom body content
 *
 * @example
 * ```html
 * <lc-callout variant="warning" title="Attention">Please review your input.</lc-callout>
 * ```
 */
export class CalloutComponent {
  /** Visual variant */
  variant = input<CalloutVariant>('info');

  /** Title text (optional) */
  title = input<string>();

  /** Icon name instead of the variant's default icon. */
  icon = input<string | undefined>(undefined);

  /**
   * Accessible name of the icon, e.g. „Hinweis“. Leave it unset when the
   * title or text already says what kind of note this is: the icon is then
   * decorative (`aria-hidden`). The kit sets no default text, so no English
   * word is read on a page in another language.
   */
  iconAriaLabel = input<string | undefined>(undefined);

  /** Whether the callout can be dismissed */
  dismissible = input<boolean>(false);

  /** Accessible name of the dismiss button (`dismissible`). */
  dismissAriaLabel = input('Dismiss');

  /** Emits when dismiss button is clicked */
  dismissed = output<void>();

  /**
   * Visibility (two-way bindable). Dismissing sets it to `false`; the parent
   * can set it back to `true` to show the callout again.
   */
  visible = model<boolean>(true);

  protected calloutClasses = computed(() => {
    return ['callout', `callout--${this.variant()}`].join(' ');
  });

  /**
   * Live-region semantics: only error / warning callouts interrupt the user
   * (`alert`); informational ones are announced politely (`status`).
   */
  protected role = computed(() =>
    this.variant() === 'error' || this.variant() === 'warning' ? 'alert' : 'status',
  );

  protected iconName = computed(() => {
    const map: Record<CalloutVariant, string> = {
      info: 'information-circle',
      success: 'check-circle',
      warning: 'exclamation-triangle',
      error: 'x-circle',
      neutral: 'information-circle',
    };
    return this.icon() || map[this.variant()];
  });

  dismiss(): void {
    this.visible.set(false);
    this.dismissed.emit();
  }
}
