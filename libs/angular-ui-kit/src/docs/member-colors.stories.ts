import type { Meta, StoryObj } from '@storybook/angular';

/**
 * Member colours (3.3, gap LK-7): one colour per household member, as theme
 * tokens. Shown here as plain swatches; the avatar components take them as an
 * input.
 */
const meta: Meta = {
  title: 'Design Tokens/Member Colours',
  parameters: {
    docs: {
      description: {
        component: `
Six **member colours** for the people in a household, \`--color-member-1\` …
\`--color-member-6\`: teal \`#1A6A79\`, rust-600 \`#B04A22\`, violet \`#4E3F84\`,
sage \`#5F7150\`, berry \`#9E3846\`, slate \`#5A798C\`. The same in light and dark,
each with **white initials** (\`--color-on-member\`) at 6.21 · 5.46 · 8.87 · 5.30 ·
6.76 · 4.62:1. TypeScript: \`ColorMember1\` … \`ColorMember6\`.

**Rules:** assign them in join order and keep a person's colour stable while
they are a member (never reuse one meanwhile). Use them only on avatars (initials), never for text or actions. Colour is
never the only cue: the initials and the name always sit beside it. Overlapping
avatars get a ring in the page colour so each one stays readable.
        `,
      },
    },
  },
};

export default meta;
type Story = StoryObj;

const members = [
  ['JA', 'Johanna', 1],
  ['TE', 'Tom', 2],
  ['LB', 'Lena', 3],
  ['RE', 'Ruth', 4],
  ['KW', 'Kai', 5],
  ['NU', 'Nora', 6],
] as const;

const avatar = (initials: string, n: number, size = 48, ring = 0) =>
  `<span aria-hidden="true" style="display: inline-flex; align-items: center; justify-content: center; width: ${size}px; height: ${size}px; border-radius: 9999px; background: var(--color-member-${n}); color: var(--color-on-member); font: 700 ${Math.round(size * 0.36)}px/1 var(--font-family-base); letter-spacing: .02em;${ring ? ` box-shadow: 0 0 0 ${ring}px var(--color-background);` : ''}">${initials}</span>`;

export const Palette: Story = {
  name: 'Palette',
  render: () => ({
    template: `
      <ul style="margin: 0; padding: 0; list-style: none; display: flex; flex-wrap: wrap; gap: 24px; font-family: var(--font-family-base)">
        ${members
          .map(
            ([initials, name, n]) => `
          <li style="display: flex; flex-direction: column; align-items: center; gap: 8px; color: var(--color-text-secondary); font-size: 13px">
            ${avatar(initials, n)}
            <span style="color: var(--color-text-primary); font-weight: 600">${name}</span>
            <code>--color-member-${n}</code>
          </li>`,
          )
          .join('')}
      </ul>`,
  }),
};

export const StackedRow: Story = {
  name: 'Stacked Row',
  parameters: {
    docs: {
      description: {
        story:
          'Overlapping avatars (−4 px), later members on top, each with a 3 px ring in the page colour; the count as text beside them.',
      },
    },
  },
  render: () => ({
    template: `
      <div style="display: flex; align-items: center; gap: 12px; font-family: var(--font-family-base)">
        <span style="display: flex">
          ${members
            .slice(0, 3)
            .map(
              ([initials, , n], i) =>
                `<span style="display: inline-flex; position: relative; z-index: ${i + 1}; margin-left: ${i ? -4 : 0}px">${avatar(initials, n, 34, 3)}</span>`,
            )
            .join('')}
        </span>
        <span style="font-size: 15px; font-weight: 600; color: var(--color-text-secondary)">3 members</span>
      </div>`,
  }),
};
