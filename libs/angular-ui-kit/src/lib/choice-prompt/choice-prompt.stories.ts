import type { Meta, StoryObj } from '@storybook/angular';
import { ChoicePromptComponent } from './choice-prompt.component';

const meta: Meta<ChoicePromptComponent> = {
  title: 'Feedback/Choice Prompt',
  component: ChoicePromptComponent,
  argTypes: {
    busy: { control: 'boolean' },
    disabled: { control: 'boolean' },
    allowCustom: { control: 'boolean' },
    size: { control: 'select', options: ['sm', 'md'] },
  },
  parameters: {
    docs: {
      description: {
        component: `
Inline-Entscheidung: vorgegebene Antwort-Optionen (mit markierter Empfehlung)
plus optionaler Freitext — ohne Modal, direkt im Fluss.

**Key Features:**
- Optionen als Buttons; \`recommended\` trägt das Badge „Empfehlung" und steht zuerst
- Freitext-Strecke hinter einem Toggle-Link (\`allowCustom\`), Submit per Button
  oder Enter — leer nie submitbar
- \`busy\` nach einer Auswahl: die geklickte Option zeigt Loading, alles andere
  ist disabled (inkl. Enter im Freitext) — verhindert Doppel-Submit; der Fokus
  bleibt nach Busy-Ende auf dem ausgelösten Element
- \`disabled\` ⇒ \`disabledReason\` ist Pflicht (Tooltip); ohne Begründung Dev-Warnung
- Nachrangige Ausgänge über \`secondaryActions\` → \`(secondaryAction)\`
- \`(decided)\` liefert \`{ optionId?: string; customText?: string }\`
- \`role="group"\` mit \`promptLabel\` als Label — die Frage selbst steht im Umfeld
`,
      },
    },
  },
};

export default meta;
type Story = StoryObj<ChoicePromptComponent>;

const sampleOptions = [
  { id: 'a', label: 'Variante A übernehmen', recommended: true },
  { id: 'b', label: 'Beide Varianten zulassen' },
];

export const Default: Story = {
  name: 'Ruhe',
  args: {
    options: sampleOptions,
    promptLabel: 'Welche Variante soll gelten?',
    allowCustom: true,
    busy: false,
    disabled: false,
    disabledReason: '',
    size: 'md',
  },
  render: (args) => ({
    props: args,
    template: `
      <div>
        <p style="margin: 0 0 0.625rem; font-weight: 600; font-size: 0.875rem;">
          Zwei Abschnitte definieren denselben Begriff unterschiedlich
        </p>
        <lc-choice-prompt
          [options]="options" [promptLabel]="promptLabel"
          [busy]="busy" [disabled]="disabled" [disabledReason]="disabledReason"
          [allowCustom]="allowCustom" [size]="size"
        />
      </div>
    `,
  }),
};

export const FreitextOffen: Story = {
  name: 'Freitext offen',
  render: () => ({
    props: { options: sampleOptions },
    template: `
      <lc-choice-prompt
        [options]="options"
        promptLabel="Welche Variante soll gelten?"
        customPlaceholder="Eigene Lösung beschreiben …"
      />
      <p style="margin-top: 0.75rem; font-size: 0.8125rem; color: var(--color-text-tertiary);">
        „Eigene Antwort …" öffnet die Freitext-Strecke; Enter oder „Übernehmen" sendet.
      </p>
    `,
  }),
  play: async ({ canvasElement }) => {
    canvasElement
      .querySelector<HTMLButtonElement>('.lc-choice-prompt__custom-toggle')
      ?.click();
  },
};

export const Busy: Story = {
  render: () => ({
    props: {
      options: sampleOptions,
      busy: false,
      onDecided() {
        (this as { busy: boolean }).busy = true;
      },
    },
    template: `
      <lc-choice-prompt
        [options]="options" [busy]="busy"
        promptLabel="Welche Variante soll gelten?"
        (decided)="onDecided()"
      />
      <p style="margin-top: 0.75rem; font-size: 0.8125rem; color: var(--color-text-tertiary);">
        Nach einem Klick zeigt die gewählte Option den Spinner; alles andere ist gesperrt.
      </p>
    `,
  }),
  play: async ({ canvasElement }) => {
    canvasElement.querySelector<HTMLButtonElement>('.lc-choice-prompt__option')?.click();
  },
};

export const DisabledMitBegruendung: Story = {
  name: 'Disabled mit Begründung',
  args: {
    options: sampleOptions,
    disabled: true,
    disabledReason: 'Bereits entschieden — die Antwort wird gerade übernommen',
    promptLabel: 'Welche Variante soll gelten?',
  },
  render: (args) => ({
    props: args,
    template: `
      <lc-choice-prompt
        [options]="options" [disabled]="disabled" [disabledReason]="disabledReason"
        [promptLabel]="promptLabel"
      />
    `,
  }),
};

export const MitSekundaerAusgaengen: Story = {
  name: 'Mit sekundären Ausgängen',
  args: {
    options: sampleOptions,
    secondaryActions: [
      { id: 'solved', label: 'Selbst gelöst', tooltip: 'Ohne Auswahl schließen' },
      { id: 'ignore', label: 'Ignorieren' },
    ],
    promptLabel: 'Welche Variante soll gelten?',
  },
  render: (args) => ({
    props: args,
    template: `
      <lc-choice-prompt
        [options]="options" [secondaryActions]="secondaryActions" [promptLabel]="promptLabel"
      />
    `,
  }),
};

export const DichteListe: Story = {
  name: 'Dichte Liste (sm)',
  render: () => ({
    props: {
      rows: [
        {
          question: 'Zeile eins: Begriff X ist doppelt definiert',
          options: [
            { id: 'a', label: 'Definition A übernehmen', recommended: true },
            { id: 'b', label: 'Beide zulassen' },
          ],
        },
        {
          question: 'Zeile zwei: Abschnitt ohne Zuordnung',
          options: [
            { id: 'c', label: 'Abschnitt eins zuordnen', recommended: true },
            { id: 'd', label: 'Offen lassen' },
          ],
        },
      ],
    },
    template: `
      <div style="display: flex; flex-direction: column; gap: 0.375rem;">
        @for (row of rows; track row.question) {
          <div style="border: 1px solid var(--color-border); border-radius: 0.75rem; padding: 0.75rem 1rem;">
            <p style="margin: 0 0 0.5rem; font-weight: 600; font-size: 0.8125rem;">{{ row.question }}</p>
            <lc-choice-prompt [options]="row.options" size="sm" [promptLabel]="row.question" />
          </div>
        }
      </div>
    `,
  }),
};
