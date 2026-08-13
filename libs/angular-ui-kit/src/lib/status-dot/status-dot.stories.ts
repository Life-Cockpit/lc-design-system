import type { Meta, StoryObj } from '@storybook/angular';
import { StatusDotComponent } from './status-dot.component';

const meta: Meta<StatusDotComponent> = {
  title: 'Data Display/Status Dot',
  component: StatusDotComponent,
  parameters: {
    docs: {
      description: {
        component: `
The Status Dot is the traffic-light atom for item states in list rows, rails
and boards.

**Key Features:**
- Five semantic tones: \`done\`, \`run\`, \`wait\`, \`blocked\`, \`open\`
- Optional pulse animation for in-progress states (static under \`prefers-reduced-motion\`)
- Decorative by default; pass \`label\` to expose the state to assistive technology
        `,
      },
    },
  },
  argTypes: {
    tone: {
      control: 'select',
      options: ['done', 'run', 'wait', 'blocked', 'open'],
      description: 'Semantic tone',
      table: { defaultValue: { summary: 'open' } },
    },
    size: {
      control: 'select',
      options: ['sm', 'md'],
      description: 'Dot size (sm = 6px for dense rows)',
      table: { defaultValue: { summary: 'md' } },
    },
    pulse: { control: 'boolean', description: 'Pulse animation for in-progress states' },
    label: { control: 'text', description: 'Accessible label; without it the dot is decorative' },
  },
};

export default meta;
type Story = StoryObj<StatusDotComponent>;

export const Default: Story = {
  args: { tone: 'run', pulse: true, label: 'In Arbeit' },
};

export const AllTones: Story = {
  render: () => ({
    template: `
      <div style="display: flex; flex-direction: column; gap: 12px; font-size: 14px;">
        <div style="display: flex; align-items: center; gap: 8px;">
          <lc-status-dot tone="done" label="Erledigt" /> done
        </div>
        <div style="display: flex; align-items: center; gap: 8px;">
          <lc-status-dot tone="run" [pulse]="true" label="In Arbeit" /> run (pulse)
        </div>
        <div style="display: flex; align-items: center; gap: 8px;">
          <lc-status-dot tone="wait" label="Wartet" /> wait
        </div>
        <div style="display: flex; align-items: center; gap: 8px;">
          <lc-status-dot tone="blocked" label="Blockiert" /> blocked
        </div>
        <div style="display: flex; align-items: center; gap: 8px;">
          <lc-status-dot tone="open" label="Offen" /> open
        </div>
      </div>`,
  }),
};

export const InListRows: Story = {
  parameters: {
    docs: { description: { story: 'The `sm` size in a dense list — the Vorhaben-Liste pattern.' } },
  },
  render: () => ({
    template: `
      <div style="display: flex; flex-direction: column; max-width: 360px; font-size: 13px;">
        <div style="display: flex; align-items: center; gap: 8px; padding: 6px 0; border-bottom: 1px solid var(--color-divider);">
          <lc-status-dot tone="run" size="sm" [pulse]="true" label="In Arbeit" />
          <span style="flex: 1;">Onboarding-Flow überarbeiten</span>
          <span style="color: var(--color-text-tertiary);">Wave 2</span>
        </div>
        <div style="display: flex; align-items: center; gap: 8px; padding: 6px 0; border-bottom: 1px solid var(--color-divider);">
          <lc-status-dot tone="blocked" size="sm" label="Blockiert" />
          <span style="flex: 1;">Abrechnung: SEPA-Mandate</span>
          <span style="color: var(--color-text-tertiary);">Wave 2</span>
        </div>
        <div style="display: flex; align-items: center; gap: 8px; padding: 6px 0;">
          <lc-status-dot tone="done" size="sm" label="Erledigt" />
          <span style="flex: 1;">Login-Härtung</span>
          <span style="color: var(--color-text-tertiary);">Wave 1</span>
        </div>
      </div>`,
  }),
};
