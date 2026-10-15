import type { Meta, StoryObj } from '@storybook/angular';
import { expect, within } from 'storybook/test';
import { ProviderButtonComponent } from './provider-button.component';

const meta: Meta<ProviderButtonComponent> = {
  title: 'Form/Provider Button',
  component: ProviderButtonComponent,
  parameters: {
    docs: {
      description: {
        component: `
\`lc-provider-button\` — "Sign in with Google" drawn to **Google's branding guidelines**
(source: https://developers.google.com/identity/branding-guidelines, last updated
2026-07-07, checked 2026-10-15). Apple's button follows as \`provider="apple"\`
without an API change.

\`\`\`html
<form method="post" action="/v1/auth/providers/google/start">
  <lc-provider-button provider="google" text="continue" label="Weiter mit Google"
                      size="lg" [fullWidth]="true" type="submit" />
</form>
\`\`\`

**What Google requires, and how the button meets it**
- **The standard "G"** (the current gradient "G"), unchanged in size (20 px) and colour, from
  Google's pre-approved asset bundle (\`signin-assets.zip\`, Android + Web). It is inlined as a
  PNG data URI: no Google script, no request to Google before the person taps the button
  (the app's CSP needs \`img-src data:\`).
- **Colours:** light — fill \`#FFFFFF\`, 1 px stroke \`#747775\`, text \`#1F1F1F\`; dark — fill
  \`#131314\`, stroke \`#8E918F\`, text \`#E3E3E3\`; neutral — fill \`#F2F2F2\`, no stroke, text
  \`#1F1F1F\`. \`appearance="auto"\` (default) follows the app theme. Google's colours are fixed,
  they never follow the kit palette.
- **Font:** Google Sans Medium 14/20 — the guideline requires it and names no alternative.
  Google Sans may be self-hosted: it is under the **SIL Open Font License 1.1** since 2025
  (\`ofl/googlesans\` in github.com/google/fonts, "Copyright 2025 The Google Sans Project
  Authors", no Reserved Font Name; checked 2026-10-15), so it can be bundled, subset and served
  by the app as long as the font is not sold on its own and \`OFL.txt\` ships with the files.
  The kit loads no fonts: **self-host it** in the app (\`font-src 'self'\`, no request to
  Google), from fonts.google.com/specimen/Google+Sans or github.com/googlefonts/googlesans, e.g.
  \`@font-face { font-family: 'Google Sans'; font-weight: 500; src: url('/fonts/google-sans-500.woff2') format('woff2'); }\`.
  The Roboto / Arial fallback only covers the moment before the font has loaded; a button
  that stays in it does not match the guideline.
- **Spacing:** 12 px · logo · 10 px · title · 12 px. \`md\` is Google's 40 px; \`lg\` is 48.5 px,
  the height of \`lc-button size="lg"\`, so it lines up with the form's other buttons.
- **Title:** "Sign in with Google", "Sign up with Google" or "Continue with Google" (\`text\`),
  localized by the app through \`label\` — Google's German title for \`continue\` is
  „Weiter mit Google“. Never "Google" alone.
- **Prominence:** at least as prominent as any other third-party sign-in button — give them the
  same \`size\` and \`fullWidth\`.
- **Shape:** \`pill\` (the kit's shape) or \`rectangular\`. \`iconOnly\` shows the "G" alone inside
  the button boundary; \`label\` becomes its accessible name.

**Accessibility:** native \`<button>\`; the visible title is the accessible name; the kit focus
ring; \`loading\` sets \`aria-busy\` and blocks clicks; long or enlarged titles wrap (WCAG 1.4.4,
1.4.10); \`lg\` meets the 44 px touch target. Google's light stroke \`#747775\` is 4.5:1 on white, the dark stroke \`#8E918F\` 5.8:1 on \`#131314\`.
        `,
      },
    },
  },
  argTypes: {
    provider: {
      control: 'select',
      options: ['google'],
      description: 'Sign-in provider. `google` in this release; `apple` follows.',
      table: { defaultValue: { summary: 'google' } },
    },
    text: {
      control: 'select',
      options: ['sign-in', 'sign-up', 'continue'],
      description:
        'Which of Google’s titles to show when `label` is empty: "Sign in with Google", "Sign up with Google", "Continue with Google"',
      table: { defaultValue: { summary: 'sign-in' } },
    },
    label: {
      control: 'text',
      description:
        'Visible title — the provider’s localized title passed by the app (e.g. „Weiter mit Google“). Empty = Google’s English title for `text`. Accessible name of an `iconOnly` button.',
      table: { defaultValue: { summary: "''" } },
    },
    appearance: {
      control: 'select',
      options: ['auto', 'light', 'dark', 'neutral'],
      description: 'Google colour theme; `auto` follows the app theme (light on light pages, dark on dark pages)',
      table: { defaultValue: { summary: 'auto' } },
    },
    size: {
      control: 'select',
      options: ['md', 'lg'],
      description: '`md` 40 px (Google’s standard), `lg` 48.5 px (same as `lc-button size="lg"`, touch target)',
      table: { defaultValue: { summary: 'md' } },
    },
    shape: {
      control: 'select',
      options: ['pill', 'rectangular'],
      description: '`pill` (kit shape) or `rectangular` (4 px corners)',
      table: { defaultValue: { summary: 'pill' } },
    },
    fullWidth: {
      control: 'boolean',
      description: 'Stretches the button to the container width; logo and title stay centred together',
      table: { defaultValue: { summary: 'false' } },
    },
    iconOnly: {
      control: 'boolean',
      description: 'Only the "G" inside the button boundary (square or round); `label` names it',
      table: { defaultValue: { summary: 'false' } },
    },
    loading: {
      control: 'boolean',
      description: 'Busy: spinner after the title, `aria-busy`, clicks blocked',
      table: { defaultValue: { summary: 'false' } },
    },
    disabled: {
      control: 'boolean',
      description: 'Disables the button',
      table: { defaultValue: { summary: 'false' } },
    },
    type: {
      control: 'select',
      options: ['button', 'submit'],
      description: 'Native button type; `submit` when the button posts the form that starts the redirect',
      table: { defaultValue: { summary: 'button' } },
    },
    clicked: { description: 'Emitted on click while neither disabled nor loading', action: 'clicked' },
  },
  args: {
    provider: 'google',
    text: 'sign-in',
    label: '',
    appearance: 'auto',
    size: 'md',
    shape: 'pill',
    fullWidth: false,
    iconOnly: false,
    loading: false,
    disabled: false,
    type: 'button',
  },
};

export default meta;
type Story = StoryObj<ProviderButtonComponent>;

export const Default: Story = {
  play: async ({ canvasElement }) => {
    const button = within(canvasElement).getByRole('button', { name: 'Sign in with Google' });
    await expect(button.getAttribute('type')).toBe('button');
  },
};

/** The app passes Google's localized title; the sign-in page uses `continue` at `lg`, full width. */
export const ContinueInGerman: Story = {
  name: 'Continue (German, lg, full width)',
  args: { text: 'continue', label: 'Weiter mit Google', size: 'lg', fullWidth: true },
  render: (args) => ({
    props: args,
    template: `
      <div style="max-width: 312px">
        <lc-provider-button provider="google" [text]="text" [label]="label" [size]="size"
                            [fullWidth]="fullWidth" [appearance]="appearance" />
      </div>
    `,
  }),
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByRole('button', { name: 'Weiter mit Google' })).toBeTruthy();
  },
};

/** Google's three themes, each on the page it belongs to. */
export const Appearances: Story = {
  render: () => ({
    template: `
      <div style="display: grid; gap: 16px; max-width: 360px">
        <div style="padding: 16px; background: #ffffff; border-radius: 12px">
          <lc-provider-button appearance="light" text="continue" size="lg" [fullWidth]="true" />
        </div>
        <div style="padding: 16px; background: #131314; border-radius: 12px">
          <lc-provider-button appearance="dark" text="continue" size="lg" [fullWidth]="true" />
        </div>
        <div style="padding: 16px; background: #ffffff; border-radius: 12px">
          <lc-provider-button appearance="neutral" text="continue" size="lg" [fullWidth]="true" />
        </div>
      </div>
    `,
  }),
};

/** The three titles Google recommends. */
export const Titles: Story = {
  render: () => ({
    template: `
      <div style="display: flex; flex-direction: column; align-items: flex-start; gap: 12px">
        <lc-provider-button text="sign-in" />
        <lc-provider-button text="sign-up" />
        <lc-provider-button text="continue" />
      </div>
    `,
  }),
};

export const SizesAndShapes: Story = {
  name: 'Sizes and Shapes',
  render: () => ({
    template: `
      <div style="display: flex; flex-wrap: wrap; gap: 12px; align-items: center">
        <lc-provider-button size="md" />
        <lc-provider-button size="lg" />
        <lc-provider-button size="md" shape="rectangular" />
        <lc-provider-button size="lg" shape="rectangular" />
        <lc-provider-button size="md" [iconOnly]="true" label="Sign in with Google" />
        <lc-provider-button size="lg" [iconOnly]="true" label="Sign in with Google" />
        <lc-provider-button size="lg" shape="rectangular" [iconOnly]="true" label="Sign in with Google" />
      </div>
    `,
  }),
};

export const Loading: Story = {
  args: { text: 'continue', label: 'Weiter mit Google', size: 'lg', loading: true },
  play: async ({ canvasElement }) => {
    const button = within(canvasElement).getByRole('button', { name: /weiter mit google/i });
    await expect(button.getAttribute('aria-busy')).toBe('true');
  },
};

export const Disabled: Story = {
  args: { disabled: true },
};

/** Starting the provider is a form POST navigation (no script, no Google SDK). */
export const InASignInForm: Story = {
  name: 'In a Sign-in Form (phone)',
  render: () => ({
    template: `
      <form method="post" action="#google-start" style="max-width: 312px" (submit)="$event.preventDefault()">
        <lc-provider-button provider="google" text="continue" label="Weiter mit Google"
                            size="lg" [fullWidth]="true" type="submit" />
      </form>
    `,
  }),
  play: async ({ canvasElement }) => {
    const button = within(canvasElement).getByRole('button', { name: 'Weiter mit Google' });
    await expect(button.getAttribute('type')).toBe('submit');
  },
};
