import type { Meta, StoryObj } from '@storybook/angular';
import { moduleMetadata } from '@storybook/angular';
import { AccordionComponent } from './accordion.component';
import { AccordionHeaderDirective } from './accordion-header.directive';
import { AccordionContentDirective } from './accordion-content.directive';
import { BadgeComponent } from '../badge/badge.component';

/**
 * Accordions expand and collapse sections of content, helping users focus on
 * relevant information without overwhelming the page. Perfect for FAQs,
 * settings panels, and long-form content.
 */
const meta: Meta<AccordionComponent> = {
  title: 'Components/Accordion',
  component: AccordionComponent,
  argTypes: {
    title: { description: 'Header text displayed in the toggle button' },
    variant: {
      control: 'select',
      options: ['outlined', 'flat'],
      description: 'Visual style — outlined adds a border, flat blends with the page',
    },
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
      description: 'Controls padding and font size of the header',
    },
    expanded: { description: 'Whether the content section is visible (supports two-way binding)' },
    disabled: { description: 'Prevents the accordion from being toggled' },
    chevronPosition: {
      control: 'select',
      options: ['leading', 'trailing'],
      description:
        'Where the disclosure chevron sits. `trailing` (default) keeps the original layout; `leading` frees the right edge for a right-aligned header element.',
    },
    lazy: {
      control: 'boolean',
      description:
        'With an `lcAccordionContent` template, defers body creation until the first open (kept afterwards). No effect on `<ng-content>` bodies.',
    },
    destroyOnClose: {
      control: 'boolean',
      description:
        'With an `lcAccordionContent` template, discards the body on collapse and recreates it on reopen. Takes precedence over `lazy`.',
    },
    ariaLabel: {
      description:
        'Explicit accessible label for the header button, used when the header is a rich template with no plain-text title. Falls back to `title`.',
    },
  },

  parameters: {
    docs: {
      description: {
        component: `
Accordion component for collapsible content sections.

**Key Features:**
- Expandable/collapsible content panels
- Two-way binding for expanded state
- Animated expand/collapse transitions
- Plain-string \`title\` **or** a rich projected header via \`<ng-template lcAccordionHeader>\`
- Eager \`<ng-content>\` body **or** lazy / destroyable template body via \`<ng-template lcAccordionContent>\` + \`[lazy]\` / \`[destroyOnClose]\`
- Configurable chevron side (\`chevronPosition\`) so right-aligned header elements stay pinned
- Accessible: real \`<button>\` header with \`aria-expanded\` / \`aria-controls\`, keyboard support and focus ring

**Rich header + lazy body**

\`\`\`html
<lc-accordion variant="flat" chevronPosition="leading" [lazy]="true">
  <ng-template lcAccordionHeader>
    <span>Item label</span>
    <lc-badge variant="success" size="sm">Done</lc-badge>
    <span style="margin-left: auto;">12:04</span>
  </ng-template>
  <ng-template lcAccordionContent>
    <expensive-panel />
  </ng-template>
</lc-accordion>
\`\`\`

**A11y constraint:** because the header is itself a \`<button>\`, the \`lcAccordionHeader\`
template must contain **no nested interactive elements** (no button / link / input) —
text, badges and other non-interactive nodes only. When the header is a template with no
plain-text \`title\`, set \`ariaLabel\` (or \`title\` as a fallback) so the button has an
accessible name.

Fully backward compatible: without \`lcAccordionHeader\` / \`lcAccordionContent\` / the new
inputs, the accordion behaves exactly as before (\`title\` + eager \`<ng-content>\` body).
`,
      },
    },
  },
};

export default meta;
type Story = StoryObj<AccordionComponent>;

export const Default: Story = {
  args: { title: 'What is Life-Cockpit?', variant: 'outlined', size: 'md', disabled: false, expanded: true },
  render: (args) => ({
    props: args,
    template: `<lc-accordion [title]="title" [variant]="variant" [size]="size" [disabled]="disabled" [expanded]="expanded">
      <p style="margin: 0; color: var(--lc-color-neutral-600);">Life-Cockpit is a personal productivity platform that helps you manage tasks, track habits, and organize your life in one unified dashboard.</p>
    </lc-accordion>`,
  }),
};

export const Expanded: Story = {
  args: { title: 'Getting Started', variant: 'outlined', size: 'md', expanded: true },
  render: (args) => ({
    props: args,
    template: `<lc-accordion [title]="title" [variant]="variant" [size]="size" [expanded]="expanded">
      <div style="color: var(--lc-color-neutral-600);">
        <p style="margin: 0 0 8px;">Follow these steps to get up and running:</p>
        <ol style="margin: 0; padding-left: 20px;">
          <li>Create your account</li>
          <li>Set up your first project</li>
          <li>Invite team members</li>
          <li>Start tracking tasks</li>
        </ol>
      </div>
    </lc-accordion>`,
  }),
};

export const FlatVariant: Story = {
  name: 'Flat Variant',
  args: { title: 'Advanced Settings', variant: 'flat', size: 'md', expanded: true },
  render: (args) => ({
    props: args,
    template: `<lc-accordion [title]="title" [variant]="variant" [size]="size" [expanded]="expanded">
      <p style="margin: 0; color: var(--lc-color-neutral-600);">Flat accordions have no border and blend seamlessly into the surrounding content. Ideal for settings pages and nested layouts.</p>
    </lc-accordion>`,
  }),
};

export const Disabled: Story = {
  args: { title: 'Locked Section (Upgrade Required)', variant: 'outlined', size: 'md', disabled: true },
  render: (args) => ({
    props: args,
    template: `<lc-accordion [title]="title" [variant]="variant" [size]="size" [disabled]="disabled">
      <p style="margin: 0;">This content is not accessible.</p>
    </lc-accordion>`,
  }),
};

export const Sizes: Story = {
  name: 'Size Comparison',
  render: () => ({
    template: `
      <div style="display: flex; flex-direction: column; gap: 12px;">
        <lc-accordion title="Small Accordion" size="sm" [expanded]="true">
          <p style="margin: 0; color: var(--lc-color-neutral-600);">Compact size for dense UIs like sidebars and mobile views.</p>
        </lc-accordion>
        <lc-accordion title="Medium Accordion (Default)" size="md" [expanded]="true">
          <p style="margin: 0; color: var(--lc-color-neutral-600);">Standard size suitable for most content sections.</p>
        </lc-accordion>
        <lc-accordion title="Large Accordion" size="lg" [expanded]="true">
          <p style="margin: 0; color: var(--lc-color-neutral-600);">Larger touch targets and more breathing room for prominent sections.</p>
        </lc-accordion>
      </div>`,
  }),
};

export const FAQPage: Story = {
  name: 'FAQ Page (Composition)',
  render: () => ({
    template: `
      <div style="max-width: 640px;">
        <h3 style="margin: 0 0 16px; font-size: 18px; font-weight: 600;">Frequently Asked Questions</h3>
        <div style="display: flex; flex-direction: column; gap: 8px;">
          <lc-accordion title="How do I reset my password?" variant="outlined">
            <p style="margin: 0; color: var(--lc-color-neutral-600);">Go to Settings → Security → Change Password. You'll receive a confirmation email with a reset link valid for 24 hours.</p>
          </lc-accordion>
          <lc-accordion title="Can I export my data?" variant="outlined">
            <p style="margin: 0; color: var(--lc-color-neutral-600);">Yes! Navigate to Settings → Data → Export. You can export as CSV, JSON, or PDF. Exports are processed in the background and you'll be notified when ready.</p>
          </lc-accordion>
          <lc-accordion title="What payment methods do you accept?" variant="outlined">
            <p style="margin: 0; color: var(--lc-color-neutral-600);">We accept Visa, Mastercard, American Express, and PayPal. Annual plans also support bank transfer. All payments are processed securely through Stripe.</p>
          </lc-accordion>
          <lc-accordion title="Is there a free plan?" variant="outlined">
            <p style="margin: 0; color: var(--lc-color-neutral-600);">Yes — the Starter plan is free forever and includes up to 3 projects, 10 tasks per project, and basic reporting. Upgrade anytime for unlimited access.</p>
          </lc-accordion>
        </div>
      </div>`,
  }),
};

export const SettingsPanel: Story = {
  name: 'Settings Panel (Composition)',
  render: () => ({
    template: `
      <div style="max-width: 480px;">
        <div style="display: flex; flex-direction: column; gap: 4px;">
          <lc-accordion title="Notifications" variant="flat" [expanded]="true">
            <div style="display: flex; flex-direction: column; gap: 12px; padding: 4px 0;">
              <label style="display: flex; align-items: center; gap: 8px; cursor: pointer;">
                <input type="checkbox" checked /> Email notifications
              </label>
              <label style="display: flex; align-items: center; gap: 8px; cursor: pointer;">
                <input type="checkbox" checked /> Push notifications
              </label>
              <label style="display: flex; align-items: center; gap: 8px; cursor: pointer;">
                <input type="checkbox" /> Weekly digest
              </label>
            </div>
          </lc-accordion>
          <lc-accordion title="Privacy" variant="flat">
            <div style="display: flex; flex-direction: column; gap: 12px; padding: 4px 0;">
              <label style="display: flex; align-items: center; gap: 8px; cursor: pointer;">
                <input type="checkbox" checked /> Show profile publicly
              </label>
              <label style="display: flex; align-items: center; gap: 8px; cursor: pointer;">
                <input type="checkbox" /> Allow search engines to index
              </label>
            </div>
          </lc-accordion>
          <lc-accordion title="Danger Zone" variant="flat">
            <p style="margin: 0; color: var(--lc-color-neutral-600);">Deleting your account is permanent and cannot be undone. All data will be lost.</p>
          </lc-accordion>
        </div>
      </div>`,
  }),
};

/**
 * Project rich, non-interactive content into the header with an
 * `<ng-template lcAccordionHeader>` — badges, meta text, a right-aligned value.
 * The accordion still owns the chevron, click/keyboard handling and focus ring.
 * Use `chevronPosition="leading"` so a right-aligned element (here pinned with
 * `margin-left: auto`) stays at the edge.
 */
export const RichHeader: Story = {
  name: 'Rich Header (Template)',
  decorators: [moduleMetadata({ imports: [AccordionHeaderDirective, BadgeComponent] })],
  render: () => ({
    template: `
      <div style="max-width: 560px;">
        <lc-accordion variant="outlined" chevronPosition="leading" ariaLabel="Item one details">
          <ng-template lcAccordionHeader>
            <span style="font-weight: 600;">Item One</span>
            <lc-badge variant="success" size="sm">Complete</lc-badge>
            <span style="color: var(--lc-color-neutral-500); font-weight: 400;">Meta · detail · info</span>
            <span style="margin-left: auto; color: var(--lc-color-neutral-500); font-weight: 400; font-variant-numeric: tabular-nums;">12:04</span>
          </ng-template>
          <p style="margin: 0; color: var(--lc-color-neutral-600);">Body content revealed on expand. The header above is fully projected, while the chevron, keyboard handling and focus ring are owned by the component.</p>
        </lc-accordion>
      </div>`,
  }),
};

/**
 * With an `<ng-template lcAccordionContent>` body and `[lazy]="true"`, the body
 * is not created until the panel is first opened, then kept in the DOM on
 * collapse. Ideal for expensive or network-backed content. Use
 * `[destroyOnClose]="true"` instead to also discard it on every collapse.
 */
export const LazyBody: Story = {
  name: 'Lazy Body (Deferred Template)',
  decorators: [moduleMetadata({ imports: [AccordionContentDirective] })],
  render: () => ({
    template: `
      <div style="max-width: 560px;">
        <lc-accordion title="Deferred section" variant="outlined" [lazy]="true">
          <ng-template lcAccordionContent>
            <p style="margin: 0; color: var(--lc-color-neutral-600);">This paragraph is only instantiated the first time the panel opens, then kept mounted. Swap in any expensive component here.</p>
          </ng-template>
        </lc-accordion>
      </div>`,
  }),
};
