import {
  Component,
  ChangeDetectionStrategy,
  input,
  output,
  computed,
  ViewEncapsulation,
} from '@angular/core';
import { IconComponent } from '../icon/icon.component';
import type { Toast, ToastVariant } from './toast.service';

/**
 * Toast component for displaying ephemeral notification messages.
 *
 * Features:
 * - Semantic variants (success, warning, error, info)
 * - Auto-dismiss with configurable duration
 * - Manual dismiss with close button
 * - Icon display per variant
 * - Stacked toast positioning via ToastService + `<lc-toast-outlet />`
 * - Animated enter/exit transitions
 *
 * Usually rendered by `<lc-toast-outlet />`; can also be placed directly:
 *
 * @example
 * ```html
 * <lc-toast [toast]="toast" (closed)="dismiss($event)" />
 * ```
 */
@Component({
  selector: 'lc-toast',
  standalone: true,
  imports: [IconComponent],
  templateUrl: './toast.component.html',
  styleUrls: ['./toast.component.scss'],
  encapsulation: ViewEncapsulation.None, // Required for dynamic variant class styling
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class]': 'hostClasses()',
    '[attr.role]': 'ariaRole()',
    '[attr.aria-live]': 'ariaLive()',
    '[attr.aria-atomic]': 'announce() ? "true" : null',
  },
})
export class ToastComponent {
  /**
   * Toast data
   */
  toast = input.required<Toast>();

  /**
   * Whether the toast is its own live region (`role="status"`/`"alert"` on the
   * host). `lc-toast-outlet` sets this to false because its persistent live
   * regions already announce the toast — announcing twice would be noise.
   * @default true
   */
  announce = input<boolean>(true);

  /**
   * Emitted when toast is closed
   */
  readonly closed = output<string>();

  /**
   * Computed host classes
   */
  protected hostClasses = computed(() => {
    const toast = this.toast();
    return `lc-toast lc-toast--${toast.variant}`;
  });

  /**
   * Computed container classes
   */
  protected containerClasses = computed(() => {
    return 'lc-toast__container';
  });

  /**
   * Computed ARIA role
   */
  protected ariaRole = computed(() => {
    if (!this.announce()) return null;
    const variant = this.toast().variant;
    return variant === 'error' || variant === 'warning' ? 'alert' : 'status';
  });

  /**
   * Computed ARIA live region priority
   */
  protected ariaLive = computed(() => {
    if (!this.announce()) return null;
    const variant = this.toast().variant;
    return variant === 'error' || variant === 'warning' ? 'assertive' : 'polite';
  });

  /**
   * Computed default icon based on variant
   */
  protected defaultIcon = computed(() => {
    const icons: Record<ToastVariant, string> = {
      success: 'check-circle',
      error: 'x-circle',
      warning: 'exclamation-triangle',
      info: 'information-circle',
    };
    return icons[this.toast().variant];
  });

  /**
   * Handle close button click
   */
  protected onCloseClick(event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    this.closed.emit(this.toast().id);
  }

  /**
   * Handle action button click
   */
  protected onActionClick(event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    const action = this.toast().action;
    if (action) {
      action.onClick();
      this.closed.emit(this.toast().id);
    }
  }
}
