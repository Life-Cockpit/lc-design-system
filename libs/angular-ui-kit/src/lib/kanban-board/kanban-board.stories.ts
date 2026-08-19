import type { Meta, StoryObj } from '@storybook/angular';
import { KanbanBoardComponent } from './kanban-board.component';

const meta: Meta<KanbanBoardComponent> = {
  title: 'Data Display/Kanban Board',
  component: KanbanBoardComponent,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: `
Kanban board with drag-and-drop card management across multiple columns.

**Key Features:**
- HTML5 drag & drop between columns and within columns
- Keyboard alternative: cards are focusable, Enter / Space activate, Alt+Arrow keys move a card between / within columns
- Column headers with colour dot, card count, and WIP limit
- WIP limit enforcement with over-limit highlighting
- Card priorities (critical, high, medium, low) with \`lc-icon\` indicators
- Card labels with custom background colours
- Card assignees and descriptions
- Readonly mode to disable all drag interactions
- Card click and move event outputs
- Dark mode compatible
        `,
      },
    },
  },
  argTypes: {
    showCardCount: { control: 'boolean', description: 'Display the number of cards in each column header', table: { defaultValue: { summary: 'true' } } },
    showWipLimit: { control: 'boolean', description: 'Show WIP limit in column header and highlight over-limit columns', table: { defaultValue: { summary: 'true' } } },
    readonly: { control: 'boolean', description: 'Disable drag-and-drop and keyboard moves (cards stay activatable)', table: { defaultValue: { summary: 'false' } } },
  },
};
export default meta;
type Story = StoryObj<KanbanBoardComponent>;

export const Default: Story = {
  parameters: {
    docs: { description: { story: 'Full-featured board with priorities, labels, assignees, WIP limits, and colour-coded columns.' } },
  },
  args: {
    columns: [
      {
        id: 'backlog', title: 'Backlog', color: '#6366f1',
        cards: [
          { id: '1', title: 'Research competitors', labels: [{ text: 'Research', color: '#dbeafe' }] },
          { id: '2', title: 'Design mockups', description: 'Create wireframes for the new dashboard', priority: 'high' },
          { id: '3', title: 'Write documentation', priority: 'low' },
        ],
      },
      {
        id: 'todo', title: 'To Do', color: '#3b82f6', limit: 5,
        cards: [
          { id: '4', title: 'Implement auth flow', priority: 'critical', labels: [{ text: 'Backend', color: '#fef3c7' }], assignee: 'Alice' },
          { id: '5', title: 'Setup CI/CD', priority: 'medium', assignee: 'Bob' },
        ],
      },
      {
        id: 'progress', title: 'In Progress', color: '#f59e0b', limit: 3,
        cards: [
          { id: '6', title: 'API endpoints', description: 'REST API for user management', priority: 'high', assignee: 'Charlie' },
        ],
      },
      {
        id: 'review', title: 'Review', color: '#8b5cf6', limit: 2,
        cards: [
          { id: '7', title: 'Landing page', priority: 'medium', assignee: 'Diana', labels: [{ text: 'Frontend', color: '#d1fae5' }] },
        ],
      },
      {
        id: 'done', title: 'Done', color: '#22c55e',
        cards: [
          { id: '8', title: 'Project setup', assignee: 'Alice' },
          { id: '9', title: 'Database schema', assignee: 'Bob' },
        ],
      },
    ],
  },
};

export const Simple: Story = {
  parameters: {
    docs: { description: { story: 'Minimal board without WIP limits or priorities — a simple task list.' } },
  },
  args: {
    columns: [
      {
        id: 'todo', title: 'To Do',
        cards: [
          { id: '1', title: 'Buy groceries' },
          { id: '2', title: 'Clean house' },
          { id: '3', title: 'Read book' },
        ],
      },
      { id: 'doing', title: 'Doing', cards: [{ id: '4', title: 'Exercise' }] },
      { id: 'done', title: 'Done', cards: [] },
    ],
    showWipLimit: false,
  },
};

export const WithWipOverflow: Story = {
  parameters: {
    docs: { description: { story: 'Column exceeding its WIP limit — highlighted with a red background.' } },
  },
  args: {
    columns: [
      {
        id: 'wip', title: 'In Progress', color: '#f59e0b', limit: 2,
        cards: [
          { id: '1', title: 'Task A', priority: 'high' },
          { id: '2', title: 'Task B', priority: 'medium' },
          { id: '3', title: 'Task C (over limit)', priority: 'low' },
        ],
      },
      {
        id: 'done', title: 'Done', color: '#22c55e',
        cards: [],
      },
    ],
  },
};

export const Readonly: Story = {
  parameters: {
    docs: { description: { story: 'Readonly mode — cards are not draggable and no drop targets are shown.' } },
  },
  args: {
    columns: [
      {
        id: 'col1', title: 'Column 1',
        cards: [
          { id: '1', title: 'Read-only card', description: 'Cannot be dragged' },
        ],
      },
      { id: 'col2', title: 'Column 2', cards: [] },
    ],
    readonly: true,
  },
};
