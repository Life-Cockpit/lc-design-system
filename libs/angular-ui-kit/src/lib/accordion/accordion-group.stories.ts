import type { Meta, StoryObj } from '@storybook/angular';
import { AccordionGroupComponent } from './accordion-group.component';
import { AccordionComponent } from './accordion.component';
import { AccordionHeaderDirective } from './accordion-header.directive';
import { AccordionContentDirective } from './accordion-content.directive';
import { BadgeComponent } from '../badge/badge.component';

/**
 * Accordion Group manages multiple accordion panels, supporting exclusive
 * (single-open) or multi-open mode. Wrap `<lc-accordion>` children inside
 * `<lc-accordion-group>` for coordinated expand/collapse behavior.
 */
const meta: Meta<AccordionGroupComponent> = {
  title: 'Components/Accordion Group',
  component: AccordionGroupComponent,
  argTypes: {
    multi: {
      control: 'boolean',
      description:
        'When false (default), only one accordion can be open at a time. When true, multiple can be open simultaneously.',
    },
  },
  parameters: {
    docs: {
      description: {
        component: `
Accordion Group wraps multiple \`<lc-accordion>\` components and coordinates their expand/collapse behavior.

**Key Features:**
- Single-expand mode (default): opening one closes the others
- Multi-expand mode: all panels can be open independently
- \`collapseAll()\` / \`expandAll()\` programmatic API
- Works with all accordion variants and sizes
- Single-open is preserved across **dynamic** child lists (\`@for\`) — see *Rich Header List*
`,
      },
    },
  },
};

export default meta;
type Story = StoryObj<AccordionGroupComponent>;

export const Default: Story = {
  name: 'Single Expand (Default)',
  args: { multi: false },
  render: (args) => ({
    props: args,
    moduleMetadata: { imports: [AccordionGroupComponent, AccordionComponent] },
    template: `
      <lc-accordion-group [multi]="multi">
        <lc-accordion title="Section 1" [expanded]="true">
          <p style="margin: 0; color: var(--lc-color-neutral-600);">Content of section 1. Opening another section will close this one.</p>
        </lc-accordion>
        <lc-accordion title="Section 2">
          <p style="margin: 0; color: var(--lc-color-neutral-600);">Content of section 2.</p>
        </lc-accordion>
        <lc-accordion title="Section 3">
          <p style="margin: 0; color: var(--lc-color-neutral-600);">Content of section 3.</p>
        </lc-accordion>
      </lc-accordion-group>`,
  }),
};

export const MultiExpand: Story = {
  name: 'Multi Expand',
  args: { multi: true },
  render: (args) => ({
    props: args,
    moduleMetadata: { imports: [AccordionGroupComponent, AccordionComponent] },
    template: `
      <lc-accordion-group [multi]="multi">
        <lc-accordion title="Section 1" [expanded]="true">
          <p style="margin: 0; color: var(--lc-color-neutral-600);">This panel can stay open while others open too.</p>
        </lc-accordion>
        <lc-accordion title="Section 2" [expanded]="true">
          <p style="margin: 0; color: var(--lc-color-neutral-600);">Multiple panels open simultaneously.</p>
        </lc-accordion>
        <lc-accordion title="Section 3">
          <p style="margin: 0; color: var(--lc-color-neutral-600);">Click to expand — others stay open.</p>
        </lc-accordion>
      </lc-accordion-group>`,
  }),
};

export const FAQ: Story = {
  name: 'FAQ (Single Expand)',
  render: () => ({
    moduleMetadata: { imports: [AccordionGroupComponent, AccordionComponent] },
    template: `
      <div style="max-width: 640px;">
        <h3 style="margin: 0 0 16px; font-size: 18px; font-weight: 600;">Frequently Asked Questions</h3>
        <lc-accordion-group>
          <lc-accordion title="How do I reset my password?">
            <p style="margin: 0; color: var(--lc-color-neutral-600);">Go to Settings → Security → Change Password. You'll receive a confirmation email with a reset link valid for 24 hours.</p>
          </lc-accordion>
          <lc-accordion title="Can I export my data?">
            <p style="margin: 0; color: var(--lc-color-neutral-600);">Yes! Navigate to Settings → Data → Export. You can export as CSV, JSON, or PDF.</p>
          </lc-accordion>
          <lc-accordion title="What payment methods do you accept?">
            <p style="margin: 0; color: var(--lc-color-neutral-600);">We accept Visa, Mastercard, American Express, and PayPal. Annual plans also support bank transfer.</p>
          </lc-accordion>
          <lc-accordion title="Is there a free plan?">
            <p style="margin: 0; color: var(--lc-color-neutral-600);">Yes — the Starter plan is free forever with up to 3 projects and 10 tasks per project.</p>
          </lc-accordion>
        </lc-accordion-group>
      </div>`,
  }),
};

export const FlatVariant: Story = {
  name: 'Flat Variant',
  render: () => ({
    moduleMetadata: { imports: [AccordionGroupComponent, AccordionComponent] },
    template: `
      <div style="max-width: 480px;">
        <lc-accordion-group>
          <lc-accordion title="Notifications" variant="flat" [expanded]="true">
            <div style="display: flex; flex-direction: column; gap: 12px; padding: 4px 0;">
              <label style="display: flex; align-items: center; gap: 8px; cursor: pointer;">
                <input type="checkbox" checked /> Email notifications
              </label>
              <label style="display: flex; align-items: center; gap: 8px; cursor: pointer;">
                <input type="checkbox" /> Push notifications
              </label>
            </div>
          </lc-accordion>
          <lc-accordion title="Privacy" variant="flat">
            <p style="margin: 0; color: var(--lc-color-neutral-600);">Control who can see your profile and activity.</p>
          </lc-accordion>
          <lc-accordion title="Appearance" variant="flat">
            <p style="margin: 0; color: var(--lc-color-neutral-600);">Customize theme, font size, and layout.</p>
          </lc-accordion>
        </lc-accordion-group>
      </div>`,
  }),
};

export const WithDisabled: Story = {
  name: 'With Disabled Panel',
  render: () => ({
    moduleMetadata: { imports: [AccordionGroupComponent, AccordionComponent] },
    template: `
      <lc-accordion-group>
        <lc-accordion title="Available Section" [expanded]="true">
          <p style="margin: 0; color: var(--lc-color-neutral-600);">This section is accessible.</p>
        </lc-accordion>
        <lc-accordion title="Locked Section (Upgrade Required)" [disabled]="true">
          <p style="margin: 0;">This content requires a premium plan.</p>
        </lc-accordion>
        <lc-accordion title="Another Section">
          <p style="margin: 0; color: var(--lc-color-neutral-600);">Click to expand.</p>
        </lc-accordion>
      </lc-accordion-group>`,
  }),
};

/**
 * The full composition: a single-open group of flat rows, each with a rich
 * projected header (label, status badge, meta, right-aligned value) and a lazy
 * templated body that only mounts when its row is first opened. Opening one row
 * collapses the others.
 */
export const RichHeaderList: Story = {
  name: 'Rich Header List (Lazy, Single Expand)',
  render: () => ({
    moduleMetadata: {
      imports: [
        AccordionGroupComponent,
        AccordionComponent,
        AccordionHeaderDirective,
        AccordionContentDirective,
        BadgeComponent,
      ],
    },
    template: `
      <div style="max-width: 600px;">
        <lc-accordion-group [multi]="false">
          <lc-accordion variant="flat" chevronPosition="leading" [lazy]="true" ariaLabel="Item one">
            <ng-template lcAccordionHeader>
              <span style="font-weight: 600;">Item One</span>
              <lc-badge variant="success" size="sm">Complete</lc-badge>
              <span style="color: var(--lc-color-neutral-500); font-weight: 400;">Meta · detail · info</span>
              <span style="margin-left: auto; color: var(--lc-color-neutral-500); font-weight: 400; font-variant-numeric: tabular-nums;">12:04</span>
            </ng-template>
            <ng-template lcAccordionContent>
              <p style="margin: 0; color: var(--lc-color-neutral-600);">Body for item one — created lazily on first open.</p>
            </ng-template>
          </lc-accordion>

          <lc-accordion variant="flat" chevronPosition="leading" [lazy]="true" ariaLabel="Item two">
            <ng-template lcAccordionHeader>
              <span style="font-weight: 600;">Item Two</span>
              <lc-badge variant="info" size="sm">Running</lc-badge>
              <span style="color: var(--lc-color-neutral-500); font-weight: 400;">Meta · detail · info</span>
              <span style="margin-left: auto; color: var(--lc-color-neutral-500); font-weight: 400; font-variant-numeric: tabular-nums;">12:07</span>
            </ng-template>
            <ng-template lcAccordionContent>
              <p style="margin: 0; color: var(--lc-color-neutral-600);">Body for item two — created lazily on first open.</p>
            </ng-template>
          </lc-accordion>

          <lc-accordion variant="flat" chevronPosition="leading" [lazy]="true" ariaLabel="Item three">
            <ng-template lcAccordionHeader>
              <span style="font-weight: 600;">Item Three</span>
              <lc-badge variant="error" size="sm">Failed</lc-badge>
              <span style="color: var(--lc-color-neutral-500); font-weight: 400;">Meta · detail · info</span>
              <span style="margin-left: auto; color: var(--lc-color-neutral-500); font-weight: 400; font-variant-numeric: tabular-nums;">12:09</span>
            </ng-template>
            <ng-template lcAccordionContent>
              <p style="margin: 0; color: var(--lc-color-neutral-600);">Body for item three — created lazily on first open.</p>
            </ng-template>
          </lc-accordion>
        </lc-accordion-group>
      </div>`,
  }),
};
