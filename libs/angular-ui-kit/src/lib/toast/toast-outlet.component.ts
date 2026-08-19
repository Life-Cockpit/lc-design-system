import { Component, ChangeDetectionStrategy, computed, inject } from '@angular/core';
import { ToastComponent } from './toast.component';
import { ToastService, type Toast, type ToastPosition } from './toast.service';

/** Politeness of the live region a toast is announced from. */
type ToastLive = 'polite' | 'assertive';

const POSITIONS: readonly ToastPosition[] = [
  'top-left',
  'top-center',
  'top-right',
  'bottom-left',
  'bottom-center',
  'bottom-right',
];

/**
 * Renders the toasts of {@link ToastService}. Place it once in the application
 * shell; without it `ToastService.show()` has no visible effect.
 *
 * ```html
 * <lc-toast-outlet />
 * ```
 *
 * Toasts are stacked per `position`. Every position owns two live regions that
 * exist from the start — screen readers only announce content that is inserted
 * into an *existing* live region — one `polite` for success/info toasts and one
 * `assertive` for error/warning toasts. Dismissing a toast (close button,
 * action, auto-dismiss) removes it from the service.
 */
@Component({
  selector: 'lc-toast-outlet',
  standalone: true,
  imports: [ToastComponent],
  templateUrl: './toast-outlet.component.html',
  styleUrls: ['./toast-outlet.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ToastOutletComponent {
  protected readonly positions = POSITIONS;
  protected readonly liveLevels: readonly ToastLive[] = ['assertive', 'polite'];

  private readonly toastService = inject(ToastService);

  /** Toasts keyed by `${position}:${politeness}` in the order they were shown. */
  private readonly groups = computed(() => {
    const groups = new Map<string, Toast[]>();
    for (const toast of this.toastService.toasts()) {
      const key = `${toast.position}:${ToastOutletComponent.liveFor(toast)}`;
      const group = groups.get(key);
      if (group) {
        group.push(toast);
      } else {
        groups.set(key, [toast]);
      }
    }
    return groups;
  });

  protected toastsFor(position: ToastPosition, live: ToastLive): readonly Toast[] {
    return this.groups().get(`${position}:${live}`) ?? [];
  }

  protected onClosed(id: string): void {
    this.toastService.close(id);
  }

  /** Errors and warnings interrupt (assertive), everything else waits its turn. */
  private static liveFor(toast: Toast): ToastLive {
    return toast.variant === 'error' || toast.variant === 'warning' ? 'assertive' : 'polite';
  }
}
