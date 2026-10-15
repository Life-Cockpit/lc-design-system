import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  inject,
  input,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { ButtonComponent } from '../button/button.component';
import { IconComponent } from '../icon/icon.component';
import { InputComponent } from '../input/input.component';

/** `stacked`: the button below the value at full width (phones); `inline`: beside it. */
export type CopyFieldLayout = 'stacked' | 'inline';

/** How long the button says "Copied" (ms). */
const CONFIRMATION_MS = 2000;

/**
 * A value to copy — an invitation link, a token, a command: the value
 * read-only and wrapping (never clipped), a 48.5 px copy button, and one
 * polite announcement after copying. If the clipboard refuses, the value is
 * selected so the person can copy it by hand.
 *
 * @example
 * ```html
 * <lc-copy-field label="Einladungslink" [value]="link" copyLabel="Kopieren"
 *                copiedLabel="Kopiert" copiedAnnouncement="Link kopiert" />
 * ```
 */
@Component({
  selector: 'lc-copy-field',
  imports: [InputComponent, ButtonComponent, IconComponent],
  templateUrl: './copy-field.component.html',
  styleUrl: './copy-field.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CopyFieldComponent {
  /** Label of the value (its accessible name). */
  readonly label = input<string>('');

  /** The value to copy. */
  readonly value = input<string>('');

  /** Help below the value. */
  readonly helperText = input<string>();

  /** `stacked` (default): button below at full width; `inline`: button beside the value. */
  readonly layout = input<CopyFieldLayout>('stacked');

  /** Show the clipboard (and, after copying, check) icon in the button. */
  readonly showIcon = input<boolean>(true);

  /** Button label. */
  readonly copyLabel = input('Copy');

  /** Button label for two seconds after copying. */
  readonly copiedLabel = input('Copied');

  /** Spoken once after copying (polite live region). */
  readonly copiedAnnouncement = input('Copied to the clipboard');

  /** Emitted with the value after it was copied. */
  readonly copied = output<string>();

  /** Emitted when the clipboard refused; the value is then selected for copying by hand. */
  readonly copyFailed = output<void>();

  protected readonly isCopied = signal(false);

  private readonly field = viewChild(InputComponent);
  private timer: ReturnType<typeof setTimeout> | undefined;

  constructor() {
    inject(DestroyRef).onDestroy(() => clearTimeout(this.timer));
  }

  /** Copies the value; on refusal selects it instead. */
  async copy(): Promise<void> {
    const value = this.value();
    try {
      const clipboard = typeof navigator === 'undefined' ? undefined : navigator.clipboard;
      if (!clipboard) throw new Error('Clipboard API unavailable');
      await clipboard.writeText(value);
    } catch {
      this.copyFailed.emit();
      this.field()?.focus();
      this.field()?.select();
      return;
    }
    this.isCopied.set(true);
    this.copied.emit(value);
    clearTimeout(this.timer);
    this.timer = setTimeout(() => this.isCopied.set(false), CONFIRMATION_MS);
  }
}
