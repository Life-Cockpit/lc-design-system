import {
  Injectable,
  ApplicationRef,
  createComponent,
  EnvironmentInjector,
  inject,
} from '@angular/core';
import {
  ConfirmDialogButtonSize,
  ConfirmDialogComponent,
  ConfirmDialogVariant,
  RequireTextConfig,
} from './confirm-dialog.component';
import type { ModalPlacement } from '@lifecorner/angular-ui-kit/modal';

export interface ConfirmOptions {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: ConfirmDialogVariant;
  icon?: string;
  requireText?: RequireTextConfig;
  /** Accessible name of the close button (3.3). */
  closeAriaLabel?: string;
  /** Size of both buttons (3.3): `lg` for a 44 px touch target. */
  buttonSize?: ConfirmDialogButtonSize;
  /** `center`, `auto` (a bottom sheet below 640 px) or `sheet` (3.3). */
  placement?: ModalPlacement;
}

/**
 * Imperative confirm dialog service.
 *
 * @example
 * ```ts
 * const ok = await this.confirmService.confirm({
 *   title: 'Delete item?',
 *   message: 'This cannot be undone.',
 * });
 * if (ok) { ... }
 * ```
 */
@Injectable({ providedIn: 'root' })
export class ConfirmService {
  private readonly appRef = inject(ApplicationRef);
  private readonly injector = inject(EnvironmentInjector);

  /**
   * Show a confirmation dialog and return a promise that resolves
   * to true (confirmed) or false (cancelled).
   */
  confirm(opts: ConfirmOptions): Promise<boolean> {
    return new Promise<boolean>((resolve) => {
      // Create a host element
      const hostEl = document.createElement('div');
      document.body.appendChild(hostEl);

      const componentRef = createComponent(ConfirmDialogComponent, {
        hostElement: hostEl,
        environmentInjector: this.injector,
      });

      // Set inputs
      componentRef.setInput('open', true);
      componentRef.setInput('title', opts.title);
      componentRef.setInput('message', opts.message);
      if (opts.confirmLabel) componentRef.setInput('confirmLabel', opts.confirmLabel);
      if (opts.cancelLabel) componentRef.setInput('cancelLabel', opts.cancelLabel);
      if (opts.variant) componentRef.setInput('variant', opts.variant);
      if (opts.icon) componentRef.setInput('icon', opts.icon);
      if (opts.requireText) componentRef.setInput('requireText', opts.requireText);
      if (opts.closeAriaLabel) componentRef.setInput('closeAriaLabel', opts.closeAriaLabel);
      if (opts.buttonSize) componentRef.setInput('buttonSize', opts.buttonSize);
      if (opts.placement) componentRef.setInput('placement', opts.placement);

      const cleanup = () => {
        this.appRef.detachView(componentRef.hostView);
        componentRef.destroy();
        hostEl.remove();
      };

      componentRef.instance.confirmed.subscribe(() => {
        cleanup();
        resolve(true);
      });

      componentRef.instance.cancelled.subscribe(() => {
        cleanup();
        resolve(false);
      });

      this.appRef.attachView(componentRef.hostView);
    });
  }

  /**
   * Show a destructive confirmation dialog.
   * Shorthand for `confirm({ ...opts, variant: 'destructive' })`.
   */
  destructive(opts: Omit<ConfirmOptions, 'variant'>): Promise<boolean> {
    return this.confirm({ ...opts, variant: 'destructive' });
  }

  /**
   * Show a warning confirmation dialog.
   * Shorthand for `confirm({ ...opts, variant: 'warning' })`.
   */
  warning(opts: Omit<ConfirmOptions, 'variant'>): Promise<boolean> {
    return this.confirm({ ...opts, variant: 'warning' });
  }
}
