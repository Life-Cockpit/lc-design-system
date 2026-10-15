import type { Meta, StoryObj } from '@storybook/angular';
import { SectionComponent } from './section.component';

/**
 * Section provides consistent vertical spacing and optional background colors
 * for page content blocks. Use it to visually separate different content areas
 * within a page layout.
 */
const meta: Meta<SectionComponent> = {
  title: 'Layout/Section',
  component: SectionComponent,
  argTypes: {
    spacing: {
      control: 'select',
      options: ['none', 'sm', 'md', 'lg', 'xl'],
      description: 'Vertical padding amount',
    },
    background: {
      control: 'select',
      options: ['none', 'gray', 'primary', 'secondary'],
      description: 'Background color preset',
    },
    noPaddingX: { description: 'Removes horizontal padding' },
    noPaddingY: { description: 'Removes vertical padding' },
  },

  parameters: {
    docs: {
      description: {
        component: `
Section component for page content grouping with spacing and background.

**Key Features:**
- Configurable vertical spacing (none, sm, md, lg, xl)
- Background color options (none, subtle, muted)
- Independent horizontal and vertical padding control
- Content projection via ng-content
`,
      },
    },
  },
};

export default meta;
type Story = StoryObj<SectionComponent>;

export const Default: Story = {
  args: { spacing: 'md', background: 'none' },
  render: (args) => ({
    props: args,
    template: `<lc-section [spacing]="spacing" [background]="background">
      <h3 style="margin: 0 0 8px; font-weight: 600;">Section Title</h3>
      <p style="margin: 0; color: #666;">This section has medium spacing and no background color. It provides consistent vertical rhythm between content blocks.</p>
    </lc-section>`,
  }),
};

export const GrayBackground: Story = {
  name: 'Gray Background',
  args: { spacing: 'lg', background: 'gray' },
  render: (args) => ({
    props: args,
    template: `<lc-section [spacing]="spacing" [background]="background">
      <h3 style="margin: 0 0 8px; font-weight: 600;">Featured Content</h3>
      <p style="margin: 0; color: #666;">Gray background sections visually separate content from the default white page.</p>
    </lc-section>`,
  }),
};

export const PrimaryBackground: Story = {
  name: 'Primary Background',
  args: { spacing: 'lg', background: 'primary' },
  render: (args) => ({
    props: args,
    template: `<lc-section [spacing]="spacing" [background]="background">
      <h3 style="margin: 0 0 8px; font-weight: 600;">Call to Action</h3>
      <p style="margin: 0;">Primary background draws attention to important content or CTAs.</p>
    </lc-section>`,
  }),
};

export const SpacingComparison: Story = {
  name: 'Spacing Sizes',
  render: () => ({
    template: `
      <div style="display: flex; flex-direction: column; gap: 4px;">
        <lc-section spacing="none" background="gray">
          <span style="font-size: 13px;">spacing: none</span>
        </lc-section>
        <lc-section spacing="sm" background="gray">
          <span style="font-size: 13px;">spacing: sm</span>
        </lc-section>
        <lc-section spacing="md" background="gray">
          <span style="font-size: 13px;">spacing: md (default)</span>
        </lc-section>
        <lc-section spacing="lg" background="gray">
          <span style="font-size: 13px;">spacing: lg</span>
        </lc-section>
        <lc-section spacing="xl" background="gray">
          <span style="font-size: 13px;">spacing: xl</span>
        </lc-section>
      </div>`,
  }),
};

export const PageLayout: Story = {
  name: 'Page Sections (Composition)',
  render: () => ({
    template: `
      <div>
        <lc-section spacing="lg" background="none">
          <h2 style="margin: 0 0 8px; font-size: 22px; font-weight: 700;">Welcome to LifeCorner</h2>
          <p style="margin: 0; color: #666; max-width: 600px;">Your personal productivity platform for managing tasks, tracking habits, and organizing your life.</p>
        </lc-section>
        <lc-section spacing="lg" background="gray">
          <h3 style="margin: 0 0 12px; font-weight: 600;">Quick Stats</h3>
          <div style="display: flex; gap: 24px;">
            <div><div style="font-size: 24px; font-weight: 700;">12</div><div style="font-size: 12px; color: #666;">Active Tasks</div></div>
            <div><div style="font-size: 24px; font-weight: 700;">3</div><div style="font-size: 12px; color: #666;">Projects</div></div>
            <div><div style="font-size: 24px; font-weight: 700;">87%</div><div style="font-size: 12px; color: #666;">Completion</div></div>
          </div>
        </lc-section>
        <lc-section spacing="md" background="none">
          <h3 style="margin: 0 0 8px; font-weight: 600;">Recent Activity</h3>
          <p style="margin: 0; color: #666;">Your latest updates will appear here once you start working.</p>
        </lc-section>
      </div>`,
  }),
};
