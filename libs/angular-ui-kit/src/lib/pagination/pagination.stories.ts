import type { Meta, StoryObj } from '@storybook/angular';
import { fn, expect, userEvent, within } from 'storybook/test';
import { PaginationComponent } from './pagination.component';

/**
 * Pagination enables navigation through large datasets by dividing content
 * into discrete pages. Shows page numbers, prev/next buttons, and optionally
 * displays item count information.
 */
const meta: Meta<PaginationComponent> = {
  title: 'Navigation/Pagination',
  component: PaginationComponent,
  args: {
    pageChange: fn(),
  },
  argTypes: {
    pageChange: { action: 'pageChange', description: 'Emitted with the new page number when navigation occurs' },
    currentPage: { description: 'The currently active page (1-based)' },
    totalItems: { description: 'Total number of items across all pages' },
    pageSize: { description: 'Number of items displayed per page' },
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
      description: 'Controls button dimensions and spacing',
    },
    showInfo: { description: 'Show "Showing X-Y of Z items" text' },
    previousLabel: { description: 'Visible text of the previous button', table: { defaultValue: { summary: 'Previous' } } },
    nextLabel: { description: 'Visible text of the next button', table: { defaultValue: { summary: 'Next' } } },
    previousAriaLabel: { description: 'Accessible name of the previous button', table: { defaultValue: { summary: 'Previous page' } } },
    nextAriaLabel: { description: 'Accessible name of the next button', table: { defaultValue: { summary: 'Next page' } } },
    pageAriaLabel: { description: 'Accessible name of a page button; `{page}` is replaced', table: { defaultValue: { summary: 'Page {page}' } } },
    infoText: {
      description: 'Info line template; `{first}`, `{last}`, `{total}` are replaced',
      table: { defaultValue: { summary: 'Showing {first} to {last} of {total} items' } },
    },
  },

  parameters: {
    docs: {
      description: {
        component: `
Pagination component for navigating through pages of content.

**Key Features:**
- Configurable page size
- Previous/Next navigation
- Direct page number access
- Ellipsis for large page ranges
- Size variants (sm, md, lg)
- Accessible with ARIA attributes
- Optional item count display
- All UI strings overridable via inputs (\`previousLabel\`, \`nextLabel\`, \`infoText\`, …)
`,
      },
    },
  },
};

export default meta;
type Story = StoryObj<PaginationComponent>;

export const Default: Story = {
  args: { currentPage: 1, totalItems: 100, pageSize: 10, size: 'md' },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    const nextBtn = canvas.getByRole('button', { name: /next/i });
    await userEvent.click(nextBtn);
    await expect(args['pageChange']).toHaveBeenCalledWith(2);
  },
};

export const MiddlePage: Story = {
  name: 'Middle Page',
  args: { currentPage: 5, totalItems: 100, pageSize: 10, size: 'md' },
};

export const LastPage: Story = {
  name: 'Last Page',
  args: { currentPage: 10, totalItems: 100, pageSize: 10, size: 'md' },
};

export const WithInfo: Story = {
  name: 'With Item Count',
  args: { currentPage: 3, totalItems: 247, pageSize: 25, size: 'md', showInfo: true },
};

export const FewPages: Story = {
  name: 'Few Pages (No Ellipsis)',
  args: { currentPage: 2, totalItems: 30, pageSize: 10, size: 'md' },
};

export const Localized: Story = {
  name: 'Localized Labels',
  args: {
    currentPage: 2,
    totalItems: 120,
    pageSize: 10,
    showInfo: true,
    previousLabel: 'Zurück',
    nextLabel: 'Weiter',
    previousAriaLabel: 'Vorherige Seite',
    nextAriaLabel: 'Nächste Seite',
    pageAriaLabel: 'Seite {page}',
    infoText: 'Einträge {first}–{last} von {total}',
  },
};

export const ManyPages: Story = {
  name: 'Many Pages (With Ellipsis)',
  args: { currentPage: 15, totalItems: 500, pageSize: 10, size: 'md', showInfo: true },
};

export const Sizes: Story = {
  name: 'Size Comparison',
  render: () => ({
    template: `
      <div style="display: flex; flex-direction: column; gap: 24px;">
        <div>
          <div style="font-size: 12px; color: #666; margin-bottom: 8px;">Small</div>
          <lc-pagination [currentPage]="3" [totalItems]="100" [pageSize]="10" size="sm"></lc-pagination>
        </div>
        <div>
          <div style="font-size: 12px; color: #666; margin-bottom: 8px;">Medium (default)</div>
          <lc-pagination [currentPage]="3" [totalItems]="100" [pageSize]="10" size="md"></lc-pagination>
        </div>
        <div>
          <div style="font-size: 12px; color: #666; margin-bottom: 8px;">Large</div>
          <lc-pagination [currentPage]="3" [totalItems]="100" [pageSize]="10" size="lg"></lc-pagination>
        </div>
      </div>`,
  }),
};

export const InTableContext: Story = {
  name: 'Below a Table (Composition)',
  render: () => ({
    template: `
      <div style="max-width: 600px; border: 1px solid #eee; border-radius: 8px; overflow: hidden;">
        <table style="width: 100%; border-collapse: collapse;">
          <thead>
            <tr style="background: #f8f8f8;">
              <th style="padding: 10px 16px; text-align: left; font-size: 13px; font-weight: 600;">Name</th>
              <th style="padding: 10px 16px; text-align: left; font-size: 13px; font-weight: 600;">Role</th>
              <th style="padding: 10px 16px; text-align: left; font-size: 13px; font-weight: 600;">Status</th>
            </tr>
          </thead>
          <tbody>
            <tr style="border-top: 1px solid #eee;"><td style="padding: 10px 16px; font-size: 13px;">Alice Johnson</td><td style="padding: 10px 16px; font-size: 13px;">Engineer</td><td style="padding: 10px 16px; font-size: 13px;">Active</td></tr>
            <tr style="border-top: 1px solid #eee;"><td style="padding: 10px 16px; font-size: 13px;">Bob Smith</td><td style="padding: 10px 16px; font-size: 13px;">Designer</td><td style="padding: 10px 16px; font-size: 13px;">Active</td></tr>
            <tr style="border-top: 1px solid #eee;"><td style="padding: 10px 16px; font-size: 13px;">Carol White</td><td style="padding: 10px 16px; font-size: 13px;">PM</td><td style="padding: 10px 16px; font-size: 13px;">Away</td></tr>
          </tbody>
        </table>
        <div style="padding: 12px 16px; border-top: 1px solid #eee; display: flex; justify-content: space-between; align-items: center;">
          <span style="font-size: 12px; color: #666;">Showing 1-3 of 47 members</span>
          <lc-pagination [currentPage]="1" [totalItems]="47" [pageSize]="3" size="sm"></lc-pagination>
        </div>
      </div>`,
  }),
};
