import type { Meta, StoryObj } from '@storybook/angular';
import { GanttChartComponent, GanttTask, GanttDependency } from './gantt-chart.component';

const d = (year: number, month: number, day: number) => new Date(year, month - 1, day).toISOString().slice(0, 10);

const projectTasks: GanttTask[] = [
  { id: '1', title: 'Requirements', start: d(2025, 3, 1), end: d(2025, 3, 7), progress: 100, color: 'success' },
  { id: '2', title: 'UI Design', start: d(2025, 3, 5), end: d(2025, 3, 14), progress: 80, color: 'primary' },
  { id: '3', title: 'Backend API', start: d(2025, 3, 8), end: d(2025, 3, 21), progress: 60, color: 'info' },
  { id: '4', title: 'Frontend Dev', start: d(2025, 3, 12), end: d(2025, 3, 28), progress: 30, color: 'primary' },
  { id: '5', title: 'Integration', start: d(2025, 3, 25), end: d(2025, 4, 5), progress: 0, color: 'secondary' },
  { id: '6', title: 'QA Testing', start: d(2025, 4, 1), end: d(2025, 4, 10), progress: 0, color: 'warning' },
  { id: '7', title: 'Release', start: d(2025, 4, 10), end: d(2025, 4, 12), progress: 0, color: 'error' },
];

const projectDeps: GanttDependency[] = [
  { from: '1', to: '2' },
  { from: '1', to: '3' },
  { from: '2', to: '4' },
  { from: '3', to: '5' },
  { from: '4', to: '5' },
  { from: '5', to: '6' },
  { from: '6', to: '7' },
];

const meta: Meta<GanttChartComponent> = {
  title: 'Charts/Gantt Chart',
  component: GanttChartComponent,
  tags: ['autodocs'],

  parameters: {
    docs: {
      description: {
        component: `
Gantt chart component for project timeline visualization.

**Key Features:**
- Task bars with progress indicators
- Dependency lines with Bézier curves and arrowheads
- Monthly and daily header timeline
- Today marker line
- Weekend highlighting
- Configurable row height, label width, day width, \`locale\` (month labels) and \`labelsHeader\`
- Task click event handling — bars are focusable, Enter / Space activate
`,
      },
    },
  },
  argTypes: {
    locale: { control: 'text', description: 'BCP 47 locale for the month header labels', table: { defaultValue: { summary: 'de-DE' } } },
    labelsHeader: { control: 'text', description: 'Header text of the task label column', table: { defaultValue: { summary: 'Aufgaben' } } },
  },
};
export default meta;
type Story = StoryObj<GanttChartComponent>;

export const Default: Story = {
  render: () => ({
    template: `<lc-gantt-chart [tasks]="tasks" [dependencies]="deps"></lc-gantt-chart>`,
    props: { tasks: projectTasks, deps: projectDeps },
    moduleMetadata: { imports: [GanttChartComponent] },
  }),
};

export const NoDependencies: Story = {
  render: () => ({
    template: `<lc-gantt-chart [tasks]="tasks" [dependencies]="[]"></lc-gantt-chart>`,
    props: { tasks: projectTasks },
    moduleMetadata: { imports: [GanttChartComponent] },
  }),
};

export const Simple: Story = {
  render: () => ({
    template: `<lc-gantt-chart [tasks]="tasks" [dependencies]="deps"></lc-gantt-chart>`,
    props: {
      tasks: [
        { id: '1', title: 'Task A', start: d(2025, 5, 1), end: d(2025, 5, 10), progress: 50, color: 'primary' },
        { id: '2', title: 'Task B', start: d(2025, 5, 8), end: d(2025, 5, 18), progress: 20, color: 'success' },
        { id: '3', title: 'Task C', start: d(2025, 5, 15), end: d(2025, 5, 25), progress: 0, color: 'warning' },
      ],
      deps: [{ from: '1', to: '2' }, { from: '2', to: '3' }],
    },
    moduleMetadata: { imports: [GanttChartComponent] },
  }),
};

export const WideTimeline: Story = {
  render: () => ({
    template: `<lc-gantt-chart [tasks]="tasks" [dependencies]="deps" [dayWidth]="48" [rowHeight]="48"></lc-gantt-chart>`,
    props: { tasks: projectTasks, deps: projectDeps },
    moduleMetadata: { imports: [GanttChartComponent] },
  }),
};
