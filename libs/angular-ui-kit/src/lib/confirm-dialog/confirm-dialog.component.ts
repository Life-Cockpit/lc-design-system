import {
  Component,
  ChangeDetectionStrategy,
  input,
  output,
  signal,
  computed,
  effect,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { IconComponent } from '../icon/icon.component';
import { ButtonComponent } from '../button/button.component';
import { InputComponent } from '../input/input.component';
import { ModalComponent } from '../modal/modal.component';

export type ConfirmDialogVariant = 'default' | 'destructive' | 'warning';

export interface RequireTextConfig {
  prompt: string;
  expected: string;
}

/**
 * Confirm dialog component for confirming user actions.
 *
 * Builds on `<lc-modal>` to provide a standardized confirmation pattern
 * with optional destructive variant and text-matching confirmation.
 *
 * @example
 * ```html
 * <lc-confirm-dialog
 *   [open]="showConfirm()"
 *   variant="destructive"
 *   title="Delete project?"
 *   message="This cannot be undone."
 *   (confirmed)="onDelete()"
 *   (cancelled)="showConfirm.set(false)"
 * />
 * ```
 */
@Component({
  selector: 'lc-confirm-dialog',
  standalone: true,
  imports: [FormsModule, IconComponent, ButtonComponent, ModalComponent, InputComponent],
  templateUrl: './confirm-dialog.component.html',
  styleUrls: ['./confirm-dialog.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConfirmDialogComponent {
  /** Whether the dialog is open */
  readonly open = input<boolean>(false);

  /** Dialog variant */
  readonly variant = input<ConfirmDialogVariant>('default');

  /** Dialog title */
  readonly title = input.required<string>();

  /** Dialog message */
  readonly message = input.required<string>();

  /** Confirm button label */
  readonly confirmLabel = input<string>('Confirm');

  /** Cancel button label */
  readonly cancelLabel = input<string>('Cancel');

  /** Icon name (auto-set by variant if not provided) */
  readonly icon = input<string>();

  /** Require text match to enable confirm */
  readonly requireText = input<RequireTextConfig>();

  /** Emitted when user confirms */
  readonly confirmed = output<void>();

  /** Emitted when user cancels */
  readonly cancelled = output<void>();

  /** Internal text input value */
  protected inputValue = signal('');

  /** Resolved icon name */
  protected resolvedIcon = computed(() => {
    const icon = this.icon();
    if (icon) return icon;
    switch (this.variant()) {
      case 'destructive':
        return 'exclamation-triangle';
      case 'warning':
        return 'exclamation-circle';
      default:
        // Tabler name — 'question-mark-circle' has no alias and rendered a placeholder
        return 'help-circle';
    }
  });

  /** Resolved icon color */
  protected iconColor = computed(() => {
    switch (this.variant()) {
      case 'destructive':
        return 'var(--color-error-default)';
      case 'warning':
        return 'var(--color-warning-default)';
      default:
        return 'var(--color-primary-600)';
    }
  });

  /** Confirm button variant */
  protected confirmButtonVariant = computed(() => {
    switch (this.variant()) {
      case 'destructive':
        return 'danger';
      case 'warning':
        return 'warning';
      default:
        return 'primary';
    }
  });

  /** Whether confirm is allowed (text match check) */
  protected confirmAllowed = computed(() => {
    const req = this.requireText();
    if (!req) return true;
    return this.inputValue() === req.expected;
  });

  constructor() {
    // Reset input when dialog opens
    effect(() => {
      if (this.open()) {
        this.inputValue.set('');
      }
    });
  }

  /**
   * Confirm via button click or Enter inside the require-text input.
   * Enter is deliberately NOT handled on the whole dialog: the focus trap
   * lands on the close/cancel buttons first, and Enter there must activate
   * *that* button, never the (possibly destructive) confirm action.
   */
  protected onConfirm(): void {
    if (!this.confirmAllowed()) return;
    this.confirmed.emit();
  }

  protected onCancel(): void {
    this.cancelled.emit();
  }

  protected onModalClose(): void {
    this.cancelled.emit();
  }

  protected onInputChange(value: string | number): void {
    this.inputValue.set(String(value));
  }
}
