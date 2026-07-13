import {
  ChangeDetectionStrategy,
  Component,
  input,
  output,
  computed,
} from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { IconComponent } from '../icon/icon.component';

/**
 * Status of a single pipeline node.
 * - complete: finished (teal check)
 * - current:  in progress / active (teal, subtle pulse)
 * - pending:  not started yet (muted, hollow)
 * - warning:  needs attention (amber)
 * - error:    failed (red)
 */
export type PipelineStatus =
  | 'complete'
  | 'current'
  | 'pending'
  | 'warning'
  | 'error';

export interface PipelineStep {
  /** Node label. */
  label: string;
  /** Optional secondary line under the label. */
  caption?: string;
  /** Status that drives the node color and default icon. */
  status: PipelineStatus;
  /** Optional icon (Tabler name) overriding the status default. */
  icon?: string;
  /** Optional opaque payload echoed back in `stepClick`. */
  id?: string;
}

export type PipelineOrientation = 'horizontal' | 'vertical';
export type PipelineSize = 'sm' | 'md';

const STATUS_ICON: Record<PipelineStatus, string> = {
  complete: 'check',
  current: 'point',
  pending: '',
  warning: 'alert-triangle',
  error: 'x',
};

/**
 * Pipeline — a status timeline of connected process nodes.
 *
 * Unlike {@link StepperComponent} (a navigation stepper whose states derive
 * from the active index), each pipeline node carries its own explicit status,
 * so it can show completed, current, pending, warning and error nodes in the
 * same chain — with an optional caption under each label.
 *
 * @example
 * ```html
 * <lc-pipeline
 *   [steps]="[
 *     { label: 'Connect', caption: 'Token valid', status: 'complete' },
 *     { label: 'Checkout', caption: '2 hours ago', status: 'complete' },
 *     { label: 'Analyze', caption: 'Running…', status: 'current' },
 *     { label: 'Graph', caption: 'Out of date', status: 'warning' }
 *   ]" />
 * ```
 */
@Component({
  selector: 'lc-pipeline',
  standalone: true,
  imports: [IconComponent, NgTemplateOutlet],
  templateUrl: './pipeline.component.html',
  styleUrls: ['./pipeline.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PipelineComponent {
  /** Ordered pipeline nodes. */
  readonly steps = input.required<readonly PipelineStep[]>();

  /** Layout direction. @default 'horizontal' */
  readonly orientation = input<PipelineOrientation>('horizontal');

  /**
   * Node/connector scale.
   * - md: default nodes (1.75rem)
   * - sm: compact spine — smaller nodes, thinner connectors, tighter grid
   * @default 'md'
   */
  readonly size = input<PipelineSize>('md');

  /** Whether nodes are clickable (emits `stepClick`). @default false */
  readonly clickable = input<boolean>(false);

  /** Emitted when a node is activated (only when `clickable`). */
  readonly stepClick = output<PipelineStep>();

  protected readonly hostClass = computed(
    () =>
      `lc-pipeline lc-pipeline--${this.orientation()} lc-pipeline--size-${this.size()}`,
  );

  protected iconFor(step: PipelineStep): string {
    return step.icon ?? STATUS_ICON[step.status];
  }

  protected stepClass(step: PipelineStep): string {
    return `lc-pipeline__step lc-pipeline__step--${step.status}`;
  }

  protected onActivate(step: PipelineStep): void {
    if (this.clickable()) {
      this.stepClick.emit(step);
    }
  }
}
