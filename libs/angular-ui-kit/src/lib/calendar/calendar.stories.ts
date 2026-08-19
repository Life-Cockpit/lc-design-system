import type { Meta, StoryObj } from '@storybook/angular';
import { CalendarComponent, CalendarEvent } from './calendar.component';

const today = new Date();
const d = (offset: number, h = 0, m = 0) => {
  const dt = new Date(today);
  dt.setDate(dt.getDate() + offset);
  dt.setHours(h, m, 0, 0);
  return dt;
};

const sampleEvents: CalendarEvent[] = [
  { id: '1', title: 'Team Standup', start: d(0, 9, 0), end: d(0, 9, 30), color: 'primary' },
  { id: '2', title: 'Sprint Planning', start: d(1, 10, 0), end: d(1, 12, 0), color: 'info' },
  { id: '3', title: 'Lunch break', start: d(0, 12, 0), end: d(0, 13, 0), color: 'success' },
  { id: '4', title: 'Code Review', start: d(2, 14, 0), end: d(2, 15, 0), color: 'secondary' },
  { id: '5', title: 'Deadline: Release', start: d(3, 9, 0), end: d(3, 9, 30), color: 'error' },
  { id: '6', title: 'Design Workshop', start: d(-1, 13, 0), end: d(-1, 16, 0), color: 'warning' },
  { id: '7', title: 'Client Call', start: d(0, 15, 0), end: d(0, 16, 0), color: 'primary' },
  { id: '8', title: '1:1 Manager', start: d(4, 11, 0), end: d(4, 11, 30), color: 'info' },
];

const meta: Meta<CalendarComponent> = {
  title: 'Data Display/Calendar',
  component: CalendarComponent,
  tags: ['autodocs'],

  parameters: {
    docs: {
      description: {
        component: `
Calendar component for date-based event display and navigation.

**Key Features:**
- Day, week, and month view modes
- Event display with six color variants
- Navigation controls for previous/next/today
- Configurable first day of week and locale
- Time grid for day and week views with hourly slots
- Click handlers for events and date cells
`,
      },
    },
  },
};
export default meta;
type Story = StoryObj<CalendarComponent>;

export const MonthView: Story = {
  render: () => ({
    template: `<lc-calendar view="month" [events]="events"></lc-calendar>`,
    props: { events: sampleEvents },
    moduleMetadata: { imports: [CalendarComponent] },
  }),
};

export const WeekView: Story = {
  render: () => ({
    template: `<lc-calendar view="week" [events]="events"></lc-calendar>`,
    props: { events: sampleEvents },
    moduleMetadata: { imports: [CalendarComponent] },
  }),
};

export const DayView: Story = {
  render: () => ({
    template: `<lc-calendar view="day" [events]="events"></lc-calendar>`,
    props: { events: sampleEvents },
    moduleMetadata: { imports: [CalendarComponent] },
  }),
};

export const Empty: Story = {
  render: () => ({
    template: `<lc-calendar view="month" [events]="[]"></lc-calendar>`,
    moduleMetadata: { imports: [CalendarComponent] },
  }),
};
