import type { Meta, StoryObj } from '@storybook/angular';

/**
 * The horizon block (`.lc-horizon`, 3.3, gap LK-1) — the "Weite" page ending.
 * Global CSS from the kit's stylesheet, no component: put the class on the
 * last block of a page that is a flex column.
 */
const meta: Meta = {
  title: 'Design Tokens/Horizon',
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: `
The **horizon block** closes a page in the "Weite" look: the sky fades towards
the horizon, a 2 px line fades out at both ends, a half sun rises on it with one
ring and a soft halo, and the land lies below. It is pure CSS (gradients only, no
image), anchored to the bottom of its own box, so it fits any height. In the
dark theme the same geometry draws the **night horizon** (switch the theme in
the toolbar).

**Use:** the global class \`.lc-horizon\` (from the kit's stylesheet) on the
**last block** of a page whose container is a flex column. It takes the
remaining height (\`flex: 1 0 auto\`) and never shrinks below land + sun + 22 px;
with more content it moves below the fold by itself. Use it only where a page
has room to breathe (a daily overview, sign-in and registration, not-found and
offline pages), never behind text. Only a compact footer may sit on the land:
put it in a child with \`.lc-horizon__land\` (pinned to the bottom edge). Mark an
empty block \`aria-hidden="true"\`.

| Input (custom property, on the block or an ancestor) | Default |
|---|---|
| \`--lc-horizon-land\` — height of the land below the line | 112 px (phone), 100 · 120 · 140 · 184 px from 1024 · 1280 · 1440 · 1920 px; add the footer's height when a footer sits on the land (136 px on a phone) |
| \`--lc-horizon-sun-radius\` | 58 px (phone), 70 · 90 · 120 · 166 px |
| \`--lc-horizon-sun-x\` — the sun's centre from the left edge | 72% |

**Colours** (theme tokens, see *Design Tokens / Colors → Horizon*):
\`--color-background-low\`, \`--color-horizon-line\`, \`--color-land-1\`…\`-3\`,
\`--color-sun-1\`…\`-3\`, \`--color-sun-ring\`, \`--color-sun-halo\`. The page
behind it is the sky: \`background-color: var(--color-background);
background-image: var(--app-background-image)\`. Forced-colour modes drop the
decoration.
        `,
      },
    },
  },
};

export default meta;
type Story = StoryObj;

export const Phone: Story = {
  name: 'Phone (360 px)',
  parameters: {
    docs: {
      description: {
        story:
          'A phone page: the date as an overline, the greeting in display type, and the horizon filling the rest. Default geometry (land 112 px, sun 58 px) leaves room for a floating bottom bar on the land.',
      },
    },
  },
  render: () => ({
    template: `
      <div style="width: 360px; height: 640px; display: flex; flex-direction: column; overflow: hidden; background-color: var(--color-background); font-family: var(--font-family-base)">
        <main style="display: flex; flex-direction: column-reverse; gap: 12px; padding: 32px 24px 16px">
          <h1 class="lc-display" style="font-size: 40px; line-height: 1.05; letter-spacing: -0.035em">Good morning, Johanna</h1>
          <p class="lc-overline" style="font-size: 13px">Wednesday, 15 October</p>
        </main>
        <div class="lc-horizon" aria-hidden="true" style="--lc-horizon-land: 112px; --lc-horizon-sun-radius: 58px"></div>
      </div>`,
  }),
};

export const FooterOnTheLand: Story = {
  name: 'Footer on the Land',
  parameters: {
    docs: {
      description: {
        story:
          'A sign-in page on the phone: the compact footer sits on the land in a `.lc-horizon__land` child; the land grows by the footer height (`--lc-horizon-land: 136px`). The block is not aria-hidden here, so the footer stays reachable.',
      },
    },
  },
  render: () => ({
    template: `
      <div style="width: 360px; height: 640px; display: flex; flex-direction: column; overflow: hidden; background-color: var(--color-background); font-family: var(--font-family-base)">
        <main style="display: flex; flex-direction: column; gap: 10px; padding: 48px 24px 16px; text-align: center">
          <h1 class="lc-auth-title" style="font-size: 30px">Sign in</h1>
          <p style="margin: 0; color: var(--color-text-secondary)">One tap with your passkey.</p>
        </main>
        <div class="lc-horizon" style="--lc-horizon-land: 136px; --lc-horizon-sun-radius: 58px">
          <footer class="lc-horizon__land" style="display: flex; gap: 8px; padding: 8px 16px 16px">
            <a href="#" style="display: inline-flex; align-items: center; min-height: 44px; padding: 0 8px; color: var(--color-link); text-decoration: underline; font-size: 14px">Privacy policy</a>
            <a href="#" style="display: inline-flex; align-items: center; min-height: 44px; padding: 0 8px; color: var(--color-link); text-decoration: underline; font-size: 14px">Legal notice</a>
          </footer>
        </div>
      </div>`,
  }),
};

export const Desktop: Story = {
  name: 'Desktop Geometry',
  parameters: {
    docs: {
      description: {
        story:
          "A wide page with Today's 1280 px geometry set explicitly (land 120 px, sun 90 px) and the sun moved under the content column with `--lc-horizon-sun-x`.",
      },
    },
  },
  render: () => ({
    template: `
      <div style="height: 520px; display: flex; flex-direction: column; overflow: hidden; background-color: var(--color-background); background-image: var(--app-background-image); font-family: var(--font-family-base)">
        <main style="display: flex; flex-direction: column-reverse; gap: 12px; padding: 64px 56px 24px; max-width: 880px">
          <h1 class="lc-display" style="font-size: 56px; line-height: 1.02; letter-spacing: -0.04em">Good morning, Johanna</h1>
          <p class="lc-overline" style="font-size: 14px">Wednesday, 15 October</p>
        </main>
        <div class="lc-horizon" aria-hidden="true" style="--lc-horizon-land: 120px; --lc-horizon-sun-radius: 90px; --lc-horizon-sun-x: 60%"></div>
      </div>`,
  }),
};
