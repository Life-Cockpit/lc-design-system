import {
  Component,
  ChangeDetectionStrategy,
  input,
  output,
  signal,
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
 * - Dismissible with close button
 * - Content projection for custom body
 * - Action slot for a button rendered right of the body (e.g. retry)
 * - Accessible with ARIA alert role
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
  // eslint-disable-next-line @angular-eslint/use-component-view-encapsulation
  encapsulation: ViewEncapsulation.None, // Required for dynamic variant class styling
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class]': 'hostClasses()',
    '[attr.role]': '"alert"',
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
   * Internal visibility state
   */
  protected visible = signal(true);

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

  /**
   * Computed ARIA live region priority
   */
  protected ariaLive = computed(() => {
    const variant = this.variant();
    return variant === 'error' || variant === 'warning' ? 'assertive' : 'polite';
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
