import type { Meta, StoryObj } from '@storybook/angular';
import { DateRangePickerComponent } from './date-range-picker.component';

const meta: Meta<DateRangePickerComponent> = {
  title: 'Form/Date Range Picker',
  component: DateRangePickerComponent,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: `
Date range picker with a calendar dropdown for selecting start and end dates.

**Key Features:**
- Calendar dropdown with month navigation
- Range highlighting (start, end, in-range states)
- Min/max date constraints
- Automatic date swap when end date precedes start date
- Localised dates, month title and weekday headers via \`locale\` (default \`de-DE\`, Monday-first grid)
- Keyboard: trigger is a real button, Escape closes, focus lands on the calendar and returns to the trigger
- ControlValueAccessor for Angular reactive forms
- Disabled state support
- Label and placeholder customisation
        `,
      },
    },
  },
  argTypes: {
    label: { control: 'text', description: 'Label displayed above the input' },
    placeholder: { control: 'text', description: 'Placeholder when no range is selected' },
    disabled: { control: 'boolean', description: 'Disable the picker' },
    minDate: { control: 'date', description: 'Earliest selectable date' },
    maxDate: { control: 'date', description: 'Latest selectable date' },
    locale: { control: 'text', description: 'BCP 47 locale for the displayed dates (default de-DE)' },
  },
};
export default meta;
type Story = StoryObj<DateRangePickerComponent>;

export const Default: Story = {
  parameters: {
    docs: { description: { story: 'Default date range picker with label and placeholder.' } },
  },
  args: {
    label: 'Date range',
    placeholder: 'Select date range',
  },
};

export const WithMinMax: Story = {
  parameters: {
    docs: { description: { story: 'Constrained to a 90-day booking window starting today. Dates outside the range are disabled.' } },
  },
  args: {
    label: 'Booking period',
    minDate: new Date(),
    maxDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
  },
};

export const Disabled: Story = {
  parameters: {
    docs: { description: { story: 'Fully disabled state — the calendar cannot be opened.' } },
  },
  args: {
    label: 'Locked range',
    disabled: true,
  },
};

export const EnglishLocale: Story = {
  parameters: {
    docs: { description: { story: 'Dates, month title and weekday headers rendered with `locale="en-US"`.' } },
  },
  args: {
    label: 'Reporting period',
    locale: 'en-US',
  },
};

export const NoLabel: Story = {
  parameters: {
    docs: { description: { story: 'Picker without a label, using only the placeholder for guidance.' } },
  },
  args: {
    placeholder: 'Pick dates…',
  },
};
