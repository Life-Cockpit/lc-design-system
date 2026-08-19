import {
  Component,
  ChangeDetectionStrategy,
  ViewEncapsulation,
  input,
  output,
  computed,
  effect,
  linkedSignal,
  HostListener,
  OnDestroy,
  inject,
} from '@angular/core';
import { A11yModule } from '@angular/cdk/a11y';
import { IconComponent } from '../icon/icon.component';
import { OverlayStackService } from '../shared/overlay-stack.service';

export type ModalSize = 'sm' | 'md' | 'lg' | 'xl' | 'full';

/**
 * Modal dialog component for focused user interactions.
 *
 * Features:
 * - Size presets (sm, md, lg, xl, full)
 * - Focus trap for keyboard accessibility
 * - Backdrop click and Escape key to close
 * - Two-way open binding
 * - Header, body, and footer content slots
 * - Optional close button
 * - Accessible with ARIA dialog role
 *
 * @example
 * ```html
 * <lc-modal [(open)]="isOpen" size="md" [closeOnBackdropClick]="true">
 *   <div slot="header"><h2>Title</h2></div>
 *   <div slot="body">Content</div>
 *   <div slot="footer"><lc-button (click)="close()">Close</lc-button></div>
 * </lc-modal>
 * ```
 */
@Component({
  selector: 'lc-modal',
  standalone: true,
  imports: [A11yModule, IconComponent],
  templateUrl: './modal.component.html',
  styleUrls: ['./modal.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None, // Required for dynamic size class styling
})
export class ModalComponent implements OnDestroy {
  private static nextId = 0;

  /**
   * Whether the modal is open (input from parent)
   * @default false
   */
  open = input<boolean>(false);

  /**
   * Modal size
   * @default 'md'
   */
  size = input<ModalSize>('md');

  /**
   * Whether clicking backdrop closes modal
   * @default true
   */
  closeOnBackdropClick = input<boolean>(true);

  /**
   * Whether pressing Escape closes modal
   * @default true
   */
  closeOnEscape = input<boolean>(true);

  /**
   * Whether to show close button in header
   * @default true
   */
  showCloseButton = input<boolean>(true);

  /**
   * ARIA label for accessibility
   */
  ariaLabel = input<string>();

  /**
   * ARIA labelledby ID
   */
  ariaLabelledBy = input<string>();

  /**
   * ARIA describedby ID
   */
  ariaDescribedBy = input<string>();

  /**
   * Emitted when modal opens
   */
  readonly modalOpened = output<void>();

  /**
   * Emitted when modal closes
   */
  readonly modalClosed = output<void>();

  /**
   * Two-way binding for open state
   */
  readonly openChange = output<boolean>();

  /**
   * Emitted when backdrop is clicked
   */
  readonly backdropClicked = output<MouseEvent>();

  /**
   * Internal open state (protected for AOT); follows the `open` input and is
   * also set by the programmatic open/close methods.
   */
  protected _open = linkedSignal(() => this.open());

  /**
   * Computed modal classes
   */
  protected modalClasses = computed(() => {
    return `lc-modal lc-modal--${this.size()}`;
  });

  private readonly overlayStack = inject(OverlayStackService);
  /** Identifies this instance in the overlay stack. */
  private readonly modalId = `lc-modal-${++ModalComponent.nextId}`;
  private originalOverflow?: string;

  constructor() {
    // Watch for open state changes
    effect(() => {
      if (this._open()) {
        this.showModal();
      } else {
        this.hideModal();
      }
    });
  }

  ngOnDestroy(): void {
    this.hideModal();
  }

  /**
   * Open the modal programmatically
   */
  openModal(): void {
    this._open.set(true);
    this.openChange.emit(true);
    this.modalOpened.emit();
  }

  /**
   * Close the modal programmatically
   */
  closeModal(): void {
    this._open.set(false);
    this.openChange.emit(false);
    this.modalClosed.emit();
  }

  /**
   * Handle backdrop click. Ignored while another overlay (popover, menu,
   * confirm dialog, …) sits above this modal — the click belongs to that layer.
   */
  protected onBackdropClick(event: MouseEvent): void {
    if (!this.overlayStack.claim(this.modalId, event)) return;
    this.backdropClicked.emit(event);
    if (this.closeOnBackdropClick()) {
      this.closeModal();
    }
  }

  /**
   * Handle close button click
   */
  protected onCloseClick(event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    this.closeModal();
  }

  /**
   * Escape closes the modal only while it is the top-most overlay; the event
   * is consumed either way so overlays underneath stay open.
   */
  @HostListener('document:keydown', ['$event'])
  protected onDocumentKeydown(event: KeyboardEvent): void {
    if (event.key !== 'Escape' || !this._open()) return;
    if (!this.overlayStack.claim(this.modalId, event)) return;
    event.stopPropagation();
    if (this.closeOnEscape()) {
      this.closeModal();
    }
  }

  /**
   * Show the modal. Focus is moved inside and restored on close by the
   * template's `cdkTrapFocus` / `cdkTrapFocusAutoCapture`.
   */
  private showModal(): void {
    this.overlayStack.push(this.modalId);

    // Lock body scroll
    if (typeof document !== 'undefined' && this.originalOverflow === undefined) {
      this.originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
    }
  }

  /**
   * Hide the modal
   */
  private hideModal(): void {
    this.overlayStack.remove(this.modalId);

    // Restore body scroll
    if (typeof document !== 'undefined' && this.originalOverflow !== undefined) {
      document.body.style.overflow = this.originalOverflow;
      this.originalOverflow = undefined;
    }
  }
}
