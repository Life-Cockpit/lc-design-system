import {
  Component,
  ChangeDetectionStrategy,
  input,
  output,
  signal,
  computed,
  effect,
  untracked,
  inject,
  HostListener,
  OnDestroy,
} from '@angular/core';
import { A11yModule } from '@angular/cdk/a11y';
import { IconComponent } from '../icon/icon.component';
import { OverlayStackService } from '../shared/overlay-stack.service';

export type DrawerPosition = 'left' | 'right';
export type DrawerSize = 'sm' | 'md' | 'lg' | 'xl';

/** Duration of the slide-out transition (see drawer.component.scss). */
const CLOSE_ANIMATION_MS = 250;

/**
 * Drawer component for slide-out overlay panels.
 *
 * Features:
 * - Slide-in from left or right
 * - Size presets (sm, md, lg, xl)
 * - Optional backdrop overlay with click-to-close
 * - Close on Escape key support
 * - Heading text display
 * - Content projection for arbitrary body content
 * - Accessible with ARIA dialog role, focus trap and focus restore
 *
 * @example
 * ```html
 * <lc-drawer [open]="showPanel" position="right" size="md"
 *            heading="Settings" (closed)="showPanel = false">
 *   <p>Any content goes here</p>
 * </lc-drawer>
 * ```
 */
@Component({
  selector: 'lc-drawer',
  standalone: true,
  imports: [A11yModule, IconComponent],
  templateUrl: './drawer.component.html',
  styleUrl: './drawer.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DrawerComponent implements OnDestroy {
  private static nextId = 0;

  /** Whether the drawer is open. */
  readonly open = input<boolean>(false);

  /** Slide-in direction. */
  readonly position = input<DrawerPosition>('right');

  /** Predefined width (sm=320, md=400, lg=520, xl=640). */
  readonly size = input<DrawerSize>('md');

  /** Optional heading shown in the drawer header. */
  readonly heading = input<string>('');

  /** Whether the overlay backdrop is shown. */
  readonly hasOverlay = input<boolean>(true);

  /** Whether clicking the overlay closes the drawer. */
  readonly closeOnOverlayClick = input<boolean>(true);

  /** Whether pressing Escape closes the drawer. */
  readonly closeOnEscape = input<boolean>(true);

  /** ARIA label for assistive technology. */
  readonly ariaLabel = input<string>('');

  /** Emitted when the drawer should close. */
  readonly closed = output<void>();

  /** Internal visibility — stays true during the slide-out animation. */
  protected _visible = signal(false);

  /** Width token → CSS. */
  protected readonly widthValue = computed(() => {
    const map: Record<DrawerSize, string> = {
      sm: '320px',
      md: '400px',
      lg: '520px',
      xl: '640px',
    };
    return map[this.size()];
  });

  protected readonly panelClasses = computed(() => {
    const cls = ['lc-drawer__panel', `lc-drawer__panel--${this.position()}`];
    if (this.open()) cls.push('lc-drawer__panel--open');
    return cls.join(' ');
  });

  private readonly overlayStack = inject(OverlayStackService);
  /** Identifies this instance in the overlay stack. */
  private readonly drawerId = `lc-drawer-${++DrawerComponent.nextId}`;
  private closeTimer?: ReturnType<typeof setTimeout>;
  private originalOverflow?: string;

  constructor() {
    effect(() => {
      const isOpen = this.open();
      untracked(() => {
        if (isOpen) {
          // Re-opening within the close animation must cancel the pending hide,
          // otherwise the stale timer hides the drawer and unlocks scroll while
          // `open()` is still true.
          this.clearCloseTimer();
          this._visible.set(true);
          this.lockScroll();
          this.overlayStack.push(this.drawerId);
        } else if (this._visible()) {
          this.overlayStack.remove(this.drawerId);
          // Keep the panel mounted until the slide-out transition has finished
          this.closeTimer = setTimeout(() => {
            this.closeTimer = undefined;
            this._visible.set(false);
            this.unlockScroll();
          }, CLOSE_ANIMATION_MS);
        }
      });
    });
  }

  ngOnDestroy(): void {
    // Navigating away while open must not leave the page scroll-locked
    this.clearCloseTimer();
    this.overlayStack.remove(this.drawerId);
    this.unlockScroll();
  }

  /**
   * Handle backdrop click. Ignored while another overlay (menu, popover, …)
   * sits above this drawer — the click belongs to that layer.
   */
  protected onOverlayClick(event: MouseEvent): void {
    if (!this.overlayStack.claim(this.drawerId, event)) return;
    if (this.closeOnOverlayClick()) {
      this.close();
    }
  }

  /** Handle close action. */
  protected close(): void {
    this.closed.emit();
  }

  /**
   * Escape closes the drawer only while it is the top-most overlay; the event
   * is consumed either way so overlays underneath stay open.
   */
  @HostListener('document:keydown', ['$event'])
  protected onKeydown(event: KeyboardEvent): void {
    if (event.key !== 'Escape' || !this.open()) return;
    if (!this.overlayStack.claim(this.drawerId, event)) return;
    event.stopPropagation();
    if (this.closeOnEscape()) {
      this.close();
    }
  }

  private lockScroll(): void {
    if (typeof document === 'undefined' || this.originalOverflow !== undefined) return;
    this.originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
  }

  private unlockScroll(): void {
    if (typeof document === 'undefined' || this.originalOverflow === undefined) return;
    document.body.style.overflow = this.originalOverflow;
    this.originalOverflow = undefined;
  }

  private clearCloseTimer(): void {
    if (this.closeTimer !== undefined) {
      clearTimeout(this.closeTimer);
      this.closeTimer = undefined;
    }
  }
}
