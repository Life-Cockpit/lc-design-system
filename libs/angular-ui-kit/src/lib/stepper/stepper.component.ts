import {
  Component,
  ChangeDetectionStrategy,
  input,
  output,
  model,
  computed,
} from '@angular/core';

export interface StepperStep {
  readonly label: string;
  readonly description?: string;
  readonly optional?: boolean;
}

export type StepState = 'pending' | 'active' | 'completed';

let nextStepperId = 0;

/**
 * Stepper component for multi-step wizard workflows.
 *
 * Features:
 * - Horizontal and vertical orientations
 * - Active, completed, and pending step states
 * - Numbered step indicators with checkmark on completion
 * - Optional step descriptions and "optional" labels
 * - Linear mode restricting navigation to sequential steps
 * - Two-way active step binding
 * - Content projection for step body
 * - Accessible: steps are real buttons in an ordered list, the active step
 *   carries `aria-current="step"`, non-navigable steps are disabled
 *
 * @example
 * ```html
 * <lc-stepper [steps]="steps" [(activeStep)]="currentStep">
 *   <div>Step content here</div>
 * </lc-stepper>
 * ```
 */
@Component({
  selector: 'lc-stepper',
  standalone: true,
  imports: [],
  templateUrl: './stepper.component.html',
  styleUrl: './stepper.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StepperComponent {
  /** Step definitions */
  readonly steps = input.required<readonly StepperStep[]>();

  /** Active step index (0-based, two-way binding) */
  readonly activeStep = model<number>(0);

  /** Whether completed steps can be clicked to navigate back */
  readonly linear = input<boolean>(true);

  /** Orientation */
  readonly orientation = input<'horizontal' | 'vertical'>('horizontal');

  /** Text shown under optional steps */
  readonly optionalLabel = input('Optional');

  /**
   * Accessible name template for each step button. Placeholders: `{n}`
   * (1-based step number), `{m}` (step count), `{label}`. Optional steps get
   * `optionalLabel` appended.
   */
  readonly stepAriaLabel = input('Step {n} of {m}: {label}');

  /** Emitted when active step changes */
  readonly stepChange = output<number>();

  /** Per-instance id prefix so description ids stay unique across steppers */
  private readonly instanceId = `lc-stepper-${++nextStepperId}`;

  /** Computed total step count */
  readonly totalSteps = computed(() => this.steps().length);

  /** Whether we're on the first step */
  readonly isFirstStep = computed(() => this.activeStep() === 0);

  /** Whether we're on the last step */
  readonly isLastStep = computed(() => this.activeStep() === this.totalSteps() - 1);

  /** Get the state of a step */
  getStepState(index: number): StepState {
    const current = this.activeStep();
    if (index < current) return 'completed';
    if (index === current) return 'active';
    return 'pending';
  }

  /**
   * Whether the step at `index` can be activated by the user. In linear mode
   * only completed steps (and the active one) are reachable.
   */
  isStepNavigable(index: number): boolean {
    return !this.linear() || index <= this.activeStep();
  }

  /** Accessible name for the step button at `index` */
  getStepAriaLabel(index: number): string {
    const step = this.steps()[index];
    if (!step) return '';
    const name = this.stepAriaLabel()
      .replace('{n}', String(index + 1))
      .replace('{m}', String(this.totalSteps()))
      .replace('{label}', step.label);
    return step.optional ? `${name}, ${this.optionalLabel()}` : name;
  }

  /** Id of the description element for `aria-describedby` (or null) */
  getDescriptionId(index: number): string | null {
    return this.steps()[index]?.description ? `${this.instanceId}-desc-${index}` : null;
  }

  /** Navigate to a specific step (only if navigable, see `isStepNavigable`) */
  goToStep(index: number): void {
    if (index === this.activeStep() || !this.isStepNavigable(index)) {
      return;
    }
    this.activeStep.set(index);
    this.stepChange.emit(index);
  }

  /** Go to next step */
  next(): void {
    const current = this.activeStep();
    if (current < this.totalSteps() - 1) {
      this.activeStep.set(current + 1);
      this.stepChange.emit(current + 1);
    }
  }

  /** Go to previous step */
  previous(): void {
    const current = this.activeStep();
    if (current > 0) {
      this.activeStep.set(current - 1);
      this.stepChange.emit(current - 1);
    }
  }

  /** Get CSS classes for step indicator */
  getStepClasses(index: number): string {
    const state = this.getStepState(index);
    const classes = ['lc-stepper__step'];
    classes.push(`lc-stepper__step--${state}`);
    if (!this.linear() || state === 'completed') {
      classes.push('lc-stepper__step--clickable');
    }
    return classes.join(' ');
  }

  /** Get CSS classes for connector line */
  getConnectorClasses(index: number): string {
    const classes = ['lc-stepper__connector'];
    if (index < this.activeStep()) {
      classes.push('lc-stepper__connector--completed');
    }
    return classes.join(' ');
  }
}
