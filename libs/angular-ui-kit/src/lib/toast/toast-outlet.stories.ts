import type { Meta, StoryObj } from '@storybook/angular';
import { moduleMetadata } from '@storybook/angular';
import { Component, inject, input } from '@angular/core';
import { ToastOutletComponent } from './toast-outlet.component';
import { ToastService, type ToastPosition, type ToastVariant } from './toast.service';
import { ButtonComponent } from '../button/button.component';

const MESSAGES: Record<ToastVariant, string> = {
  success: 'Changes saved successfully.',
  info: 'A new version is available.',
  warning: 'Your session expires in 5 minutes.',
  error: 'Something went wrong. Please try again.',
};

/** Demo host: a few buttons that call `ToastService.show()` and one outlet. */
@Component({
  selector: 'lc-toast-outlet-demo',
  standalone: true,
  imports: [ToastOutletComponent, ButtonComponent],
  template: `
    <div style="display: flex; flex-wrap: wrap; gap: 8px; align-items: center;">
      <lc-button variant="primary" (clicked)="show('success')">Success</lc-button>
      <lc-button variant="outline" (clicked)="show('info')">Info</lc-button>
      <lc-button variant="warning" (clicked)="show('warning')">Warning</lc-button>
      <lc-button variant="danger" (clicked)="show('error')">Error</lc-button>
      <lc-button variant="ghost" (clicked)="showMany()">Show 7 (max 5 stack)</lc-button>
      <lc-button variant="ghost" (clicked)="closeAll()">Close all</lc-button>
    </div>
    <lc-toast-outlet />
  `,
})
class ToastOutletDemoComponent {
  readonly position = input<ToastPosition>('top-right');
  readonly duration = input<number>(4000);

  private readonly toastService = inject(ToastService);
  private counter = 0;

  show(variant: ToastVariant): void {
    this.toastService.show({
      message: MESSAGES[variant],
      variant,
      position: this.position(),
      duration: this.duration(),
      action: variant === 'success' ? { label: 'Undo', onClick: () => undefined } : undefined,
    });
  }

  showMany(): void {
    for (let i = 1; i <= 7; i++) {
      this.toastService.show({
        message: `Notification ${++this.counter}`,
        variant: 'info',
        position: this.position(),
        duration: 0,
      });
    }
  }

  closeAll(): void {
    this.toastService.closeAll();
  }
}

interface DemoArgs {
  position: ToastPosition;
  duration: number;
}

/**
 * `<lc-toast-outlet />` renders the toasts of `ToastService`. Place it once in
 * the application shell; without it `ToastService.show()` shows nothing.
 * Toasts are stacked per position (at most 5 at a time — the oldest is dropped)
 * and announced from persistent live regions (polite, or assertive for
 * error/warning toasts).
 */
const meta: Meta<DemoArgs> = {
  title: 'Feedback/Toast Outlet',
  component: ToastOutletComponent,
  decorators: [moduleMetadata({ imports: [ToastOutletDemoComponent] })],
  args: { position: 'top-right', duration: 4000 },
  argTypes: {
    position: {
      control: 'select',
      options: ['top-left', 'top-center', 'top-right', 'bottom-left', 'bottom-center', 'bottom-right'],
      description: 'Position of the toasts shown by the demo buttons',
    },
    duration: { control: 'number', description: 'Auto-dismiss duration in ms (0 = sticky)' },
  },
  render: (args) => ({
    props: args,
    template: `<lc-toast-outlet-demo [position]="position" [duration]="duration" />`,
  }),
};

export default meta;
type Story = StoryObj<DemoArgs>;

export const Default: Story = {};

export const BottomCenter: Story = {
  args: { position: 'bottom-center' },
  parameters: {
    docs: { description: { story: 'Bottom stacks grow upwards — the newest toast sits nearest the edge.' } },
  },
};

export const Sticky: Story = {
  args: { duration: 0 },
  parameters: {
    docs: { description: { story: 'With `duration: 0` toasts stay until dismissed via the close button or action.' } },
  },
};
