import {
  AfterViewChecked,
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
} from '@angular/core';
import { ButtonComponent } from '../button/button.component';
import { IconComponent } from '../icon/icon.component';

export type NextStepCardTone = 'neutral' | 'primary' | 'success' | 'warning' | 'info';

/**
 * Next-step card — the single status-and-action surface of a page: "where does
 * this stand, and what is the one next step?".
 *
 * Features:
 * - Tonal accent rail (4px left) + tinted icon bubble, token colors only
 * - Title, message (string input or default slot for markup)
 * - Primary action (with loading / disabled + mandatory disabled reason),
 *   ghost secondary action, or an external link instead of the primary button
 * - `[slot='blockers']`: rows inside the card under a subtle divider (dot
 *   prefix); each projected element with `slot="blockers"` becomes one row —
 *   blockers are rows IN the card, never additional banners
 * - `[slot='meta']`: one footer line (icon + text)
 * - `[slot='actions']`: fully replaces the built-in action buttons
 * - `role="region"` labelled by the title; optional polite live announcement
 *   of title changes via `announce`
 *
 * Usage rule: exactly ONE next-step card per page.
 *
 * @example
 * ```html
 * <lc-next-step-card
 *   tone="warning"
 *   icon="clock"
 *   cardTitle="Wartet auf Freigabe"
 *   message="Der Entwurf ist vollständig und kann geprüft werden."
 *   primaryLabel="Freigeben"
 *   secondaryLabel="Änderungen anfordern"
 *   (primaryClick)="approve()"
 * />
 * ```
 */
@Component({
  selector: 'lc-next-step-card',
  standalone: true,
  imports: [ButtonComponent, IconComponent],
  templateUrl: './next-step-card.component.html',
  styleUrls: ['./next-step-card.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NextStepCardComponent implements AfterViewChecked {
  /**
   * Tone of the accent rail and icon bubble. Colors come exclusively from the
   * semantic tokens (`--color-*` rail, `--color-*-subtle` bubble tint,
   * `--color-on-*-subtle` icon ink).
   * @default 'neutral'
   */
  tone = input<NextStepCardTone>('neutral');

  /** Icon name for the round 36px bubble. */
  icon = input<string>('information-circle');

  /** Title (1rem semibold). Also the card's accessible name. */
  cardTitle = input.required<string>();

  /** Message below the title. For markup, use the default slot instead. */
  message = input<string>();

  /** Label of the primary action. Omit to render no primary button. */
  primaryLabel = input<string>();

  /** Optional leading icon of the primary action. */
  primaryIcon = input<string>();

  /** Shows a spinner on the primary action. */
  primaryLoading = input<boolean>(false);

  /**
   * Disables the primary action. A disabled primary REQUIRES
   * `primaryDisabledReason`; disabled without a reason logs a dev warning.
   */
  primaryDisabled = input<boolean>(false);

  /** Why the primary action is disabled — shown as tooltip on the button. */
  primaryDisabledReason = input<string>('');

  /** Label of the ghost secondary action (rendered with a chevron). */
  secondaryLabel = input<string>();

  /**
   * Label of an external link rendered instead of the primary button
   * (opens in a new tab). Requires `linkHref`.
   */
  linkLabel = input<string>();

  /** Target URL of the external link. */
  linkHref = input<string>();

  /**
   * Announce title changes to screen readers via `aria-live="polite"` —
   * for cards whose state advances in place.
   * @default false
   */
  announce = input<boolean>(false);

  /** Emits when the primary action is clicked. */
  primaryClick = output<void>();

  /** Emits when the secondary action is clicked. */
  secondaryClick = output<void>();

  private actionsSlot = viewChild<ElementRef<HTMLElement>>('actionsSlot');

  /**
   * Whether content was projected into `[slot='actions']` — projected actions
   * fully replace the built-in buttons.
   */
  protected hasProjectedActions = signal(false);

  protected cardClasses = computed(() =>
    ['lc-next-step-card', `lc-next-step-card--${this.tone()}`].join(' '),
  );

  protected showLink = computed(() => !!(this.linkLabel() && this.linkHref()));

  constructor() {
    effect(() => {
      if (isDevMode() && this.primaryDisabled() && !this.primaryDisabledReason()) {
        console.warn(
          '[lc-next-step-card] `primaryDisabled` is set without a `primaryDisabledReason`. ' +
            'A disabled primary action must explain why (shown as tooltip).',
        );
      }
    });
  }

  ngAfterViewChecked(): void {
    // Projected [slot='actions'] content replaces the built-in buttons. The
    // signal write is equality-guarded, so unchanged checks are no-ops.
    const el = this.actionsSlot()?.nativeElement;
    this.hasProjectedActions.set(!!el && el.childElementCount > 0);
  }
}
