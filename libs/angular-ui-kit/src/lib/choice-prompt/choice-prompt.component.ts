import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  computed,
  effect,
  input,
  isDevMode,
  output,
  signal,
  viewChild,
  viewChildren,
} from '@angular/core';
import { ButtonComponent } from '../button/button.component';

/** One selectable answer of an `lc-choice-prompt`. */
export interface ChoicePromptOption {
  id: string;
  label: string;
  /** Optional second line inside the option button. */
  description?: string;
  /** Marks the recommended answer: badge + first position. */
  recommended?: boolean;
}

/** A subordinate exit of the prompt (e.g. "Selbst gelöst" / "Ignorieren"). */
export interface ChoicePromptSecondaryAction {
  id: string;
  label: string;
  tooltip?: string;
}

/** Payload of the `(decided)` output — exactly one of the two fields is set. */
export interface ChoicePromptDecision {
  optionId?: string;
  customText?: string;
}

export type ChoicePromptSize = 'sm' | 'md';

/**
 * Inline decision prompt: predefined answer options (with a marked
 * recommendation) plus an optional free-text answer — no modal, directly in
 * the flow.
 *
 * Features:
 * - Options as buttons; `recommended` carries the badge and is sorted first
 * - Free-text lane behind a toggle link (`allowCustom`), submit via button or
 *   Enter; empty text is never submittable
 * - `busy` after a decision: the clicked option shows a spinner, everything
 *   else is disabled — prevents double submits. Focus stays on the triggering
 *   element when `busy` ends.
 * - `disabled` requires a `disabledReason` (tooltip); missing reason logs a
 *   dev warning
 * - Subordinate exits via `secondaryActions`
 * - `role="group"` labelled via `promptLabel` (the question itself lives in
 *   the surrounding layout)
 *
 * @example
 * ```html
 * <lc-choice-prompt
 *   promptLabel="Wie soll der Konflikt gelöst werden?"
 *   [options]="[
 *     { id: 'a', label: 'Variante A übernehmen', recommended: true },
 *     { id: 'b', label: 'Beide behalten' },
 *   ]"
 *   [busy]="saving()"
 *   (decided)="resolve($event)"
 * />
 * ```
 */
@Component({
  selector: 'lc-choice-prompt',
  standalone: true,
  imports: [ButtonComponent],
  templateUrl: './choice-prompt.component.html',
  styleUrls: ['./choice-prompt.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChoicePromptComponent {
  /** Answer options. The recommended option is sorted to the front. */
  options = input.required<ChoicePromptOption[]>();

  /**
   * Whether the free-text lane is offered.
   * @default true
   */
  allowCustom = input<boolean>(true);

  /** Label of the link that opens the free-text lane. */
  customToggleLabel = input<string>('Eigene Antwort …');

  /** Placeholder of the free-text input. */
  customPlaceholder = input<string>('');

  /** Label of the free-text submit button. */
  submitLabel = input<string>('Übernehmen');

  /**
   * Set after a decision while it is being processed: the chosen element shows
   * a spinner, every other interaction is blocked (including Enter in the
   * free-text input).
   * @default false
   */
  busy = input<boolean>(false);

  /** Disables the whole prompt. Requires `disabledReason`. */
  disabled = input<boolean>(false);

  /** Why the prompt is disabled — shown as tooltip. */
  disabledReason = input<string>('');

  /** Subordinate exits, rendered as quiet text buttons after the options. */
  secondaryActions = input<ChoicePromptSecondaryAction[]>([]);

  /**
   * `sm` for dense lists (inbox rows).
   * @default 'md'
   */
  size = input<ChoicePromptSize>('md');

  /** Accessible name of the group — the question shown in the surroundings. */
  promptLabel = input<string>('');

  /** Label of the recommendation badge. */
  recommendedLabel = input<string>('Empfehlung');

  /** Fires immediately on option click, or on free-text submit. */
  decided = output<ChoicePromptDecision>();

  /** Fires with the id of a clicked secondary action. */
  secondaryAction = output<string>();

  /** Whether the free-text lane is open. */
  protected customOpen = signal(false);

  /** Current free-text value. */
  protected customText = signal('');

  /** Option that triggered the pending decision (spinner + focus anchor). */
  protected pendingOptionId = signal<string | null>(null);

  /** Whether the pending decision came from the free-text lane. */
  protected pendingCustom = signal(false);

  private customInput = viewChild<ElementRef<HTMLInputElement>>('customInput');
  private optionButtons = viewChildren<ElementRef<HTMLButtonElement>>('optionButton');
  private submitButton = viewChild<ButtonComponent>('submitButton');

  /** Options with the recommended one(s) first, original order otherwise. */
  protected sortedOptions = computed(() => {
    const options = this.options();
    return [...options.filter((o) => o.recommended), ...options.filter((o) => !o.recommended)];
  });

  /** No interaction while busy or disabled. */
  protected locked = computed(() => this.busy() || this.disabled());

  protected canSubmitCustom = computed(
    () => this.customText().trim().length > 0 && !this.locked(),
  );

  protected disabledTitle = computed(() =>
    this.disabled() && this.disabledReason() ? this.disabledReason() : null,
  );

  protected groupClasses = computed(() =>
    ['lc-choice-prompt', `lc-choice-prompt--${this.size()}`].join(' '),
  );

  constructor() {
    effect(() => {
      if (isDevMode() && this.disabled() && !this.disabledReason()) {
        console.warn(
          '[lc-choice-prompt] `disabled` is set without a `disabledReason`. ' +
            'A disabled prompt must explain why (shown as tooltip).',
        );
      }
    });

    // When busy ends, focus returns to the element that triggered the
    // decision, then the pending markers reset.
    let wasBusy = false;
    effect(() => {
      const busy = this.busy();
      if (wasBusy && !busy) {
        this.restoreFocus();
        this.pendingOptionId.set(null);
        this.pendingCustom.set(false);
      }
      wasBusy = busy;
    });
  }

  protected isPendingOption(id: string): boolean {
    return this.busy() && this.pendingOptionId() === id;
  }

  protected chooseOption(option: ChoicePromptOption): void {
    if (this.locked()) return;
    this.pendingOptionId.set(option.id);
    this.pendingCustom.set(false);
    this.decided.emit({ optionId: option.id });
  }

  protected openCustom(): void {
    if (this.locked()) return;
    this.customOpen.set(true);
    // Focus the input once it is rendered.
    setTimeout(() => this.customInput()?.nativeElement.focus());
  }

  protected onCustomInput(event: Event): void {
    this.customText.set((event.target as HTMLInputElement).value);
  }

  protected submitCustom(): void {
    const text = this.customText().trim();
    if (!text || this.locked()) return;
    this.pendingCustom.set(true);
    this.pendingOptionId.set(null);
    this.decided.emit({ customText: text });
  }

  protected triggerSecondary(action: ChoicePromptSecondaryAction): void {
    if (this.locked()) return;
    this.secondaryAction.emit(action.id);
  }

  private restoreFocus(): void {
    const pendingId = this.pendingOptionId();
    if (pendingId !== null) {
      const button = this.optionButtons().find(
        (ref) => ref.nativeElement.dataset['optionId'] === pendingId,
      );
      button?.nativeElement.focus();
    } else if (this.pendingCustom()) {
      this.submitButton()?.focus();
    }
  }
}
