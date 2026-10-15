import {
  Component,
  ChangeDetectionStrategy,
  input,
  model,
  output,
  computed,
  ViewEncapsulation,
} from '@angular/core';
import { IconComponent } from '../icon/icon.component';

export type AlertVariant = 'success' | 'error' | 'warning' | 'info';

/**
 * Layout of the projected actions (`slot="action"`).
 * - `inline`: one action right of the body, vertically centred (3.2)
 * - `stacked`: the actions in their own row below the title and message;
 *   below 576 px of alert width one per line at full width, 8 px apart,
 *   from 576 px side by side at their natural width
 */
export type AlertActionsLayout = 'inline' | 'stacked';

/**
 * Alert component for inline notifications.
 *
 * Features:
 * - Semantic variants (success, warning, error, info)
 * - Optional title and icon display
 * - Auto-mapped variant icons
 * - Dismissible with close button; `visible` is two-way bindable so a
 *   dismissed alert can be shown again
 * - Content projection for custom body
 * - Action slot for a button rendered right of the body (e.g. retry), or
 *   several actions stacked below it (`actionsLayout="stacked"`)
 * - The variant icon is decorative unless `iconAriaLabel` names it (the
 *   title and the colour carry the tone; no built-in English word)
 * - Accessible: `role="alert"` for error / warning, `role="status"` otherwise
 *
 * @example
 * ```html
 * <lc-alert variant="success" title="Success!" [dismissible]="true">
 *   Your changes have been saved.
 * </lc-alert>
 *
 * <lc-alert variant="error" title="Laden fehlgeschlagen">
 *   Die Liste konnte nicht geladen werden.
 *   <lc-button slot="action" variant="outline" size="sm">Erneut versuchen</lc-button>
 * </lc-alert>
 * ```
 */
@Component({
  selector: 'lc-alert',
  standalone: true,
  imports: [IconComponent],
  templateUrl: './alert.component.html',
  styleUrls: ['./alert.component.scss'],
  encapsulation: ViewEncapsulation.None, // Required for dynamic variant class styling
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class]': 'hostClasses()',
    '[attr.role]': 'role()',
    '[attr.aria-live]': 'ariaLive()',
    '[attr.aria-label]': 'ariaLabel()',
  },
})
export class AlertComponent {
  /**
   * Visual variant of the alert
   * @default 'info'
   */
  variant = input<AlertVariant>('info');

  /**
   * Alert title (optional)
   */
  title = input<string>();

  /**
   * Alert message (alternative to content projection)
   */
  message = input<string>();

  /**
   * Icon to display (defaults based on variant)
   */
  icon = input<string>();

  /**
   * Whether to show icon
   * @default true
   */
  showIcon = input<boolean>(true);

  /**
   * Accessible name of the variant icon, e.g. „Warnung“. Leave it unset when
   * the title already says what kind of message this is: the icon is then
   * decorative (`aria-hidden`). The kit sets no default text, so no English
   * word is read on a page in another language.
   */
  iconAriaLabel = input<string | undefined>(undefined);

  /**
   * Layout of the projected actions (`slot="action"`): `inline` — one action
   * right of the body (3.2); `stacked` — the actions in their own row below
   * the title and message, one per line at full width and 8 px apart below
   * 576 px of alert width, side by side at their natural width from there.
   * @default 'inline'
   */
  actionsLayout = input<AlertActionsLayout>('inline');

  /**
   * Whether the alert can be dismissed
   * @default false
   */
  dismissible = input<boolean>(false);

  /**
   * ARIA label for accessibility
   */
  ariaLabel = input<string>();

  /** Accessible name of the close button (`dismissible`). */
  closeAriaLabel = input('Close alert');

  /**
   * Emitted when alert is dismissed
   */
  readonly dismissed = output<void>();

  /**
   * Visibility (two-way bindable). Dismissing sets it to `false`; the parent
   * can set it back to `true` to show the alert again.
   */
  visible = model<boolean>(true);

  /**
   * Computed host classes
   */
  protected hostClasses = computed(() => {
    const classes = ['lc-alert', `lc-alert--${this.variant()}`];
    if (this.actionsLayout() === 'stacked') {
      classes.push('lc-alert--actions-stacked');
    }
    if (this.showIcon()) {
      classes.push('lc-alert--with-icon');
    }
    if (!this.visible()) {
      classes.push('lc-alert--hidden');
    }
    return classes.join(' ');
  });

  /**
   * Computed container classes
   */
  protected containerClasses = computed(() => {
    return 'lc-alert__container';
  });

  /** Whether the variant should interrupt the user (error / warning). */
  private readonly isUrgent = computed(() => {
    const variant = this.variant();
    return variant === 'error' || variant === 'warning';
  });

  /**
   * Live-region role: `alert` (assertive) only for error / warning,
   * `status` (polite) for info / success.
   */
  protected role = computed(() => (this.isUrgent() ? 'alert' : 'status'));

  /**
   * Computed ARIA live region priority
   */
  protected ariaLive = computed(() => (this.isUrgent() ? 'assertive' : 'polite'));

  /**
   * Computed default icon based on variant
   */
  protected defaultIcon = computed(() => {
    const icons: Record<AlertVariant, string> = {
      success: 'check-circle',
      error: 'x-circle',
      warning: 'exclamation-triangle',
      info: 'information-circle',
    };
    return this.icon() || icons[this.variant()];
  });

  /**
   * Dismiss the alert
   */
  dismiss(): void {
    this.visible.set(false);
    this.dismissed.emit();
  }

  /**
   * Handle close button click
   */
  protected onCloseClick(event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    this.dismiss();
  }
}
