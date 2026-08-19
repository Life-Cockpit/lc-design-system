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
 * Alert component for inline notifications.
 *
 * Features:
 * - Semantic variants (success, warning, error, info)
 * - Optional title and icon display
 * - Auto-mapped variant icons
 * - Dismissible with close button; `visible` is two-way bindable so a
 *   dismissed alert can be shown again
 * - Content projection for custom body
 * - Action slot for a button rendered right of the body (e.g. retry)
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
   * Whether the alert can be dismissed
   * @default false
   */
  dismissible = input<boolean>(false);

  /**
   * ARIA label for accessibility
   */
  ariaLabel = input<string>();

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

  /** Accessible name of the variant icon (it conveys the alert's tone). */
  protected iconLabel = computed(() => {
    const labels: Record<AlertVariant, string> = {
      success: 'Success',
      error: 'Error',
      warning: 'Warning',
      info: 'Info',
    };
    return labels[this.variant()];
  });

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
