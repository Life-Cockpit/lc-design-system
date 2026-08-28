import type { Meta, StoryObj } from '@storybook/angular';
import { moduleMetadata } from '@storybook/angular';
import { NextStepCardComponent } from './next-step-card.component';
import { ButtonComponent } from '../button/button.component';
import { IconComponent } from '../icon/icon.component';

const meta: Meta<NextStepCardComponent> = {
  title: 'Feedback/Next Step Card',
  component: NextStepCardComponent,
  decorators: [
    moduleMetadata({
      imports: [ButtonComponent, IconComponent],
    }),
  ],
  argTypes: {
    tone: { control: 'select', options: ['neutral', 'primary', 'success', 'warning', 'info'] },
    primaryLoading: { control: 'boolean' },
    primaryDisabled: { control: 'boolean' },
    announce: { control: 'boolean' },
  },
  parameters: {
    docs: {
      description: {
        component: `
Die eine Status- und Aktionsfläche einer Seite: „Wo steht das Ding, was ist der
eine nächste Schritt?"

**Key Features:**
- Tonale Akzent-Kante (4 px links) + getönte Icon-Bubble — ausschließlich Token-Farben
- Titel, Botschaft (String-Input oder Default-Slot für Markup)
- Primäraktion mit Loading/Disabled (**disabled ⇒ \`primaryDisabledReason\` ist Pflicht**,
  ohne Begründung gibt es eine Dev-Warnung), Ghost-Sekundäraktion mit Chevron,
  oder externer Link (\`linkLabel\`/\`linkHref\`) statt Primärbutton
- \`[slot='blockers']\`: Zeilenliste unter Subtle-Trenner (Punkt-Präfix) — jedes
  projizierte Element mit \`slot="blockers"\` wird eine eigene Zeile
- \`[slot='meta']\`: eine Fußzeile (Icon + Text)
- \`[slot='actions']\`: ersetzt die Button-Inputs vollständig
- \`role="region"\` mit Titel als Label; \`announce\` meldet Titelwechsel via \`aria-live="polite"\`

**Nutzungsregeln:**
- Genau **eine** Karte pro Seite — sie ist die eine „nächster Schritt"-Fläche.
- Blocker sind Zeilen **in** der Karte (\`[slot='blockers']\`), nie zusätzliche Banner
  über oder unter der Karte.
`,
      },
    },
  },
};

export default meta;
type Story = StoryObj<NextStepCardComponent>;

export const Default: Story = {
  args: {
    tone: 'warning',
    icon: 'clock',
    cardTitle: 'Wartet auf Freigabe',
    message: 'Der Entwurf ist vollständig: 8 Abschnitte, alle Prüfungen bestanden.',
    primaryLabel: 'Freigeben',
    secondaryLabel: 'Änderungen anfordern',
  },
  render: (args) => ({
    props: args,
    template: `
      <lc-next-step-card
        [tone]="tone" [icon]="icon" [cardTitle]="cardTitle" [message]="message"
        [primaryLabel]="primaryLabel" [secondaryLabel]="secondaryLabel"
        [primaryLoading]="primaryLoading" [primaryDisabled]="primaryDisabled"
        [primaryDisabledReason]="primaryDisabledReason"
      />
    `,
  }),
};

export const AllTones: Story = {
  render: () => ({
    template: `
      <div style="display: flex; flex-direction: column; gap: 1rem;">
        <lc-next-step-card tone="neutral" icon="information-circle" cardTitle="Kein Handlungsbedarf" message="Alles läuft — es gibt gerade nichts zu tun." />
        <lc-next-step-card tone="primary" icon="pencil" cardTitle="Entwurf fortsetzen" message="Zwei Abschnitte sind noch offen." primaryLabel="Weiter bearbeiten" />
        <lc-next-step-card tone="success" icon="circle-check" cardTitle="Abgeschlossen" message="Alle Schritte sind erledigt." secondaryLabel="Zusammenfassung ansehen" />
        <lc-next-step-card tone="warning" icon="clock" cardTitle="Wartet auf Freigabe" message="Der Entwurf ist fertig und kann geprüft werden." primaryLabel="Freigeben" secondaryLabel="Änderungen anfordern" />
        <lc-next-step-card tone="info" icon="refresh" cardTitle="Verarbeitung läuft" message="Schritt 2 von 4 — das kann einige Minuten dauern." />
      </div>
    `,
  }),
};

export const WithBlockers: Story = {
  render: () => ({
    template: `
      <lc-next-step-card
        tone="warning" icon="clock" cardTitle="Startet, sobald die Voraussetzungen erfüllt sind"
        message="Zwei Punkte stehen noch aus."
        primaryLabel="Starten" [primaryDisabled]="true"
        primaryDisabledReason="Erst möglich, wenn beide Blocker gelöst sind"
      >
        <span slot="blockers">Abschnitt B wartet auf eine Entscheidung.</span>
        <span slot="blockers">Die Prüfung von Abschnitt C läuft noch.</span>
      </lc-next-step-card>
    `,
  }),
};

export const WithMetaLine: Story = {
  render: () => ({
    template: `
      <lc-next-step-card
        tone="warning" icon="clock" cardTitle="Wartet auf Freigabe"
        message="Der Entwurf ist fertig — jedes Kriterium ist abgedeckt."
        primaryLabel="Freigeben" secondaryLabel="Änderungen anfordern"
      >
        <span slot="meta">
          <lc-icon name="circle-check" size="xs" [decorative]="true" />
          Konsistenzprüfung: keine offenen Befunde
        </span>
      </lc-next-step-card>
    `,
  }),
};

export const ExternalLink: Story = {
  render: () => ({
    template: `
      <lc-next-step-card
        tone="success" icon="circle-check" cardTitle="Zur Prüfung eingereicht"
        message="Das Ergebnis liegt im externen System bereit."
        linkLabel="Vorgang ansehen" linkHref="https://example.com/"
        secondaryLabel="Details"
      />
    `,
  }),
};

export const CustomActionsSlot: Story = {
  render: () => ({
    template: `
      <lc-next-step-card
        tone="primary" icon="help-circle" cardTitle="Eine Rückfrage ist offen"
        message="Die Antwort entscheidet, wie es weitergeht."
      >
        <div slot="actions" style="display: flex; gap: 0.5rem;">
          <lc-button variant="outline" size="sm">Option A</lc-button>
          <lc-button variant="outline" size="sm">Option B</lc-button>
        </div>
      </lc-next-step-card>
    `,
  }),
};

export const LoadingPrimary: Story = {
  render: () => ({
    template: `
      <lc-next-step-card
        tone="primary" icon="pencil" cardTitle="Wird gestartet"
        message="Die Aktion läuft bereits."
        primaryLabel="Starten" [primaryLoading]="true"
      />
    `,
  }),
};
