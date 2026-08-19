import { Injectable, PLATFORM_ID, inject, signal, Signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

export type ToastVariant = 'success' | 'error' | 'warning' | 'info';
export type ToastPosition =
  | 'top-left'
  | 'top-center'
  | 'top-right'
  | 'bottom-left'
  | 'bottom-center'
  | 'bottom-right';

export interface ToastAction {
  label: string;
  onClick: () => void;
}

export interface ToastConfig {
  message: string;
  variant?: ToastVariant;
  position?: ToastPosition;
  duration?: number;
  showCloseButton?: boolean;
  action?: ToastAction;
}

export interface Toast extends Required<Omit<ToastConfig, 'action'>> {
  id: string;
  action?: ToastAction;
}

/**
 * Toast service for showing ephemeral notifications.
 *
 * The toasts are rendered by `<lc-toast-outlet />`, which the application
 * places once (e.g. in its shell); without it nothing is shown.
 *
 * @example
 * ```typescript
 * private readonly toastService = inject(ToastService);
 *
 * showSuccess() {
 *   this.toastService.show({
 *     message: 'Changes saved successfully!',
 *     variant: 'success',
 *     duration: 3000
 *   });
 * }
 * ```
 */
@Injectable({
  providedIn: 'root',
})
export class ToastService {
  /**
   * Public readonly signal for toasts
   */
  public readonly toasts: Signal<readonly Toast[]>;

  /**
   * Internal signal for toast list
   */
  private readonly toastList = signal<Toast[]>([]);

  private readonly MAX_TOASTS = 5;
  private toastIdCounter = 0;
  private activeTimeouts = new Map<string, ReturnType<typeof setTimeout>>();
  /** Auto-dismiss timers only make sense in the browser (and `window` does not exist on the server). */
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  constructor() {
    this.toasts = this.toastList.asReadonly();
  }

  /**
   * Show a toast notification
   */
  show(config: ToastConfig): string {
    const toast: Toast = {
      id: this.generateId(),
      message: config.message,
      variant: config.variant || 'info',
      position: config.position || 'top-right',
      duration: config.duration !== undefined ? config.duration : 3000,
      showCloseButton: config.showCloseButton !== undefined ? config.showCloseButton : true,
      action: config.action,
    };

    // Add toast to list
    let currentToasts = this.toastList();

    // Remove oldest toast if at max capacity
    if (currentToasts.length >= this.MAX_TOASTS) {
      const oldestToast = currentToasts[0];
      if (oldestToast) {
        this.clearTimeout(oldestToast.id);
        currentToasts = currentToasts.slice(1);
      }
    }

    this.toastList.set([...currentToasts, toast]);

    // Auto-dismiss if duration > 0
    if (toast.duration > 0 && this.isBrowser) {
      const timeoutId = setTimeout(() => {
        this.close(toast.id);
      }, toast.duration);

      this.activeTimeouts.set(toast.id, timeoutId);
    }

    return toast.id;
  }

  /**
   * Close a specific toast
   */
  close(id: string): void {
    this.removeToast(id);
  }

  /**
   * Close all toasts
   */
  closeAll(): void {
    const currentToasts = this.toastList();
    currentToasts.forEach((toast) => {
      this.clearTimeout(toast.id);
    });
    this.toastList.set([]);
  }

  /**
   * Generate unique toast ID
   */
  private generateId(): string {
    return `toast-${++this.toastIdCounter}-${Date.now()}`;
  }

  /**
   * Remove a toast from the list
   */
  private removeToast(id: string): void {
    this.clearTimeout(id);
    const currentToasts = this.toastList();
    this.toastList.set(currentToasts.filter((t) => t.id !== id));
  }

  /**
   * Clear timeout for a toast
   */
  private clearTimeout(id: string): void {
    const timeoutId = this.activeTimeouts.get(id);
    if (timeoutId !== undefined) {
      clearTimeout(timeoutId);
      this.activeTimeouts.delete(id);
    }
  }
}
